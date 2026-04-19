export const PRODUCT_CATEGORIES = ["WINDOW", "DOOR", "SLIDING_DOOR"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const GLASS_TYPES = ["STANDARD", "SPECIAL", "SAFETY", "FROSTED"] as const;
export type GlassType = (typeof GLASS_TYPES)[number];

export const BURGLAR_BAR_TYPES = ["NONE", "CLEAR", "ALUM"] as const;
export type BurglarBarType = (typeof BURGLAR_BAR_TYPES)[number];

export const FRAME_COLOURS = ["WHITE", "BRONZE", "CHARCOAL", "BLACK", "SILVER", "SPECIAL"] as const;
export type FrameColour = (typeof FRAME_COLOURS)[number];

export const HARDWARE_COLOURS = ["WHITE", "BRONZE", "CHARCOAL", "BLACK", "SILVER", "SPECIAL"] as const;
export type HardwareColour = (typeof HARDWARE_COLOURS)[number];

export const EXTRA_OPTIONS = ["WRAP", "DRAINAGE", "VIDEO", "ROUND_TUBE", "BOX_WOOD"] as const;
export type ExtraOption = (typeof EXTRA_OPTIONS)[number];

export const ADJUSTMENT_KINDS = [
  "NONE",
  "MARKUP_PERCENT",
  "MARKUP_FIXED",
  "DISCOUNT_PERCENT",
  "DISCOUNT_FIXED",
] as const;
export type AdjustmentKind = (typeof ADJUSTMENT_KINDS)[number];

export const PRODUCT_TYPE_OPTIONS = [
  {
    key: "FIXED_WINDOW",
    label: "Fixed Window",
    category: "WINDOW",
    shortLabel: "Fixed",
    description: "Non-opening glazed frame.",
  },
  {
    key: "TOP_HUNG_WINDOW",
    label: "Top-Hung Window",
    category: "WINDOW",
    shortLabel: "Top-Hung",
    description: "Top-hung opening sash window.",
  },
  {
    key: "SIDE_HUNG_WINDOW",
    label: "Side-Hung Window",
    category: "WINDOW",
    shortLabel: "Side-Hung",
    description: "Side-hung casement window.",
  },
  {
    key: "SLIDING_WINDOW_2_PANEL",
    label: "Sliding Window (2 Panel)",
    category: "WINDOW",
    shortLabel: "Sliding 2P",
    description: "Two-panel horizontal sliding window.",
  },
  {
    key: "SLIDING_WINDOW_3_PANEL",
    label: "Sliding Window (3 Panel)",
    category: "WINDOW",
    shortLabel: "Sliding 3P",
    description: "Three-panel horizontal sliding window.",
  },
  {
    key: "HINGED_DOOR_SINGLE",
    label: "Single Hinged Door",
    category: "DOOR",
    shortLabel: "Single Door",
    description: "Single swing door unit.",
  },
  {
    key: "HINGED_DOOR_DOUBLE",
    label: "Double Hinged Door",
    category: "DOOR",
    shortLabel: "Double Door",
    description: "Double swing door unit.",
  },
  {
    key: "SLIDING_DOOR_2_PANEL",
    label: "Sliding Door (2 Panel)",
    category: "SLIDING_DOOR",
    shortLabel: "Sliding Door 2P",
    description: "Two-panel patio sliding door.",
  },
  {
    key: "SLIDING_DOOR_3_PANEL",
    label: "Sliding Door (3 Panel)",
    category: "SLIDING_DOOR",
    shortLabel: "Sliding Door 3P",
    description: "Three-panel patio sliding door.",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  category: ProductCategory;
  shortLabel: string;
  description: string;
}>;

export type ProductTypeKey = (typeof PRODUCT_TYPE_OPTIONS)[number]["key"];

export const PRODUCT_TYPE_LOOKUP = Object.fromEntries(
  PRODUCT_TYPE_OPTIONS.map(option => [option.key, option]),
) as Record<ProductTypeKey, (typeof PRODUCT_TYPE_OPTIONS)[number]>;

export const EXTRA_LABELS: Record<ExtraOption, string> = {
  WRAP: "Wrap",
  DRAINAGE: "Drainage",
  VIDEO: "Video",
  ROUND_TUBE: "Round Tube",
  BOX_WOOD: "Box Wood",
};

export const GLASS_LABELS: Record<GlassType, string> = {
  STANDARD: "Standard",
  SPECIAL: "Special",
  SAFETY: "Safety",
  FROSTED: "Frosted",
};

export const BURGLAR_BAR_LABELS: Record<BurglarBarType, string> = {
  NONE: "None",
  CLEAR: "Clear",
  ALUM: "Alum",
};

export const COLOUR_LABELS: Record<FrameColour | HardwareColour, string> = {
  WHITE: "White",
  BRONZE: "Bronze",
  CHARCOAL: "Charcoal",
  BLACK: "Black",
  SILVER: "Silver",
  SPECIAL: "Special",
};

export const ADJUSTMENT_LABELS: Record<AdjustmentKind, string> = {
  NONE: "None",
  MARKUP_PERCENT: "Markup %",
  MARKUP_FIXED: "Markup fixed",
  DISCOUNT_PERCENT: "Discount %",
  DISCOUNT_FIXED: "Discount fixed",
};
