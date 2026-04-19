# Jones-Fernkloof Plan Reference Findings

## What the sample plan contains

The uploaded PDF is not just a generic floor plan. It is a multi-sheet architectural set that includes a site and roof plan, ground storey plan, labelled openings across the drawings, and dedicated **door and window schedule sheets**.

The schedule sheets visually pair each opening tag with a standardised schedule card. The cards appear to include:

- an opening identifier such as `D1`, `D10`, `SD1`, `W1`, `W24`
- elevation-style sketches of each unit
- width and height dimensions
- opening direction or operation reference
- frame / threshold specification
- finish / colour specification
- glazing or glass note
- a note to verify dimensions on site before manufacture

## Extraction implications for the quoting tool

This confirms that future document intake must support two related extraction modes.

First, the system should detect **opening markers on plans** so it can compile counts and references from annotated floor plans. Second, it should extract **structured schedule data** from dedicated window and door schedule sheets, because these sheets appear to hold the more reliable fabrication attributes.

## Data fields worth capturing

The sample suggests the following fields are realistic targets for automated extraction:

| Field | Why it matters |
|---|---|
| Drawing sheet type | Helps separate plan pages from schedule pages |
| Opening code | Links plan tags to schedule definitions |
| Category | Door, sliding door, window, garage door, etc. |
| Width and height | Core pricing and fabrication inputs |
| Quantity or occurrences | Needed because one schedule type may repeat across plan references |
| Finish / colour | Direct cost impact |
| Frame / threshold type | Direct cost impact |
| Opening configuration | Needed to map onto Anglo product rules |
| Glazing note | Required for valid cost and compliance logic |
| Safety glazing flag | Important compliance cue for pricing and output notes |
| Room or location context | Useful for quote grouping and installer instructions |

## Product implications

The reference file shows that the intake flow should not assume users upload only quote requests or rough sketches. They may upload full municipal or architectural drawing packs. That means the platform should eventually classify pages before extraction, prioritise schedule pages, and then reconcile schedule entries against plan occurrences.

The sample also shows that the application will need a user review step rather than silent automation, because many schedule notes still say to verify on site.
