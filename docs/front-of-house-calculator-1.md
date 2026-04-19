# Front of House Calculator-1

## Project Overview

**Anglo Windows Master Calculator** is a reception-focused quote generator that helps staff produce accurate mini quotes from architectural drawings or manual input.

- **User:** Reception staff and front desk
- **Purpose:** Generate professional mini quotes for customers in under 5 minutes
- **Status:** Ready for development

## Core Features

### 1. PDF Upload and Extraction

- Reception staff upload architectural drawings in PDF format
- The system extracts product specifications such as code, width, height, finish, and glass type
- Staff review extracted data in an inline-editable table
- Staff confirm and add extracted products to the quote

### 2. Manual Entry

- Alternative for phone orders or quick quotes
- Simple form for customer details and product specifications
- Step-by-step guided workflow

### 3. Quote Builder

- Add multiple products to a single quote
- Each product includes:
- Product type such as Casement, Slider, Door, Shopfront, Folding, or Frameless
- Dimensions such as width, height, or run length for linear products
- Configuration such as hinge type, panel count, glass type, colour, and hardware
- Quantity
- Unit price and line total
- Edit or delete products before finalising
- Live running total with markup and discount controls

### 4. Quote Export

- Generate professional PDF quotes with Anglo Windows branding
- Include customer details, itemised products, and total price
- Email quotes directly to customers
- Save quotes for later reference or updates

## System Groups and Products

The calculator supports 8 system groups, each with specific product types.

| Group | Products | UI Fields |
| --- | --- | --- |
| Casement | 30.5mm, 38mm, Baobab | Width, Height, Hinge Type, Glass Type, Colour |
| Sliding Window | Elite, Knysna | Width, Height, Panel Count, Glass Type, Colour |
| Sliding Door Domestic | Patio | Width, Height, Panel Count, Glass Type, Colour |
| Sliding Door HD | Palace, Valencia | Width, Height, Panel Count, Glass Type, Colour |
| Sliding Folding | Vistafold | Width per leaf, Height, Leaf Count, Glass Type, Colour |
| Shopfront | Shopfront | Width, Height, Door Type, Glass Type, Colour |
| Frameless Folding | Frameless Folding | Width per panel, Height, Panel Count, Glass Type |
| Frameless Balustrade | Crystal View | Run Length (metres), Glass Type |

## User Workflow

### Workflow 1: Quote From PDF

1. Reception staff click `Upload Drawing`.
2. They select a PDF file with a window or door schedule.
3. The system extracts product data into a table.
4. Staff review and edit extracted rows.
5. Staff click `Confirm & Add to Quote`.
6. Products appear in the quote workspace.
7. Staff review the quote summary.
8. Staff click `Export as PDF` or `Email to Customer`.
9. The quote is sent to the customer.

Expected time: about 3 to 5 minutes.

### Workflow 2: Manual Entry

1. Reception staff click `Manual Entry`.
2. They enter customer details.
3. They click `Add Product`.
4. They select the product group and product type, then enter dimensions and configuration.
5. They click `Add to Quote`.
6. They repeat the process for each product.
7. They review the quote summary.
8. They export the quote as a PDF or email it to the customer.

Expected time: about 5 to 10 minutes depending on the number of products.

## Key UI Components

### 1. Home Screen

- Two large buttons: `Upload Drawing` and `Manual Entry`
- Recent quotes list for quick access
- Anglo Windows branding and logo
- `Sign in with Google` for staff access

### 2. PDF Upload and Review Table

- File upload area with drag-and-drop support
- Editable table for extracted data:
- Code
- Product Type
- Width
- Height
- Finish
- Glass
- Quantity
- Red highlighting for missing or invalid data
- Inline editing for each cell
- `Confirm & Add to Quote` button

### 3. Quote Builder Workspace

- Left panel for product selection and entry
- Right panel for quote summary showing:
- Quote number, customer name, and date
- Itemised products with code, description, quantity, unit price, and line total
- Subtotal, markup, discount, and total price
- Export and email buttons

### 4. Product Selector

- Step 1: Select product group
- Step 2: Select specific product
- Step 3: Enter dimensions and configuration
- Step 4: System calculates price and shows the line total

### 5. Quote Summary Panel

- Live total updates as products are added or edited
- Markup control with a default of 20%
- Discount field
- Edit and delete controls for each product
- Export and email actions

## Data Requirements

### From Bizman Database

1. Product pricing for each product type and configuration
2. Glass type pricing multipliers
3. Colour adjustments for frame and hardware colours
4. Configuration options such as hinge types, panel counts, and door types

### From Anglo Windows

1. Company branding including logo, colours, and fonts for PDF export
2. Markup policy with a default markup of 20%
3. Product coding rules used in drawings such as `W1` and `D1`

## Technical Stack

- Frontend: React 19 + Tailwind 4 + TypeScript
- Backend: Express 4 + tRPC 11 + Drizzle ORM
- Database: MySQL or TiDB
- PDF Processing: `pdfplumber` in Python
- Authentication: Google Sign-In
- Hosting: Web deployment to be confirmed by the implementation team

## Current Status

### Phase 1: Complete

- PDF extraction module (`pdf_intake.py`) is working
- Inline-editable review table is implemented
- Validation for missing or invalid data is in place
- Basic quote builder is in place

### Phase 2: In Progress

- Implement 8 costing engines
- Build dynamic product selector UI
- Integrate Bizman pricing data
- Test the full workflow end to end

### Phase 3: Pending

- Polish UI and UX
- Add job header strip with live total
- Deploy to production

## Success Metrics

- Reception staff can generate a quote from PDF in under 5 minutes
- Exported quotes look professional and include all required details
- Manual entry is intuitive and error-resistant
- The system prevents invalid quotes
- Staff can easily edit and resend quotes

## Constraints and Assumptions

- PDF extraction works best with well-structured schedule pages
- Dimensions are extracted from schedule pages only
- Pricing is lookup-based from Bizman templates
- Default markup is 20% and can be adjusted per quote
- All quotes are saved and retrievable by quote number or customer name

## Next Steps

1. Review this brief with the reception team
2. Confirm the product list and pricing structure
3. Gather Bizman pricing data
4. Implement Phase 2 including the 8 engines and dynamic UI
5. Test with real drawings and reception staff
6. Deploy to production

## Contact

- Project Owner: Angus, Production Manager, Anglo Windows
- Questions: Refer to [anglo-windows-master-calculator-reception-user-guide.md](C:\Users\User\Documents\New project\docs\anglo-windows-master-calculator-reception-user-guide.md)
