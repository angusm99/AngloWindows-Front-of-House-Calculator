# Anglo Windows Master Cost Calculator

This repository contains the local bridge build of the Anglo Windows reception calculator, updated from the latest Manus ZIP and shaped around a FastAPI-served browser UI.

## Repo layout

```text
frontend/         Local browser UI with Manus-inspired landing shell
src/app/          FastAPI backend, pricing logic, quote routes, and PDF intake bridge
docs/             Imported Manus handoff docs plus local implementation notes
imports/          Extracted latest Manus source snapshot for reference and porting
```

## Current app status

### Frontend

- Manus-style staged landing page with upload/manual entry paths
- Quote builder, saved quotes tab, and price-book/reference tab
- Quote header intake form
- PDF upload review table with extraction-backed intake route
- Manual product builder with dynamic system selection
- Live quote summary with markup and discount controls
- Save, reload, preview, print-to-PDF, and email handoff actions

### Backend

- FastAPI app entrypoint and static frontend serving
- Catalogue endpoints for system groups and configuration options
- Hybrid pricing engine across the 8 supported system groups
- Finished-goods template lookup sourced from the supplied CSV
- `/api/pdf-intake` route backed by Manus `pdf_intake.py`
- Quote save and reload endpoints
- Stock level and stock transaction endpoints
- Pydantic request and response schemas
- In-memory repositories with seed data

## Imported Manus material

The freshest Manus project snapshot is extracted at:

- `imports/manus-latest/anglo-cost-calculator`

Latest synced docs now available in `docs/`:

- `AI_STUDIO_HANDOFF.md`
- `ANGLO_SYSTEM_MASTER_FINAL.md`
- `FRONT_OF_HOUSE_CALCULATOR_BRIEF.md`
- `RECEPTION_USER_GUIDE.md`
- `FINISHED_GOODS_ANALYSIS.md`

## Still missing for full production parity

- Production Google OAuth configuration
- Additional Bizman exports or edge-case pricing rules if required
- Persistent database-backed repositories
- Final branded PDF/export copy and outbound email service
- A configured GitHub remote for push/publish

## Run locally

```powershell
cd "C:\Users\User\Documents\New project"
.\start.ps1
```

Or double-click `start.bat`.

The app will be available at:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`
