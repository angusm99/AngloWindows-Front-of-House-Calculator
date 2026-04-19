# Anglo Windows Master Cost Calculator

This repository now contains a working local MVP for the Anglo Windows reception calculator:

- `frontend/` contains a browser-based reception workflow UI
- `src/app/` contains the FastAPI backend for catalogue data, pricing, quotes, and stock
- `docs/` contains the reception guide, project brief, Drive notes, and the remaining Manus file requests

## Current repo layout

```text
frontend/   Local reception calculator frontend
docs/       User guides, project brief, and integration notes
src/app/    FastAPI backend and pricing engine
```

## What is already built

### Frontend MVP

- Reception-first quoting workspace served from FastAPI
- Quote header intake form
- Upload review table for PDF-driven workflows
- Manual entry flow with dynamic system selection
- Live quote summary with markup and discount controls
- Save, reload, preview, print-to-PDF, and email handoff actions

### Backend

- FastAPI app entrypoint and routes
- Catalogue endpoints for system groups and options
- Hybrid pricing engine across 8 system groups
- Finished-goods template lookup sourced from `template finished goods list.xlsx - Sheet1.csv`
- Quote save and reload endpoints
- Stock level and stock transaction endpoints
- Pydantic request and response schemas
- In-memory repositories with seed data

## What is still missing

- Real PDF extraction via Manus `pdf_intake.py`
- Production Google OAuth configuration
- Additional Bizman exports and any edge-case pricing rules not covered by the current finished-goods template file
- Persistent database-backed repositories
- True PDF branding export and mail delivery service
- Any Manus source files needed for an exact screen-for-screen clone

See [frontend/README.md](frontend/README.md), [docs/files-needed-from-manus.md](docs/files-needed-from-manus.md), and [docs/drive-assets.md](docs/drive-assets.md) for the remaining integration notes.

## Run locally

The simplest Windows startup path is:

```powershell
cd "C:\Users\User\Documents\New project"
.\start.ps1
```

Or double-click `start.bat`.

The app will be available at:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`
