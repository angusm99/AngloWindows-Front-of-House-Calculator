import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Copy,
  DoorClosed,
  FileDown,
  Loader2,
  PanelTop,
  Plus,
  Printer,
  ReceiptText,
  Save,
  ScanLine,
  Settings2,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { buildPdfDetailLines, buildPdfTableBody } from "@/lib/quoteExport";
import {
  ADJUSTMENT_KINDS,
  ADJUSTMENT_LABELS,
  BURGLAR_BAR_LABELS,
  BURGLAR_BAR_TYPES,
  COLOUR_LABELS,
  EXTRA_LABELS,
  EXTRA_OPTIONS,
  FRAME_COLOURS,
  GLASS_LABELS,
  GLASS_TYPES,
  HARDWARE_COLOURS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPE_LOOKUP,
  PRODUCT_TYPE_OPTIONS,
  type AdjustmentKind,
  type BurglarBarType,
  type ExtraOption,
  type FrameColour,
  type GlassType,
  type HardwareColour,
  type ProductCategory,
  type ProductTypeKey,
} from "../../../shared/quote";

type QuoteHeaderForm = {
  jobRef: string;
  clientName: string;
  quoteDate: string;
  phone: string;
  address: string;
  salesperson: string;
  installer: string;
  estimatedHours: number;
  notes: string;
  adjustmentKind: AdjustmentKind;
  adjustmentValue: number;
};

type QuoteUnitForm = {
  localId: string;
  roomName: string;
  productCategory: ProductCategory;
  productType: ProductTypeKey;
  configuration: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  glassType: GlassType;
  burglarBarType: BurglarBarType;
  frameColour: FrameColour;
  hardwareColour: HardwareColour;
  extras: ExtraOption[];
  notes: string;
};

type PricingDraft = {
  products: Record<string, { baseAmount: number; areaRate: number; isActive: boolean }>;
  glass: Record<string, { surcharge: number; isActive: boolean }>;
  extras: Record<string, { amount: number; isActive: boolean }>;
};

type TabKey = "builder" | "saved" | "pricing";
type IntakeMode = "upload" | "manual";

const angloLogoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395163475/KqvsntT7BTuX9cKkgSoajt/Anglo_LOGO_eccf0518.png";
const angloWallpaperUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395163475/KqvsntT7BTuX9cKkgSoajt/WALLPAPERANGLO_7a6115dc.png";
const productTypeKeys = PRODUCT_TYPE_OPTIONS.map(option => option.key) as ProductTypeKey[];

const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

function createUnit(): QuoteUnitForm {
  return {
    localId: createLocalId(),
    roomName: "",
    productCategory: "WINDOW",
    productType: "FIXED_WINDOW",
    configuration: "",
    widthMm: 1200,
    heightMm: 1200,
    quantity: 1,
    glassType: "STANDARD",
    burglarBarType: "NONE",
    frameColour: "CHARCOAL",
    hardwareColour: "BLACK",
    extras: [],
    notes: "",
  };
}

function createHeader(): QuoteHeaderForm {
  return {
    jobRef: "",
    clientName: "",
    quoteDate: new Date().toISOString().slice(0, 10),
    phone: "",
    address: "",
    salesperson: "",
    installer: "",
    estimatedHours: 0,
    notes: "",
    adjustmentKind: "NONE",
    adjustmentValue: 0,
  };
}

function createLocalId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `unit-${Math.random().toString(36).slice(2, 10)}`;
}

function formatCurrency(cents: number) {
  return currencyFormatter.format((cents || 0) / 100);
}

function isOption<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function sanitizeFilename(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "anglo-windows-quote";
}

function getHeaderErrors(header: QuoteHeaderForm) {
  return {
    jobRef: !header.jobRef.trim(),
    clientName: !header.clientName.trim(),
    quoteDate: !header.quoteDate.trim(),
    contact: !header.phone.trim() && !header.address.trim(),
  };
}

function getUnitErrors(unit: QuoteUnitForm) {
  return {
    roomName: !unit.roomName.trim(),
    productType: !unit.productType,
    widthMm: unit.widthMm <= 0,
    heightMm: unit.heightMm <= 0,
    quantity: unit.quantity <= 0,
  };
}

function toHeaderPayload(header: QuoteHeaderForm) {
  return {
    ...header,
    phone: header.phone.trim() || null,
    address: header.address.trim() || null,
    salesperson: header.salesperson.trim() || null,
    installer: header.installer.trim() || null,
    estimatedHours: header.estimatedHours > 0 ? Math.round(header.estimatedHours) : null,
    notes: header.notes.trim() || null,
  };
}

function toUnitPayload(unit: QuoteUnitForm) {
  return {
    roomName: unit.roomName.trim(),
    productCategory: unit.productCategory,
    productType: unit.productType,
    configuration: unit.configuration.trim() || null,
    widthMm: Math.round(unit.widthMm),
    heightMm: Math.round(unit.heightMm),
    quantity: Math.round(unit.quantity),
    glassType: unit.glassType,
    burglarBarType: unit.burglarBarType,
    frameColour: unit.frameColour,
    hardwareColour: unit.hardwareColour,
    extras: unit.extras,
    notes: unit.notes.trim() || null,
  };
}

function ProductGlyph({ productType }: { productType: ProductTypeKey }) {
  if (productType === "FIXED_WINDOW") {
    return <Square className="h-8 w-8" />;
  }
  if (productType === "TOP_HUNG_WINDOW") {
    return <PanelTop className="h-8 w-8" />;
  }
  if (productType === "SIDE_HUNG_WINDOW") {
    return <ScanLine className="h-8 w-8 rotate-90" />;
  }
  if (productType.includes("SLIDING") && productType.includes("WINDOW")) {
    return <ScanLine className="h-8 w-8" />;
  }
  return <DoorClosed className="h-8 w-8" />;
}

function ProductTypeCard({
  option,
  active,
  onSelect,
}: {
  option: (typeof PRODUCT_TYPE_OPTIONS)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-primary bg-primary/12 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
          : "border-border/70 bg-background/40 hover:border-primary/50 hover:bg-primary/8"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl border p-3 ${active ? "border-primary/50 bg-primary/10 text-primary" : "border-border/70 bg-card/60 text-muted-foreground"}`}>
          <ProductGlyph productType={option.key} />
        </div>
        <Badge variant="outline" className="border-secondary/40 bg-secondary/10 text-secondary-foreground">
          {option.category.replace("_", " ")}
        </Badge>
      </div>
      <div className="mt-4">
        <p className={`font-display text-sm uppercase tracking-[0.18em] ${active ? "text-primary glow-cyan" : "text-foreground"}`}>
          {option.label}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
      </div>
    </button>
  );
}

function SectionTab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Calculator;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm uppercase tracking-[0.18em] transition-all ${
        active
          ? "border-primary bg-primary/12 text-primary shadow-[0_0_22px_rgba(34,211,238,0.16)]"
          : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function Home() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<TabKey>("builder");
  const [currentQuoteId, setCurrentQuoteId] = useState<number | undefined>();
  const [workspaceVisible, setWorkspaceVisible] = useState(false);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("upload");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [extractionSummary, setExtractionSummary] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [header, setHeader] = useState<QuoteHeaderForm>(() => createHeader());
  const [units, setUnits] = useState<QuoteUnitForm[]>([createUnit()]);
  const [showValidation, setShowValidation] = useState(false);
  const [pricingDraft, setPricingDraft] = useState<PricingDraft>({ products: {}, glass: {}, extras: {} });
  const [extractedScheduleItems, setExtractedScheduleItems] = useState<Array<{
    code: string;
    width: number | null;
    height: number | null;
    finish: string;
    glazing: string;
    safety_flag: boolean;
    schedule_type: string;
    flags: string[];
  }>>([]);
  const [showScheduleReview, setShowScheduleReview] = useState(false);
  const [scheduleEdits, setScheduleEdits] = useState<Record<string, {
    productType?: ProductTypeKey;
    width?: number;
    height?: number;
    quantity?: number;
  }>>({});

  const catalogQuery = trpc.quotes.catalog.useQuery();
  const pricingQuery = trpc.pricing.snapshot.useQuery();
  const quotesListQuery = trpc.quotes.list.useQuery();

  const previewInput = useMemo(
    () => ({
      header: toHeaderPayload(header),
      units: units.map(toUnitPayload),
    }),
    [header, units],
  );

  const previewQuery = trpc.quotes.preview.useQuery(previewInput, {
    refetchOnWindowFocus: false,
  });

  const saveQuoteMutation = trpc.quotes.save.useMutation({
    onSuccess: async result => {
      const savedId = result.saved?.quote.id;
      setCurrentQuoteId(savedId);
      await Promise.all([utils.quotes.list.invalidate(), utils.quotes.preview.invalidate()]);
      toast.success(savedId ? `Quote ${result.saved?.quote.jobRef} saved successfully.` : "Quote saved successfully.");
    },
    onError: error => {
      toast.error(error.message || "Unable to save the quote.");
    },
  });

  const duplicateQuoteMutation = trpc.quotes.duplicate.useMutation({
    onSuccess: async () => {
      await quotesListQuery.refetch();
      toast.success("Quote duplicated.");
    },
    onError: error => {
      toast.error(error.message || "Unable to duplicate quote.");
    },
  });

  const extractSchedulesMutation = trpc.quotes.extractSchedules.useMutation({
    onSuccess: result => {
      if (!result.success || result.scheduleItems.length === 0) {
        // Fall back to LLM extraction if schedule extraction fails
        toast.info("No schedule data found. Trying document analysis...");
        return;
      }

      // Store extracted items for review
      setExtractedScheduleItems(result.scheduleItems);
      setShowScheduleReview(true);
      setCurrentQuoteId(undefined);
      setHeader(createHeader());
      setUnits([]);
      setShowValidation(false);
      setIntakeMode('upload');
      setWorkspaceVisible(true);
      setExtractionSummary(`Extracted ${result.itemCount} items: ${result.windowCount} windows, ${result.doorCount} doors. Review and confirm below.`);
      toast.success(`Extracted ${result.itemCount} schedule items. Review and confirm product types.`);
    },
    onError: error => {
      toast.error(error.message || "Unable to extract schedule data.");
    },
  });

  const extractDocumentMutation = trpc.quotes.extractDocument.useMutation({
    onSuccess: result => {
      const extracted = result.extracted as {
        summary?: string | null;
        header?: Record<string, unknown>;
        units?: Array<Record<string, unknown>>;
      };

      const extractedHeader = extracted.header ?? {};
      const nextHeader: QuoteHeaderForm = {
        ...createHeader(),
        jobRef: typeof extractedHeader.jobRef === "string" ? extractedHeader.jobRef : "",
        clientName: typeof extractedHeader.clientName === "string" ? extractedHeader.clientName : "",
        quoteDate: typeof extractedHeader.quoteDate === "string" && extractedHeader.quoteDate ? extractedHeader.quoteDate : createHeader().quoteDate,
        phone: typeof extractedHeader.phone === "string" ? extractedHeader.phone : "",
        address: typeof extractedHeader.address === "string" ? extractedHeader.address : "",
        salesperson: typeof extractedHeader.salesperson === "string" ? extractedHeader.salesperson : "",
        installer: typeof extractedHeader.installer === "string" ? extractedHeader.installer : "",
        estimatedHours: typeof extractedHeader.estimatedHours === "number" ? Math.max(0, extractedHeader.estimatedHours) : 0,
        notes: typeof extractedHeader.notes === "string" ? extractedHeader.notes : "",
        adjustmentKind: isOption(ADJUSTMENT_KINDS, extractedHeader.adjustmentKind) ? extractedHeader.adjustmentKind : "NONE",
        adjustmentValue: typeof extractedHeader.adjustmentValue === "number" ? extractedHeader.adjustmentValue : 0,
      };

      const nextUnits: QuoteUnitForm[] = Array.isArray(extracted.units) && extracted.units.length > 0
        ? extracted.units.map(unit => ({
            ...createUnit(),
            localId: createLocalId(),
            roomName: typeof unit.roomName === "string" ? unit.roomName : "",
            productCategory: isOption(PRODUCT_CATEGORIES, unit.productCategory) ? unit.productCategory : "WINDOW",
            productType: isOption(productTypeKeys, unit.productType) ? (unit.productType as ProductTypeKey) : "FIXED_WINDOW",
            configuration: typeof unit.configuration === "string" ? unit.configuration : "",
            widthMm: typeof unit.widthMm === "number" && unit.widthMm > 0 ? Math.round(unit.widthMm) : 1200,
            heightMm: typeof unit.heightMm === "number" && unit.heightMm > 0 ? Math.round(unit.heightMm) : 1200,
            quantity: typeof unit.quantity === "number" && unit.quantity > 0 ? Math.round(unit.quantity) : 1,
            glassType: isOption(GLASS_TYPES, unit.glassType) ? unit.glassType : "STANDARD",
            burglarBarType: isOption(BURGLAR_BAR_TYPES, unit.burglarBarType) ? unit.burglarBarType : "NONE",
            frameColour: isOption(FRAME_COLOURS, unit.frameColour) ? unit.frameColour : "CHARCOAL",
            hardwareColour: isOption(HARDWARE_COLOURS, unit.hardwareColour) ? unit.hardwareColour : "BLACK",
            extras: Array.isArray(unit.extras)
              ? unit.extras.filter(extra => isOption(EXTRA_OPTIONS, extra))
              : [],
            notes: typeof unit.notes === "string" ? unit.notes : "",
          }))
        : [createUnit()];

      setCurrentQuoteId(undefined);
      setHeader(nextHeader);
      setUnits(nextUnits);
      setShowValidation(false);
      setIntakeMode("upload");
      setWorkspaceVisible(true);
      setExtractionSummary(typeof extracted.summary === "string" ? extracted.summary : "");
      toast.success("Document analysed and quote draft prepared.");
    },
    onError: error => {
      toast.error(error.message || "Unable to extract information from the selected document.");
    },
  });

  const upsertProductRuleMutation = trpc.pricing.upsertProductRule.useMutation({
    onSuccess: async () => {
      await pricingQuery.refetch();
      toast.success("Product pricing updated.");
    },
    onError: error => {
      toast.error(error.message || "You do not have permission to update product pricing.");
    },
  });

  const upsertGlassRuleMutation = trpc.pricing.upsertGlassRule.useMutation({
    onSuccess: async () => {
      await pricingQuery.refetch();
      toast.success("Glass pricing updated.");
    },
    onError: error => {
      toast.error(error.message || "You do not have permission to update glass pricing.");
    },
  });

  const upsertExtraRuleMutation = trpc.pricing.upsertExtraRule.useMutation({
    onSuccess: async () => {
      await pricingQuery.refetch();
      toast.success("Extra pricing updated.");
    },
    onError: error => {
      toast.error(error.message || "You do not have permission to update extra pricing.");
    },
  });

  useEffect(() => {
    if (!pricingQuery.data) return;

    setPricingDraft({
      products: Object.fromEntries(
        PRODUCT_TYPE_OPTIONS.map(option => {
          const found = pricingQuery.data?.productRules.find(rule => rule.productType === option.key);
          return [
            option.key,
            {
              baseAmount: (found?.baseAmountCents ?? 0) / 100,
              areaRate: (found?.areaRatePerSqmCents ?? 0) / 100,
              isActive: found?.isActive ?? false,
            },
          ];
        }),
      ),
      glass: Object.fromEntries(
        GLASS_TYPES.map(glassType => {
          const found = pricingQuery.data?.glassRules.find(rule => rule.glassType === glassType);
          return [
            glassType,
            {
              surcharge: (found?.surchargeCents ?? 0) / 100,
              isActive: found?.isActive ?? false,
            },
          ];
        }),
      ),
      extras: Object.fromEntries(
        EXTRA_OPTIONS.map(extraKey => {
          const found = pricingQuery.data?.extraRules.find(rule => rule.extraKey === extraKey);
          return [
            extraKey,
            {
              amount: (found?.amountCents ?? 0) / 100,
              isActive: found?.isActive ?? false,
            },
          ];
        }),
      ),
    });
  }, [pricingQuery.data]);

  const summary = previewQuery.data;
  const headerErrors = getHeaderErrors(header);

  const updateHeader = <K extends keyof QuoteHeaderForm>(key: K, value: QuoteHeaderForm[K]) => {
    setHeader(current => ({ ...current, [key]: value }));
  };

  const updateUnit = <K extends keyof QuoteUnitForm>(localId: string, key: K, value: QuoteUnitForm[K]) => {
    setUnits(current =>
      current.map(unit => (unit.localId === localId ? { ...unit, [key]: value } : unit)),
    );
  };

  const addUnit = () => {
    setUnits(current => [...current, createUnit()]);
  };

  const removeUnit = (localId: string) => {
    setUnits(current => (current.length === 1 ? current : current.filter(unit => unit.localId !== localId)));
  };

  const resetBuilder = () => {
    setCurrentQuoteId(undefined);
    setShowValidation(false);
    setHeader(createHeader());
    setUnits([createUnit()]);
    setWorkspaceVisible(false);
    setIntakeMode("upload");
    setUploadedFileName("");
    setExtractionSummary("");
    toast.success("Started a new quote draft.");
  };

  const loadQuote = async (quoteId: number) => {
    try {
      const result = await utils.quotes.get.fetch({ quoteId });
      if (!result) {
        toast.error("Quote not found.");
        return;
      }

      setCurrentQuoteId(result.quote.id);
      setHeader({
        jobRef: result.quote.jobRef,
        clientName: result.quote.clientName,
        quoteDate: result.quote.quoteDate,
        phone: result.quote.phone ?? "",
        address: result.quote.address ?? "",
        salesperson: result.quote.salesperson ?? "",
        installer: result.quote.installer ?? "",
        estimatedHours: result.quote.estimatedHours ?? 0,
        notes: result.quote.notes ?? "",
        adjustmentKind: result.quote.adjustmentKind as AdjustmentKind,
        adjustmentValue: result.quote.adjustmentValue,
      });
      setUnits(
        result.units.map(unit => ({
          localId: createLocalId(),
          roomName: unit.roomName,
          productCategory: unit.productCategory as ProductCategory,
          productType: unit.productType as ProductTypeKey,
          configuration: unit.configuration ?? "",
          widthMm: unit.widthMm,
          heightMm: unit.heightMm,
          quantity: unit.quantity,
          glassType: unit.glassType as GlassType,
          burglarBarType: unit.burglarBarType as BurglarBarType,
          frameColour: unit.frameColour as FrameColour,
          hardwareColour: unit.hardwareColour as HardwareColour,
          extras: Array.isArray(unit.extrasJson) ? (unit.extrasJson as ExtraOption[]) : [],
          notes: unit.notes ?? "",
        })),
      );
      setActiveTab("builder");
      setWorkspaceVisible(true);
      setShowValidation(false);
      setUploadedFileName("");
      setExtractionSummary("");
      toast.success(`Loaded quote ${result.quote.jobRef}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load the selected quote.");
    }
  };

  const startManualEntry = () => {
    setIntakeMode("manual");
    setWorkspaceVisible(true);
    setExtractionSummary("");
  };

  const openDocumentPicker = () => {
    setIntakeMode("upload");
    fileInputRef.current?.click();
  };

  const handleDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const supportedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
    if (!isOption(supportedMimeTypes, file.type)) {
      toast.error("Please upload a PDF, PNG, JPG, or WEBP file.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUploadedFileName(file.name);
      
      // For PDFs, try schedule extraction first
      if (file.type === "application/pdf") {
        toast.loading("Extracting schedule data...");
        try {
          await extractSchedulesMutation.mutateAsync({
            fileName: file.name,
            mimeType: "application/pdf",
            dataUrl,
          });
          return; // Success, stop here
        } catch (scheduleError) {
          // Schedule extraction failed, fall back to LLM
          toast.dismiss();
          toast.info("Schedule extraction unavailable. Using document analysis...");
        }
      }
      
      // Fall back to LLM extraction for images or if schedule extraction failed
      await extractDocumentMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process the selected document.");
    }
  };

  const validateBeforeAction = () => {
    setShowValidation(true);
    if (!summary?.canExport) {
      toast.error("Please fix validation issues and missing pricing before saving or exporting.");
      return false;
    }
    return true;
  };

  const saveQuote = async () => {
    setShowValidation(true);

    await saveQuoteMutation.mutateAsync({
      quoteId: currentQuoteId,
      header: toHeaderPayload(header),
      units: units.map(toUnitPayload),
    });

    if (!summary?.canExport) {
      toast.success("Draft saved. Complete the required fields and pricing rules before exporting the quote.");
    }
  };

  const downloadPdf = async () => {
    if (!validateBeforeAction() || !summary) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pdfDetails = buildPdfDetailLines(header, summary);

    doc.setFillColor(8, 10, 18);
    doc.rect(0, 0, pageWidth, 130, "F");
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(1);
    doc.line(40, 96, pageWidth - 40, 96);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(250, 204, 21);
    doc.text(pdfDetails.heading, 40, 48);

    doc.setFontSize(11);
    doc.setTextColor(244, 114, 182);
    doc.text(pdfDetails.subheading, 40, 70);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    doc.text(pdfDetails.topMeta[0] || "", 40, 114);
    doc.text(pdfDetails.topMeta[1] || "", 180, 114);
    doc.text(pdfDetails.topMeta[2] || "", 380, 114);

    autoTable(doc, {
      startY: 148,
      theme: "grid",
      headStyles: {
        fillColor: [17, 24, 39],
        textColor: [244, 114, 182],
        lineColor: [56, 189, 248],
        lineWidth: 0.4,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: [31, 41, 55],
        lineWidth: 0.25,
        textColor: [17, 24, 39],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      head: [["Room", "Type", "Size (mm)", "Qty", "Glass", "Extras", "Line total"]],
      body: buildPdfTableBody(summary.units),
    });

    const tableFinalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 148;
    const summaryTop = tableFinalY + 28;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(8, 10, 18);
    doc.text("Job details", 40, summaryTop);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(pdfDetails.jobDetails[0] || "", 40, summaryTop + 20);
    doc.text(pdfDetails.jobDetails[1] || "", 40, summaryTop + 36);
    doc.text(pdfDetails.jobDetails[2] || "", 40, summaryTop + 52);
    doc.text(pdfDetails.jobDetails[3] || "", 260, summaryTop + 20);
    doc.text(pdfDetails.jobDetails[4] || "", 260, summaryTop + 36);
    doc.text(pdfDetails.jobDetails[5] || "", 260, summaryTop + 52);
    doc.text(pdfDetails.jobDetails[6] || "", 40, summaryTop + 68);

    doc.setFont("helvetica", "bold");
    doc.text("Totals", 40, summaryTop + 104);
    doc.setFont("helvetica", "normal");
    doc.text(pdfDetails.totals[0] || "", 40, summaryTop + 124);
    doc.text(pdfDetails.totals[1] || "", 40, summaryTop + 140);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(14, 165, 233);
    doc.text(pdfDetails.totals[2] || "", 40, summaryTop + 160);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text(
      pdfDetails.footer,
      40,
      summaryTop + 192,
      { maxWidth: pageWidth - 80 },
    );

    doc.save(`${sanitizeFilename(header.jobRef || header.clientName || "anglo-windows-quote")}.pdf`);
  };

  const printQuote = async () => {
    if (!validateBeforeAction()) return;
    window.print();
  };

  const duplicateQuote = async (quoteId: number) => {
    await duplicateQuoteMutation.mutateAsync({ quoteId });
  };

  const filteredOptions = PRODUCT_TYPE_OPTIONS.filter(option => option.category === PRODUCT_TYPE_LOOKUP[option.key].category);

  const totals = {
    subtotal: summary?.subtotalCents ?? 0,
    adjustment: summary?.adjustmentCents ?? 0,
    total: summary?.totalCents ?? 0,
  };

  return (
    <div className="space-y-6">
      <section className="hud-panel overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-stretch">
          <div className="relative overflow-hidden rounded-[30px] border border-primary/25 bg-black/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-8">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.88), rgba(0,0,0,0.58)), url(${angloWallpaperUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="w-fit rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-primary">
                  Anglo Windows Internal Tool
                </Badge>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70">
                  Faster intake, calmer workflow
                </div>
              </div>
              <div className="max-w-2xl space-y-4">
                <img src={angloLogoUrl} alt="Anglo Windows" className="h-14 w-auto rounded-xl border border-primary/20 bg-primary/90 p-2 shadow-[0_12px_35px_rgba(245,197,24,0.2)]" />
                <div className="space-y-3">
                  <h1 className="font-display text-3xl uppercase tracking-[0.18em] text-white md:text-5xl">
                    Start a new quote
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                    Begin with a document for assisted extraction, or open the manual builder and capture the quote step by step. The full pricing workspace stays out of the way until you need it.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] uppercase tracking-[0.26em] text-white/58">
                  <div className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5">Units in draft · {units.length}</div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Subtotal · {formatCurrency(totals.subtotal)}</div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Quote total · {formatCurrency(totals.total)}</div>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 no-print">
                <Card className="border border-primary/25 bg-black/60 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg uppercase tracking-[0.18em] text-white">Upload and prefill</CardTitle>
                    <CardDescription className="text-sm text-white/65">
                      Upload a PDF or image and let the system extract job details and likely units into a draft quote.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="neon-button w-full justify-center" onClick={openDocumentPicker} disabled={extractDocumentMutation.isPending}>
                      {extractDocumentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                      Upload document
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={handleDocumentSelected} />
                    <div className="space-y-2 text-xs text-white/60">
                      <p>{uploadedFileName ? `Latest file: ${uploadedFileName}` : "Supported formats: PDF, PNG, JPG, WEBP."}</p>
                      {extractionSummary ? <p className="text-primary">{extractionSummary}</p> : null}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-white/10 bg-white/[0.03] backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg uppercase tracking-[0.18em] text-white">Manual entry</CardTitle>
                    <CardDescription className="text-sm text-white/65">
                      Open the full quote builder when you want to capture the job header and units directly with guided prompts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full border-primary/35 bg-primary/10 text-primary hover:bg-primary/20" onClick={startManualEntry}>
                      <Plus className="mr-2 h-4 w-4" />
                      Open manual builder
                    </Button>
                    <p className="text-xs leading-6 text-white/55">
                      Best for walk-in enquiries, phone calls, or any job where the details still need to be captured from scratch.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div className="grid gap-4 self-start">
            <Card className="border border-primary/20 bg-black/55">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg uppercase tracking-[0.18em] text-white">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 no-print">
                <SectionTab active={activeTab === "builder"} label="Quote Builder" icon={Calculator} onClick={() => setActiveTab("builder")} />
                <SectionTab active={activeTab === "saved"} label="Saved Quotes" icon={ReceiptText} onClick={() => setActiveTab("saved")} />
                <SectionTab active={activeTab === "pricing"} label="Price Book" icon={Settings2} onClick={() => setActiveTab("pricing")} />
              </CardContent>
            </Card>
            {!workspaceVisible ? (
              <Card className="border border-white/10 bg-white/[0.03]">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg uppercase tracking-[0.18em] text-white">Before you begin</CardTitle>
                  <CardDescription className="text-sm text-white/65">
                    Keep the first step simple: choose upload if a client has already sent a drawing or quote request, or choose manual if reception is capturing details live.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        </div>
      </section>

      {activeTab === "builder" ? workspaceVisible ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
          <div className="space-y-6">
            <Card className="hud-panel border-none bg-transparent">
              <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Job Header</CardTitle>
                    <CardDescription className="mt-2 text-sm text-muted-foreground">
                      Capture the core client and site details before building the individual window and door units.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 no-print">
                    <Button variant="outline" className="border-border/70 bg-background/50" onClick={resetBuilder}>
                      Start new draft
                    </Button>
                    <Button className="neon-button" onClick={saveQuote} disabled={saveQuoteMutation.isPending}>
                      {saveQuoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save quote
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 md:px-6 md:pb-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Job reference" required error={showValidation && headerErrors.jobRef}>
                    <Input value={header.jobRef} onChange={e => updateHeader("jobRef", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="AW-2026-001" />
                  </Field>
                  <Field label="Client name" required error={showValidation && headerErrors.clientName}>
                    <Input value={header.clientName} onChange={e => updateHeader("clientName", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="Client / company name" />
                  </Field>
                  <Field label="Quote date" required error={showValidation && headerErrors.quoteDate}>
                    <Input type="date" value={header.quoteDate} onChange={e => updateHeader("quoteDate", e.target.value)} className="field-shell h-12 border-0 bg-transparent" />
                  </Field>
                  <Field label="Phone" error={showValidation && headerErrors.contact}>
                    <Input value={header.phone} onChange={e => updateHeader("phone", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="Client contact number" />
                  </Field>
                  <Field label="Salesperson">
                    <Input value={header.salesperson} onChange={e => updateHeader("salesperson", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="Handled by" />
                  </Field>
                  <Field label="Installer">
                    <Input value={header.installer} onChange={e => updateHeader("installer", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="Assigned installer" />
                  </Field>
                  <Field label="Estimated hours">
                    <Input type="number" min={0} value={header.estimatedHours} onChange={e => updateHeader("estimatedHours", Math.max(0, Number(e.target.value)))} className="field-shell h-12 border-0 bg-transparent" />
                  </Field>
                  <Field label="Markup / discount type">
                    <select
                      value={header.adjustmentKind}
                      onChange={e => updateHeader("adjustmentKind", e.target.value as AdjustmentKind)}
                      className="field-shell h-12 w-full px-4 text-sm text-foreground"
                    >
                      {ADJUSTMENT_KINDS.map(kind => (
                        <option key={kind} value={kind}>
                          {ADJUSTMENT_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Adjustment value">
                    <Input type="number" value={header.adjustmentValue} onChange={e => updateHeader("adjustmentValue", Number(e.target.value))} className="field-shell h-12 border-0 bg-transparent" />
                  </Field>
                </div>

                <Field label="Address" requiredHint={showValidation && headerErrors.contact ? "Phone or address is required." : undefined} error={showValidation && headerErrors.contact}>
                  <Textarea value={header.address} onChange={e => updateHeader("address", e.target.value)} className="field-shell min-h-24 border-0 bg-transparent" placeholder="Site address" />
                </Field>

                <Field label="Notes">
                  <Textarea value={header.notes} onChange={e => updateHeader("notes", e.target.value)} className="field-shell min-h-28 border-0 bg-transparent" placeholder="Job notes, scope notes, access restrictions, or production instructions" />
                </Field>
              </CardContent>
            </Card>

            {showScheduleReview && extractedScheduleItems.length > 0 ? (
              <Card className="hud-panel border-none bg-transparent">
                <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Review Extracted Schedule</CardTitle>
                      <CardDescription className="mt-2 text-sm text-muted-foreground">
                        Confirm product types and dimensions. Edit any cells to adjust before adding to quote.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 no-print">
                      <Button variant="outline" className="border-border/70 bg-background/40" onClick={() => {
                        setShowScheduleReview(false);
                        setExtractedScheduleItems([]);
                      }}>
                        Cancel
                      </Button>
                      <Button className="neon-button" onClick={() => {
                        // Validate all rows have valid dimensions and quantities
                        const validationErrors: string[] = [];
                        extractedScheduleItems.forEach(item => {
                          const edit = scheduleEdits[item.code] || {};
                          const width = edit.width !== undefined ? edit.width : item.width;
                          const height = edit.height !== undefined ? edit.height : item.height;
                          const quantity = edit.quantity !== undefined ? edit.quantity : 1;
                          
                          if (!width || width <= 0) validationErrors.push(`${item.code}: Width must be > 0`);
                          if (!height || height <= 0) validationErrors.push(`${item.code}: Height must be > 0`);
                          if (!quantity || quantity <= 0) validationErrors.push(`${item.code}: Quantity must be > 0`);
                        });
                        
                        if (validationErrors.length > 0) {
                          toast.error(`Fix errors: ${validationErrors.slice(0, 3).join('; ')}${validationErrors.length > 3 ? '...' : ''}`);
                          return;
                        }
                        
                        const nextUnits: QuoteUnitForm[] = extractedScheduleItems.map(item => {
                          const isWindow = item.code.startsWith('W');
                          const edit = scheduleEdits[item.code] || {};
                          const productType = edit.productType || (isWindow ? 'FIXED_WINDOW' : 'HINGED_DOOR_SINGLE');
                          const width = edit.width !== undefined ? edit.width : (item.width || 1200);
                          const height = edit.height !== undefined ? edit.height : (item.height || 2100);
                          const quantity = edit.quantity !== undefined ? edit.quantity : 1;
                          
                          return {
                            ...createUnit(),
                            localId: createLocalId(),
                            roomName: `${isWindow ? 'Window' : 'Door'} ${item.code}`,
                            productCategory: isWindow ? 'WINDOW' : 'DOOR',
                            productType: productType,
                            configuration: item.schedule_type || '',
                            widthMm: width,
                            heightMm: height,
                            quantity: quantity,
                            glassType: item.safety_flag ? 'SAFETY' : 'STANDARD',
                            burglarBarType: 'NONE',
                            frameColour: 'CHARCOAL',
                            hardwareColour: 'BLACK',
                            extras: [],
                            notes: `Finish: ${item.finish} | Glazing: ${item.glazing}${item.flags.length > 0 ? ' | ⚠️ ' + item.flags.join('; ') : ''}`,
                          };
                        });
                        setUnits(nextUnits);
                        setShowScheduleReview(false);
                        setExtractedScheduleItems([]);
                        setScheduleEdits({});
                        toast.success('Items added to quote.');
                      }}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm and add to quote
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 md:px-6 md:pb-6">
                  <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/35">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-background/50">
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Code</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Width (mm)</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Height (mm)</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Finish</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Glazing</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Safety</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Product Type / Qty / Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedScheduleItems.map((item, idx) => {
                          const isWindow = item.code.startsWith('W');
                          const edit = scheduleEdits[item.code] || {};
                          const productType = edit.productType || (isWindow ? 'FIXED_WINDOW' : 'HINGED_DOOR_SINGLE');
                          const width = edit.width !== undefined ? edit.width : item.width;
                          const height = edit.height !== undefined ? edit.height : item.height;
                          const quantity = edit.quantity !== undefined ? edit.quantity : 1;
                          const categoryOptions = PRODUCT_TYPE_OPTIONS.filter(opt => opt.category === (isWindow ? 'WINDOW' : 'DOOR'));

                          return (
                            <tr key={idx} className="border-b border-border/30 hover:bg-background/50">
                              <td className="px-4 py-3 font-semibold text-primary">{item.code}</td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={width || ''}
                                  onChange={e => setScheduleEdits(prev => ({
                                    ...prev,
                                    [item.code]: { ...prev[item.code], width: Math.max(0, Number(e.target.value)) }
                                  }))}
                                  className={`field-shell h-8 w-20 border-0 bg-transparent px-2 text-sm ${
                                    !width || width <= 0 ? 'border border-red-500/50 bg-red-500/10' : ''
                                  }`}
                                  placeholder="—"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={height || ''}
                                  onChange={e => setScheduleEdits(prev => ({
                                    ...prev,
                                    [item.code]: { ...prev[item.code], height: Math.max(0, Number(e.target.value)) }
                                  }))}
                                  className={`field-shell h-8 w-20 border-0 bg-transparent px-2 text-sm ${
                                    !height || height <= 0 ? 'border border-red-500/50 bg-red-500/10' : ''
                                  }`}
                                  placeholder="—"
                                />
                              </td>
                              <td className="px-4 py-3 text-xs text-foreground">{item.finish}</td>
                              <td className="px-4 py-3 text-xs text-foreground">{item.glazing}</td>
                              <td className="px-4 py-3">{item.safety_flag ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <select
                                    value={productType}
                                    onChange={e => setScheduleEdits(prev => ({
                                      ...prev,
                                      [item.code]: { ...prev[item.code], productType: e.target.value as ProductTypeKey }
                                    }))}
                                    className="field-shell h-7 w-32 border-0 bg-transparent px-2 text-xs"
                                  >
                                    {categoryOptions.map(opt => (
                                      <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={e => setScheduleEdits(prev => ({
                                      ...prev,
                                      [item.code]: { ...prev[item.code], quantity: Math.max(1, Number(e.target.value)) }
                                    }))}
                                    className={`field-shell h-7 w-16 border-0 bg-transparent px-2 text-xs ${
                                      !quantity || quantity <= 0 ? 'border border-red-500/50 bg-red-500/10' : ''
                                    }`}
                                    placeholder="Qty"
                                  />
                                  {(!width || width <= 0) && <span className="text-xs text-red-500">Width required</span>}
                                  {(!height || height <= 0) && <span className="text-xs text-red-500">Height required</span>}
                                  {(!quantity || quantity <= 0) && <span className="text-xs text-red-500">Qty required</span>}
                                  {item.flags.length > 0 && (
                                    <span className="text-xs text-yellow-600">⚠️ {item.flags[0]}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="hud-panel border-none bg-transparent">
              <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Window and Door Units</CardTitle>
                    <CardDescription className="mt-2 text-sm text-muted-foreground">
                      Add each room or opening, choose a unit type, configure the finishes, and let the quote engine recalculate automatically.
                    </CardDescription>
                  </div>
                  <Button onClick={addUnit} className="neon-button no-print">
                    <Plus className="mr-2 h-4 w-4" />
                    Add unit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-5 pb-5 md:px-6 md:pb-6">
                {units.map((unit, index) => {
                  const unitErrors = getUnitErrors(unit);
                  const unitSummary = summary?.units[index];
                  const categoryOptions = PRODUCT_TYPE_OPTIONS.filter(option => option.category === unit.productCategory);

                  return (
                    <div key={unit.localId} className="rounded-3xl border border-border/70 bg-background/35 p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.34em] text-primary glow-cyan">Unit {index + 1}</p>
                          <h3 className="mt-1 font-display text-lg uppercase tracking-[0.18em] text-foreground">
                            {unit.roomName.trim() || PRODUCT_TYPE_LOOKUP[unit.productType].label}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 no-print">
                          <Badge variant="outline" className="border-secondary/40 bg-secondary/10 text-secondary-foreground">
                            {formatCurrency(unitSummary?.lineTotalCents ?? 0)}
                          </Badge>
                          <Button variant="outline" className="border-border/70 bg-background/40" disabled={units.length === 1} onClick={() => removeUnit(unit.localId)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <Field label="Product category">
                            <select
                              value={unit.productCategory}
                              onChange={e => {
                                const nextCategory = e.target.value as ProductCategory;
                                const firstOption = PRODUCT_TYPE_OPTIONS.find(option => option.category === nextCategory) ?? PRODUCT_TYPE_OPTIONS[0];
                                setUnits(current =>
                                  current.map(currentUnit =>
                                    currentUnit.localId === unit.localId
                                      ? {
                                          ...currentUnit,
                                          productCategory: nextCategory,
                                          productType: firstOption.key,
                                        }
                                      : currentUnit,
                                  ),
                                );
                              }}
                              className="field-shell h-12 w-full px-4 text-sm text-foreground"
                            >
                              {PRODUCT_CATEGORIES.map(category => (
                                <option key={category} value={category}>
                                  {category.replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <div className="grid gap-3">
                            {categoryOptions.map(option => (
                              <ProductTypeCard
                                key={option.key}
                                option={option}
                                active={unit.productType === option.key}
                                onSelect={() => updateUnit(unit.localId, "productType", option.key)}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Room name" required error={showValidation && unitErrors.roomName}>
                              <Input value={unit.roomName} onChange={e => updateUnit(unit.localId, "roomName", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="Kitchen / Lounge / Bedroom" />
                            </Field>
                            <Field label="Configuration">
                              <Input value={unit.configuration} onChange={e => updateUnit(unit.localId, "configuration", e.target.value)} className="field-shell h-12 border-0 bg-transparent" placeholder="XO, fixed-left, active-right" />
                            </Field>
                            <Field label="Quantity" required error={showValidation && unitErrors.quantity}>
                              <Input type="number" min={1} value={unit.quantity} onChange={e => updateUnit(unit.localId, "quantity", Math.max(0, Number(e.target.value)))} className="field-shell h-12 border-0 bg-transparent" />
                            </Field>
                            <Field label="Width (mm)" required error={showValidation && unitErrors.widthMm}>
                              <Input type="number" min={1} value={unit.widthMm} onChange={e => updateUnit(unit.localId, "widthMm", Math.max(0, Number(e.target.value)))} className="field-shell h-12 border-0 bg-transparent" />
                            </Field>
                            <Field label="Height (mm)" required error={showValidation && unitErrors.heightMm}>
                              <Input type="number" min={1} value={unit.heightMm} onChange={e => updateUnit(unit.localId, "heightMm", Math.max(0, Number(e.target.value)))} className="field-shell h-12 border-0 bg-transparent" />
                            </Field>
                            <Field label="Glass type">
                              <select value={unit.glassType} onChange={e => updateUnit(unit.localId, "glassType", e.target.value as GlassType)} className="field-shell h-12 w-full px-4 text-sm text-foreground">
                                {GLASS_TYPES.map(type => (
                                  <option key={type} value={type}>
                                    {GLASS_LABELS[type]}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Burglar bars">
                              <select value={unit.burglarBarType} onChange={e => updateUnit(unit.localId, "burglarBarType", e.target.value as BurglarBarType)} className="field-shell h-12 w-full px-4 text-sm text-foreground">
                                {BURGLAR_BAR_TYPES.map(type => (
                                  <option key={type} value={type}>
                                    {BURGLAR_BAR_LABELS[type]}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Frame colour">
                              <select value={unit.frameColour} onChange={e => updateUnit(unit.localId, "frameColour", e.target.value as FrameColour)} className="field-shell h-12 w-full px-4 text-sm text-foreground">
                                {FRAME_COLOURS.map(colour => (
                                  <option key={colour} value={colour}>
                                    {COLOUR_LABELS[colour]}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Hardware colour">
                              <select value={unit.hardwareColour} onChange={e => updateUnit(unit.localId, "hardwareColour", e.target.value as HardwareColour)} className="field-shell h-12 w-full px-4 text-sm text-foreground">
                                {HARDWARE_COLOURS.map(colour => (
                                  <option key={colour} value={colour}>
                                    {COLOUR_LABELS[colour]}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">Extras</p>
                                <p className="text-xs text-muted-foreground">Toggle chargeable extras for this unit.</p>
                              </div>
                              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                                {unit.extras.length} selected
                              </Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {EXTRA_OPTIONS.map(extra => {
                                const active = unit.extras.includes(extra);
                                return (
                                  <button
                                    key={extra}
                                    type="button"
                                    onClick={() => {
                                      updateUnit(
                                        unit.localId,
                                        "extras",
                                        active ? unit.extras.filter(item => item !== extra) : [...unit.extras, extra],
                                      );
                                    }}
                                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                                      active
                                        ? "border-primary bg-primary/12 text-primary shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                                        : "border-border/70 bg-card/50 text-muted-foreground hover:border-secondary/40 hover:text-foreground"
                                    }`}
                                  >
                                    <span className="font-medium">{EXTRA_LABELS[extra]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <Field label="Unit notes">
                            <Textarea value={unit.notes} onChange={e => updateUnit(unit.localId, "notes", e.target.value)} className="field-shell min-h-24 border-0 bg-transparent" placeholder="Special fabrication notes, handing, sill details, or site comments" />
                          </Field>

                          <div className="grid gap-3 md:grid-cols-4">
                            <InlineMetric label="Area" value={`${unitSummary?.areaSqm?.toFixed(2) ?? "0.00"} m²`} />
                            <InlineMetric label="Unit cost" value={formatCurrency(unitSummary?.unitCostCents ?? 0)} />
                            <InlineMetric label="Line total" value={formatCurrency(unitSummary?.lineTotalCents ?? 0)} />
                            <InlineMetric label="Pricing flags" value={String((unitSummary?.validationIssues.length ?? 0) + (unitSummary?.missingPricing.length ?? 0))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Card className="hud-panel border-none bg-transparent print-sheet">
              <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Summary and Export</CardTitle>
                    <CardDescription className="mt-2 text-sm text-muted-foreground">
                      Review the running totals, fix missing data, and export Anglo Windows quotes as either a direct PDF download or print-ready output.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 no-print">
                    <Button variant="outline" className="border-border/70 bg-background/40" onClick={() => setActiveTab("saved")}>
                      Saved quotes
                    </Button>
                    <Button className="neon-button" onClick={downloadPdf}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="border-border/70 bg-background/40" onClick={printQuote}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print quote
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-5 pb-5 md:px-6 md:pb-6">
                <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-primary glow-cyan">Anglo Windows</p>
                  <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.18em] text-foreground">Quick Quote</h2>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <QuoteMeta label="Job ref" value={header.jobRef || "Pending"} />
                    <QuoteMeta label="Client" value={header.clientName || "Pending"} />
                    <QuoteMeta label="Date" value={header.quoteDate || "Pending"} />
                    <QuoteMeta label="Salesperson" value={header.salesperson || "Pending"} />
                    <QuoteMeta label="Phone" value={header.phone || "Pending"} />
                    <QuoteMeta label="Installer" value={header.installer || "Pending"} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="hidden rounded-2xl border border-border/70 md:block">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/70 text-left text-[11px] uppercase tracking-[0.28em] text-primary">
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3 text-right">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary?.units.map((unit, index) => (
                          <tr key={`${unit.roomName}-${index}`} className="data-table-row border-b border-border/40 last:border-b-0">
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-foreground">{unit.roomName}</p>
                              <p className="text-xs text-muted-foreground">{unit.configuration || "Standard configuration"}</p>
                            </td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{PRODUCT_TYPE_LOOKUP[unit.productType].shortLabel}</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{unit.widthMm} × {unit.heightMm} mm</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{unit.quantity}</td>
                            <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(unit.lineTotalCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {summary?.units.map((unit, index) => (
                      <div key={`${unit.roomName}-${index}`} className="rounded-2xl border border-border/70 bg-background/35 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{unit.roomName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{PRODUCT_TYPE_LOOKUP[unit.productType].label}</p>
                          </div>
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                            Qty {unit.quantity}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{unit.widthMm} × {unit.heightMm} mm</span>
                          <span>{formatCurrency(unit.lineTotalCents)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!summary?.units.length ? (
                  <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    Add at least one unit to start generating the quote summary.
                  </div>
                ) : null}

                <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
                  <TotalRow label={ADJUSTMENT_LABELS[header.adjustmentKind]} value={formatCurrency(totals.adjustment)} />
                  <Separator className="bg-border/70" />
                  <TotalRow label="Grand total" value={formatCurrency(totals.total)} emphasis />
                </div>

                {showValidation && summary?.validationIssues.length ? (
                  <AlertPanel title="Validation issues" items={summary.validationIssues} tone="danger" />
                ) : null}

                {summary?.missingPricing.length ? (
                  <AlertPanel title="Missing pricing rules" items={summary.missingPricing} tone="warning" />
                ) : null}

                <div className="print-only mt-8 border-t pt-6 text-xs text-neutral-600">
                  <p><strong>Address:</strong> {header.address || "Not supplied"}</p>
                  <p className="mt-2"><strong>Notes:</strong> {header.notes || "No additional notes."}</p>
                  <p className="mt-4">This quote was generated internally for Anglo Windows and is subject to final material, manufacturing, and installation confirmation.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="hud-panel border-none bg-transparent">
            <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
              <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">What happens next</CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                After upload, the draft quote is prefilled for review. After manual entry, the full builder opens with guided job, unit, pricing, and export sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-5 pb-5 md:grid-cols-3 md:px-6 md:pb-6">
              <InlineMetric label="Document-assisted intake" value="Best for emailed plans" />
              <InlineMetric label="Manual builder" value="Best for live reception capture" />
              <InlineMetric label="Output" value="Saved draft plus PDF quote" />
            </CardContent>
          </Card>
          <Card className="hud-panel border-none bg-transparent">
            <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
              <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Draft snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5 md:px-6 md:pb-6">
              <InlineMetric label="Current job ref" value={header.jobRef || "Not started"} />
              <InlineMetric label="Client" value={header.clientName || "Not started"} />
              <InlineMetric label="Units in draft" value={String(units.length)} />
              <InlineMetric label="Quote total" value={formatCurrency(totals.total)} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "saved" ? (
        <Card className="hud-panel border-none bg-transparent">
          <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
            <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Saved Quotes</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Retrieve recent quotes from the database, load them back into the builder, or duplicate them to create a variation quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 md:px-6 md:pb-6">
            {quotesListQuery.isLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved quotes...
              </div>
            ) : quotesListQuery.data?.length ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:hidden">
                  {quotesListQuery.data.map(quote => {
                    const issues = Array.isArray(quote.validationIssuesJson) ? quote.validationIssuesJson.length : 0;
                    const pricingFlags = Array.isArray(quote.missingPricingJson) ? quote.missingPricingJson.length : 0;
                    return (
                      <div key={quote.id} className="rounded-2xl border border-border/70 bg-background/35 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{quote.jobRef}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{quote.clientName}</p>
                          </div>
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                            {formatCurrency(quote.totalCents)}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          <p>Date: {quote.quoteDate}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                              {issues === 0 ? "Validated" : `${issues} issue${issues === 1 ? "" : "s"}`}
                            </Badge>
                            {pricingFlags ? (
                              <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-200">
                                {pricingFlags} pricing flag{pricingFlags === 1 ? "" : "s"}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" className="flex-1 border-border/70 bg-background/40" onClick={() => loadQuote(quote.id)}>
                            Load
                          </Button>
                          <Button variant="outline" className="flex-1 border-border/70 bg-background/40" onClick={() => duplicateQuote(quote.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-border/70 md:block">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-background/50 text-left text-[11px] uppercase tracking-[0.28em] text-primary">
                        <th className="px-4 py-3">Job ref</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotesListQuery.data.map(quote => {
                        const issues = Array.isArray(quote.validationIssuesJson) ? quote.validationIssuesJson.length : 0;
                        const pricingFlags = Array.isArray(quote.missingPricingJson) ? quote.missingPricingJson.length : 0;
                        return (
                          <tr key={quote.id} className="data-table-row border-b border-border/40 last:border-b-0">
                            <td className="px-4 py-4 font-medium text-foreground">{quote.jobRef}</td>
                            <td className="px-4 py-4 text-muted-foreground">{quote.clientName}</td>
                            <td className="px-4 py-4 text-muted-foreground">{quote.quoteDate}</td>
                            <td className="px-4 py-4 text-foreground">{formatCurrency(quote.totalCents)}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                                  {issues === 0 ? "Validated" : `${issues} issue${issues === 1 ? "" : "s"}`}
                                </Badge>
                                {pricingFlags ? (
                                  <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-200">
                                    {pricingFlags} pricing flag{pricingFlags === 1 ? "" : "s"}
                                  </Badge>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" className="border-border/70 bg-background/40" onClick={() => loadQuote(quote.id)}>
                                  Load
                                </Button>
                                <Button variant="outline" className="border-border/70 bg-background/40" onClick={() => duplicateQuote(quote.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
                No quotes have been saved yet. Save the current builder draft to create your first database record.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "pricing" ? (
        <div className="space-y-6">
          <Card className="hud-panel border-none bg-transparent">
            <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
              <CardTitle className="font-display text-xl uppercase tracking-[0.18em] text-foreground">Price Book Administration</CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Maintain configurable pricing rules for products, glass, and extras. The quote engine uses these stored values directly and will not invent missing rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-5 pb-5 md:px-6 md:pb-6">
              <AlertPanel
                title="Pricing control"
                items={[
                  "Product rules define a base amount and an area rate per square metre.",
                  "Glass and extras apply surcharges per unit according to the selected configuration.",
                  "Only admin users can persist price-book changes.",
                ]}
                tone="info"
              />

              <div className="space-y-4">
                <div>
                  <p className="font-display text-lg uppercase tracking-[0.18em] text-foreground">Product rules</p>
                  <p className="mt-2 text-sm text-muted-foreground">Configure the base charge and area rate that apply to each product type.</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {PRODUCT_TYPE_OPTIONS.map(option => {
                    const draft = pricingDraft.products[option.key] ?? { baseAmount: 0, areaRate: 0, isActive: false };
                    return (
                      <div key={option.key} className="rounded-2xl border border-border/70 bg-background/35 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{option.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={draft.isActive}
                              onChange={e =>
                                setPricingDraft(current => ({
                                  ...current,
                                  products: {
                                    ...current.products,
                                    [option.key]: { ...draft, isActive: e.target.checked },
                                  },
                                }))
                              }
                            />
                            Active
                          </label>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <Field label="Base amount (R)">
                            <Input
                              type="number"
                              value={draft.baseAmount}
                              onChange={e =>
                                setPricingDraft(current => ({
                                  ...current,
                                  products: {
                                    ...current.products,
                                    [option.key]: { ...draft, baseAmount: Number(e.target.value) },
                                  },
                                }))
                              }
                              className="field-shell h-11 border-0 bg-transparent"
                            />
                          </Field>
                          <Field label="Area rate / m² (R)">
                            <Input
                              type="number"
                              value={draft.areaRate}
                              onChange={e =>
                                setPricingDraft(current => ({
                                  ...current,
                                  products: {
                                    ...current.products,
                                    [option.key]: { ...draft, areaRate: Number(e.target.value) },
                                  },
                                }))
                              }
                              className="field-shell h-11 border-0 bg-transparent"
                            />
                          </Field>
                        </div>
                        <Button
                          className="mt-4 neon-button"
                          disabled={upsertProductRuleMutation.isPending}
                          onClick={() =>
                            upsertProductRuleMutation.mutate({
                              productType: option.key,
                              productCategory: option.category,
                              baseAmountCents: Math.round((draft.baseAmount || 0) * 100),
                              areaRatePerSqmCents: Math.round((draft.areaRate || 0) * 100),
                              isActive: draft.isActive,
                            })
                          }
                        >
                          Save product rule
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-lg uppercase tracking-[0.18em] text-foreground">Glass surcharges</p>
                    <p className="mt-2 text-sm text-muted-foreground">Apply additional per-unit charges for glass selection.</p>
                  </div>
                  <div className="space-y-3">
                    {GLASS_TYPES.map(glassType => {
                      const draft = pricingDraft.glass[glassType] ?? { surcharge: 0, isActive: false };
                      return (
                        <div key={glassType} className="rounded-2xl border border-border/70 bg-background/35 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{GLASS_LABELS[glassType]}</p>
                              <p className="text-xs text-muted-foreground">Per-unit surcharge.</p>
                            </div>
                            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={draft.isActive}
                                onChange={e =>
                                  setPricingDraft(current => ({
                                    ...current,
                                    glass: {
                                      ...current.glass,
                                      [glassType]: { ...draft, isActive: e.target.checked },
                                    },
                                  }))
                                }
                              />
                              Active
                            </label>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <Input
                              type="number"
                              value={draft.surcharge}
                              onChange={e =>
                                setPricingDraft(current => ({
                                  ...current,
                                  glass: {
                                    ...current.glass,
                                    [glassType]: { ...draft, surcharge: Number(e.target.value) },
                                  },
                                }))
                              }
                              className="field-shell h-11 border-0 bg-transparent"
                            />
                            <Button
                              className="neon-button"
                              disabled={upsertGlassRuleMutation.isPending}
                              onClick={() =>
                                upsertGlassRuleMutation.mutate({
                                  glassType,
                                  surchargeCents: Math.round((draft.surcharge || 0) * 100),
                                  isActive: draft.isActive,
                                })
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-display text-lg uppercase tracking-[0.18em] text-foreground">Extras pricing</p>
                    <p className="mt-2 text-sm text-muted-foreground">Define the surcharge applied when an extra option is selected.</p>
                  </div>
                  <div className="space-y-3">
                    {EXTRA_OPTIONS.map(extraKey => {
                      const draft = pricingDraft.extras[extraKey] ?? { amount: 0, isActive: false };
                      return (
                        <div key={extraKey} className="rounded-2xl border border-border/70 bg-background/35 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{EXTRA_LABELS[extraKey]}</p>
                              <p className="text-xs text-muted-foreground">Chargeable extra.</p>
                            </div>
                            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={draft.isActive}
                                onChange={e =>
                                  setPricingDraft(current => ({
                                    ...current,
                                    extras: {
                                      ...current.extras,
                                      [extraKey]: { ...draft, isActive: e.target.checked },
                                    },
                                  }))
                                }
                              />
                              Active
                            </label>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <Input
                              type="number"
                              value={draft.amount}
                              onChange={e =>
                                setPricingDraft(current => ({
                                  ...current,
                                  extras: {
                                    ...current.extras,
                                    [extraKey]: { ...draft, amount: Number(e.target.value) },
                                  },
                                }))
                              }
                              className="field-shell h-11 border-0 bg-transparent"
                            />
                            <Button
                              className="neon-button"
                              disabled={upsertExtraRuleMutation.isPending}
                              onClick={() =>
                                upsertExtraRuleMutation.mutate({
                                  extraKey,
                                  amountCents: Math.round((draft.amount || 0) * 100),
                                  isActive: draft.isActive,
                                })
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
  requiredHint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
  requiredHint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
        {required ? <span className="text-secondary glow-pink">Required</span> : null}
      </span>
      <div data-error={error ? "true" : "false"}>{children}</div>
      {error ? <span className="text-xs text-destructive">{requiredHint || `${label} is required.`}</span> : null}
    </label>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Calculator;
  accent: "cyan" | "pink" | "gold";
}) {
  const accentClass =
    accent === "cyan"
      ? "border-primary/35 bg-primary/10 text-primary"
      : accent === "pink"
        ? "border-secondary/35 bg-secondary/10 text-secondary-foreground"
        : "border-amber-400/35 bg-amber-400/10 text-amber-200";

  return (
    <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-lg uppercase tracking-[0.12em] text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl border p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${emphasis ? "font-display uppercase tracking-[0.18em] text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`${emphasis ? "font-display text-xl uppercase tracking-[0.14em] text-primary glow-cyan" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}

function QuoteMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function AlertPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "danger" | "warning" | "info";
}) {
  const styles =
    tone === "danger"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
        : "border-primary/40 bg-primary/10 text-primary";

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <p className="font-medium uppercase tracking-[0.16em]">{title}</p>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {items.map(item => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
