import { z } from "zod";
import {
  ADJUSTMENT_KINDS,
  BURGLAR_BAR_TYPES,
  EXTRA_OPTIONS,
  FRAME_COLOURS,
  GLASS_TYPES,
  HARDWARE_COLOURS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPE_OPTIONS,
} from "../../shared/quote";
import { duplicateQuote, getPricingSnapshot, getQuoteById, listQuotes, saveQuote } from "../db";
import { calculateQuote } from "../quoteEngine";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const productTypeKeys = PRODUCT_TYPE_OPTIONS.map(option => option.key) as [
  (typeof PRODUCT_TYPE_OPTIONS)[number]["key"],
  ...(typeof PRODUCT_TYPE_OPTIONS)[number]["key"][],
];

const quoteHeaderSchema = z.object({
  jobRef: z.string().trim(),
  clientName: z.string().trim(),
  quoteDate: z.string().trim(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  salesperson: z.string().trim().optional().nullable(),
  installer: z.string().trim().optional().nullable(),
  estimatedHours: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  adjustmentKind: z.enum([...ADJUSTMENT_KINDS]),
  adjustmentValue: z.number().default(0),
});

const quoteUnitSchema = z.object({
  roomName: z.string().trim(),
  productCategory: z.enum([...PRODUCT_CATEGORIES]),
  productType: z.enum(productTypeKeys),
  configuration: z.string().trim().optional().nullable(),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  quantity: z.number().int().positive(),
  glassType: z.enum([...GLASS_TYPES]),
  burglarBarType: z.enum([...BURGLAR_BAR_TYPES]),
  frameColour: z.enum([...FRAME_COLOURS]),
  hardwareColour: z.enum([...HARDWARE_COLOURS]),
  extras: z.array(z.enum([...EXTRA_OPTIONS])).default([]),
  notes: z.string().trim().optional().nullable(),
});

const supportedDocumentMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
const supportedDocumentMimeTypeSchema = z.enum(supportedDocumentMimeTypes);

function decodeDataUrl(dataUrl: string, mimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid document upload format.");
  }

  if (match[1] !== mimeType) {
    throw new Error("Uploaded document MIME type did not match the provided file type.");
  }

  return Buffer.from(match[2], "base64");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "quote-source";
}

function extractJsonText(content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file_url"; file_url: { url: string } }>) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map(part => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();
}

export const quotesRouter = router({
  list: protectedProcedure.query(async () => {
    return listQuotes();
  }),

  get: protectedProcedure
    .input(
      z.object({
        quoteId: z.number().int().positive(),
      }),
    )
    .query(async ({ input }) => {
      return getQuoteById(input.quoteId);
    }),

  save: protectedProcedure
    .input(
      z.object({
        quoteId: z.number().int().positive().optional(),
        header: quoteHeaderSchema,
        units: z.array(quoteUnitSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return saveQuote({
        quoteId: input.quoteId,
        header: input.header,
        units: input.units,
        userId: ctx.user.id,
      });
    }),

  duplicate: protectedProcedure
    .input(
      z.object({
        quoteId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return duplicateQuote(input.quoteId, ctx.user.id);
    }),

  preview: protectedProcedure
    .input(
      z.object({
        header: quoteHeaderSchema,
        units: z.array(quoteUnitSchema),
      }),
    )
    .query(async ({ input }) => {
      const pricing = await getPricingSnapshot();
      return calculateQuote(input.header, input.units, pricing);
    }),

  extractDocument: protectedProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1),
        mimeType: supportedDocumentMimeTypeSchema,
        dataUrl: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fileBuffer = decodeDataUrl(input.dataUrl, input.mimeType);
      const stored = await storagePut(
        `quote-intake/${ctx.user.id}/${Date.now()}-${sanitizeFileName(input.fileName)}`,
        fileBuffer,
        input.mimeType,
      );

      const extraction = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You extract quoting information from Anglo Windows source documents. Return only structured data. Do not invent pricing. Use the provided enum values exactly. If information is missing, return empty strings, nulls, or empty arrays. Keep dimensions in millimetres and quantities as integers.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract a quote prefill from the uploaded source document. Allowed adjustmentKind values: ${ADJUSTMENT_KINDS.join(", ")}. Allowed productCategory values: ${PRODUCT_CATEGORIES.join(", ")}. Allowed productType values: ${productTypeKeys.join(", ")}. Allowed glassType values: ${GLASS_TYPES.join(", ")}. Allowed burglarBarType values: ${BURGLAR_BAR_TYPES.join(", ")}. Allowed frameColour values: ${FRAME_COLOURS.join(", ")}. Allowed hardwareColour values: ${HARDWARE_COLOURS.join(", ")}. Allowed extras values: ${EXTRA_OPTIONS.join(", ")}. If a unit type cannot be determined exactly, choose the closest visible match and note the uncertainty in unit notes.`,
              },
              input.mimeType === "application/pdf"
                ? {
                    type: "file_url",
                    file_url: {
                      url: stored.url,
                      mime_type: "application/pdf",
                    },
                  }
                : {
                    type: "image_url",
                    image_url: {
                      url: stored.url,
                      detail: "high",
                    },
                  },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quote_document_prefill",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: {
                  type: ["string", "null"],
                },
                header: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    jobRef: { type: ["string", "null"] },
                    clientName: { type: ["string", "null"] },
                    quoteDate: { type: ["string", "null"] },
                    phone: { type: ["string", "null"] },
                    address: { type: ["string", "null"] },
                    salesperson: { type: ["string", "null"] },
                    installer: { type: ["string", "null"] },
                    estimatedHours: { type: ["integer", "null"] },
                    notes: { type: ["string", "null"] },
                    adjustmentKind: { type: ["string", "null"], enum: [...ADJUSTMENT_KINDS, null] },
                    adjustmentValue: { type: ["number", "null"] },
                  },
                  required: [
                    "jobRef",
                    "clientName",
                    "quoteDate",
                    "phone",
                    "address",
                    "salesperson",
                    "installer",
                    "estimatedHours",
                    "notes",
                    "adjustmentKind",
                    "adjustmentValue",
                  ],
                },
                units: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      roomName: { type: ["string", "null"] },
                      productCategory: { type: ["string", "null"], enum: [...PRODUCT_CATEGORIES, null] },
                      productType: { type: ["string", "null"], enum: [...productTypeKeys, null] },
                      configuration: { type: ["string", "null"] },
                      widthMm: { type: ["integer", "null"] },
                      heightMm: { type: ["integer", "null"] },
                      quantity: { type: ["integer", "null"] },
                      glassType: { type: ["string", "null"], enum: [...GLASS_TYPES, null] },
                      burglarBarType: { type: ["string", "null"], enum: [...BURGLAR_BAR_TYPES, null] },
                      frameColour: { type: ["string", "null"], enum: [...FRAME_COLOURS, null] },
                      hardwareColour: { type: ["string", "null"], enum: [...HARDWARE_COLOURS, null] },
                      extras: {
                        type: "array",
                        items: { type: "string", enum: EXTRA_OPTIONS },
                      },
                      notes: { type: ["string", "null"] },
                    },
                    required: [
                      "roomName",
                      "productCategory",
                      "productType",
                      "configuration",
                      "widthMm",
                      "heightMm",
                      "quantity",
                      "glassType",
                      "burglarBarType",
                      "frameColour",
                      "hardwareColour",
                      "extras",
                      "notes",
                    ],
                  },
                },
              },
              required: ["summary", "header", "units"],
            },
          },
        },
      });

      const content = extractJsonText(extraction.choices[0]?.message.content ?? "{}");

      return {
        sourceUrl: stored.url,
        extracted: JSON.parse(content),
      };
    }),

  extractSchedules: protectedProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1),
        mimeType: z.literal("application/pdf"),
        dataUrl: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Import pdf_intake dynamically to avoid issues with Python module loading
      const { execSync } = require("child_process");
      const fs = require("fs");
      const path = require("path");
      const os = require("os");

      try {
        // Decode the data URL to get the PDF buffer
        const fileBuffer = decodeDataUrl(input.dataUrl, input.mimeType);

        // Create temporary files for input PDF and output CSV
        const tmpDir = os.tmpdir();
        const inputPdfPath = path.join(tmpDir, `pdf_intake_${Date.now()}_input.pdf`);
        const outputCsvPath = path.join(tmpDir, `pdf_intake_${Date.now()}_output.csv`);

        // Write PDF to temporary file
        fs.writeFileSync(inputPdfPath, fileBuffer);

        // Run pdf_intake.py script
        const serverDir = path.join(__dirname, "..");
        const pythonScript = path.join(serverDir, "pdf_intake.py");
        const command = `python3 "${pythonScript}" "${inputPdfPath}" "${outputCsvPath}"`;

        execSync(command, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });

        // Read the output CSV
        const csvContent = fs.readFileSync(outputCsvPath, "utf-8");

        // Parse CSV into schedule items
        const lines: string[] = csvContent.trim().split("\n");
        const headers: string[] = lines[0].split(",");
        const scheduleItems = lines.slice(1).map((line: string) => {
          const values = line.split(",");
          return {
            code: values[headers.indexOf("code")] || "",
            width: parseInt(values[headers.indexOf("width")]) || null,
            height: parseInt(values[headers.indexOf("height")]) || null,
            finish: values[headers.indexOf("finish")] || "",
            glazing: values[headers.indexOf("glazing")] || "",
            safety_flag: values[headers.indexOf("safety_flag")] === "True",
            schedule_type: values[headers.indexOf("schedule_type")] || "",
            flags: values[headers.indexOf("flags")] ? values[headers.indexOf("flags")].split(";").map((f: string) => f.trim()) : [],
          };
        });

        // Clean up temporary files
        fs.unlinkSync(inputPdfPath);
        fs.unlinkSync(outputCsvPath);

        return {
          success: true,
          scheduleItems,
          itemCount: scheduleItems.length,
          windowCount: scheduleItems.filter((item: any) => item.code.startsWith("W")).length,
          doorCount: scheduleItems.filter((item: any) => item.code.startsWith("D") || item.code.startsWith("SD")).length,
        };
      } catch (error) {
        console.error("PDF schedule extraction error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error during PDF extraction",
          scheduleItems: [],
          itemCount: 0,
          windowCount: 0,
          doorCount: 0,
        };
      }
    }),

  catalog: protectedProcedure.query(async () => {
    return {
      productCategories: PRODUCT_CATEGORIES,
      productTypes: PRODUCT_TYPE_OPTIONS,
      glassTypes: GLASS_TYPES,
      burglarBarTypes: BURGLAR_BAR_TYPES,
      frameColours: FRAME_COLOURS,
      hardwareColours: HARDWARE_COLOURS,
      extras: EXTRA_OPTIONS,
      supportedDocumentMimeTypes,
    };
  }),
});
