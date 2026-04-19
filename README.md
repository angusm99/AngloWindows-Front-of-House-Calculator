# Front of House Calculator-1

This repository contains Front of House Calculator-1, the Anglo Windows reception quote calculator rebuilt locally from the latest Manus project files and organized as a FastAPI-served browser app.

## What is in this repo

```text
frontend/         Browser UI with Manus-aligned landing page and quote workspace
src/app/          FastAPI backend, pricing logic, quote routes, and PDF intake bridge
docs/             Synced Manus handoff docs plus local implementation notes
imports/          Extracted Manus source snapshots kept for reference and porting
```

## Current app status

### Frontend

- Manus-style landing page with `Upload Drawing` and `Manual Entry` entry points
- Quote builder workspace, saved quotes view, and pricing/reference tab
- Quote header capture, dynamic product forms, and inline edit flows
- Live subtotal, markup, discount, and total calculations
- Preview, print/export, save, and email handoff actions

### Backend

- FastAPI app entrypoint with static asset serving
- Catalogue endpoints for system groups and configurable product options
- Hybrid pricing engine across the 8 supported Anglo system groups
- Finished-goods template lookup sourced from the supplied CSV
- `/api/pdf-intake` route backed by Manus `pdf_intake.py`
- Quote save and load endpoints for reception workflow drafts

## Imported Manus material

The latest Manus project snapshot is stored at:

- `imports/manus-latest/anglo-cost-calculator`

Key synced documents are available in `docs/`:

- `AI_STUDIO_HANDOFF.md`
- `ANGLO_SYSTEM_MASTER_FINAL.md`
- `FRONT_OF_HOUSE_CALCULATOR_BRIEF.md`
- `RECEPTION_USER_GUIDE.md`
- `FINISHED_GOODS_ANALYSIS.md`

## What is still needed for full production parity

- Production Google OAuth configuration
- Additional Bizman exports or edge-case pricing rules if required
- Persistent database-backed storage instead of local/in-memory saves
- Final branded PDF copy and real outbound email delivery

## Run locally

From PowerShell:

```powershell
cd "C:\Users\User\Documents\New project"
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Then open:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

## GitHub notes

- The main working branch is `main`
- This repo is connected to the GitHub repository `angusm99/AngloWindows-intranet`
- The easiest daily workflow is: edit locally, test locally, then commit and push `main`
- Start with `docs/GITHUB_QUICKSTART.md` if you want the simplest Git/GitHub flow
- See `CONTRIBUTING.md` for the recommended local-to-GitHub workflow
