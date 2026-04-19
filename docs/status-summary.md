# Build Status Summary

## Already built

### Frontend

- Local reception calculator UI in `frontend/`
- Manus-style staged landing page with upload/manual start paths
- Quote header intake flow
- Upload review table for drawing-based workflows
- Manual product builder with dynamic system selection
- Live quote summary with markup and discount controls
- Saved quotes tab, quote reload, preview, print-to-PDF, and email handoff
- Price-book/reference tab fed by the imported Manus docs and local catalog data

### Backend

- FastAPI application serving both API routes and the frontend
- Catalogue endpoints for system groups and configuration options
- Pricing engine covering the 8 supported system groups
- Finished-goods template pricing imported from the provided CSV and used as the first lookup path
- PDF upload intake route backed by the Manus `pdf_intake.py` parser
- Quote save and reload flow backed by in-memory repositories

## Partially built

- PDF upload review workflow now uses the Manus parser, but still depends on the quality of schedule pages and local Python dependencies
- Google sign-in is represented in the UI, but production OAuth details are not configured
- Pricing engine now uses the imported finished-goods template file, but still needs additional source data for gaps such as Baobab or any missing edge-case systems

## Missing

- Persistent backend storage
- Additional Bizman pricing imports where the current finished-goods list has no usable template coverage
- Production Google OAuth credentials
- Branded PDF template and outbound email service
