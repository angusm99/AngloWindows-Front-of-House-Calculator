# Codex Handoff Prompt

Use this prompt when continuing the Front of House Calculator work on another machine.

```text
We are continuing work on the Anglo Windows Front of House Calculator.

Repository:
- name: AngloWindows-Front-of-House-Calculator
- branch: main
- continue from the latest pushed HEAD on GitHub

Project purpose:
This is a browser-based quick quoting app for Anglo Windows reception/front-of-house use. It should help staff:
- upload schedules, rough copies, drawings, and mixed customer request files
- manually build and edit quotes
- calculate pricing for windows, doors, shopfronts, folding systems, and balustrades
- save quotes and export customer-ready PDFs

Technology:
- FastAPI backend in `src/app`
- static frontend in `frontend`
- local startup script: `start.ps1`
- app served locally on `http://127.0.0.1:8000`

Recent major changes already completed:
1. Replaced the old Google demo login placeholder with WorkPool-first auth wiring
   - backend endpoints:
     - `POST /api/auth/workpool/login`
     - `GET /api/auth/me`
     - `POST /api/auth/logout`
   - service file:
     - `src/app/services/workpool_auth.py`
   - frontend now has a WorkPool sign-in panel instead of Google demo UI
2. Improved intake UX
   - clearer document-intake entry point
   - extracted job header shown near the top of intake
   - sticky job-header snapshot in the right column while scrolling
   - `Start new draft` now warns before clearing data
   - removed the confusing duplicate upload messaging
3. Extended intake to accept mixed file types
   - PDFs still work
   - common image files now also go through the same intake route
   - this was wired through:
     - `src/app/services/pdf_intake.py`
     - `src/app/services/pdf_uploads.py`
     - `src/app/api/routes.py`
4. Existing OCR/header work from the prior session remains in place
   - scanned/image-only PDFs can produce document header hints
   - filename parsing is still part of header extraction

Important current behavior:
- Schedule-heavy PDFs can sometimes extract rows plus partial header info
- Rough copies often produce useful header hints but few or no rows
- Image/photo intake now works, but currently tends to produce only weak OCR header hints such as a project/title name
- Localhost does not automatically reuse an existing WorkPool browser session; users still sign in explicitly in the app for now

Current priorities:
1. Improve OCR-to-header extraction for image and rough-copy files
   - especially customer name
   - phone number
   - address/site
   - project/job name
2. Improve row extraction from rough copies and scanned schedules
3. Validate WorkPool login against real environment configuration
   - expected env vars:
     - `WORKPOOL_BASE_URL`
     - `WORKPOOL_WP_ID`
4. Keep the front-of-house workflow practical and obvious for non-technical staff

Important files to review first:
- `src/app/services/workpool_auth.py`
- `src/app/services/pdf_intake.py`
- `src/app/services/pdf_uploads.py`
- `src/app/api/routes.py`
- `src/app/schemas.py`
- `src/app/dependencies.py`
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`
- `start.ps1`

Representative sample behavior observed:
- `Novio Court Unit 03 - Table View - Blight Rental Company RC - Amended 14.04.2026 Stephen.pdf`
  - useful header extraction:
    - customer: `Blight Rental Company`
    - project: `Novio Court Unit 03`
    - address: `Table View`
  - but zero opening rows
- `Johan Theron - Job Bowen RC - PHASE 2 - Amended 20.04.2026 Aletta.pdf`
  - extracted one review row:
    - `D19`
    - `1300 x 2930`
    - mapped to `Shopfront`
  - header summary roughly `Johan Theron | Bowen`
- image-based samples such as `Tandi-....jpg`
  - accepted by the intake route
  - OCR runs
  - currently mostly produce a weak title/project match and no rows

What to do next:
1. Pull latest `main`
2. Run `start.ps1`
3. Test mixed files from:
   `G:\Profile\My Pictures\FRONT OF HOUSE CALCULATOR-SAMPE PICS`
4. Focus on improving real-world mixed-bag intake quality without destabilizing the quoting flow
5. Preserve the WorkPool-first auth direction unless a better deployment-compatible approach emerges
```
