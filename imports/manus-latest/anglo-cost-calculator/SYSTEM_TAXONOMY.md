# Anglo Windows System Taxonomy

**Purpose:** Define all system types, configurations, and costing logic modules that the universal calculator engine will support.

---

## System Categories & Types

### 1. Casement Systems (Mitre Logic)

Casement windows use **45° mitre cuts** on all four corners. The costing logic divides the perimeter into four equal segments, applies mitre deductions, and calculates material lengths.

| System | Profile Depth | Use Case | Key Configurations |
|---|---|---|---|
| **30.5mm Casement** | 30.5mm | Light-duty residential | Top-hung, Side-hung, Fixed, Multi-light (F-O-F) |
| **34mm Casement** | 34mm | Medium-duty coastal/higher-spec | Top-hung, Side-hung, Fixed, Multi-light |
| **38mm Casement** | 38mm | Heavy-duty large vents, high wind-load | Top-hung, Side-hung, Fixed, Multi-light |

**Mitre Logic Variables:**
- Width (W), Height (H)
- Mitre deduction per corner (typically 45mm per system)
- Total perimeter = 2(W + H) - (4 × mitre deduction)
- Material cost = (perimeter × rate per mm) + hardware kit + glass

---

### 2. Sliding Systems (Overlap Logic)

Sliding windows and doors use **rail overlap** and **interlocker deductions**. The costing logic accounts for the number of panels, overlap per joint, and rail-specific reductions.

| System | Profile Depth | Typical Use | Key Configurations |
|---|---|---|---|
| **Elite Slider** | ~25mm | Standard residential sliding window and light door | OX (1 slider), OXXO (4-panel), 2-panel, 3-panel |
| **Patio Slider** | ~30mm | Standard residential sliding door | OX, OXXO, 3-panel stacking |
| **Palace High-Performance Slider** | ~40mm | Premium heavy-duty sliding door | 2-track, 3-track, 4-track multi-stacking |

**Overlap Logic Variables:**
- Width (W), Height (H)
- Number of panels (N)
- Overlap per joint (typically 20–30mm per system)
- Rail deduction (per track configuration)
- Total rail length = (W + overlap × (N-1)) + deductions
- Material cost = (rail length × rate) + (stile length × rate) + hardware kit + glass

---

### 3. Shopfront & Hinged Door Systems (Butt-Joint Logic)

Shopfronts and hinged doors use **90° butt joints** with square cuts and compensation factors. The costing logic applies butt-joint deductions and handles door-specific hardware.

| System | Profile Depth | Typical Use | Key Configurations |
|---|---|---|---|
| **Clip-44 Shopfront** | 44mm | Commercial ground-floor framing | Frameless, mullion-based, transom options |
| **Clip-101 Shopfront** | 101mm | Heavy-duty commercial shopfront | Frameless, mullion-based, transom options |
| **Hinged Doors (45mm)** | 45mm | Light-duty hinged entrance doors | Single hinged, double hinged, stable door |
| **Hinged Doors (60mm)** | 60mm | Medium-duty hinged entrance doors | Single hinged, double hinged, stable door, parliament hinge |
| **Hinged Doors (90mm)** | 90mm | Heavy-duty hinged entrance doors | Single hinged, double hinged, stable door, parliament hinge |
| **Pivot Doors** | 45mm–90mm | Large-format entrance doors | Single pivot, double pivot |

**Butt-Joint Logic Variables:**
- Width (W), Height (H)
- Butt-joint deduction per corner (typically 10–15mm per system)
- Total perimeter = 2(W + H) - (4 × butt deduction)
- Material cost = (perimeter × rate) + hardware kit (hinges, closers, locks) + glass

---

### 4. Sliding-Folding Systems (Leaf-Count Logic)

Folding systems (VistaFold) use **leaf-count division** where the total width is divided by the number of leaves, and hardware cost is the major driver.

| System | Profile Depth | Typical Use | Key Configurations |
|---|---|---|---|
| **VistaFold / Fold-a-Side** | ~40mm | Premium stacker door system | 3-leaf, 4-leaf, 5-leaf, 6-leaf, custom combinations (e.g., 3-2-1, 5-4-1, 6-3-3) |

**Leaf-Count Logic Variables:**
- Width (W), Height (H)
- Number of leaves (N)
- Gap per leaf (typically 5–10mm)
- Width per leaf = (W - (N × gap)) / N
- Material cost = (width per leaf × N × rate) + (height × rate × N) + hardware kit (rollers, guides, handles) + glass

---

### 5. Specialized Systems

#### 5.1 Louvres

Fixed or adjustable louvre inserts used in doors, windows, or standalone frames.

| Type | Use Case | Key Variables |
|---|---|---|
| **Fixed Blade Louvre** | Ventilation, privacy | Blade count, blade angle, frame dimensions |
| **Adjustable (Galloti-style) Louvre** | Ventilation with control | Blade count, blade angle, frame dimensions, actuator |

**Louvre Logic:** Blade count × blade length + frame perimeter + hardware (hinges, handles, actuators if adjustable)

#### 5.2 Vertical Sliders (Sash Windows)

Traditional sash windows with vertical sliding panes.

| Type | Use Case | Key Variables |
|---|---|---|
| **Vertical Slider / Sash** | Heritage, traditional aesthetic | Width, height, number of panes (typically 2), sash cord/spring hardware |

**Sash Logic:** Similar to sliding logic but with vertical orientation and sash-specific hardware (cords, springs, pulleys, weights).

---

## Logic Modules Summary

| Logic Module | Formula Pattern | Used By | Key Deduction |
|---|---|---|---|
| **Mitre Logic** | Perimeter = 2(W+H) - (4 × mitre) | All Casement Systems | 45° corner cuts |
| **Overlap Logic** | Rail = (W + overlap × (N-1)) + deductions | Elite, Patio, Palace Sliders | Interlocker overlap per panel |
| **Butt-Joint Logic** | Perimeter = 2(W+H) - (4 × butt) | Shopfronts, Hinged Doors | 90° corner cuts |
| **Leaf-Count Logic** | Width per leaf = (W - (N × gap)) / N | VistaFold, Folding Doors | Gap per leaf division |

---

## Product Selector Hierarchy

The frontend UI will present products in this hierarchy:

```
Products
├── Windows
│   ├── Casements
│   │   ├── 30.5mm (Light Duty)
│   │   ├── 34mm (Medium Duty)
│   │   └── 38mm (Heavy Duty)
│   ├── Sliders
│   │   ├── Elite Slider
│   │   ├── Patio Slider
│   │   └── Palace Slider
│   ├── Vertical Sliders (Sash)
│   └── Louvres
│       ├── Fixed Blade
│       └── Adjustable (Galloti)
├── Doors
│   ├── Shopfronts
│   │   ├── Clip-44
│   │   └── Clip-101
│   ├── Hinged Doors
│   │   ├── 45mm
│   │   ├── 60mm
│   │   └── 90mm
│   ├── Pivot Doors
│   │   ├── 45mm
│   │   ├── 60mm
│   │   └── 90mm
│   ├── Sliding Doors
│   │   ├── Elite Slider
│   │   ├── Patio Slider
│   │   └── Palace Slider
│   └── Folding Doors
│       └── VistaFold / Fold-a-Side
```

---

## Configuration Options by System

### Casement Windows
- **Hinge Type:** Top-hung, Side-hung, Fixed
- **Multi-light:** Single pane, F-O-F (Fixed-Opening-Fixed), O-F-O, etc.
- **Glass Type:** 4mm clear, laminated, DGU, tinted
- **Safety Glass:** Yes/No
- **Frame Colour:** White, Black, Anodised, Custom
- **Hardware Colour:** Matching, Contrast

### Sliding Systems
- **Panel Count:** 2, 3, 4, 5+ (depending on system)
- **Track Count (Palace):** 2-track, 3-track, 4-track
- **Glass Type:** 4mm clear, laminated, DGU, tinted
- **Safety Glass:** Yes/No
- **Frame Colour:** White, Black, Anodised, Custom
- **Hardware Colour:** Matching, Contrast

### Shopfront & Hinged Doors
- **Door Type:** Single hinged, Double hinged, Stable door, Pivot
- **Hinge Style (Hinged):** Standard, Parliament (180°)
- **Glass Type:** 4mm clear, laminated, DGU, tinted, Obscured
- **Safety Glass:** Yes/No
- **Frame Colour:** White, Black, Anodised, Custom
- **Hardware:** Hinges, Closers, Locks, Handles

### Folding Doors (VistaFold)
- **Leaf Count:** 3, 4, 5, 6, custom
- **Leaf Arrangement:** Symmetrical (e.g., 3-3), Asymmetrical (e.g., 3-2-1, 5-4-1)
- **Glass Type:** 4mm clear, laminated, DGU, tinted
- **Safety Glass:** Yes/No
- **Frame Colour:** White, Black, Anodised, Custom
- **Hardware:** Rollers, Guides, Handles

---

## Mapping to Bizman Kits

The 138 Bizman kits will be categorized as follows:

1. **Casement Kits** (~30–40 kits) – One per profile depth, glass type, and colour combination
2. **Slider Kits** (~25–35 kits) – Elite, Patio, Palace variants with panel/track options
3. **Shopfront Kits** (~15–20 kits) – Clip-44 and Clip-101 variants
4. **Hinged Door Kits** (~20–25 kits) – 45mm, 60mm, 90mm with hinge and hardware options
5. **Folding Door Kits** (~10–15 kits) – VistaFold variants with leaf-count options
6. **Specialized Kits** (~5–10 kits) – Louvres, Sash, Pivot doors

Each kit will store:
- System type (e.g., "Casement 38mm")
- Logic module (e.g., "Mitre Logic")
- Gap set reference (e.g., "Elite_Slider_Gaps")
- BOM recipe (formula for calculating material lengths)
- Hardware kit ID (for automatic hardware lookup)
- Base price per unit length

---

## Next Steps

1. **Obtain Bizman Kit List:** Request the cleaned CSV with all 138 kits and their current categorization
2. **Map Each Kit:** Assign each kit to a system type and logic module
3. **Extract Gap Sets:** Identify the specific deduction values for each system (mitre, overlap, butt-joint, leaf-gap)
4. **Build BOM Recipes:** Translate each kit's material calculation into a formula
5. **Implement Universal Engine:** Code the pluggable logic modules in the backend
6. **Test Coverage:** Validate costing accuracy against known Bizman outputs

