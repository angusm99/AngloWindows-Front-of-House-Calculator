# Frontend

This folder now contains the local Front of House Calculator-1 frontend for the Anglo Windows reception calculator.

## Current files

- `index.html` - single-page reception workflow shell
- `styles.css` - local styling for the calculator UI
- `app.js` - client-side quote builder, upload review flow, and API integration

## Current scope

- Manus-inspired landing shell with staged intake workflow
- Google sign-in demo state for front-desk workflow
- Quote header intake
- PDF upload review table backed by the local `/api/pdf-intake` route
- Manual entry product builder
- Live quote summary and saved quotes list
- Preview, print-to-PDF, and email handoff
- Pricing backed by the imported finished-goods template dataset
- Imported Manus references surfaced in the UI's price-book tab

## Still to wire from production systems

- Production Google OAuth configuration
- Final branded PDF template/output wording
- Additional Bizman exports or validated special-case pricing rules
