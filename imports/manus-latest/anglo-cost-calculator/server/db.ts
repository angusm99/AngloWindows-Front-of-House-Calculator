import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  extraPricingRules,
  glassPricingRules,
  InsertUser,
  productPricingRules,
  quoteUnits,
  quotes,
  users,
} from "../drizzle/schema";
import type { ExtraOption, GlassType, ProductTypeKey } from "../shared/quote";
import { calculateQuote, type PricingSnapshot, type QuoteHeaderDraft, type QuoteUnitDraft } from "./quoteEngine";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPricingSnapshot(): Promise<PricingSnapshot> {
  const db = await getDb();
  if (!db) {
    return {
      productRules: [],
      glassRules: [],
      extraRules: [],
    };
  }

  const [productRows, glassRows, extraRows] = await Promise.all([
    db.select().from(productPricingRules),
    db.select().from(glassPricingRules),
    db.select().from(extraPricingRules),
  ]);

  return {
    productRules: productRows.map(row => ({
      productType: row.productType,
      baseAmountCents: row.baseAmountCents,
      areaRatePerSqmCents: row.areaRatePerSqmCents,
      isActive: row.isActive === 1,
    })),
    glassRules: glassRows.map(row => ({
      glassType: row.glassType,
      surchargeCents: row.surchargeCents,
      isActive: row.isActive === 1,
    })),
    extraRules: extraRows.map(row => ({
      extraKey: row.extraKey,
      amountCents: row.amountCents,
      isActive: row.isActive === 1,
    })),
  };
}

export async function listQuotes() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(quotes).orderBy(desc(quotes.updatedAt)).limit(100);
}

export async function getQuoteById(quoteId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) {
    return null;
  }

  const units = await db.select().from(quoteUnits).where(eq(quoteUnits.quoteId, quoteId)).orderBy(quoteUnits.sortOrder);

  return {
    quote,
    units,
  };
}

export async function saveQuote(input: {
  quoteId?: number;
  header: QuoteHeaderDraft;
  units: QuoteUnitDraft[];
  userId: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const pricing = await getPricingSnapshot();
  const calculation = calculateQuote(input.header, input.units, pricing);

  const persistedQuoteId = await db.transaction(async tx => {
    const baseQuoteValues = {
      jobRef: input.header.jobRef,
      clientName: input.header.clientName,
      quoteDate: input.header.quoteDate,
      phone: input.header.phone ?? null,
      address: input.header.address ?? null,
      salesperson: input.header.salesperson ?? null,
      installer: input.header.installer ?? null,
      estimatedHours: input.header.estimatedHours ?? null,
      notes: input.header.notes ?? null,
      adjustmentKind: input.header.adjustmentKind,
      adjustmentValue: Math.round(input.header.adjustmentValue),
      subtotalCents: calculation.subtotalCents,
      adjustmentCents: calculation.adjustmentCents,
      totalCents: calculation.totalCents,
      validationIssuesJson: calculation.validationIssues,
      missingPricingJson: calculation.missingPricing,
      updatedByUserId: input.userId,
    } as const;

    let quoteId = input.quoteId;

    if (quoteId) {
      await tx.update(quotes).set(baseQuoteValues).where(eq(quotes.id, quoteId));
      await tx.delete(quoteUnits).where(eq(quoteUnits.quoteId, quoteId));
    } else {
      const insertResult = await tx.insert(quotes).values({
        ...baseQuoteValues,
        createdByUserId: input.userId,
      });
      quoteId = Number((insertResult as { insertId?: number }).insertId);
    }

    if (!quoteId) {
      throw new Error("Failed to persist quote");
    }

    if (calculation.units.length > 0) {
      await tx.insert(quoteUnits).values(
        calculation.units.map((unit, index) => ({
          quoteId,
          sortOrder: index,
          roomName: unit.roomName,
          productCategory: unit.productCategory,
          productType: unit.productType,
          configuration: unit.configuration ?? null,
          widthMm: unit.widthMm,
          heightMm: unit.heightMm,
          quantity: unit.quantity,
          glassType: unit.glassType,
          burglarBarType: unit.burglarBarType as "NONE" | "CLEAR" | "ALUM",
          frameColour: unit.frameColour as "WHITE" | "BRONZE" | "CHARCOAL" | "BLACK" | "SILVER" | "SPECIAL",
          hardwareColour: unit.hardwareColour as "WHITE" | "BRONZE" | "CHARCOAL" | "BLACK" | "SILVER" | "SPECIAL",
          extrasJson: unit.extras,
          notes: unit.notes ?? null,
          unitCostCents: unit.unitCostCents,
          lineTotalCents: unit.lineTotalCents,
          pricingBreakdownJson: {
            areaSqm: unit.areaSqm,
            baseAmountCents: unit.baseAmountCents,
            areaAmountCents: unit.areaAmountCents,
            glassAmountCents: unit.glassAmountCents,
            extrasAmountCents: unit.extrasAmountCents,
          },
          validationIssuesJson: unit.validationIssues,
        })),
      );
    }

    return quoteId;
  });

  const fullQuote = await getQuoteById(persistedQuoteId);
  return {
    saved: fullQuote,
    calculation,
  };
}

export async function duplicateQuote(quoteId: number, userId: number) {
  const existing = await getQuoteById(quoteId);
  if (!existing) {
    throw new Error("Quote not found");
  }

  return saveQuote({
    userId,
    header: {
      jobRef: `${existing.quote.jobRef}-COPY`,
      clientName: existing.quote.clientName,
      quoteDate: existing.quote.quoteDate,
      phone: existing.quote.phone,
      address: existing.quote.address,
      salesperson: existing.quote.salesperson,
      installer: existing.quote.installer,
      estimatedHours: existing.quote.estimatedHours,
      notes: existing.quote.notes,
      adjustmentKind: existing.quote.adjustmentKind,
      adjustmentValue: existing.quote.adjustmentValue,
    },
    units: existing.units.map(unit => ({
      roomName: unit.roomName,
      productCategory: unit.productCategory,
      productType: unit.productType,
      configuration: unit.configuration,
      widthMm: unit.widthMm,
      heightMm: unit.heightMm,
      quantity: unit.quantity,
      glassType: unit.glassType,
      burglarBarType: unit.burglarBarType,
      frameColour: unit.frameColour,
      hardwareColour: unit.hardwareColour,
      extras: Array.isArray(unit.extrasJson) ? (unit.extrasJson as ExtraOption[]) : [],
      notes: unit.notes,
    })),
  });
}

export async function upsertProductPricingRule(input: {
  productType: ProductTypeKey;
  productCategory: string;
  baseAmountCents: number;
  areaRatePerSqmCents: number;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .insert(productPricingRules)
    .values({
      productType: input.productType,
      productCategory: input.productCategory as "WINDOW" | "DOOR" | "SLIDING_DOOR",
      baseAmountCents: input.baseAmountCents,
      areaRatePerSqmCents: input.areaRatePerSqmCents,
      isActive: input.isActive ? 1 : 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        productCategory: input.productCategory as "WINDOW" | "DOOR" | "SLIDING_DOOR",
        baseAmountCents: input.baseAmountCents,
        areaRatePerSqmCents: input.areaRatePerSqmCents,
        isActive: input.isActive ? 1 : 0,
      },
    });
}

export async function upsertGlassPricingRule(input: {
  glassType: GlassType;
  surchargeCents: number;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .insert(glassPricingRules)
    .values({
      glassType: input.glassType,
      surchargeCents: input.surchargeCents,
      isActive: input.isActive ? 1 : 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        surchargeCents: input.surchargeCents,
        isActive: input.isActive ? 1 : 0,
      },
    });
}

export async function upsertExtraPricingRule(input: {
  extraKey: ExtraOption;
  amountCents: number;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .insert(extraPricingRules)
    .values({
      extraKey: input.extraKey,
      amountCents: input.amountCents,
      isActive: input.isActive ? 1 : 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        amountCents: input.amountCents,
        isActive: input.isActive ? 1 : 0,
      },
    });
}
