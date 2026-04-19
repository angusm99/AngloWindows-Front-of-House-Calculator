import {
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  ADJUSTMENT_KINDS,
  BURGLAR_BAR_TYPES,
  EXTRA_OPTIONS,
  FRAME_COLOURS,
  GLASS_TYPES,
  HARDWARE_COLOURS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPE_OPTIONS,
} from "../shared/quote";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  jobRef: varchar("jobRef", { length: 80 }).notNull(),
  clientName: varchar("clientName", { length: 160 }).notNull(),
  quoteDate: varchar("quoteDate", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  salesperson: varchar("salesperson", { length: 120 }),
  installer: varchar("installer", { length: 120 }),
  estimatedHours: int("estimatedHours"),
  notes: text("notes"),
  adjustmentKind: mysqlEnum("adjustmentKind", [...ADJUSTMENT_KINDS]).default("NONE").notNull(),
  adjustmentValue: int("adjustmentValue").default(0).notNull(),
  subtotalCents: int("subtotalCents").default(0).notNull(),
  adjustmentCents: int("adjustmentCents").default(0).notNull(),
  totalCents: int("totalCents").default(0).notNull(),
  validationIssuesJson: json("validationIssuesJson"),
  missingPricingJson: json("missingPricingJson"),
  createdByUserId: int("createdByUserId").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const quoteUnits = mysqlTable("quoteUnits", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  sortOrder: int("sortOrder").default(0).notNull(),
  roomName: varchar("roomName", { length: 120 }).notNull(),
  productCategory: mysqlEnum("productCategory", [...PRODUCT_CATEGORIES]).notNull(),
  productType: mysqlEnum(
    "productType",
    PRODUCT_TYPE_OPTIONS.map(option => option.key) as [
      (typeof PRODUCT_TYPE_OPTIONS)[number]["key"],
      ...(typeof PRODUCT_TYPE_OPTIONS)[number]["key"][],
    ],
  ).notNull(),
  configuration: varchar("configuration", { length: 120 }),
  widthMm: int("widthMm").notNull(),
  heightMm: int("heightMm").notNull(),
  quantity: int("quantity").default(1).notNull(),
  glassType: mysqlEnum("glassType", [...GLASS_TYPES]).notNull(),
  burglarBarType: mysqlEnum("burglarBarType", [...BURGLAR_BAR_TYPES]).default("NONE").notNull(),
  frameColour: mysqlEnum("frameColour", [...FRAME_COLOURS]).default("WHITE").notNull(),
  hardwareColour: mysqlEnum("hardwareColour", [...HARDWARE_COLOURS]).default("WHITE").notNull(),
  extrasJson: json("extrasJson"),
  notes: text("notes"),
  unitCostCents: int("unitCostCents").default(0).notNull(),
  lineTotalCents: int("lineTotalCents").default(0).notNull(),
  pricingBreakdownJson: json("pricingBreakdownJson"),
  validationIssuesJson: json("validationIssuesJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productPricingRules = mysqlTable("productPricingRules", {
  id: int("id").autoincrement().primaryKey(),
  productType: mysqlEnum(
    "productType",
    PRODUCT_TYPE_OPTIONS.map(option => option.key) as [
      (typeof PRODUCT_TYPE_OPTIONS)[number]["key"],
      ...(typeof PRODUCT_TYPE_OPTIONS)[number]["key"][],
    ],
  ).notNull().unique(),
  productCategory: mysqlEnum("productCategory", [...PRODUCT_CATEGORIES]).notNull(),
  baseAmountCents: int("baseAmountCents").default(0).notNull(),
  areaRatePerSqmCents: int("areaRatePerSqmCents").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const glassPricingRules = mysqlTable("glassPricingRules", {
  id: int("id").autoincrement().primaryKey(),
  glassType: mysqlEnum("glassType", [...GLASS_TYPES]).notNull().unique(),
  surchargeCents: int("surchargeCents").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const extraPricingRules = mysqlTable("extraPricingRules", {
  id: int("id").autoincrement().primaryKey(),
  extraKey: mysqlEnum("extraKey", [...EXTRA_OPTIONS]).notNull().unique(),
  amountCents: int("amountCents").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

export type QuoteUnit = typeof quoteUnits.$inferSelect;
export type InsertQuoteUnit = typeof quoteUnits.$inferInsert;

export type ProductPricingRuleRow = typeof productPricingRules.$inferSelect;
export type InsertProductPricingRule = typeof productPricingRules.$inferInsert;

export type GlassPricingRuleRow = typeof glassPricingRules.$inferSelect;
export type InsertGlassPricingRule = typeof glassPricingRules.$inferInsert;

export type ExtraPricingRuleRow = typeof extraPricingRules.$inferSelect;
export type InsertExtraPricingRule = typeof extraPricingRules.$inferInsert;
