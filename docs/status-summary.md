# Build Status Summary

## Already built

### Frontend

- Local reception calculator UI in `frontend/`
- Quote header intake flow
- Upload review table for drawing-based workflows
- Manual product builder with dynamic system selection
- Live quote summary with markup and discount controls
- Saved quotes list, quote reload, preview, print-to-PDF, and email handoff

### Backend

- FastAPI application serving both API routes and the frontend
- Catalogue endpoints for system groups and configuration options
- Pricing engine covering the 8 supported system groups
- Finished-goods template pricing imported from the provided CSV and used as the first lookup path
- Quote save and reload flow backed by in-memory repositories
- Stock level and stock transaction endpoints

## Partially built

- PDF upload review workflow exists, but true schedule extraction still needs `pdf_intake.py`
- Google sign-in is represented in the UI, but production OAuth details are not configured
- Pricing engine now uses the imported finished-goods template file, but still needs additional source data for gaps such as Baobab or any missing edge-case systems

## Missing

- Persistent backend storage
- Additional Bizman pricing imports where the current finished-goods list has no usable template coverage
- Production Google OAuth credentials
- Real PDF extraction parser from Manus
- Branded PDF template and outbound email service
