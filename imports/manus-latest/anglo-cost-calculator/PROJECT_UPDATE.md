# Anglo Windows Master Calculator – Project Update

**Project Name:** Anglo Windows - MASTER CALCULATOR  
**Status:** Working Prototype with PDF Intake MVP  
**Latest Checkpoint:** 7041ac34  
**Last Updated:** April 2026  

---

## Executive Summary

The Anglo Windows Master Calculator is a secure internal quoting platform designed for reception, sales, and estimating staff. The system enables fast quote generation from either manual entry or architectural drawing uploads. The current build includes a fully functional PDF-assisted intake workflow that extracts schedule data from architectural plans, presents it in an editable review table, and feeds validated items into the quote builder.

**Key Achievement:** The app now bridges document capture and quote drafting, reducing manual data entry and supporting first-pass estimating from client drawings.

---

## Architecture Overview

### Tech Stack
- **Frontend:** React 19 + Tailwind 4 + shadcn/ui components
- **Backend:** Express 4 + tRPC 11 (type-safe RPC framework)
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth (built-in, no manual setup required)
- **PDF Processing:** pdfplumber (Python backend module)
- **File Storage:** S3 (preconfigured helpers in `server/storage.ts`)

### Project Structure
```
anglo-cost-calculator/
├── client/
│   ├── src/
│   │   ├── pages/Home.tsx          ← Main quote workspace
│   │   ├── components/DashboardLayout.tsx  ← App shell
│   │   ├── lib/trpc.ts             ← tRPC client binding
│   │   └── index.css               ← Global theming (dark Anglo-branded)
├── server/
│   ├── pdf_intake.py               ← PDF schedule extraction module
│   ├── routers.ts                  ← tRPC procedures
│   ├── routers/quotes.ts           ← Quote-specific endpoints
│   ├── db.ts                       ← Database query helpers
│   └── _core/                      ← Framework plumbing (OAuth, context, LLM, etc.)
├── drizzle/
│   └── schema.ts                   ← Database schema
└── storage/
    └── S3 helpers for file uploads
```

---

## Feature Breakdown

### 1. Secure Internal Dashboard
- **Status:** ✅ Complete
- **Details:** Anglo-branded dark interface with sidebar navigation, resizable sidebar, user profile, and logout
- **Access:** Manus OAuth login gate (receptionist, sales, estimating staff only)
- **UX:** Calmer, focused workspace suitable for first-pass quoting and document intake

### 2. Manual Quote Builder
- **Status:** ✅ Complete
- **Details:** Users can manually add quote units by specifying:
  - Product type (window or door)
  - Dimensions (width × height in mm)
  - Quantity
  - Finish (frame colour)
  - Glass type (4mm clear, laminated, DGU, etc.)
  - Safety glass flag
- **Workflow:** Each unit is added as a card, displayed in the workspace, and can be removed before export

### 3. PDF Schedule Extraction (MVP)
- **Status:** ✅ Complete (with known limitations)
- **Module:** `server/pdf_intake.py`
- **How it works:**
  1. User uploads an architectural PDF
  2. Backend classifies pages by keyword signature (WINDOW SCHEDULE, DOOR SCHEDULE)
  3. Extracts schedule card data via regex and text layer parsing
  4. Captures: opening code, width, height, finish, glazing, safety glass flag
  5. Flags ambiguous rows (missing dimensions, unknown finish, non-standard codes)
  6. Outputs structured CSV-like data ready for review
- **Extraction Quality:**
  - ✅ Opening codes (W1, D1, SD1, etc.) extracted reliably
  - ✅ Finish and glazing detected from schedule text
  - ✅ Safety glass flags identified
  - ⚠️ Dimensions: Text layer parsing is basic; works well for clean schedules but may miss or misparse dimensions in complex layouts
- **Test Case:** Jones-Fernkloof architectural plan successfully extracted 55 schedule items (27 windows, 28 doors)

### 4. Schedule Review & Edit UI
- **Status:** ✅ Complete
- **Details:** After extraction, users see an inline-editable table with:
  - **Opening Code** (read-only, extracted from schedule)
  - **Product Type** (dropdown: Window or Door)
  - **Width** (editable number input, mm)
  - **Height** (editable number input, mm)
  - **Quantity** (editable number input, default 1)
  - **Finish** (extracted from schedule, editable dropdown)
  - **Glass Type** (extracted from schedule, editable dropdown)
- **Validation:** 
  - Rows with zero or missing width/height show red error indicators
  - Rows with zero quantity show red error indicators
  - Confirm button is disabled if any row has validation errors
  - Error messages display inline below each invalid field
- **Workflow:** Users can edit any cell, see validation feedback immediately, and confirm when all rows are valid. Confirmed rows are added to the main quote builder.

### 5. Quote Draft Population
- **Status:** ✅ Complete
- **Details:** Validated extracted rows are transformed into quote units and added to the builder workspace
- **Data Flow:** Extraction → Review & Edit → Validation → Quote Builder → (Future: Costing & Export)

### 6. Design Reference Analysis
- **Status:** ✅ Complete
- **Details:** Reviewed Claude's HTML dashboard concept and identified useful patterns:
  - **Adopt:** Quote header strip with ID, customer, live total
  - **Adopt:** Clearer step grouping for estimator workflow
  - **Adopt:** Persistent live price summary panel
  - **Adopt Later:** Tabs for cutting list, hardware, quote PDF, history
  - **Defer:** CAD-style drawing canvas (adds complexity)
  - **Reject for now:** Dense three-column cockpit layout (keep current calmer interface)
- **Recommendation:** Borrow workflow structure from reference without copying full density

---

## Current Limitations & Known Issues

| Issue | Impact | Workaround | Priority |
|---|---|---|---|
| **Dimension extraction** | May misparse dimensions in complex PDF layouts | Manual correction in review table | Medium |
| **Product auto-matching** | No automatic kit suggestion from Bizman catalogue | Manual product type selection in review table | High |
| **Quote export** | No formal PDF/document output yet | Manual export workflow not yet built | High |
| **Frontend test coverage** | Placeholder test suite (not fully hardened) | Manual testing recommended | Medium |
| **Job header/summary strip** | Not yet implemented | Adopted from design reference for next phase | Low |
| **Cutting list & hardware tabs** | Not yet implemented | Deferred to post-MVP | Low |

---

## Testing Status

### What Has Been Tested
- ✅ PDF extraction against real architectural plan (Jones-Fernkloof)
- ✅ Schedule review table edit workflow (inline edits, validation, confirmation)
- ✅ Validation blocking on missing/zero dimensions
- ✅ Error message display and styling
- ✅ Integration of extracted rows into quote builder
- ✅ Manual quote creation and removal

### What Needs User Testing
- ⚠️ Real-world PDF formats (different drawing standards, layouts, fonts)
- ⚠️ Edge cases (very large/small dimensions, unusual product codes, mixed schedules)
- ⚠️ Reception staff workflow (speed, clarity, common errors)
- ⚠️ Estimator workflow (does the review table catch the right issues?)
- ⚠️ Quote accuracy against your Bizman kit database

---

## Database Schema

Current tables include:

- **users** – Authentication and role management (admin/user)
- **quotes** – Quote headers (ID, customer, status, created date)
- **quote_units** – Individual line items (product type, dimensions, quantity, finish, glass, price)

No migrations pending. Schema is stable for current MVP.

---

## API Endpoints (tRPC Procedures)

### Public Procedures
- `trpc.auth.me.useQuery()` – Get current user info
- `trpc.auth.logout.useMutation()` – Sign out

### Protected Procedures (Authenticated Users)
- `trpc.quotes.list.useQuery()` – Fetch all quotes for current user
- `trpc.quotes.get.useQuery({ id })` – Fetch single quote with units
- `trpc.quotes.create.useMutation()` – Create new quote
- `trpc.quotes.updateUnit.useMutation()` – Update a quote unit
- `trpc.quotes.deleteUnit.useMutation()` – Remove a unit from quote
- `trpc.quotes.extractSchedules.useMutation({ file })` – Extract schedule data from uploaded PDF

### Admin Procedures
- None currently defined (role field exists but not yet used)

---

## Environment Variables

All secrets are injected automatically by the Manus platform. Key variables:

- `DATABASE_URL` – MySQL/TiDB connection string
- `JWT_SECRET` – Session cookie signing secret
- `VITE_APP_ID` – Manus OAuth application ID
- `OAUTH_SERVER_URL` – Manus OAuth backend
- `BUILT_IN_FORGE_API_KEY` – Server-side API access (LLM, storage, notifications)
- `VITE_FRONTEND_FORGE_API_KEY` – Frontend API access (limited scope)

No manual .env file needed; all values are preconfigured.

---

## Next Priority Features

### Phase 1 (High Priority)
1. **Product Auto-Matching** – Link extracted dimensions to your Bizman kit catalogue and suggest matching products in the review table
2. **Quote Export to PDF** – Generate branded Anglo Windows quote documents for client delivery
3. **Job Header Strip** – Add a persistent quote summary bar at the top of the workspace (quote ID, customer, live total)

### Phase 2 (Medium Priority)
4. **Cutting List & Hardware Tabs** – Expand quote detail view to show material requirements and hardware schedules
5. **Quote History & Saved Jobs** – Allow users to revisit and edit previous quotes
6. **Improved Dimension Extraction** – Refine pdf_intake.py to handle more drawing formats and layouts

### Phase 3 (Lower Priority)
7. **Production Handoff Integration** – Connect to factory systems for order routing
8. **Drawing Canvas Preview** – Add visual representation of configured units (optional enhancement)
9. **Role-Based Access Control** – Expand admin features and permission levels

---

## Deployment & Hosting

- **Platform:** Manus (built-in hosting with custom domain support)
- **Dev Server:** Running on `https://3000-iythldwem60h5q0oruez6-83470252.us2.manus.computer`
- **Database:** Hosted MySQL/TiDB (managed by Manus)
- **File Storage:** S3 (automatic, preconfigured)
- **Publish:** Click "Publish" button in Management UI (requires checkpoint first)

---

## Code Quality & Standards

- **Framework:** tRPC for type-safe RPC (types flow end-to-end)
- **Database:** Drizzle ORM with schema-first migrations
- **Frontend:** React hooks, shadcn/ui components, Tailwind 4
- **Styling:** Dark Anglo-branded theme with yellow accents, HUD-style panels
- **Testing:** Vitest for unit tests (placeholder suite in place; manual testing recommended)
- **Linting:** TypeScript strict mode enabled

---

## File Locations & Key Artifacts

- **Project Root:** `/home/ubuntu/anglo-cost-calculator/`
- **PDF Intake Module:** `server/pdf_intake.py`
- **Quote Workspace:** `client/src/pages/Home.tsx`
- **Dashboard Shell:** `client/src/components/DashboardLayout.tsx`
- **Global Styles:** `client/src/index.css`
- **Database Schema:** `drizzle/schema.ts`
- **Design Reference Notes:** `claude_dashboard_reference_findings.md`
- **Project TODO:** `todo.md`

---

## Recommendations for Next Steps

1. **Test with real drawings** – Upload a few of your actual client plans and see how the extraction and review workflow feel in practice
2. **Identify product matching rules** – Document how dimensions map to your Bizman kits so auto-suggestion can be built
3. **Plan quote export format** – Decide what information should appear in the PDF quote (pricing, materials, terms, etc.)
4. **Gather estimator feedback** – Have your team use the app for a few quotes and report what they would change
5. **Consider job header design** – Sketch or describe how you'd like the quote summary strip to look and what data it should show

---

## Support & Troubleshooting

- **Dev server not running?** Use `webdev_restart_server` in the Management UI
- **TypeScript errors?** Run `pnpm check` to verify all types
- **Database issues?** Check connection string in Management UI → Settings → Secrets
- **PDF extraction failing?** Verify the PDF has a readable text layer (not a scanned image)

---

**Project prepared by:** Manus AI  
**Last checkpoint:** 7041ac34  
**ZIP file:** anglo-cost-calculator.zip (delivered)
