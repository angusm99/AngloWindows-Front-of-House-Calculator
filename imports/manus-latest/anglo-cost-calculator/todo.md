# Project TODO

- [x] Create the Anglo Windows internal quoting workflow with a guided job header form for job reference, client name, date, phone, address, salesperson, installer, estimated hours, and notes.
- [x] Build guided window and door unit entry with room name, product type, dimensions, quantity, and configuration inputs.
- [x] Add a visual product type selector covering fixed, top-hung, side-hung, sliding, and door variants.
- [x] Add per-unit configuration options for glass type, burglar bar type, frame colour, hardware colour, and extras.
- [x] Implement automatic cost calculation driven by product type, dimensions, glass, extras, and quantity.
- [x] Build a summary and quote panel with itemised line costs, subtotal, total, and markup or discount controls.
- [x] Implement Anglo Windows branded PDF and print quote export with full job details and itemised units.
- [x] Add database-backed save, load, edit, and duplicate quote workflows.
- [x] Add validation and missing-field highlighting before quote generation.
- [x] Build a responsive mobile-first interface with cyberpunk-themed card layout on mobile and table view on desktop.
- [x] Apply a Rough Copy Digital-inspired visual system with dark gold accents, neon pink, electric cyan, HUD-style framing, and strong brand styling for Anglo Windows.
- [x] Add unit and server-side automated tests covering calculation, validation, and quote persistence.
- [x] Verify application health and prepare final delivery for review.

- [x] Add a configurable price book and pricing rules so quote calculations use stored Anglo Windows rate inputs instead of invented hard-coded values.
- [x] Implement true Anglo Windows PDF export in addition to print styling, with branded header, job details, itemised units, and totals.
- [x] Add automated coverage for updating an existing quote via quoteId so edit persistence is verified alongside create, load, and duplicate workflows.
- [x] Validate and refine the responsive quote unit rendering so mobile cards and desktop table layouts are both confirmed in the final UI.
- [x] Rework the application theme to Anglo Windows brand colours with predominantly black and yellow surfaces, restrained white usage, and a more polished futuristic style.
- [x] Integrate the provided Anglo Windows logo and wallpaper into the live interface using the approved static asset workflow.
- [x] Refine typography and visual hierarchy to better match the Anglo Windows brand character and improve the overall premium feel.
- [x] Polish responsive layout details, spacing, surfaces, and navigation so the quoting tool feels more cohesive and production-ready.
- [x] Redesign the first interface page so it feels calmer and less overwhelming, with a clearer primary entry point.
- [x] Add a document upload entry path that can extract quote information and prefill the job header and unit data where possible.
- [x] Preserve and refine the manual quote entry path so staff can either upload a document or enter details directly.
- [x] Prepare the app structure for possible self-hosting on the company server and assess whether the existing local Ollama setup can support document extraction workflows.
- [x] Fix the invalid nested button structure causing the React DOM nesting error on the main quoting page.
- [x] Review the uploaded architectural plan PDF sample and translate its drawing structure into document-extraction requirements for the quote intake workflow.
- [x] Wire extractSchedules endpoint into Home.tsx upload flow to transform extracted schedule rows into draft quote units.
- [x] Make the extracted schedule review table fully inline-editable: product type selector, width/height inputs, quantity inputs, and persist edits when confirming.
- [x] Add product-match review table where users confirm product types and dimensions per extracted item before costing (basic read-only table).
- [x] Add validation to block confirmation when extracted rows have missing/zero dimensions or invalid quantities, with inline error messages.
- [x] Render per-row inline validation messages for missing/zero width, height, and quantity in the extracted schedule review table.
- [x] Add automated frontend tests covering the schedule review table edit-and-confirm workflow including edge cases.
- [x] Review the uploaded Claude HTML dashboard concept and identify any useful UX, layout, or workflow ideas to adopt in the Anglo Windows calculator.


## Phase 2: Simplified Template-Based Quote Generation

- [ ] Design simplified product selector UI with 7 main system types (Casements, Sliders, Patio, Palace, Shopfront, VistaFold, Specialized).
- [ ] Build product selector component that guides users through system type to configuration selection workflow.
- [ ] Create template matcher backend logic that queries Bizman quote templates based on extracted/entered specs.
- [ ] Integrate Bizman quote template database lookup into the backend (requires Bizman template data).
- [ ] Build quote assembly engine that combines template pricing with user-selected configurations.
- [ ] Implement mini-quote export workflow (PDF or email to client).
- [ ] Add quote history/tracking so reception staff can see previously generated quotes.
- [ ] Build end-to-end test: upload PDF, extract, select product, match template, generate quote, export.

## Phase 3: Polish and Deployment

- [ ] Add job summary header strip (quote number, customer, live total) inspired by Claude design reference.
- [ ] Implement persistent running total panel for better visibility during quote building.
- [ ] Add quote PDF export with Anglo Windows branding.
- [ ] User acceptance testing with reception staff.
- [ ] Deploy to production.


## Phase 2: Implement Master System Architecture (8 Engines)

- [ ] Update database schema: add leaf_count and run_length fields to quote_units table
- [ ] Implement ENGINE_MITRE: 45 degree mitre joints with fixed deductions for Casement systems
- [ ] Implement ENGINE_SLIDER_LIGHT: Overlap logic for Elite and Knysna sliders
- [ ] Implement ENGINE_SLIDER_DOM: Standard overlap for Patio domestic sliders
- [ ] Implement ENGINE_SLIDER_HEAVY: Heavy overlap for Palace and Valencia with Clip 44 stiles
- [ ] Implement ENGINE_LEAF_COUNT: Vistafold sash multiplication logic
- [ ] Implement ENGINE_SHOPFRONT: Clip 44 shopfront with hinged door variants
- [ ] Implement ENGINE_LEAF: Frameless folding with leaf logic
- [ ] Implement ENGINE_LINEAR: Crystal View balustrade with run length calculation
- [ ] Build dynamic product selector UI that adapts fields based on engine type
- [ ] Wire PDF extraction to auto-detect system group and pre-populate fields
- [ ] Test all 8 engines with reference dimensions
- [ ] Build end-to-end test: upload PDF, extract, select system, generate quote
