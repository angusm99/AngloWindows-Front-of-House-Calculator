# Anglo Windows - Master System Architecture (Final)

## 1. Primary System Groups & Engines

Every unit in the app must be categorized into one of these seven groups, which dictates the UI fields and the math engine used.

| Group | System Names | Engine Type | Workshop Rule |
| :--- | :--- | :--- | :--- |
| **Casement** | 30.5, 38, Baobab | `ENGINE_MITRE` | 45° Mitre joints. Fixed deductions. |
| **Sliding Window** | Elite, Knysna | `ENGINE_SLIDER_LIGHT` | Overlap logic. Knysna uses Elite props. |
| **Sliding Door Domestic** | Patio | `ENGINE_SLIDER_DOM` | Standard overlap logic. |
| **Sliding Door HD** | Palace, Valencia | `ENGINE_SLIDER_HEAVY` | Heavy overlap. Shared Clip 44 stiles. |
| **Sliding Folding** | Vistafold | `ENGINE_LEAF_COUNT` | **Sash Top/Bottom Qty = Leaf Count.** |
| **Clip 44 Shopfront** | Shopfront | `ENGINE_SHOPFRONT` | Fixed frames & Hinged doors. Square cut. |
| **Frameless** | Frameless Folding | `ENGINE_LEAF` | Patch fittings & Glass panel math. |
| **Frameless** | Crystal View | `ENGINE_LINEAR` | Balustrades. Calculated per **Linear Metre**. |

---

## 2. Technical Engineering Rules

### A. The Sliding Folding Group (Vistafold)

**Logic:** This engine must dynamically calculate the number of sash components.

**Multiplier:** If a user selects a "5-Leaf" config, the BOM must generate **5x Sash Tops** and **5x Sash Bottoms** based on the width of a single leaf.

**Ecosystem:** Uses the Vistafold specialized outer frame but is compatible with Clip 44 stiles and beads.

### B. The Sliding Door HD Group (Palace & Valencia)

**Logic:** Optimized for high-performance sliders.

**Components:** Pulls unique HD Heads, Sills, and Interlockers.

**Ecosystem:** Shares standard Clip 44 door stiles and glazing beads.

### C. The Sliding Window Group (Elite & Knysna)

**Shared DNA:** Knysna is calculated using the exact same deduction and property logic as the **Elite** system.

**Database:** One calculation template serves both; selection only changes the price/code lookup.

### D. The Frameless Group

**Frameless Folding:** Follows "Leaf Logic" (Width ÷ Panels).

**Crystal View Balustrade:** Pure **Linear Logic**. UI must hide "Height" and "Width" and show "Run Length (m)".

---

## 3. Backend Implementation Requirements

1. **Schema Update:** Ensure `quote_units` has a `leaf_count` field (integer) and a `run_length` field (decimal).

2. **Engine Selection:**
   - `if group == 'Sliding Folding'` → Trigger `ENGINE_LEAF_COUNT` (calculate sash lengths and multiply Qty by `leaf_count`).
   - `if group == 'Frameless' and system == 'Crystal View'` → Trigger `ENGINE_LINEAR` (BOM items quantity = `run_length`).

3. **Clip 44 Compatibility:** Ensure the `material_prices` table correctly links shared stiles (e.g., `SF44011`) across the Shopfront, Sliding Door HD, and Sliding Folding groups.

---

## 4. Frontend UI Requirements

1. **Dynamic Inputs:**
   - For **Vistafold/Frameless Folding**: Show a "Number of Leaves" selector.
   - For **Crystal View**: Replace the standard WxH box with a single "Run Length (m)" input.

2. **System Hierarchy:** The first step in the manual builder should be selecting the **Group**, which then filters the **System Names**.

3. **Branding:** Ensure **Elite** is the lead name for sliding windows.

---

## 5. System Group Descriptions

### Casement (ENGINE_MITRE)

**Systems:** 30.5mm, 38mm, Baobab

**Characteristics:**
- Fixed 45° mitre joints at corners
- Fixed deductions for corner waste
- Standard width × height calculation

**UI Fields:**
- Width, Height, Quantity
- Hinge type (top-hung, side-hung, fixed)
- Glass type, Frame colour, Hardware colour

### Sliding Window Light (ENGINE_SLIDER_LIGHT)

**Systems:** Elite, Knysna

**Characteristics:**
- Overlap logic for panel calculations
- Knysna uses identical Elite properties
- Standard 2–4 panel configurations

**UI Fields:**
- Width, Height, Quantity
- Panel count (2, 3, 4)
- Glass type, Frame colour, Hardware colour

### Sliding Door Domestic (ENGINE_SLIDER_DOM)

**Systems:** Patio

**Characteristics:**
- Standard overlap logic
- Domestic-duty sliders
- 2–4 panel configurations

**UI Fields:**
- Width, Height, Quantity
- Panel count (2, 3, 4)
- Glass type, Frame colour, Hardware colour

### Sliding Door Heavy-Duty (ENGINE_SLIDER_HEAVY)

**Systems:** Palace, Valencia

**Characteristics:**
- Heavy-duty overlap logic
- Shared Clip 44 stiles with shopfront
- Unique HD heads, sills, interlockers
- 2–6 panel configurations

**UI Fields:**
- Width, Height, Quantity
- Panel count (2, 3, 4, 6)
- Glass type, Frame colour, Hardware colour

### Sliding Folding (ENGINE_LEAF_COUNT)

**Systems:** Vistafold

**Characteristics:**
- Leaf-count-driven BOM
- Sash Tops/Bottoms multiply by leaf count
- Compatible with Clip 44 stiles and beads
- 3–8 leaf configurations

**UI Fields:**
- Width (per leaf), Height, Quantity
- **Leaf count (3–8)** – drives sash component multiplication
- Glass type, Frame colour, Hardware colour

### Clip 44 Shopfront (ENGINE_SHOPFRONT)

**Systems:** Shopfront

**Characteristics:**
- Fixed frames and hinged doors
- Square-cut (no mitres)
- Shared Clip 44 stiles with HD sliders and folding doors
- Hinged door variants (single, double, stable, pivot)

**UI Fields:**
- Width, Height, Quantity
- Door type (single hinged, double hinged, stable, pivot, frameless)
- Glass type, Frame colour, Hardware colour

### Frameless Folding (ENGINE_LEAF)

**Systems:** Frameless Folding

**Characteristics:**
- Leaf logic (Width ÷ Panels)
- Patch fittings and glass panel math
- No frame profile
- 2–8 panel configurations

**UI Fields:**
- Width (per panel), Height, Quantity
- Panel count (2–8)
- Glass type

### Frameless Balustrade (ENGINE_LINEAR)

**Systems:** Crystal View

**Characteristics:**
- Pure linear metre calculation
- Balustrade system
- No width/height; only run length

**UI Fields:**
- **Run Length (metres)** – replaces Width/Height
- Quantity
- Glass type, Handrail colour

---

## 6. Shared Component Ecosystem

### Clip 44 Stiles (Shared Across Groups)

The following groups share standard Clip 44 door stiles and glazing beads:

- Sliding Door HD (Palace, Valencia)
- Clip 44 Shopfront
- Sliding Folding (Vistafold)

**Example Material Code:** `SF44011` (Clip 44 door stile)

When calculating BOM, ensure that these groups reference the same material pricing and availability.

---

## 7. Costing Engine Workflow

### Step 1: Determine Engine Type

User selects **Group** → System → Configuration → Engine type is determined.

### Step 2: Extract Input Parameters

- **Standard:** Width, Height, Quantity
- **Folding:** Width (per leaf), Height, Quantity, Leaf Count
- **Linear:** Run Length (metres), Quantity

### Step 3: Apply Engine Logic

- **ENGINE_MITRE:** Calculate perimeter, apply mitre deductions, multiply by quantity
- **ENGINE_SLIDER_LIGHT/DOM/HEAVY:** Calculate panel lengths, apply overlap deductions, multiply by quantity
- **ENGINE_LEAF_COUNT:** Calculate sash lengths, multiply sash components by leaf count, multiply total by quantity
- **ENGINE_SHOPFRONT:** Calculate frame and door components, multiply by quantity
- **ENGINE_LEAF:** Divide width by panel count, calculate glass area, multiply by quantity
- **ENGINE_LINEAR:** Multiply run length by quantity

### Step 4: Generate BOM

Apply material prices and hardware kits to generate line items and total cost.

### Step 5: Apply Markup & Export

Apply 20% markup (or user-defined), generate quote, export as PDF.

---

## 8. Testing Checklist

- [ ] Casement 30.5mm: 1200×800, top-hung → Correct mitre deduction applied
- [ ] Elite Slider: 2000×1000, 3-panel → Correct overlap deduction applied
- [ ] Patio: 2400×1200, 4-panel → Correct domestic overlap applied
- [ ] Palace: 3000×1500, 6-panel → Correct HD overlap and shared Clip 44 stiles
- [ ] Vistafold: 2000×2000, 5-leaf → 5x Sash Tops + 5x Sash Bottoms generated
- [ ] Shopfront: 2500×2500, double hinged → Correct frame + door components
- [ ] Frameless Folding: 2000×2000, 4-panel → Correct glass area calculation
- [ ] Crystal View: 5m run length → Correct linear metre calculation

---

**This is the Cemented Specification.** All developers should reference this document to ensure correct implementation of the 20% markup, Clip 44 shared stiles, Vistafold sash counts, and all engine logic.

