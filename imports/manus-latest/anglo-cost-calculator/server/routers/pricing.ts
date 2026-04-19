import { z } from "zod";
import { EXTRA_OPTIONS, GLASS_TYPES, PRODUCT_CATEGORIES, PRODUCT_TYPE_OPTIONS } from "../../shared/quote";
import { getPricingSnapshot, upsertExtraPricingRule, upsertGlassPricingRule, upsertProductPricingRule } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const productTypeKeys = PRODUCT_TYPE_OPTIONS.map(option => option.key) as [
  (typeof PRODUCT_TYPE_OPTIONS)[number]["key"],
  ...(typeof PRODUCT_TYPE_OPTIONS)[number]["key"][],
];

export const pricingRouter = router({
  snapshot: protectedProcedure.query(async () => {
    return getPricingSnapshot();
  }),

  upsertProductRule: adminProcedure
    .input(
      z.object({
        productType: z.enum(productTypeKeys),
        productCategory: z.enum([...PRODUCT_CATEGORIES]),
        baseAmountCents: z.number().int().nonnegative(),
        areaRatePerSqmCents: z.number().int().nonnegative(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      await upsertProductPricingRule(input);
      return { success: true } as const;
    }),

  upsertGlassRule: adminProcedure
    .input(
      z.object({
        glassType: z.enum([...GLASS_TYPES]),
        surchargeCents: z.number().int().nonnegative(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      await upsertGlassPricingRule(input);
      return { success: true } as const;
    }),

  upsertExtraRule: adminProcedure
    .input(
      z.object({
        extraKey: z.enum([...EXTRA_OPTIONS]),
        amountCents: z.number().int().nonnegative(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      await upsertExtraPricingRule(input);
      return { success: true } as const;
    }),
});
