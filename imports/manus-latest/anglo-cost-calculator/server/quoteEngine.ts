import {
  ADJUSTMENT_KINDS,
  EXTRA_OPTIONS,
  GLASS_TYPES,
  PRODUCT_TYPE_LOOKUP,
  type AdjustmentKind,
  type ExtraOption,
  type GlassType,
  type ProductCategory,
  type ProductTypeKey,
} from "../shared/quote";

export type QuoteUnitDraft = {
  id?: number;
  roomName: string;
  productCategory: ProductCategory;
  productType: ProductTypeKey;
  configuration?: string | null;
  widthMm: number;
  heightMm: number;
  quantity: number;
  glassType: GlassType;
  burglarBarType: string;
  frameColour: string;
  hardwareColour: string;
  extras: ExtraOption[];
  notes?: string | null;
};

export type QuoteHeaderDraft = {
  jobRef: string;
  clientName: string;
  quoteDate: string;
  phone?: string | null;
  address?: string | null;
  salesperson?: string | null;
  installer?: string | null;
  estimatedHours?: number | null;
  notes?: string | null;
  adjustmentKind: AdjustmentKind;
  adjustmentValue: number;
};

export type ProductPricingRule = {
  productType: ProductTypeKey;
  baseAmountCents: number;
  areaRatePerSqmCents: number;
  isActive?: boolean;
};

export type GlassPricingRule = {
  glassType: GlassType;
  surchargeCents: number;
  isActive?: boolean;
};

export type ExtraPricingRule = {
  extraKey: ExtraOption;
  amountCents: number;
  isActive?: boolean;
};

export type PricingSnapshot = {
  productRules: ProductPricingRule[];
  glassRules: GlassPricingRule[];
  extraRules: ExtraPricingRule[];
};

export type UnitCalculationResult = {
  areaSqm: number;
  baseAmountCents: number;
  areaAmountCents: number;
  glassAmountCents: number;
  extrasAmountCents: number;
  unitCostCents: number;
  lineTotalCents: number;
  validationIssues: string[];
  missingPricing: string[];
};

export type QuoteCalculationResult = {
  units: Array<QuoteUnitDraft & UnitCalculationResult>;
  subtotalCents: number;
  adjustmentCents: number;
  totalCents: number;
  validationIssues: string[];
  missingPricing: string[];
  canExport: boolean;
};

export function centsToCurrency(cents: number) {
  return cents / 100;
}

export function normalizeNumber(value: unknown, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getHeaderValidationIssues(header: QuoteHeaderDraft) {
  const issues: string[] = [];

  if (!header.jobRef.trim()) issues.push("Job reference is required.");
  if (!header.clientName.trim()) issues.push("Client name is required.");
  if (!header.quoteDate.trim()) issues.push("Quote date is required.");
  if (!String(header.phone ?? "").trim() && !String(header.address ?? "").trim()) {
    issues.push("At least a phone number or address is required.");
  }
  if (!ADJUSTMENT_KINDS.includes(header.adjustmentKind)) {
    issues.push("Adjustment kind is invalid.");
  }
  if (!Number.isFinite(header.adjustmentValue)) {
    issues.push("Adjustment value must be numeric.");
  }

  return issues;
}

export function getUnitValidationIssues(unit: QuoteUnitDraft) {
  const issues: string[] = [];

  if (!unit.roomName.trim()) issues.push("Room name is required.");
  if (!PRODUCT_TYPE_LOOKUP[unit.productType]) issues.push("Product type is required.");
  if (normalizeNumber(unit.widthMm) <= 0) issues.push("Width must be greater than zero.");
  if (normalizeNumber(unit.heightMm) <= 0) issues.push("Height must be greater than zero.");
  if (normalizeNumber(unit.quantity) <= 0) issues.push("Quantity must be greater than zero.");
  if (!GLASS_TYPES.includes(unit.glassType)) issues.push("Glass type is required.");
  if (!Array.isArray(unit.extras)) issues.push("Extras must be a list.");

  return issues;
}

export function calculateUnit(unit: QuoteUnitDraft, pricing: PricingSnapshot): UnitCalculationResult {
  const validationIssues = getUnitValidationIssues(unit);
  const productRule = pricing.productRules.find(rule => rule.productType === unit.productType && rule.isActive !== false);
  const glassRule = pricing.glassRules.find(rule => rule.glassType === unit.glassType && rule.isActive !== false);
  const activeExtraRules = pricing.extraRules.filter(rule => rule.isActive !== false);

  const missingPricing: string[] = [];
  if (!productRule) missingPricing.push(`Missing product pricing for ${unit.productType}.`);
  if (!glassRule) missingPricing.push(`Missing glass pricing for ${unit.glassType}.`);

  const areaSqm = (normalizeNumber(unit.widthMm) * normalizeNumber(unit.heightMm)) / 1_000_000;
  const baseAmountCents = productRule?.baseAmountCents ?? 0;
  const areaAmountCents = Math.round(areaSqm * (productRule?.areaRatePerSqmCents ?? 0));
  const glassAmountCents = glassRule?.surchargeCents ?? 0;

  let extrasAmountCents = 0;
  for (const extra of unit.extras ?? []) {
    if (!EXTRA_OPTIONS.includes(extra)) continue;
    const rule = activeExtraRules.find(item => item.extraKey === extra);
    if (!rule) {
      missingPricing.push(`Missing extra pricing for ${extra}.`);
      continue;
    }
    extrasAmountCents += rule.amountCents;
  }

  const unitCostCents = Math.max(0, baseAmountCents + areaAmountCents + glassAmountCents + extrasAmountCents);
  const lineTotalCents = unitCostCents * Math.max(0, normalizeNumber(unit.quantity));

  return {
    areaSqm: Number(areaSqm.toFixed(4)),
    baseAmountCents,
    areaAmountCents,
    glassAmountCents,
    extrasAmountCents,
    unitCostCents,
    lineTotalCents,
    validationIssues,
    missingPricing: Array.from(new Set(missingPricing)),
  };
}

export function calculateQuote(
  header: QuoteHeaderDraft,
  units: QuoteUnitDraft[],
  pricing: PricingSnapshot,
): QuoteCalculationResult {
  const headerIssues = getHeaderValidationIssues(header);
  const calculatedUnits = units.map(unit => {
    const totals = calculateUnit(unit, pricing);
    return {
      ...unit,
      ...totals,
    };
  });

  const subtotalCents = calculatedUnits.reduce((sum, unit) => sum + unit.lineTotalCents, 0);
  const normalizedAdjustmentValue = normalizeNumber(header.adjustmentValue);

  let adjustmentCents = 0;
  if (header.adjustmentKind === "MARKUP_PERCENT") {
    adjustmentCents = Math.round(subtotalCents * (normalizedAdjustmentValue / 100));
  }
  if (header.adjustmentKind === "MARKUP_FIXED") {
    adjustmentCents = Math.round(normalizedAdjustmentValue * 100);
  }
  if (header.adjustmentKind === "DISCOUNT_PERCENT") {
    adjustmentCents = -Math.round(subtotalCents * (normalizedAdjustmentValue / 100));
  }
  if (header.adjustmentKind === "DISCOUNT_FIXED") {
    adjustmentCents = -Math.round(normalizedAdjustmentValue * 100);
  }

  const totalCents = Math.max(0, subtotalCents + adjustmentCents);
  const unitValidationIssues = calculatedUnits.flatMap(unit => unit.validationIssues);
  const missingPricing = calculatedUnits.flatMap(unit => unit.missingPricing);
  const validationIssues = [...headerIssues, ...unitValidationIssues];

  return {
    units: calculatedUnits,
    subtotalCents,
    adjustmentCents,
    totalCents,
    validationIssues: Array.from(new Set(validationIssues)),
    missingPricing: Array.from(new Set(missingPricing)),
    canExport: validationIssues.length === 0 && missingPricing.length === 0 && calculatedUnits.length > 0,
  };
}
