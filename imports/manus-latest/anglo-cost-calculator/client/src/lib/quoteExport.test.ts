import { describe, expect, it } from "vitest";
import { buildPdfDetailLines, buildPdfTableBody } from "./quoteExport";

describe("quoteExport", () => {
  it("builds branded PDF detail lines for Anglo Windows quotes", () => {
    const details = buildPdfDetailLines(
      {
        jobRef: "AW-2026-014",
        clientName: "Cape Town Villas",
        quoteDate: "2026-04-13",
        phone: "0820000000",
        address: "1 Main Road, Cape Town",
        salesperson: "Angus",
        installer: "Mandla",
        estimatedHours: 12,
        notes: "Install after site glazing prep.",
        adjustmentKind: "MARKUP",
        adjustmentValue: 15,
      },
      {
        units: [],
        subtotalCents: 125000,
        adjustmentCents: 18750,
        totalCents: 143750,
      },
    );

    expect(details.heading).toBe("Anglo Windows");
    expect(details.subheading).toBe("Internal Quote Export");
    expect(details.topMeta).toEqual([
      "Job ref: AW-2026-014",
      "Client: Cape Town Villas",
      "Quote date: 2026-04-13",
    ]);
    expect(details.jobDetails).toContain("Phone: 0820000000");
    expect(details.jobDetails).toContain("Salesperson: Angus");
    expect(details.jobDetails).toContain("Installer: Mandla");
    expect(details.jobDetails).toContain("Estimated hours: 12");
    expect(details.jobDetails).toContain("Adjustment: Markup 15");
    expect(details.jobDetails).toContain("Notes: Install after site glazing prep.");
    expect(details.totals).toEqual([
      "Subtotal: R 1,250.00",
      "Adjustment: R 187.50",
      "Total: R 1,437.50",
    ]);
    expect(details.footer).toMatch(/Generated for Anglo Windows internal quoting/);
  });

  it("builds PDF table rows using product, glass, extras, and totals", () => {
    const rows = buildPdfTableBody([
      {
        roomName: "Lounge",
        productType: "SLIDING_WINDOW",
        widthMm: 1800,
        heightMm: 1200,
        quantity: 2,
        glassType: "SAFETY",
        extras: ["WRAP", "VIDEO"],
        configuration: "XO",
        lineTotalCents: 845000,
      },
    ]);

    expect(rows).toEqual([
      ["Lounge", "Sliding Window", "1800 × 1200", "2", "Safety", "Wrap, Video", "R 8,450.00"],
    ]);
  });
});
