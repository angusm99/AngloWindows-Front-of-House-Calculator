# Bizman Kit Structure Analysis

## Overview

The provided Bizman data reveals a **two-tier kit structure**: **Raw Materials (RM)** grouped by component type and **Finished Goods (FG)** grouped by product family, with **KIT** entries serving as headers for kit collections.

---

## Raw Materials (RM) - Material Cost Categories

The RM entries represent cost pools that are applied to calculate material costs. Each RM has a markup percentage and material type.

| RM Category | Markup | Material Type | Purpose |
|---|---|---|---|
| Profiles CLS251 | 40% | Hardware | CLS251 profile system |
| Profiles Casement 340 | 40% | Profiles | 340mm profile system |
| Profiles Casement 28 | 40% | Profiles | 28mm profile system |
| Profiles Deco Wall | 40% | Profiles | Deco Wall system |
| Hardware CLS250 | 40% | Hardware | CLS250 hardware kit |
| Misc Profiles | 40% | Profiles | Miscellaneous profiles |
| Profiles CLS250 | 40% | Profiles | CLS250 profile system |
| Angles Flats Posts | 20% | Profiles | Structural angles/flats/posts |
| Hardware Patio | 20% | Hardware | Patio door hardware |
| Hardware Sliding Window Zenith | 20% | Hardware | Zenith sliding window hardware |
| Profiles Shopfront | 20% | Profiles + Hardware | Shopfront profiles and hardware |
| Cladding | 20% | Hardware | Cladding materials |
| Profiles Patio | 20% | Profiles | Patio door profiles |
| Profiles Tilt and Turn Baobab | 20% | Profiles | Baobab tilt-and-turn profiles |
| Silicone | 20% | Hardware | Silicone sealant/gaskets |
| Profiles Casement 38 | 20% | Profiles | 38mm casement profiles |
| Profiles General | 20% | Profiles | General/miscellaneous profiles |
| Hardware Multi Slider Acacia | 20% | Hardware | Acacia multi-slider hardware |
| Profiles Casement 30.5 | 20% | Profiles | 30.5mm casement profiles |
| Profiles Curtain Wall Jacaranda | 20% | Profiles | Jacaranda curtain wall profiles |
| Hardware Curtain Wall Jacaranda | 20% | Hardware | Jacaranda curtain wall hardware |
| Hardware General | 20% | Hardware | General hardware |
| Hardware Casement | 20% | Hardware | Casement hardware (hinges, stays, etc.) |
| Hardware Tilt and Turn Baobab | 20% | Hardware | Baobab tilt-and-turn hardware |
| Glass | 20% | Glass | Glass sheets/panes |
| Profiles Multi Slider Acacia | 20% | Profiles | Acacia multi-slider profiles |
| Locks Shop front | 20% | Hardware | Shopfront locks |
| Gaskets | 20% | Hardware | Gaskets/seals |
| UNASSIGNED | 20% | (unspecified) | Unassigned materials |
| Kit Headers | 20% | Hardware | Kit header components |
| Hinges Shop front | 20% | Hardware | Shopfront hinges |
| Profiles Sliding Window Zenith | 20% | Profiles | Zenith sliding window profiles |
| Aluminium H/Duty Slider | 20% | Profiles | High-duty slider profiles |
| Rollers | 20% | Hardware | Roller hardware |
| SFD hardware | 20% | Hardware | Sliding-folding door hardware |
| Sliding door hardware | 20% | Hardware | Sliding door hardware |
| Hardware shopfront | 20% | Hardware | Shopfront hardware (general) |
| Handles Shop front | 20% | Hardware | Shopfront handles |

**Key Insight:** Most RM entries use a 20% markup, except for the CLS251, Casement 340, Casement 28, and Deco Wall systems which use 40%. This suggests these are premium or specialized systems.

---

## Finished Goods (FG) - Product Templates

The FG entries represent finished product templates or frame groups. These are the actual products that users will select in the calculator.

### Window Systems

| Product | Type | Notes |
|---|---|---|
| **38 Casement** | Casement | 38mm heavy-duty casement window |
| **70mm OuterFrame-TOP HUNG** | Casement | 70mm top-hung casement (likely custom/heritage) |
| **70mm OuterFrame-SIDE HUNG** | Casement | 70mm side-hung casement (likely custom/heritage) |
| **New Hole - E-Leg OuterFrame-TOP HUNG** | Casement | Custom top-hung frame |
| **New Hole - E-Leg OuterFrame-SIDE HUNG** | Casement | Custom side-hung frame |
| **Sash OuterFrame-EXS TOP HUNG** | Vertical Slider | Sash window, top-hung configuration |
| **Sash OuterFrame-EXS SIDE HUNG** | Vertical Slider | Sash window, side-hung configuration |

### Slider Systems

| Product | Type | Notes |
|---|---|---|
| **Elite Slider** | Sliding Window | Standard residential sliding window |
| **Knysna Sliding Windows** | Sliding Window | Knysna-branded sliding window |
| **Sliding Window Zenith** | Sliding Window | Zenith-branded sliding window |
| **Patio Door** | Sliding Door | Standard residential patio door |
| **Aluminium H/Duty Slider** | Sliding Door | High-duty sliding door (likely Palace) |
| **Valencia 2 Panel** | Sliding Door | Valencia 2-panel sliding door |
| **Valencia 3 Panel** | Sliding Door | Valencia 3-panel sliding door |
| **Valencia 4 Panel** | Sliding Door | Valencia 4-panel sliding door |
| **Valencia 6 Panel** | Sliding Door | Valencia 6-panel sliding door |
| **Cavity Sliders - Valencia Panels** | Sliding Door | Cavity slider variant with Valencia panels |

### Folding/Stacking Systems

| Product | Type | Notes |
|---|---|---|
| **Vistafold 3 Panel** | Folding Door | 3-panel folding door |
| **Vistafold 4 Panel** | Folding Door | 4-panel folding door |
| **Vistafold 5 Panel** | Folding Door | 5-panel folding door |
| **Vistafold 6 panel** | Folding Door | 6-panel folding door |
| **Vistafold 7 panel** | Folding Door | 7-panel folding door |
| **Vistafold 8 panel** | Folding Door | 8-panel folding door |
| **Sliding Folding Doors** | Folding Door | Generic sliding-folding door |

### Shopfront & Door Systems

| Product | Type | Notes |
|---|---|---|
| **Shopfront- Fixes** | Shopfront | Fixed shopfront panels |
| **Shopfront- Standard Doors** | Shopfront | Standard hinged shopfront doors |
| **Shopfront- non-standard configurations** | Shopfront | Custom shopfront configurations |
| **Shopfront-Stable+Slatted+Pivot** | Shopfront | Stable doors, slatted, and pivot variants |
| **Shopfront Door** | Shopfront | Generic shopfront door |

### Multi-Slider Systems

| Product | Type | Notes |
|---|---|---|
| **Palace 2 Panel** | Multi-Slider | Palace 2-panel configuration |
| **Palace 3 Panel** | Multi-Slider | Palace 3-panel configuration |
| **Palace 4 Panel** | Multi-Slider | Palace 4-panel configuration |
| **Palace 6 Panel** | Multi-Slider | Palace 6-panel configuration |
| **Acacia Multi Slider** | Multi-Slider | Acacia-branded multi-slider |

### Specialized Systems

| Product | Type | Notes |
|---|---|---|
| **CLS250 Cold Lift and Slide** | Specialized | Cold-lift-and-slide system |
| **Baobab** | Specialized | Baobab tilt-and-turn system |
| **Zenith** | Specialized | Zenith sliding window system |
| **Knysna** | Specialized | Knysna sliding window system |
| **Deco Wall** | Specialized | Deco Wall system |

### Complex/Project Templates

| Product | Type | Notes |
|---|---|---|
| **COMPLEXES - KIDBROOKE** | Project | Kidbrooke complex template |
| **COMPLEXES - HERITAGE MANOR** | Project | Heritage Manor complex template |
| **COMPLEXES - ALPHENVALE** | Project | Alphenvale complex template |
| **COMPLEXES - NOORDHOEK MANOR** | Project | Noordhoek Manor complex template |
| **COMPLEXES - CLEU DE CAP** | Project | Cleu de Cap complex template |
| **COMPLEXES - PANORAMA VILLAGE** | Project | Panorama Village complex template |
| **COMPLEXES - ONRUS MANOR** | Project | Onrus Manor complex template |
| **COMPLEXES - KENILWORTH VILLAGE** | Project | Kenilworth Village complex template |
| **COMPLEXES - GOOILAND** | Project | Gooiland complex template |
| **COMPLEXES - LIBERTE** | Project | Liberte complex template |

### Utility/Miscellaneous

| Product | Type | Notes |
|---|---|---|
| **NO FRAME TEMPLATES** | Utility | Placeholder for non-standard frames |
| **Gates** | Utility | Gate systems |
| **WATERPROOF ANGLE UNITS** | Utility | Waterproof angle components |
| **WIREFRAMES-70MM** | Utility | 70mm wireframe template |
| **WIREFRAMES-EQUAL LEG** | Utility | Equal-leg wireframe template |
| **WIREFRAMES-38MM CASEMENT** | Utility | 38mm casement wireframe template |

---

## Kit Headers (KIT) - Product Family Collections

The KIT entries group related FG products into logical families for easier navigation and management.

| Kit Family | Contained Products | Logic Module |
|---|---|---|
| **30.5: Kits** | 30.5mm casement variants | Mitre Logic |
| **38: Kits** | 38mm casement variants | Mitre Logic |
| **Elite: Kits** | Elite slider variants | Overlap Logic |
| **Patio** | Patio door variants | Overlap Logic |
| **Acacia Multi Slider: Kits** | Acacia multi-slider variants | Overlap Logic |
| **CLS250 Cold Lift and Slide: Kits** | CLS250 cold-lift-and-slide variants | Overlap Logic |
| **Shopfront** | Shopfront and hinged door variants | Butt-Joint Logic |
| **Jacaranda Curtain Wall: Kits** | Jacaranda curtain wall variants | Custom Logic |
| **Baobab: Kits** | Baobab tilt-and-turn variants | Custom Logic |
| **Zenith: Kits** | Zenith sliding window variants | Overlap Logic |
| **Knysna: Kits** | Knysna sliding window variants | Overlap Logic |
| **Deco Wall: Kits** | Deco Wall system variants | Custom Logic |
| **Burglar Bars: Kits** | Burglar bar variants | Custom Logic |
| **Repair Kits: Kits** | Repair kit variants | N/A |
| **REPAIR PACK: Kits** | Repair pack variants | N/A |
| **28: Kits** | 28mm profile system variants | Mitre Logic (likely) |
| **340: Kits** | 340mm profile system variants | Mitre Logic (likely) |

---

## Mapping to System Taxonomy

Based on the Bizman structure, here is the recommended mapping to the system taxonomy:

| Taxonomy System | Bizman Kit Family | FG Products | RM Categories |
|---|---|---|---|
| **30.5mm Casement** | 30.5: Kits | 30.5mm casement variants | Profiles Casement 30.5, Hardware Casement, Glass |
| **34mm Casement** | (Not explicitly listed) | (Likely under 30.5 or 38) | Profiles Casement 28/340, Hardware Casement, Glass |
| **38mm Casement** | 38: Kits | 38 Casement, 70mm OuterFrame variants | Profiles Casement 38, Hardware Casement, Glass |
| **Elite Slider** | Elite: Kits | Elite Slider, Knysna Sliding Windows, Zenith | Profiles Sliding Window Zenith, Hardware Sliding Window Zenith, Glass |
| **Patio Slider** | Patio | Patio Door | Profiles Patio, Hardware Patio, Glass |
| **Palace Slider** | (Not explicitly listed) | Aluminium H/Duty Slider, Palace 2/3/4/6 Panel | Aluminium H/Duty Slider, Rollers, Glass |
| **Shopfront** | Shopfront | Shopfront- Fixes, Shopfront- Standard Doors, etc. | Profiles Shopfront, Hardware shopfront, Locks Shop front, Hinges Shop front, Glass |
| **Hinged Doors** | Shopfront | Shopfront-Stable+Slatted+Pivot | Profiles Shopfront, Hardware shopfront, Hinges Shop front, Glass |
| **VistaFold** | (Not explicitly listed) | Vistafold 3/4/5/6/7/8 Panel, Sliding Folding Doors | SFD hardware, Profiles (generic), Glass |
| **Vertical Slider (Sash)** | (Not explicitly listed) | Sash OuterFrame-EXS TOP HUNG, Sash OuterFrame-EXS SIDE HUNG | Profiles (generic), Hardware General, Glass |
| **Louvres** | (Not explicitly listed) | (Not found in FG list) | (Not found in RM list) |
| **Curtain Wall** | Jacaranda Curtain Wall: Kits | (Custom variants) | Profiles Curtain Wall Jacaranda, Hardware Curtain Wall Jacaranda, Glass |
| **Tilt-and-Turn** | Baobab: Kits | (Custom variants) | Profiles Tilt and Turn Baobab, Hardware Tilt and Turn Baobab, Glass |

---

## Missing Information

To complete the universal engine implementation, the following data is still needed:

1. **Gap Set Values:** The specific deduction values for each system (e.g., mitre deduction for 38mm casement, overlap for Elite slider)
2. **BOM Recipes:** The formulas for calculating material lengths for each kit (e.g., "Elite Slider: Rail = (W + 25mm overlap × (N-1)) + 50mm deduction")
3. **Hardware Kit Mappings:** Which hardware kits are used for each product family
4. **Glass Specifications:** Available glass types and their cost multipliers
5. **Colour/Finish Options:** Available frame colours and their cost adjustments

---

## Recommended Next Steps

1. **Extract Kit Details:** Obtain the detailed BOM and gap set data for each KIT family
2. **Validate Mappings:** Confirm that the proposed taxonomy mapping aligns with Bizman's actual kit structure
3. **Implement RM Lookup:** Build a backend function that looks up RM categories and applies markup percentages
4. **Seed Database:** Populate the `products` table with FG entries and their associated KIT families
5. **Build Logic Modules:** Implement the four logic modules (Mitre, Overlap, Butt-Joint, Leaf-Count) with the extracted gap sets and BOM recipes

