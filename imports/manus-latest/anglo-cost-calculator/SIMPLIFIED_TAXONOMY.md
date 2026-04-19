# Simplified Product Taxonomy for Reception Quote Generator

**Purpose:** Define the main system types and configurations that reception staff will use to generate quick quotes from Bizman templates.

---

## System Categories (Simplified)

The calculator supports **7 main system types**, each with a set of standard configurations. Each system maps to a family of pre-built Bizman quote templates.

### 1. Casement Windows

**Profile Depths:** 30.5mm, 34mm, 38mm

**Configurations:**
- Hinge Type: Top-hung, Side-hung, Fixed
- Multi-light: Single pane, F-O-F (Fixed-Opening-Fixed), O-F-O, O-F-O-F
- Glass Type: 4mm clear, laminated, DGU, tinted
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware Colour: Matching, Contrast

**Bizman Template Family:** 30.5: Kits, 38: Kits, (34mm likely under one of these)

---

### 2. Sliding Windows

**Systems:** Elite Slider, Zenith, Knysna

**Configurations:**
- Panel Count: 2, 3, 4
- Glass Type: 4mm clear, laminated, DGU, tinted
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware Colour: Matching, Contrast

**Bizman Template Family:** Elite: Kits, Zenith: Kits, Knysna: Kits

---

### 3. Patio Doors (Sliding)

**Systems:** Patio Slider, Valencia

**Configurations:**
- Panel Count: 2, 3, 4, 6 (Valencia)
- Glass Type: 4mm clear, laminated, DGU, tinted
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware Colour: Matching, Contrast

**Bizman Template Family:** Patio, Valencia variants

---

### 4. Palace Multi-Slider (High-Duty)

**Systems:** Palace Slider, Aluminium H/Duty Slider

**Configurations:**
- Panel Count: 2, 3, 4, 6
- Track Count: 2-track, 3-track, 4-track
- Glass Type: 4mm clear, laminated, DGU, tinted
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware Colour: Matching, Contrast

**Bizman Template Family:** (Palace variants in Bizman)

---

### 5. Shopfront & Hinged Doors

**Systems:** Clip-44, Clip-101 (shopfront), Hinged Doors (45mm, 60mm, 90mm), Stable Doors, Pivot Doors

**Configurations:**
- Door Type: Single hinged, Double hinged, Stable door, Pivot, Frameless shopfront
- Hinge Style: Standard, Parliament (180°)
- Glass Type: 4mm clear, laminated, DGU, tinted, Obscured
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware: Hinges, Closers, Locks, Handles

**Bizman Template Family:** Shopfront

---

### 6. Folding/Stacking Doors (VistaFold)

**Systems:** VistaFold, Sliding Folding Doors

**Configurations:**
- Leaf Count: 3, 4, 5, 6, 7, 8
- Leaf Arrangement: Symmetrical (e.g., 3-3), Asymmetrical (e.g., 3-2-1, 5-4-1)
- Glass Type: 4mm clear, laminated, DGU, tinted
- Safety Glass: Yes/No
- Frame Colour: White, Black, Anodised, Custom
- Hardware Colour: Matching, Contrast

**Bizman Template Family:** Vistafold variants

---

### 7. Specialized Systems

**Systems:** Baobab (Tilt-and-Turn), CLS250 (Cold Lift and Slide), Curtain Wall (Jacaranda), Vertical Slider (Sash)

**Configurations:** Vary by system; typically include glass type, colour, and hardware options.

**Bizman Template Family:** Baobab: Kits, CLS250 Cold Lift and Slide: Kits, Jacaranda Curtain Wall: Kits, etc.

---

## Product Selector Hierarchy (Simplified)

The frontend UI will present products in this simplified hierarchy:

```
Products
├── Windows
│   ├── Casements
│   │   ├── 30.5mm
│   │   ├── 34mm
│   │   └── 38mm
│   ├── Sliders
│   │   ├── Elite
│   │   ├── Zenith
│   │   └── Knysna
│   └── Vertical Sliders (Sash)
├── Doors
│   ├── Patio Sliders
│   │   ├── Patio
│   │   └── Valencia
│   ├── Palace Multi-Slider
│   ├── Shopfront & Hinged
│   │   ├── Shopfront (Clip-44/101)
│   │   ├── Hinged (45/60/90mm)
│   │   ├── Stable Door
│   │   └── Pivot Door
│   └── Folding
│       └── VistaFold (3–8 panels)
└── Specialized
    ├── Baobab (Tilt-and-Turn)
    ├── CLS250 (Cold Lift and Slide)
    ├── Curtain Wall (Jacaranda)
    └── Vertical Slider (Sash)
```

---

## Template Matching Logic

When a user extracts or enters a specification (e.g., "38mm casement, 1200x800, top-hung, white frame, clear glass"), the calculator will:

1. **Identify the system type** (38mm Casement)
2. **Extract the key specs** (width, height, hinge type, colour, glass type)
3. **Query Bizman templates** for matching pre-built quotes
4. **Return the closest match** (or offer multiple options if ambiguous)
5. **Assemble the quote** using the template pricing

---

## Bizman Template Database Schema (Simplified)

Each Bizman template will be stored with:

- **Template ID** – Unique identifier
- **System Type** – Casement 38mm, Elite Slider, Shopfront, etc.
- **Configuration** – Hinge type, panel count, etc.
- **Width Range** – Min/max width for this template
- **Height Range** – Min/max height for this template
- **Glass Type** – 4mm clear, DGU, laminated, etc.
- **Frame Colour** – White, Black, Anodised, etc.
- **Base Price** – Price per unit (e.g., per window, per door)
- **Price Adjustments** – Multipliers for size, glass type, colour, etc.
- **Hardware Kit** – Associated hardware (hinges, rollers, handles, etc.)
- **Notes** – Any special considerations or limitations

---

## Workflow: From Extraction to Quote

1. **User uploads PDF or enters specs manually**
2. **PDF extraction (if applicable)** → Extract code, dimensions, finish, glass type
3. **Product selector** → User confirms/corrects system type and configurations
4. **Template lookup** → Find matching Bizman quote template
5. **Price calculation** → Apply adjustments for size, glass, colour, etc.
6. **Quote assembly** → Generate mini quote with line items and total
7. **Export** → Generate PDF or email quote to client

---

## Data Required from Bizman

To implement the template matcher, we need:

1. **Template List** – All pre-built quote templates with their specs and pricing
2. **Price Adjustment Rules** – How to adjust base price for different sizes, glass types, colours
3. **Hardware Kit Mapping** – Which hardware kits are included with each template
4. **Size Ranges** – Min/max dimensions for each template

This is much simpler than the full BOM engine and focuses on **lookup and assembly** rather than calculation.

