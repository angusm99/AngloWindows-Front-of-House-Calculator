# Files Still Needed From Manus

The latest ZIP has now been imported into this workspace. The extracted project lives at:

- `imports/manus-latest/anglo-cost-calculator`

The following Manus files are now present locally:

- `AI_STUDIO_HANDOFF.md`
- `ANGLO_SYSTEM_MASTER_FINAL.md`
- `FRONT_OF_HOUSE_CALCULATOR_BRIEF.md`
- `RECEPTION_USER_GUIDE.md`
- `FINISHED_GOODS_ANALYSIS.md`
- `server/pdf_intake.py`
- the full React/tRPC source tree from the Manus app

## Still Needed

1. Google sign-in setup values

- Google OAuth client ID
- Redirect URI configuration used by the Manus app
- Any allowed domain or workspace restrictions

2. Additional pricing source files if available

- Additional Bizman exports or template files for systems not covered well enough by the current finished-goods list
- Special-case pricing rules that differ from the imported template lookup
- Any validated rules for Baobab or Crystal View if those are priced outside the provided file

3. Final branding/export content if there is a production-approved pack

- Final PDF quote header/footer wording
- Any approved colour/font guidance beyond the current logo/wallpaper assets
- Any exported quote examples that must be matched exactly

## What Is Already Built Locally

- Reception quote header workflow
- Manual product entry flow
- Upload review table flow
- Real `pdf_intake.py`-based upload extraction route
- Live quote summary with markup and discount
- Save and reload quotes
- Quote preview, print-to-PDF, and email handoff
- Pricing lookup from the imported finished-goods template dataset
- Formula-based fallback pricing across the 8 system groups when no template row is available
