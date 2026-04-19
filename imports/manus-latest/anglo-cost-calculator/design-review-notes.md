# Anglo Windows Design Review Notes

## Current first-screen findings

The refreshed intake view is now calmer than the earlier version and correctly prioritizes **document upload** and **manual entry** as the two main starting actions.

The most visible remaining polish issues are:

1. The left sidebar still consumes too much width and visual attention relative to the first-screen intake content.
2. The main hero typography is strong, but the line breaks on smaller widths make the headline feel slightly cramped.
3. The metric cards overlap the visual reading flow and should be reduced in prominence or repositioned.
4. The right-hand support column still feels heavy for the first screen and could be condensed.
5. The page still shows a stale development warning about a duplicate `Avatar` declaration in `DashboardLayout.tsx`, even though TypeScript reports zero errors; the import block should be checked and cleaned up.

## UX direction to continue

The first screen should feel more like a clean intake console:

- a compact branded intro,
- a primary upload action,
- a secondary manual-entry action,
- minimal supporting text,
- and the full builder only after explicit user intent.

## Hosting note to address in delivery

The user wants to possibly host this on their own server and mentioned an Ollama/Jemma setup. The delivery should explain that the application can stay on Manus hosting with built-in domain support, or be adapted for external/self-hosting if they choose, with a warning that external hosting may need extra compatibility work. Ollama may be useful later for local extraction or AI assistance, but it is not required for the current hosted version.

## Review update

The first-screen intake experience is now calmer than the earlier cyberpunk version. The large summary cards no longer dominate the hero, and the upload-versus-manual choice is clearer. The Anglo Windows black-and-yellow palette is reading correctly, and the slimmer sidebar is an improvement.

Remaining polish observations:

- The left sidebar still feels slightly dominant relative to the intake hero on medium desktop widths.
- The hero typography is much cleaner, but the serif logo plus futuristic display font balance can still be refined to feel more distinctly Anglo Windows rather than generic sci-fi.
- The primary intake cards are working, although their lower copy block could use tighter spacing and slightly stronger hierarchy.
- The first screen is now appropriate for reception use, with the workspace staying hidden until a path is chosen.

