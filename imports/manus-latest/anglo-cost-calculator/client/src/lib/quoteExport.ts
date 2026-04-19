import {
  ADJUSTMENT_LABELS,
  EXTRA_LABELS,
  GLASS_LABELS,
  PRODUCT_TYPE_LOOKUP,
  type ExtraOption,
  type GlassType,
  type ProductTypeKey,
} from "../../../shared/quote";

export type QuoteExportHeader = {
  jobRef: string;
  clientName: string;
  quoteDate: string;
  phone: string;
  address: string;
  salesperson: string;
  installer: string;
  estimatedHours: number;
  notes: string;
  adjustmentKind: keyof typeof ADJUSTMENT_LABELS;
  adjustmentValue: number;
};

export type QuoteExportUnit = {
  roomName: string;
  productType: ProductTypeKey;
  widthMm: number;
  heightMm: number;
  quantity: number;
  glassType: GlassType;
  extras: ExtraOption[];
  configuration?: string | null;
  lineTotalCents: number;
};

export type QuoteExportSummary = {
  units: QuoteExportUnit[];
  subtotalCents: number;
  adjustmentCents: number;
  totalCents: number;
};

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

export function formatCurrency(cents: number) {
  return currencyFormatter.format((cents || 0) / 100);
}

export function buildUnitDisplay(unit: QuoteExportUnit) {
  return {
    roomName: unit.roomName,
    typeLabel: PRODUCT_TYPE_LOOKUP[unit.productType].label,
    sizeLabel: `${unit.widthMm} × ${unit.heightMm}`,
    quantityLabel: String(unit.quantity),
    glassLabel: GLASS_LABELS[unit.glassType],
    extrasLabel: unit.extras.length > 0 ? unit.extras.map(extra => EXTRA_LABELS[extra]).join(", ") : "—",
    configurationLabel: unit.configuration || "Standard configuration",
    lineTotalLabel: formatCurrency(unit.lineTotalCents),
  };
}

export function buildPdfTableBody(units: QuoteExportUnit[]) {
  return units.map(unit => {
    const display = buildUnitDisplay(unit);
    return [
      display.roomName,
      display.typeLabel,
      display.sizeLabel,
      display.quantityLabel,
      display.glassLabel,
      display.extrasLabel,
      display.lineTotalLabel,
    ];
  });
}

export function buildPdfDetailLines(header: QuoteExportHeader, summary: QuoteExportSummary) {
  return {
    heading: "Anglo Windows",
    subheading: "Internal Quote Export",
    topMeta: [
      `Job ref: ${header.jobRef}`,
      `Client: ${header.clientName}`,
      `Quote date: ${header.quoteDate}`,
    ],
    jobDetails: [
      `Phone: ${header.phone || "Not supplied"}`,
      `Address: ${header.address || "Not supplied"}`,
      `Salesperson: ${header.salesperson || "Not supplied"}`,
      `Installer: ${header.installer || "Not supplied"}`,
      `Estimated hours: ${header.estimatedHours || 0}`,
      `Adjustment: ${ADJUSTMENT_LABELS[header.adjustmentKind]} ${header.adjustmentValue || 0}`,
      `Notes: ${header.notes || "No additional notes."}`,
    ],
    totals: [
      `Subtotal: ${formatCurrency(summary.subtotalCents)}`,
      `Adjustment: ${formatCurrency(summary.adjustmentCents)}`,
      `Total: ${formatCurrency(summary.totalCents)}`,
    ],
    footer:
      "Generated for Anglo Windows internal quoting. Final pricing remains subject to material, manufacturing, and installation confirmation.",
  };
}
