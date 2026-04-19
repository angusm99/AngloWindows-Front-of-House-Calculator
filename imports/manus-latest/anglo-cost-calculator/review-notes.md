# Preview Review Notes

## Current UI observations

- The core builder renders successfully in the preview with the Anglo Windows dashboard shell and cyberpunk styling applied.
- On the current viewport, the left navigation and header content consume substantial vertical space, which makes the builder feel cramped on smaller screens.
- The quote builder, summary panel, and print actions are present and interactive.
- The initial draft shows missing pricing warnings for the default fixed window and standard glass because the price book has not been populated yet.
- The frame-colour selector now needs a quick runtime re-check after the import fix, but the TypeScript build is clean.

## Immediate refinements to make

- Tighten the top dashboard shell on mobile so the main quoting form appears earlier in the viewport.
- Add automated tests for quote calculation, save/load, and validation workflows.
- Re-check the preview after the next UI pass and then finish delivery preparation.
