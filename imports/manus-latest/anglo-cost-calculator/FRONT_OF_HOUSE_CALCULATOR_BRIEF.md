# Front of House Calculator-1

## Project Overview

**Anglo Windows Master Calculator** – A reception-focused quote generator that enables staff to quickly generate accurate quotes from architectural drawings or manual input.

**User:** Reception staff and front desk  
**Purpose:** Generate professional mini quotes for customers in under 5 minutes  
**Status:** Ready for development

---

## Core Features

### 1. PDF Upload & Extraction
- Reception staff upload architectural drawings (PDFs with window/door schedules)
- System automatically extracts product specifications (code, width, height, finish, glass type)
- Staff review extracted data in an inline-editable table
- Staff confirm and add extracted products to quote

### 2. Manual Entry
- Alternative to PDF upload for phone orders or quick quotes
- Simple form to enter customer details and product specifications
- Step-by-step guided workflow

### 3. Quote Builder
- Add multiple products to a single quote
- Each product shows:
  - Product type (Casement, Slider, Door, Shopfront, Folding, Frameless, etc.)
  - Dimensions (width, height, or run length for linear products)
  - Configuration (hinge type, panel count, glass type, colour, hardware)
  - Quantity
  - Unit price and line total
- Edit or delete products before finalizing
- Live running total with markup/discount controls

### 4. Quote Export
- Generate professional PDF quote with Anglo Windows branding
- Include customer details, itemised products, and total price
- Email quote directly to customer
- Save quote for later reference or updates

---

## System Groups & Products

The calculator supports **8 system groups**, each with specific product types:

| Group | Products | UI Fields |
|-------|----------|-----------|
| **Casement** | 30.5mm, 38mm, Baobab | Width, Height, Hinge Type, Glass Type, Colour |
| **Sliding Window** | Elite, Knysna | Width, Height, Panel Count, Glass Type, Colour |
| **Sliding Door Domestic** | Patio | Width, Height, Panel Count, Glass Type, Colour |
| **Sliding Door HD** | Palace, Valencia | Width, Height, Panel Count, Glass Type, Colour |
| **Sliding Folding** | Vistafold | Width (per leaf), Height, **Leaf Count**, Glass Type, Colour |
| **Shopfront** | Shopfront | Width, Height, Door Type, Glass Type, Colour |
| **Frameless Folding** | Frameless Folding | Width (per panel), Height, **Panel Count**, Glass Type |
| **Frameless Balustrade** | Crystal View | **Run Length (metres)**, Glass Type |

---

## User Workflow

### Workflow 1: Quote from PDF (Fastest)
1. Reception staff clicks "Upload Drawing"
2. Selects PDF file (architectural plan with window/door schedule)
3. System extracts product data into a table
4. Staff reviews and edits extracted rows (fix dimensions, product type, etc.)
5. Staff clicks "Confirm & Add to Quote"
6. Products appear in quote workspace
7. Staff reviews quote summary (customer name, items, total)
8. Staff clicks "Export as PDF" or "Email to Customer"
9. Quote is sent to customer

**Time:** ~3–5 minutes

### Workflow 2: Manual Entry
1. Reception staff clicks "Manual Entry"
2. Fills in customer details (name, phone, address, date, etc.)
3. Clicks "Add Product"
4. Selects product group → product type → enters dimensions → chooses configuration
5. Clicks "Add to Quote"
6. Repeats for each product
7. Reviews quote summary
8. Exports as PDF or emails to customer

**Time:** ~5–10 minutes depending on number of products

---

## Key UI Components

### 1. Home Screen
- Two large buttons: "Upload Drawing" and "Manual Entry"
- Recent quotes list (for quick access)
- Anglo Windows branding and logo

### 2. PDF Upload & Review Table
- File upload area (drag & drop or click to select)
- Extracted data displayed in editable table:
  - Code, Product Type, Width, Height, Finish, Glass, Quantity
  - Red highlighting for missing/invalid data
  - Inline editing for each cell
  - "Confirm & Add to Quote" button at bottom

### 3. Quote Builder Workspace
- **Left panel:** Product selector and entry form (dynamic fields based on product type)
- **Right panel:** Quote summary showing:
  - Quote number, customer name, date
  - Itemised products (code, description, qty, unit price, line total)
  - Subtotal, markup %, discount, total price
  - Export/Email buttons

### 4. Product Selector
- Step 1: Select product group (dropdown or cards)
- Step 2: Select specific product (e.g., Elite for Sliding Window)
- Step 3: Enter dimensions and configuration
- Step 4: System calculates price and shows line total

### 5. Quote Summary Panel
- Live total that updates as products are added/edited
- Markup control (default 20%)
- Discount field
- Edit/Delete buttons for each product
- Export and Email buttons

---

## Data Requirements

### From Bizman Database
1. **Product Pricing** – Base price for each product type and configuration
2. **Glass Type Pricing** – Multipliers for different glass types (clear, DGU, laminated, tinted, etc.)
3. **Colour Adjustments** – Cost adjustments for frame and hardware colours
4. **Configuration Options** – Available hinge types, panel counts, door types, etc.

### From Anglo Windows
1. **Company Branding** – Logo, colours, fonts for PDF export
2. **Markup Policy** – Default markup percentage (currently 20%)
3. **Product Codes** – How products are coded in drawings (e.g., W1, D1, etc.)

---

## Technical Stack

- **Frontend:** React 19 + Tailwind 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Database:** MySQL/TiDB
- **PDF Processing:** pdfplumber (Python)
- **Hosting:** Manus platform (built-in)

---

## Current Status

### Phase 1: COMPLETE ✅
- PDF extraction module (pdf_intake.py) working
- Inline-editable review table implemented
- Validation for missing/invalid data
- Basic quote builder in place

### Phase 2: IN PROGRESS ⏳
- Implement 8 costing engines
- Build dynamic product selector UI
- Integrate Bizman pricing data
- Test end-to-end workflow

### Phase 3: PENDING
- Polish UI/UX
- Add job header strip with live total
- Deploy to production

---

## Success Metrics

- Reception staff can generate a quote from PDF in < 5 minutes
- Exported quotes look professional and include all required details
- Manual entry is intuitive and error-resistant
- System prevents invalid quotes (missing dimensions, invalid quantities)
- Staff can easily edit and resend quotes

---

## Constraints & Assumptions

- PDF extraction works best with well-structured schedule pages (may need adjustment for different drawing formats)
- Dimensions are extracted from schedule pages only (plan-page dimensions require manual verification)
- Pricing is lookup-based (from Bizman templates), not calculated from raw materials
- Default markup is 20% (can be adjusted per quote)
- All quotes are saved and retrievable by quote number or customer name

---

## Next Steps

1. Review this brief with reception team
2. Confirm product list and pricing structure
3. Gather Bizman pricing data
4. Implement Phase 2 (8 engines and dynamic UI)
5. Test with real drawings and real reception staff
6. Deploy to production

---

## Contact

**Project Owner:** Angus (Production Manager, Anglo Windows)  
**Current Developer:** Manus AI  
**For Questions:** Refer to RECEPTION_USER_GUIDE.md for detailed user documentation

