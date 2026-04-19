import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  calculateUnit,
  getHeaderValidationIssues,
  type PricingSnapshot,
  type QuoteHeaderDraft,
  type QuoteUnitDraft,
} from "./quoteEngine";

const pricing: PricingSnapshot = {
  productRules: [
    {
      productType: "FIXED_WINDOW",
      baseAmountCents: 25_000,
      areaRatePerSqmCents: 12_000,
      isActive: true,
    },
  ],
  glassRules: [
    {
      glassType: "STANDARD",
      surchargeCents: 5_000,
      isActive: true,
    },
  ],
  extraRules: [
    {
      extraKey: "WRAP",
      amountCents: 2_500,
      isActive: true,
    },
  ],
};

function createHeader(overrides: Partial<QuoteHeaderDraft> = {}): QuoteHeaderDraft {
  return {
    jobRef: "AW-2026-001",
    clientName: "Anglo Test Client",
    quoteDate: "2026-04-13",
    phone: "0215550101",
    address: "Cape Town",
    salesperson: "Reception",
    installer: "Team A",
    estimatedHours: 4,
    notes: "Internal test quote",
    adjustmentKind: "NONE",
    adjustmentValue: 0,
    ...overrides,
  };
}

function createUnit(overrides: Partial<QuoteUnitDraft> = {}): QuoteUnitDraft {
  return {
    roomName: "Kitchen",
    productCategory: "WINDOW",
    productType: "FIXED_WINDOW",
    configuration: "Fixed",
    widthMm: 1200,
    heightMm: 1000,
    quantity: 2,
    glassType: "STANDARD",
    burglarBarType: "NONE",
    frameColour: "WHITE",
    hardwareColour: "WHITE",
    extras: ["WRAP"],
    notes: "",
    ...overrides,
  };
}

describe("quoteEngine", () => {
  it("calculates unit area and line totals from product, glass, extras, and quantity", () => {
    const result = calculateUnit(createUnit(), pricing);

    expect(result.areaSqm).toBe(1.2);
    expect(result.baseAmountCents).toBe(25_000);
    expect(result.areaAmountCents).toBe(14_400);
    expect(result.glassAmountCents).toBe(5_000);
    expect(result.extrasAmountCents).toBe(2_500);
    expect(result.unitCostCents).toBe(46_900);
    expect(result.lineTotalCents).toBe(93_800);
    expect(result.validationIssues).toEqual([]);
    expect(result.missingPricing).toEqual([]);
  });

  it("returns missing-pricing warnings when product, glass, or extras have no active pricing rules", () => {
    const missingPricingResult = calculateUnit(
      createUnit({
        productType: "TOP_HUNG_WINDOW",
        glassType: "SAFETY",
        extras: ["VIDEO"],
      }),
      pricing,
    );

    expect(missingPricingResult.unitCostCents).toBe(0);
    expect(missingPricingResult.missingPricing).toEqual([
      "Missing product pricing for TOP_HUNG_WINDOW.",
      "Missing glass pricing for SAFETY.",
      "Missing extra pricing for VIDEO.",
    ]);
  });

  it("blocks export readiness when header or unit validation fails", () => {
    const result = calculateQuote(
      createHeader({ clientName: "", phone: "", address: "" }),
      [createUnit({ roomName: "", widthMm: 0 })],
      pricing,
    );

    expect(result.canExport).toBe(false);
    expect(result.validationIssues).toContain("Client name is required.");
    expect(result.validationIssues).toContain("At least a phone number or address is required.");
    expect(result.validationIssues).toContain("Room name is required.");
    expect(result.validationIssues).toContain("Width must be greater than zero.");
  });

  it("applies markup and discount adjustments to the subtotal correctly", () => {
    const markupResult = calculateQuote(
      createHeader({ adjustmentKind: "MARKUP_PERCENT", adjustmentValue: 10 }),
      [createUnit()],
      pricing,
    );
    const discountResult = calculateQuote(
      createHeader({ adjustmentKind: "DISCOUNT_FIXED", adjustmentValue: 100 }),
      [createUnit()],
      pricing,
    );

    expect(markupResult.subtotalCents).toBe(93_800);
    expect(markupResult.adjustmentCents).toBe(9_380);
    expect(markupResult.totalCents).toBe(103_180);
    expect(markupResult.canExport).toBe(true);

    expect(discountResult.subtotalCents).toBe(93_800);
    expect(discountResult.adjustmentCents).toBe(-10_000);
    expect(discountResult.totalCents).toBe(83_800);
  });

  it("reports invalid header values before any export attempt", () => {
    const issues = getHeaderValidationIssues(
      createHeader({
        jobRef: "",
        quoteDate: "",
        adjustmentKind: "NONE",
        adjustmentValue: Number.NaN,
      }),
    );

    expect(issues).toContain("Job reference is required.");
    expect(issues).toContain("Quote date is required.");
    expect(issues).toContain("Adjustment value must be numeric.");
  });
});
