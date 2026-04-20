# Codex Handoff Prompt

Use this prompt when continuing the Front of House Calculator work on another machine.

```text
We are continuing work on the Anglo Windows Front of House Calculator.

Repository:
- name: AngloWindows-Front-of-House-Calculator
- branch: main
- latest known commit from the previous work session: e417777
- latest change summary: Improve rough-copy intake and stabilize local startup

Project purpose:
This is a browser-based quick quoting app for Anglo Windows reception/front-of-house use, and later for reps and other staff. It should allow users to:
- upload rough copies
- upload window schedules
- upload drawings/plans
- manually build quotes
- calculate pricing for windows, doors, balustrades, and other stocked/manufactured products
- export quotes as PDF

Technology and layout:
- FastAPI backend in src/app
- static frontend in frontend
- local startup script: start.ps1
- app served locally on http://127.0.0.1:8000

Important repo context:
- start.ps1 was changed to run uvicorn without --reload by default for stability
- use -Reload only if explicitly needed
- OCR-related dependencies were added:
  - pymupdf
  - rapidocr-onnxruntime
- pyproject.toml and start.ps1 were updated accordingly

What was completed in the last work session:
1. Added OCR fallback for scanned/image-only PDFs in src/app/services/pdf_intake.py
2. Added document_info to PDF intake responses in src/app/schemas.py
3. Passed the original uploaded filename through the API so header parsing can use the real filename
4. Updated src/app/services/pdf_uploads.py to return document header info
5. Updated frontend/app.js so upload intake can prefill:
   - customer name
   - phone number if found
   - address
   - notes summary
6. If no rows are extracted, the UI now falls back toward manual builder instead of appearing to do nothing
7. Added friendlier manual calculation error messages
8. Hardened src/app/services/template_pricing.py so malformed CSV rows do not crash the calculator
9. Stabilized local startup by removing auto-reload from the default startup path

Known current issues / priorities:
1. OCR/header extraction is only partially working
   - it can pull some project/customer/address hints from rough-copy PDFs
   - it is not yet reliably detecting opening rows from rough copies
2. Manual builder UX still needs work
   - clearer workflow
   - better visibility around what to enter
3. Upload UX is still confusing
   - selecting a file only sets “Latest file”
   - user must still click the extract button
   - likely needs a clearer “Read Document” style CTA and better status feedback
4. Extraction should be tuned using real sample files from:
   G:\Profile\My Pictures\FRONT OF HOUSE CALCULATOR-SAMPE PICS
5. The app should eventually handle:
   - rough copies
   - hand-drawn marked-up pages
   - text documents
   - schedules
   - architectural drawings/plans
6. Longer term:
   - persistent quote/history storage
   - historical quote reference system for non-standard sizes
   - better PDF export
   - production auth

Important files to review first:
- src/app/services/pdf_intake.py
- src/app/services/pdf_uploads.py
- src/app/services/template_pricing.py
- src/app/api/routes.py
- src/app/schemas.py
- frontend/app.js
- start.ps1
- pyproject.toml

Observed sample behavior:
- “Novio Court Unit 03 - Table View - Blight Rental Company RC - Amended 14.04.2026 Stephen.pdf”
  can now produce document_info roughly like:
  - customer_name: Blight Rental Company
  - address: Table View
  - project_name: Novio Court Unit 03
  but may still return zero opening rows

What to do next:
1. Inspect the current repo state
2. Run the app locally
3. Test the upload flow against the sample documents
4. Improve rough-copy extraction and opening detection
5. Improve manual builder usability
6. Improve upload/extract UI clarity
7. Keep changes practical and stable for local desktop use

Please continue from the latest pushed state without reverting the recent rough-copy OCR, header autofill, startup stability, or template-loader changes.
```

