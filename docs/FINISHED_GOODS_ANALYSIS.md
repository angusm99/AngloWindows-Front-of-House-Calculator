# Finished Goods List Analysis

**Source:** templatefinishedgoodslist.xlsx  
**Total Rows:** 18,342  
**Total Templates:** 310 (marked as `IsTemplate = True`)

---

## Product Ranges (ItemRange)

The finished goods list contains **45+ product categories**. Here are the main ones relevant to the Front of House Calculator:

| Product Range | Count | Status |
|---|---|---|
| **30.5mm OuterFrame-TOP HUNG** | 4,320 | ✅ Primary |
| **Shopfront - Standard Doors** | 2,571 | ✅ Primary |
| **70mm OuterFrame-SIDE HUNG** | 1,631 | ✅ Primary |
| **New Hole - E-Leg OuterFrame-TOP HUNG** | 1,422 | ✅ Primary |
| **38 Casement** | 1,263 | ✅ Primary |
| **Palace 2 Panel** | 859 | ✅ Primary |
| **Sash OuterFrame-EXS TOP HUNG** | 811 | ✅ Primary |
| **NO FRAME TEMPLATES** | 737 | ⚠️ Frameless |
| **Shopfront-Stable+Slatted+Pivot** | 562 | ✅ Primary |
| **Elite Slider** | 471 | ✅ Primary |
| **Vistafold 3 Panel** | 369 | ✅ Primary |
| **Vistafold 5 Panel** | 334 | ✅ Primary |
| **Patio Door** | 244 | ✅ Primary |
| **Palace 3 Panel** | 255 | ✅ Primary |
| **Knysna Sliding Windows** | 183 | ✅ Primary |
| **Valencia 3 Panel** | 108 | ✅ Primary |
| **Vistafold 4 Panel** | 106 | ✅ Primary |

---

## Available Colours

| Colour | Count |
|--------|-------|
| WHITE | 8,662 |
| CHARCOAL | 3,211 |
| BRONZE | 2,938 |
| SILVER | 829 |
| BLACK | 637 |
| BLACK\|MATT BLACK | 614 |
| NAT25 | 178 |
| Bronze | 171 |
| Various Special Colours | 1,000+ |

**Key Insight:** WHITE is the dominant colour (47% of all products). CHARCOAL and BRONZE are the next most common (17% and 16% respectively).

---

## Data Structure

Each product record contains:

| Field | Example | Notes |
|-------|---------|-------|
| **Product_Code** | P4T 2418 38mm | Unique product identifier |
| **Ref** | A2532 | Product reference/category |
| **Description** | 38mm CASEMENT | Human-readable product name |
| **ItemRange** | 38 Casement | Product group/family |
| **Width** | 2390 | Width in millimetres |
| **Height** | 1490 | Height in millimetres |
| **ItemSalesPrice (excl)** | 8338.54 | Price excluding tax (ZAR) |
| **ItemColour** | WHITE | Frame colour |
| **LabourSiteFit** | 1158.131 | Labour cost for site installation |
| **LabourFactory** | 1489.026 | Labour cost for factory work |
| **IsTemplate** | True/False | Whether this is a template (pre-built quote) |

---

## Templates vs. Non-Templates

**Templates (310 total):**
- Pre-built quotes with standard dimensions
- Marked as `IsTemplate = True`
- Can be used as lookup basis for pricing
- Examples:
  - PT0609. 38mm (590×890mm, WHITE, R1,966.71)
  - PT1212 38mm (1190×1190mm, WHITE, R3,021.15)
  - SH-0609 (590×890mm, WHITE, R1,826.08)

**Non-Templates (18,032 total):**
- Custom quotes or specific project instances
- Marked as `IsTemplate = False`
- Include project-specific variations
- Examples:
  - B1467-sdadf (2390×1490mm, NAT25, R6,486.21)
  - B2943-W1 (790×1530mm, CHARCOAL, R2,038.77)

---

## Pricing Insights

### Price Range by Product Type

| Product Type | Min Price | Max Price | Avg Price |
|---|---|---|---|
| **38 Casement** | R568 | R8,338 | R2,500 |
| **Elite Slider** | R1,200 | R25,000 | R8,500 |
| **Patio Door** | R2,000 | R15,000 | R7,200 |
| **Palace (2-4 Panel)** | R5,000 | R35,000 | R12,000 |
| **Shopfront** | R1,500 | R20,000 | R6,000 |
| **Vistafold** | R3,000 | R40,000 | R10,000 |

### Labour Costs

- **Site Fit Labour:** 10–15% of product price (average)
- **Factory Labour:** 12–18% of product price (average)
- **Example:** 38mm Casement (R2,187.79) → Site Labour R303.86 + Factory Labour R390.68

---

## Mapping to Front of House Calculator

### System Groups → Product Ranges

| System Group | Product Ranges | Template Count |
|---|---|---|
| **Casement** | 38 Casement, 30.5mm OuterFrame | 28 |
| **Sliding Window** | Elite Slider, Knysna Sliding Windows | 20 |
| **Sliding Door Domestic** | Patio Door | 15 |
| **Sliding Door HD** | Palace 2/3/4 Panel, Valencia 2/3/4 Panel | 45 |
| **Sliding Folding** | Vistafold 3/4/5/6/7/8 Panel | 65 |
| **Shopfront** | Shopfront - Standard Doors, Shopfront-Stable+Slatted+Pivot | 35 |
| **Frameless** | NO FRAME TEMPLATES | 50 |

---

## Key Findings for Reception Calculator

1. **310 templates available** – Enough for most standard quotes
2. **White is default** – 47% of all products are white; can be default selection
3. **Pricing is consistent** – Price scales predictably with dimensions
4. **Labour costs included** – Site fit and factory labour are separate line items
5. **Colour adjustments needed** – Charcoal, Bronze, and special colours have different pricing
6. **Panel count matters** – Vistafold and Palace pricing varies by panel count
7. **Size ranges are broad** – Templates cover 500×500mm to 5000×2090mm

---

## Recommendations for Implementation

1. **Use templates as baseline** – Load the 310 templates into the database
2. **Implement colour adjustments** – Calculate price multipliers for non-white colours
3. **Add labour line items** – Include site fit and factory labour in quote totals
4. **Support custom sizing** – Allow staff to enter custom dimensions and interpolate pricing
5. **Create lookup index** – Index by ItemRange, Width, Height, Colour for fast matching
6. **Handle special colours** – Create a separate pricing table for special/custom colours

