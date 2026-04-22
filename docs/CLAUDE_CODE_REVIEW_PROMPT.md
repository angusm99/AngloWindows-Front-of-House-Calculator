# Claude Code Review Prompt

Use this prompt in Claude Code when you want an additional review pass on the current repo state.

```text
Please review this repository as a practical senior engineer helping stabilize an internal front-of-house quoting app.

Repository:
- AngloWindows-Front-of-House-Calculator
- branch: main

What this app is:
- A FastAPI + static frontend quoting tool for Anglo Windows reception/front-of-house staff
- It supports manual quote building plus document intake from PDFs and images
- It is moving toward WorkPool-first login

What changed recently:
1. Replaced a Google demo login placeholder with WorkPool-first auth scaffolding
2. Added backend auth endpoints and a WorkPool auth service
3. Reshaped the intake UX so extracted header info is surfaced much earlier
4. Added sticky header visibility while scrolling
5. Added confirmation before clearing the current draft
6. Extended document intake so common image files can go through the same intake route as PDFs
7. Fixed a bug where uploaded images were temporarily saved with a `.pdf` suffix and misclassified

Files most relevant to review:
- `src/app/services/workpool_auth.py`
- `src/app/api/routes.py`
- `src/app/dependencies.py`
- `src/app/schemas.py`
- `src/app/services/pdf_intake.py`
- `src/app/services/pdf_uploads.py`
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`

Please focus your review on:
1. Bugs or regressions
2. Security or session-handling risks in the WorkPool auth flow
3. Frontend logic mistakes or brittle UI state handling
4. Backend edge cases in mixed-file intake
5. Any obvious mismatch between the stated workflow and the actual implementation
6. Missing tests or validation gaps that are likely to matter

Please do not spend most of the review on style nits.
Prioritize findings by severity and be concrete.

Useful known context:
- The app runs locally via `start.ps1`
- Local testing happens at `http://127.0.0.1:8000`
- WorkPool session reuse from an already logged-in browser is not solved yet; explicit in-app sign-in is the current intended behavior
- Sample files used for intake testing live at:
  `G:\Profile\My Pictures\FRONT OF HOUSE CALCULATOR-SAMPE PICS`

Please return:
1. Findings first, ordered by severity
2. Open questions / assumptions
3. A short summary of overall risk
```
