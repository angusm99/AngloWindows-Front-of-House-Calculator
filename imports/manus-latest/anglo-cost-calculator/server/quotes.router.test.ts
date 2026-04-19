import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  getPricingSnapshot,
  getQuoteById,
  listQuotes,
  saveQuote,
  duplicateQuote,
} from "./db";

vi.mock("./db", () => ({
  getPricingSnapshot: vi.fn(),
  getQuoteById: vi.fn(),
  listQuotes: vi.fn(),
  saveQuote: vi.fn(),
  duplicateQuote: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createProtectedContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "anglo-user",
    email: "reception@anglowindows.test",
    name: "Reception Desk",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const validHeader = {
  jobRef: "AW-2026-014",
  clientName: "Atlantic House",
  quoteDate: "2026-04-13",
  phone: "0215550101",
  address: "Cape Town",
  salesperson: "Front Desk",
  installer: "Team B",
  estimatedHours: 5,
  notes: "Priority job",
  adjustmentKind: "NONE" as const,
  adjustmentValue: 0,
};

const validUnits = [
  {
    roomName: "Lounge",
    productCategory: "WINDOW" as const,
    productType: "FIXED_WINDOW" as const,
    configuration: "Fixed",
    widthMm: 1200,
    heightMm: 1000,
    quantity: 1,
    glassType: "STANDARD" as const,
    burglarBarType: "NONE" as const,
    frameColour: "WHITE" as const,
    hardwareColour: "WHITE" as const,
    extras: ["WRAP" as const],
    notes: "",
  },
];

describe("quotes router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates preview totals using the stored pricing snapshot", async () => {
    vi.mocked(getPricingSnapshot).mockResolvedValue({
      productRules: [
        {
          productType: "FIXED_WINDOW",
          baseAmountCents: 20_000,
          areaRatePerSqmCents: 10_000,
          isActive: true,
        },
      ],
      glassRules: [
        {
          glassType: "STANDARD",
          surchargeCents: 3_000,
          isActive: true,
        },
      ],
      extraRules: [
        {
          extraKey: "WRAP",
          amountCents: 1_500,
          isActive: true,
        },
      ],
    });

    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.quotes.preview({ header: validHeader, units: validUnits });

    expect(result.subtotalCents).toBe(36_500);
    expect(result.totalCents).toBe(36_500);
    expect(result.canExport).toBe(true);
    expect(result.units[0]?.lineTotalCents).toBe(36_500);
  });

  it("passes the authenticated user id into the save workflow and supports both create and edit persistence paths", async () => {
    const createdQuote = {
      id: 21,
      jobRef: validHeader.jobRef,
      clientName: validHeader.clientName,
      totalCents: 36_500,
    };
    const updatedQuote = {
      id: 21,
      jobRef: `${validHeader.jobRef}-REV1`,
      clientName: validHeader.clientName,
      totalCents: 38_000,
    };

    vi.mocked(saveQuote)
      .mockResolvedValueOnce(createdQuote as never)
      .mockResolvedValueOnce(updatedQuote as never);

    const caller = appRouter.createCaller(createProtectedContext());
    const createResult = await caller.quotes.save({
      header: validHeader,
      units: validUnits,
    });
    const editResult = await caller.quotes.save({
      quoteId: 21,
      header: { ...validHeader, jobRef: `${validHeader.jobRef}-REV1` },
      units: validUnits,
    });

    expect(saveQuote).toHaveBeenNthCalledWith(1, {
      quoteId: undefined,
      header: validHeader,
      units: validUnits,
      userId: 7,
    });
    expect(saveQuote).toHaveBeenNthCalledWith(2, {
      quoteId: 21,
      header: { ...validHeader, jobRef: `${validHeader.jobRef}-REV1` },
      units: validUnits,
      userId: 7,
    });
    expect(createResult).toEqual(createdQuote);
    expect(editResult).toEqual(updatedQuote);
  });

  it("surfaces persisted quote list, detail, and duplicate responses from the database layer", async () => {
    vi.mocked(listQuotes).mockResolvedValue([{ id: 1, jobRef: "AW-1" }] as never);
    vi.mocked(getQuoteById).mockResolvedValue({ id: 1, jobRef: "AW-1", units: [] } as never);
    vi.mocked(duplicateQuote).mockResolvedValue({ id: 2, jobRef: "AW-1 COPY" } as never);

    const caller = appRouter.createCaller(createProtectedContext());

    await expect(caller.quotes.list()).resolves.toEqual([{ id: 1, jobRef: "AW-1" }]);
    await expect(caller.quotes.get({ quoteId: 1 })).resolves.toEqual({ id: 1, jobRef: "AW-1", units: [] });
    await expect(caller.quotes.duplicate({ quoteId: 1 })).resolves.toEqual({ id: 2, jobRef: "AW-1 COPY" });
  });
});
