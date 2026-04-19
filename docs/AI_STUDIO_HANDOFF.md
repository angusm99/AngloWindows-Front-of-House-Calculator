# Anglo Windows Master Calculator - AI Studio Handoff

**Project:** Anglo Windows Master Calculator (Reception Quote Generator)  
**Status:** Phase 2 - Ready for Architecture Implementation  
**Last Updated:** April 2026  
**Handoff To:** AI Studio Development Team

---

## Executive Summary

The Anglo Windows Master Calculator is a **reception-focused quote generator** that enables staff to quickly generate accurate quotes from architectural drawings or manual input. The app extracts product specifications from PDF schedules, matches them to pre-built Bizman quote templates, and generates mini quotes for client delivery.

**Current Status:**
- ✅ Phase 1 Complete: PDF extraction and inline-editable review table working
- ⏳ Phase 2 In Progress: Implement 8 costing engines for all product groups
- ⏳ Phase 3 Pending: Polish, branding, and deployment

**Technology Stack:**
- **Frontend:** React 19 + Tailwind 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Database:** MySQL/TiDB
- **Hosting:** Manus platform (built-in)
- **PDF Processing:** pdfplumber (Python backend module)

---

## Project Architecture

### High-Level Workflow

```
1. User uploads PDF or enters specs manually
   ↓
2. PDF extraction (if applicable)
   → Extract code, dimensions, finish, glass type from schedule pages
   ↓
3. Product selector
   → User confirms/corrects system type and configurations
   ↓
4. Template lookup & engine selection
   → Find matching Bizman quote template
   → Select appropriate costing engine (8 options)
   ↓
5. Price calculation
   → Apply engine logic (mitre, overlap, leaf count, linear, etc.)
   → Apply adjustments for size, glass, colour, etc.
   ↓
6. Quote assembly
   → Generate mini quote with line items and total
   ↓
7. Export
   → Generate PDF or email quote to client
```

### System Groups & Engines (Master Architecture)

Every product in the app belongs to one of **8 system groups**, each with a dedicated costing engine:

| Group | Systems | Engine | Logic |
|-------|---------|--------|-------|
| **Casement** | 30.5mm, 38mm, Baobab | ENGINE_MITRE | 45° mitre joints, fixed deductions |
| **Sliding Window** | Elite, Knysna | ENGINE_SLIDER_LIGHT | Overlap logic, shared calculation |
| **Sliding Door Domestic** | Patio | ENGINE_SLIDER_DOM | Standard overlap logic |
| **Sliding Door HD** | Palace, Valencia | ENGINE_SLIDER_HEAVY | Heavy overlap, shared Clip 44 stiles |
| **Sliding Folding** | Vistafold | ENGINE_LEAF_COUNT | Sash multiplication by leaf count |
| **Clip 44 Shopfront** | Shopfront | ENGINE_SHOPFRONT | Fixed frames, hinged doors, square cut |
| **Frameless Folding** | Frameless Folding | ENGINE_LEAF | Leaf logic (Width ÷ Panels) |
| **Frameless Balustrade** | Crystal View | ENGINE_LINEAR | Run length only (metres) |

---

## Database Schema Requirements

### Current Tables

The project uses Drizzle ORM with the following key tables:

- `users` – User authentication and roles
- `quotes` – Quote headers (job reference, customer, date, etc.)
- `quote_units` – Individual products within a quote

### Required Schema Updates

**Add to `quote_units` table:**

```typescript
// New fields to support all 8 engines
leaf_count: integer | null        // For ENGINE_LEAF_COUNT (Vistafold)
run_length: decimal | null        // For ENGINE_LINEAR (Crystal View)
engine_type: enum (see below)     // Tracks which engine to use
system_group: string              // Casement, Sliding Window, etc.
system_name: string               // Elite, Palace, etc.
```

**Engine Type Enum:**

```typescript
enum EngineType {
  ENGINE_MITRE = 'ENGINE_MITRE',
  ENGINE_SLIDER_LIGHT = 'ENGINE_SLIDER_LIGHT',
  ENGINE_SLIDER_DOM = 'ENGINE_SLIDER_DOM',
  ENGINE_SLIDER_HEAVY = 'ENGINE_SLIDER_HEAVY',
  ENGINE_LEAF_COUNT = 'ENGINE_LEAF_COUNT',
  ENGINE_SHOPFRONT = 'ENGINE_SHOPFRONT',
  ENGINE_LEAF = 'ENGINE_LEAF',
  ENGINE_LINEAR = 'ENGINE_LINEAR',
}
```

**Sample Migration SQL:**

```sql
ALTER TABLE quote_units ADD COLUMN leaf_count INT DEFAULT NULL;
ALTER TABLE quote_units ADD COLUMN run_length DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE quote_units ADD COLUMN engine_type VARCHAR(50) NOT NULL DEFAULT 'ENGINE_MITRE';
ALTER TABLE quote_units ADD COLUMN system_group VARCHAR(50) NOT NULL DEFAULT 'Casement';
ALTER TABLE quote_units ADD COLUMN system_name VARCHAR(100) NOT NULL DEFAULT '30.5';
```

---

## Backend Implementation (tRPC Procedures)

### 1. Engine Implementations

Each engine is a separate module in `server/engines/` that calculates BOM and pricing:

**Location:** `server/engines/mitre.ts`, `server/engines/slider.ts`, etc.

**Interface (all engines implement this):**

```typescript
interface CostingEngine {
  calculateBOM(params: {
    width: number;
    height: number;
    quantity: number;
    leafCount?: number;      // For ENGINE_LEAF_COUNT
    runLength?: number;      // For ENGINE_LINEAR
    glassType: string;
    frameColour: string;
    hardwareColour: string;
  }): Promise<{
    lineItems: Array<{ code: string; description: string; qty: number; unitPrice: number; total: number }>;
    subtotal: number;
    markup: number;
    total: number;
  }>;
}
```

**Engine-Specific Logic:**

- **ENGINE_MITRE:** Perimeter = (W + H) × 2 - mitre_deduction. Cost = Perimeter × material_rate × quantity.
- **ENGINE_SLIDER_LIGHT/DOM/HEAVY:** Rail length = W + overlap_deduction × (panels - 1). Cost = Rail length × material_rate × quantity.
- **ENGINE_LEAF_COUNT:** Sash tops = leaf_count, Sash bottoms = leaf_count. Cost = (Sash cost × leaf_count × 2) × quantity.
- **ENGINE_SHOPFRONT:** Frame perimeter + door components. Cost = Frame cost + (Door cost × door_qty) × quantity.
- **ENGINE_LEAF:** Panel width = W ÷ panels. Glass area = Panel width × H × panels. Cost = Glass area × material_rate × quantity.
- **ENGINE_LINEAR:** Cost = run_length × material_rate × quantity.

### 2. Product Selector tRPC Procedure

**Procedure:** `trpc.products.getSystemGroups`

**Returns:**

```typescript
{
  groups: Array<{
    id: string;
    name: string;
    systems: Array<{
      id: string;
      name: string;
      engineType: EngineType;
    }>;
  }>;
}
```

**Example Response:**

```json
{
  "groups": [
    {
      "id": "casement",
      "name": "Casement",
      "systems": [
        { "id": "30.5", "name": "30.5mm", "engineType": "ENGINE_MITRE" },
        { "id": "38", "name": "38mm", "engineType": "ENGINE_MITRE" },
        { "id": "baobab", "name": "Baobab", "engineType": "ENGINE_MITRE" }
      ]
    },
    {
      "id": "sliding_window",
      "name": "Sliding Window",
      "systems": [
        { "id": "elite", "name": "Elite", "engineType": "ENGINE_SLIDER_LIGHT" },
        { "id": "knysna", "name": "Knysna", "engineType": "ENGINE_SLIDER_LIGHT" }
      ]
    }
  ]
}
```

### 3. Quote Calculation tRPC Procedure

**Procedure:** `trpc.quotes.calculateUnit`

**Input:**

```typescript
{
  systemGroup: string;
  systemName: string;
  width: number;
  height: number;
  quantity: number;
  leafCount?: number;
  runLength?: number;
  glassType: string;
  frameColour: string;
  hardwareColour: string;
}
```

**Output:**

```typescript
{
  engineType: EngineType;
  lineItems: Array<{ code: string; description: string; qty: number; unitPrice: number; total: number }>;
  subtotal: number;
  markup: number;
  total: number;
}
```

---

## Frontend Implementation (React Components)

### 1. Dynamic Product Selector Component

**Location:** `client/src/components/ProductSelector.tsx`

**Behavior:**
- Step 1: User selects **Group** (Casement, Sliding Window, etc.)
- Step 2: UI filters and displays **Systems** for that group
- Step 3: User selects **System** (e.g., Elite)
- Step 4: Engine type is determined; UI adapts input fields

**Dynamic Field Rendering:**

```typescript
// Pseudo-code
if (engineType === 'ENGINE_LINEAR') {
  // Hide Width/Height, show Run Length (metres)
  showField('runLength');
  hideFields(['width', 'height']);
} else if (engineType === 'ENGINE_LEAF_COUNT') {
  // Show Width, Height, Leaf Count
  showFields(['width', 'height', 'leafCount']);
} else {
  // Standard: Width, Height, Quantity
  showFields(['width', 'height', 'quantity']);
}
```

### 2. Quote Unit Form Component

**Location:** `client/src/components/QuoteUnitForm.tsx`

**Fields (dynamic based on engine type):**

- **Standard Fields:** Width, Height, Quantity, Glass Type, Frame Colour, Hardware Colour
- **Folding-Specific:** Leaf Count (for ENGINE_LEAF_COUNT)
- **Linear-Specific:** Run Length in metres (for ENGINE_LINEAR, replaces Width/Height)

### 3. Quote Summary Component

**Location:** `client/src/components/QuoteSummary.tsx`

**Displays:**
- Quote number, customer name, date
- Itemised line items (code, description, qty, unit price, total)
- Subtotal, markup, total price
- Export button (PDF, email)

---

## PDF Extraction Integration

### Current Status

**Module:** `server/pdf_intake.py`

**Capabilities:**
- Extracts schedule pages from architectural PDFs
- Captures: opening code, width, height, finish, glazing, safety glass flag
- Outputs: CSV with extracted rows
- Flags ambiguous rows (missing dimensions, non-standard codes)

**Limitations:**
- Dimension extraction is schedule-only; plan-page dimensions require manual verification
- Assumes well-structured schedule format (may need adjustment for different drawing sets)

### Integration with New Engine System

**tRPC Procedure:** `trpc.quotes.extractSchedules`

**Workflow:**
1. User uploads PDF
2. Backend calls `pdf_intake.py`
3. Extract rows are returned to frontend
4. User reviews and edits extracted rows in inline-editable table
5. User confirms; rows are added to quote as units

**Enhancement Needed:** Auto-detect system group from extracted code

```typescript
// Example: If extracted code is "W1" (window), map to appropriate system
// If code is "D1" (door), map to door system
// This requires a mapping table: code_prefix → system_group
```

---

## UI/UX Requirements

### Product Selector Flow

**Step 1: Select Group**
- Display 8 system groups as cards or dropdown
- Show system count and brief description

**Step 2: Select System**
- Display systems within group
- Show engine type and key features

**Step 3: Configure Unit**
- Render dynamic fields based on engine type
- Show validation errors (missing dimensions, invalid quantities)

### Quote Builder Workspace

**Layout:**
- Left panel: Product selector and unit entry form
- Right panel: Quote summary with running total
- Bottom: Extracted schedule review table (if PDF upload)

**Key Features:**
- Inline editing of units
- Live price calculation
- Markup/discount controls
- Export button (PDF, email)

### Validation Rules

- Width and Height must be > 0 (except for ENGINE_LINEAR)
- Leaf Count must be 3–8 (for ENGINE_LEAF_COUNT)
- Run Length must be > 0 (for ENGINE_LINEAR)
- Quantity must be ≥ 1
- Glass Type and Frame Colour must be selected

---

## Data Requirements from Bizman

To complete the implementation, provide:

1. **Material Pricing Table**
   - Material codes (e.g., SF30501, SF38001, etc.)
   - Unit prices
   - Markup percentages

2. **Deduction/Overlap Values**
   - Mitre deduction for each casement profile (30.5mm, 38mm, Baobab)
   - Overlap deduction for each slider type (Elite, Knysna, Patio, Palace, Valencia)
   - Shopfront frame deduction
   - Frameless panel deduction

3. **Hardware Kit Mappings**
   - Which hardware kits are included with each system
   - Hardware costs

4. **Glass Type Pricing**
   - 4mm clear, laminated, DGU, tinted, obscured
   - Multipliers for each type

5. **Colour Adjustments**
   - Frame colours (white, black, anodised, custom)
   - Hardware colours
   - Cost multipliers for each

---

## Testing Checklist

### Unit Tests (Backend)

- [ ] ENGINE_MITRE: 1200×800 casement → Correct perimeter and mitre deduction
- [ ] ENGINE_SLIDER_LIGHT: 2000×1000 Elite, 3-panel → Correct overlap deduction
- [ ] ENGINE_SLIDER_DOM: 2400×1200 Patio, 4-panel → Correct domestic overlap
- [ ] ENGINE_SLIDER_HEAVY: 3000×1500 Palace, 6-panel → Correct HD overlap and Clip 44 stiles
- [ ] ENGINE_LEAF_COUNT: 2000×2000 Vistafold, 5-leaf → 5 sash tops + 5 sash bottoms
- [ ] ENGINE_SHOPFRONT: 2500×2500 shopfront, double hinged → Correct frame + door components
- [ ] ENGINE_LEAF: 2000×2000 frameless, 4-panel → Correct glass area
- [ ] ENGINE_LINEAR: 5m Crystal View → Correct linear metre calculation

### Integration Tests (Frontend + Backend)

- [ ] PDF upload → Extract schedule → Review table → Confirm → Units added to quote
- [ ] Manual entry: Select Casement 38mm → Enter dimensions → Calculate → Quote generated
- [ ] Product selector: Select Group → System → Engine type determined → Correct fields shown
- [ ] Quote export: Generate PDF with branding, line items, total

### User Acceptance Testing

- [ ] Reception staff can quickly generate quotes from PDFs
- [ ] Manual entry is intuitive and error-resistant
- [ ] Exported quotes look professional and include all required details
- [ ] Performance is acceptable (< 2s for quote calculation)

---

## Deployment & Hosting

**Platform:** Manus (built-in hosting)

**Environment Variables:**
- `DATABASE_URL` – MySQL/TiDB connection
- `JWT_SECRET` – Session signing
- `VITE_APP_ID` – OAuth app ID
- `OAUTH_SERVER_URL` – OAuth backend
- All other system envs are pre-configured

**Deployment Steps:**
1. Complete Phase 2 implementation
2. Run all tests
3. Create checkpoint
4. Click Publish button in Manus UI

---

## File Structure & Key Locations

```
/home/ubuntu/anglo-cost-calculator/
├── server/
│   ├── engines/
│   │   ├── mitre.ts              ← Casement logic
│   │   ├── slider.ts             ← Slider logic (light, dom, heavy)
│   │   ├── shopfront.ts          ← Shopfront logic
│   │   ├── leaf.ts               ← Frameless folding logic
│   │   └── linear.ts             ← Crystal View logic
│   ├── pdf_intake.py             ← PDF extraction module
│   ├── routers.ts                ← tRPC procedures
│   └── db.ts                     ← Database queries
├── client/src/
│   ├── components/
│   │   ├── ProductSelector.tsx   ← Dynamic product selector
│   │   ├── QuoteUnitForm.tsx     ← Unit entry form
│   │   └── QuoteSummary.tsx      ← Quote summary panel
│   ├── pages/
│   │   └── Home.tsx              ← Main workspace
│   └── App.tsx                   ← Routes and layout
├── drizzle/
│   └── schema.ts                 ← Database schema (needs update)
├── ANGLO_SYSTEM_MASTER_FINAL.md  ← Master architecture spec
├── SIMPLIFIED_TAXONOMY.md        ← Product taxonomy
└── todo.md                       ← Implementation checklist
```

---

## Known Limitations & Deferred Items

- **Full BOM/Raw Materials Costing:** Deferred. Using Bizman templates instead.
- **Automatic Dimension Extraction from Plan Pages:** Deferred. Currently schedule-only; dimensions require manual verification.
- **Product Auto-Suggestion from Kit Database:** Deferred. Users select product type manually.
- **Louvre System Support:** Not yet in Bizman data; can add later if needed.
- **Multi-Language Support:** Not implemented; English only for now.

---

## Next Steps for AI Studio

1. **Review & Approve Architecture**
   - Confirm 8 engine design
   - Validate database schema updates
   - Approve UI/UX flow

2. **Implement Backend Engines**
   - Create `server/engines/` directory
   - Implement all 8 engines
   - Write unit tests for each engine

3. **Update Database Schema**
   - Add `leaf_count`, `run_length`, `engine_type`, `system_group`, `system_name` fields
   - Run migration

4. **Build Frontend Components**
   - Product selector (dynamic group/system selection)
   - Quote unit form (dynamic fields based on engine)
   - Quote summary panel

5. **Integrate PDF Extraction**
   - Wire `extractSchedules` tRPC procedure
   - Add auto-detection of system group from extracted codes
   - Test with real drawing sets

6. **Testing & Validation**
   - Run all unit tests
   - Run integration tests
   - User acceptance testing with reception staff

7. **Deployment**
   - Create checkpoint
   - Deploy to Manus platform

---

## Contact & Support

**Project Owner:** Angus (Production Manager, Anglo Windows)  
**Current Developer:** Manus AI  
**Handoff To:** AI Studio Development Team

**Key Documents:**
- `ANGLO_SYSTEM_MASTER_FINAL.md` – Master architecture (cemented specification)
- `SIMPLIFIED_TAXONOMY.md` – Product taxonomy and configurations
- `todo.md` – Implementation checklist
- `PROJECT_UPDATE.md` – Current project status

---

**Status:** Ready for Phase 2 Implementation  
**Handoff Date:** April 2026  
**Estimated Timeline:** 2–3 weeks for full implementation and testing

