# Frontend

This folder now contains the local Anglo Windows reception calculator frontend.

## Current files

- `index.html` - single-page reception workflow shell
- `styles.css` - local styling for the calculator UI
- `app.js` - client-side quote builder, upload review flow, and API integration

## Current scope

- Google sign-in demo state for front-desk workflow
- Quote header intake
- PDF upload review table
- Manual entry product builder
- Live quote summary and saved quotes list
- Preview, print-to-PDF, and email handoff
- Pricing backed by the imported finished-goods template dataset

## Still to wire from Manus or production systems

- Real PDF extraction logic from `pdf_intake.py`
- Production Google OAuth configuration
- Production branding assets and exact PDF template
- Exact Manus source files if a pixel-level match is required
