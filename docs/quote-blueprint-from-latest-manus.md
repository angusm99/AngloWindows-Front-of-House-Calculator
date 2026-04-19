# Anglo Windows Quote Blueprint

This application is being structured as an authenticated internal quoting tool for Anglo Windows. The workflow starts with a job header, continues into guided unit capture, then calculates quote totals from configurable rate inputs, and finally allows staff to save, duplicate, print, and export branded quotes. The interface will use a mobile-first card workflow for unit capture and a denser desktop table layout for rapid editing.

| Area | Design Decision |
| --- | --- |
| Quote ownership | Quotes are stored in the database and linked to the signed-in staff member who created or last updated them. |
| Quote header | Job reference, client details, job metadata, notes, pricing summary, and status are stored on the main quote record. |
| Quote units | Each window or door line is stored separately with room name, product type, dimensions, quantity, configuration, and calculated totals. |
| Pricing engine | Pricing is driven by configurable stored rates so no hard-coded invented costing values are required. |
| Validation | Required fields are checked both in the interface and on the server before saving or exporting. |
| Export | Print and PDF output must be Anglo Windows branded and include the full itemised unit schedule and totals. |

The database will use a primary `quotes` table for header-level information, a `quoteUnits` table for individual products, and a `pricingRules` table for cost inputs. The pricing rules will allow the application to remain accurate without embedding assumed values in the codebase. This keeps the costing engine flexible enough to match future extraction work from the Rough Copy Digital process.

| Entity | Core Fields |
| --- | --- |
| `quotes` | `id`, `jobRef`, `clientName`, `quoteDate`, `phone`, `address`, `salesperson`, `installer`, `estimatedHours`, `notes`, `markupType`, `markupValue`, `discountType`, `discountValue`, `subtotal`, `adjustmentsTotal`, `grandTotal`, `createdByUserId`, `updatedByUserId`, timestamps |
| `quoteUnits` | `id`, `quoteId`, `sortOrder`, `roomName`, `productCategory`, `productType`, `configuration`, `widthMm`, `heightMm`, `quantity`, `glassType`, `burglarBarType`, `frameColour`, `hardwareColour`, `extrasJson`, `unitCost`, `lineTotal`, `validationJson`, timestamps |
| `pricingRules` | `id`, `productType`, `baseAmount`, `areaRatePerSqm`, `glassType`, `glassSurcharge`, `extraKey`, `extraAmount`, `isActive`, timestamps |

The quote calculation formula will be deterministic. For each line item, the application will derive area from width and height in millimetres, apply the product type base amount, add the area-based amount, add the chosen glass surcharge, add any selected extras, and multiply by quantity. The quote summary will total all line items first, then apply any markup or discount adjustments at quote level. Options such as burglar bars and colours will be captured for specification and output even where they are not part of the current pricing formula.

| Validation Rule | Requirement |
| --- | --- |
| Quote header | Job reference, client name, quote date, and at least one contact or address detail must be present before export. |
| Unit rows | Room name, product type, width, height, quantity, and glass type must be present before the row is treated as complete. |
| Dimensions | Width and height must be positive numeric millimetre values. |
| Export gate | Quotes cannot be exported while required header fields or unit fields are missing. |
| Save behaviour | Draft quotes may still be saved with validation warnings so work is not lost. |

The interface will follow a dashboard pattern because this is an internal operational tool. The primary navigation will focus on quote building, saved quotes, and price settings. Within the quote builder, the page will keep one main entry focus at a time by separating the header, unit entry, and summary into clear panels and modal-assisted flows. This preserves the fast capture rhythm of the Rough Copy Digital reference while making the system practical for reception and production staff.
