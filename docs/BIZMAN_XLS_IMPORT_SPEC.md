# Bizman XLS Price List Import Spec

Last verified: 2026-05-13 SAST

Source files checked:

- `\\ANGLOSERVER\Share\Search\Scans\Bizman Server Connection-Angus\PRICE LIST MASTER 305 XLS.xls`
- `\\ANGLOSERVER\Share\Search\Scans\Bizman Server Connection-Angus\MASTER PRICE LIST-305MM CASEMENT-TOP AND SIDE HUNG.pdf`

File timestamps at verification:

- XLS: 2026-05-12 13:54:42 SAST
- PDF: 2026-05-12 13:56:10 SAST

## Import Decision

Use the Bizman `XLS` export as the pricing source of truth.

The matching PDF is useful as a human-readable verification copy, but it should not drive automated pricing. The XLS preserves the item rows, follow-on glass rows, prices, and size text in a much more reliable structure.

All imported master price list values are treated as `supply only`. Installation must be calculated separately by the app.

## Verification Result

The updated 305 mm casement top-hung and side-hung files were compared item-by-item.

Result:

- XLS item count: `53`
- PDF item count: `53`
- Codes only in XLS: `0`
- Codes only in PDF: `0`
- Price mismatches: `0`

Known remaining caveat:

- `5` item codes showed a `1 SASH` / `2 SASH` section-label mismatch between the XLS and PDF comparison.
- Affected codes: `SH189`, `SH612`, `SH615`, `SH618`, `SH69`
- The item code, size, and price still matched.
- Treat the sash section as secondary metadata, not as the primary pricing key.

## Row Structure

The Bizman XLS sheet tested was:

- Sheet: `DistinctGlassPerItemCode_sf`
- Header and document metadata rows appear before the first section.
- Product rows are followed by one or more continuation rows for glass details.
- Section rows contain values like `1 SASH` or `2 SASH` in column `B`.

## Column Mapping

Use zero-based indexes in code and Excel letters in docs:

| Excel column | Zero-based index | Field | Notes |
|---|---:|---|---|
| `A` | `0` | misc_label | Header/report metadata. Do not use for pricing. |
| `B` | `1` | section_label | Values like `1 SASH`, `2 SASH`. Secondary metadata only. |
| `C` | `2` | product_code | Main product row key, for example `PT0606`, `SH1215`, `P4T2418`. |
| `D` | `3` | drawing_type | Text like `drwg: TOP HUNG` or `drwg: SIDE HUNG`. Strip `drwg:`. |
| `E` | `4` | quantity | Usually `1`. Import as numeric. |
| `F` | `5` | unit | Usually `Set`. |
| `G` | `6` | unit_price_excl | Supply-only unit price. Parse currency carefully. |
| `H` | `7` | total_excl | Usually same as unit price when quantity is `1`. |
| `I` | `8` | detail_text | Contains supply type, system description, and overall size. |
| `J` | `9` | colour | Example: `CHARCOAL`. |
| `K` | `10` | windload | Example: `1000 Pa`. |
| `L` | `11` | glass_detail | Continuation rows hold glass values here. Ignore placeholder values like `Text42`. |

## Product Row Detection

A row is a product row when:

- column `C` has a non-empty product code
- column `D` starts with `drwg:`

Example product row:

```text
C: PT0606
D: drwg: TOP HUNG
E: 1
F: Set
G: R 1 142.65
H: R 1 142.65
I: Supply only: 70mm OuterFrame-30.5mm case[Cas30.5] Overall size: 590 x 590
J: CHARCOAL
K: 1000 Pa
```

## Continuation Row Detection

After a product row, read following rows until the next product row or next section row.

Use continuation rows to gather glass details from column `L`.

Ignore continuation values that are blank or placeholder labels such as:

- `Text42`

Example glass continuation:

```text
L: 4mm Float - 01-CLEAR
L: 5mm Float - 01-TSG CLEAR
```

## Normalized Import Fields

The importer should normalize each product into this shape:

```json
{
  "source": "bizman_xls",
  "pricing_basis": "supply_only",
  "product_code": "PT0606",
  "section_label": "1 SASH",
  "drawing_type": "TOP HUNG",
  "system_group": "casement",
  "system_name": "30.5mm",
  "quantity": 1,
  "unit": "Set",
  "unit_price_excl": 1142.65,
  "total_excl": 1142.65,
  "width_mm": 590,
  "height_mm": 590,
  "colour": "CHARCOAL",
  "windload": "1000 Pa",
  "glass_details": ["4mm Float - 01-CLEAR"],
  "detail_text": "Supply only: 70mm OuterFrame-30.5mm case[Cas30.5] Overall size: 590 x 590"
}
```

## Parsing Rules

### Price Parsing

Bizman prices may contain spaces or non-breaking spaces.

Normalize before converting:

- remove `R`
- replace non-breaking spaces with normal spaces
- remove spaces used as thousands separators
- parse as decimal currency

Examples:

- `R 1 142.65` -> `1142.65`
- `R 1\xa0142.65` -> `1142.65`

### Size Parsing

Extract dimensions from `detail_text` using:

```text
Overall size: <width> x <height>
```

Example:

```text
Overall size: 590 x 1190
```

Normalizes to:

- `width_mm = 590`
- `height_mm = 1190`

### Drawing Type Mapping

Initial mapping for this 305 mm master:

| Bizman drawing type | App opening type | App group | App system |
|---|---|---|---|
| `TOP HUNG` | Top Hung Window | `casement` | `30.5mm` |
| `SIDE HUNG` | Side Hung Window | `casement` | `30.5mm` |

The product code can help with future classification:

| Prefix | Likely meaning |
|---|---|
| `PT` | Top hung, one sash |
| `PTT` | Top hung, two sash |
| `P4T` | Top hung, wider multi-panel/four-light family |
| `SH` | Side hung |
| `SHH` | Side hung, wider/two-sash family |

Do not rely only on the prefix if `drawing_type` is present. Prefer `drawing_type` for opening type and keep the prefix as a supporting signal.

### Supply Type

This import stream is supply-only by business rule.

Still parse the detail text for audit:

- expected phrase: `Supply only:`
- if `Supply and Fit:` appears in an XLS master, flag the row for review

Installation cost must be calculated separately by the app.

## Validation Rules

Fail or flag the import if any of these occur:

- product row has no product code
- product row has no drawing type
- unit price cannot be parsed
- width or height cannot be extracted from `detail_text`
- quantity is missing or less than `1`
- duplicate `product_code` appears with conflicting width, height, or price
- `total_excl` does not equal `unit_price_excl * quantity` within a small rounding tolerance

Warn, but do not block, for:

- missing section label
- `1 SASH` / `2 SASH` section mismatch against a PDF reference
- missing windload
- missing colour
- multiple glass lines
- unrecognized drawing type

## Recommended Primary Key

Use a composite key for pricing lookup:

```text
system_group + system_name + product_code + width_mm + height_mm + colour + glass_signature
```

Where `glass_signature` is a normalized join of all glass detail lines.

Do not use `section_label` as a primary key.

## PDF Cross-Check

If a PDF is supplied alongside the XLS, use it only for verification:

- compare item count
- compare code set
- compare unit price and total
- optionally compare width and height

The import should still use XLS values when the XLS passes validation.

## Current Conclusion

The updated 305 mm casement top-hung and side-hung XLS is suitable for automated import into the calculator as a supply-only master price list.

The remaining section-label differences are manageable as warnings because they do not affect item code, size, or price.
