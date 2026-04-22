# Claude Code Full Brief

Use this brief to start a fresh Claude Code session with enough project context to review, test, and potentially implement follow-up fixes without re-discovering the whole history.

## 1. Project Overview

This repository contains the **Anglo Windows Front of House Calculator**, a browser-based quoting tool aimed first at **reception/front-of-house staff** and later potentially internal reps and other operational users.

The practical goal is to let staff:

- start a quote quickly
- upload customer-provided files
- extract whatever useful job information can be derived from those files
- manually correct and complete the intake
- calculate product pricing
- save quote drafts
- export a customer-ready quote

This is not meant to be a generic consumer app. It is a practical internal desktop workflow tool, currently used and tested locally.

## 2. Current Repo / Runtime Context

- Repository: `AngloWindows-Front-of-House-Calculator`
- Branch: `main`
- Current local commit at time of this brief: `42f1760`
- Local app URL: `http://127.0.0.1:8000`
- Startup script: `start.ps1`
- Backend: FastAPI
- Frontend: static HTML/CSS/JS in `frontend`

Important repo structure:

- `src/app/api/routes.py`
- `src/app/dependencies.py`
- `src/app/schemas.py`
- `src/app/services/`
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`
- `start.ps1`

## 3. Product Direction

The app has shifted away from a placeholder Google sign-in concept and is now moving toward **WorkPool-first login**.

Why:

- staff already know their WorkPool usernames/passwords
- WorkPool is already part of daily workflow
- it is a more realistic internal identity source for this tool than Google for the current use case

There is still an unresolved future question around whether an already-authenticated WorkPool browser session can be reused automatically, but for now the practical solution is:

- explicit WorkPool login inside the app
- app-level session state inside this calculator

That is the intended current behavior.

## 4. What Was In Place Before This Session

Before the latest auth/intake work, the app already had:

- a functioning FastAPI backend
- a manual quote builder
- quote save/load behavior
- PDF intake for extraction
- OCR fallback work for scanned/image-only PDFs
- basic document header extraction for:
  - customer hints
  - address hints
  - project/job name hints
- a more stable local startup path where `start.ps1` runs without `--reload` by default

There was also an older **Google sign-in demo placeholder** in the frontend which did not perform real auth.

## 5. Main Changes Implemented In This Session

### 5.1 WorkPool-first auth scaffolding

Implemented a new backend auth service:

- `src/app/services/workpool_auth.py`

This currently:

- posts credentials to WorkPool
- uses WorkPool login as the primary intended auth source
- creates app-side session state
- exposes a current-user style session response back to the frontend

New backend endpoints were added in:

- `src/app/api/routes.py`

Endpoints:

- `POST /api/auth/workpool/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

The frontend now uses WorkPool auth instead of the Google demo.

### 5.2 Frontend auth UI replacement

Updated:

- `frontend/index.html`
- `frontend/app.js`

Changes:

- removed the old Google placeholder UI
- added a WorkPool login form
- added login/logout state handling
- auto-populates salesperson if login succeeds and the field is blank

### 5.3 Intake workflow cleanup

The user felt the top-of-page workflow was confusing. The UI previously gave the impression that:

- upload had already done something
- but extraction was still a separate unclear step
- the job header information was too far down the page
- “live workspace” copy was not useful
- “start new draft” was too easy to trigger without enough warning

Changes made:

- clearer entry point into intake
- extracted job header shown much earlier
- sticky header snapshot in the right column
- better wording around choosing a file then extracting
- removed the “Live workspace” pill
- added a confirmation on `Start new draft`

### 5.4 Mixed-file intake support

Originally the intake endpoint only accepted PDFs.

The user wants to test a real mixed bag of inputs, including:

- PDFs
- rough copies
- scans
- photos
- written quote request images

Changes made:

- intake route now accepts common image formats too
- image OCR can run through the same intake path

Relevant files:

- `src/app/services/pdf_intake.py`
- `src/app/services/pdf_uploads.py`
- `src/app/api/routes.py`

### 5.5 Bug fixed during live testing

During testing, image files were still failing in practice because uploads were being saved to temporary files with a `.pdf` suffix regardless of the original extension.

That caused JPGs to be treated as broken PDFs.

This was fixed in:

- `src/app/api/routes.py`

The temp upload file now keeps the correct extension.

## 6. Files Most Worth Reviewing

Highest priority:

- `src/app/services/workpool_auth.py`
- `src/app/api/routes.py`
- `src/app/services/pdf_intake.py`
- `src/app/services/pdf_uploads.py`
- `frontend/app.js`
- `frontend/index.html`
- `frontend/styles.css`

Supporting:

- `src/app/dependencies.py`
- `src/app/schemas.py`
- `start.ps1`

## 7. WorkPool Context

The WorkPool documentation review strongly suggested:

- WorkPool has real login endpoints
- WorkPool exposes resource/user lookup endpoints
- WorkPool is a plausible auth/identity source for this app

Important documented endpoints discovered from the user-provided WorkPool docs included:

- `/wservices/resource/login.do`
- `/wservices/resource/logout.do`
- `/wservices/users/user-property-get.do`
- `/wservices/users/user-property-get-list.do`
- `/wservices/users/resource-with-id.do`
- `/wservices/users/resource-with-username.do`

Important WorkPool data classes found in docs:

- `JLogin`
- `JPostData`
- `JResponse`
- `JResourceMobile`

Important known `JResourceMobile` fields:

- `id`
- `username`
- `firstName`
- `surname`
- `recoveryEmail`
- `mobileNumber`
- `photo`

Current app-side assumptions:

- WorkPool login is performed explicitly from this app
- app creates its own session cookie after successful WorkPool login
- `WORKPOOL_BASE_URL` and `WORKPOOL_WP_ID` are expected environment variables

Known unresolved auth question:

- local `127.0.0.1` cannot automatically reuse an already-open WorkPool browser session in a clean/supported way right now
- future same-site hosting or reverse-proxy deployment may make session reuse more possible

## 8. Intake / Extraction Context

The intake system is intentionally not trying to be perfect. It is designed to:

- extract what it can
- prefill obvious values
- fall back to review/manual correction

The user has specifically wanted this to handle messy real-world material such as:

- architect schedules
- scanned schedules
- rough copies
- annotated pages
- customer-sent photos
- simple written requests

That means “good enough to prefill and speed up reception” is more important than “perfect parser.”

## 9. Real Sample Testing Already Performed

Sample files tested from:

`G:\Profile\My Pictures\FRONT OF HOUSE CALCULATOR-SAMPE PICS`

### 9.1 `Novio Court Unit 03 - Table View - Blight Rental Company RC - Amended 14.04.2026 Stephen.pdf`

Observed result:

- rows: `[]`
- warnings:
  - `No opening rows could be confidently extracted from the scanned drawing.`
- document info was useful:
  - `customer_name`: `Blight Rental Company`
  - `project_name`: `Novio Court Unit 03`
  - `address`: `Table View`
  - `source`: `ocr`

Interpretation:

- header autofill is useful
- row extraction is still weak on this rough/scanned type of input

### 9.2 `JM Quote Info -1776674201057.pdf`

Observed result:

- rows: `[]`
- weak header extraction:
  - `project_name`: `JM Quote Info`
- no customer/address/phone found

Interpretation:

- currently only a weak title/project hint

### 9.3 `Johan Theron - Job Bowen RC - PHASE 2 - Amended 20.04.2026 Aletta.pdf`

Observed result:

- one row extracted:
  - code: `D19`
  - system group: `shopfront`
  - dimensions: `1300 x 2930`
  - status: `review`
  - flags:
    - `OCR fallback`
    - `Door system defaulted to Shopfront for review`
- document info:
  - `project_name`: `Johan Theron`
  - `address`: `Bowen`
  - `source`: `ocr`

Interpretation:

- the OCR path can extract at least partial schedule rows from some PDFs
- still needs review and stronger parsing

### 9.4 `505 Ronday doc-1775807733166-1776342051650.jpg`

After fixing the temp-file suffix bug:

- image upload succeeded
- OCR ran
- result:
  - no rows extracted
  - warning:
    - `Image text was read, but no opening rows could be confidently extracted.`
  - document info:
    - `project_name`: `505 Ronday doc`
    - `source`: `ocr`

Interpretation:

- mixed-file image intake works now
- but OCR-to-header extraction for images is still shallow

### 9.5 `Tandi-1776774477005.jpg`

Observed result:

- image accepted
- OCR ran
- no rows extracted
- document info:
  - `project_name`: `Tandi`
  - `source`: `ocr`

Interpretation:

- image path is working
- useful fallback title is possible
- richer contact/header extraction is still missing

## 10. What Is Working Well Right Now

- local app startup is stable
- API health is fine
- Python code compiles
- frontend JS parses
- WorkPool auth scaffolding exists
- intake UX is clearer than before
- extracted header info is more visible
- mixed-file intake path exists
- image uploads are no longer rejected just because they are not PDFs

## 11. What Still Looks Weak / Risky

### 11.1 WorkPool auth robustness

The WorkPool auth implementation is practical scaffolding, but should be reviewed carefully for:

- cookie/session handling assumptions
- failure handling
- real response-shape assumptions
- production suitability
- security implications of in-memory session storage

### 11.2 OCR/header extraction depth

Image-based quote requests currently tend to produce:

- filename/project hints
- weak OCR summary

but not yet strong structured extraction of:

- customer name
- contact number
- site address
- better request semantics

### 11.3 Row extraction reliability

The current OCR extraction can find some codes and dimensions, but it is still inconsistent on rough copies and scanned material.

### 11.4 No automatic WorkPool browser-session reuse

This is not a bug in the code so much as an unresolved design/deployment limitation.

## 12. Suggested Next Tasks For Claude Code

Please prioritize in this order:

1. **Review the WorkPool auth flow**
   - check whether `workpool_auth.py` is making reasonable assumptions
   - identify session/security risks
   - identify missing validation or response handling

2. **Improve OCR-to-header extraction for mixed bag files**
   - especially image/photo quote requests
   - focus on customer name / phone / address / project name extraction

3. **Improve rough-copy row extraction**
   - especially OCR context selection around codes and dimensions
   - avoid regressing known good schedule behavior

4. **Review frontend state logic**
   - login state
   - quote header snapshot rendering
   - mode switching
   - draft reset behavior

5. **Keep solutions practical**
   - this is an internal tool for busy staff
   - clarity and resilience matter more than abstraction elegance

## 13. Useful Commands / Checks

The following checks were already used successfully:

```powershell
.\\.venv\\Scripts\\python.exe -m compileall src
```

```powershell
node --check frontend\\app.js
```

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health'
```

Example intake test pattern:

```powershell
$filePath='G:\Profile\My Pictures\FRONT OF HOUSE CALCULATOR-SAMPE PICS\Some Sample.pdf'
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/pdf-intake' -Method Post -Form @{ file = Get-Item $filePath } | ConvertTo-Json -Depth 6
```

## 14. Important Constraints

- Do not revert recent WorkPool auth direction unless there is a clear technical reason
- Do not remove mixed-file intake support
- Do not bring back the old Google demo login placeholder
- Preserve the clearer top-of-page intake workflow
- Prefer practical fixes over large architectural rewrites unless the rewrite is clearly justified

## 15. Desired Review Output From Claude Code

Ideally Claude Code should return:

1. Findings first, ordered by severity
2. Open questions / assumptions
3. Suggested fixes
4. If it chooses to implement changes, keep them incremental and testable

## 16. Short Pasteable Prompt

If you want a shorter pasteable Claude opener, use this:

```text
Please review and, where sensible, improve this internal quoting app for Anglo Windows.

Read first:
- docs/CLAUDE_CODE_FULL_BRIEF.md
- docs/CLAUDE_CODE_REVIEW_PROMPT.md

Then inspect:
- src/app/services/workpool_auth.py
- src/app/api/routes.py
- src/app/services/pdf_intake.py
- src/app/services/pdf_uploads.py
- frontend/app.js
- frontend/index.html
- frontend/styles.css

Focus on:
- WorkPool auth correctness and risks
- mixed-file intake quality
- OCR/header extraction from image-based quote requests
- frontend workflow and state bugs

Please prioritize practical issues over style nits, and report findings first.
```
