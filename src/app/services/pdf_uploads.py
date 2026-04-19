from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.pdf_intake import extract_schedules


class PdfIntakeUnavailableError(RuntimeError):
    """Raised when PDF extraction dependencies are unavailable."""


SYSTEM_DEFAULTS = {
    "casement": "30.5mm",
    "sliding_window": "Elite",
    "sliding_door_domestic": "Patio",
    "sliding_door_hd": "Palace",
    "sliding_folding": "Vistafold",
    "shopfront": "Shopfront",
    "frameless_folding": "Frameless Folding",
    "frameless_balustrade": "Crystal View",
}

CODE_GROUP_RULES = [
    ("FB", "frameless_balustrade"),
    ("FF", "frameless_folding"),
    ("HD", "sliding_door_hd"),
    ("SD", "sliding_door_domestic"),
    ("SW", "sliding_window"),
    ("SF", "shopfront"),
    ("W", "casement"),
    ("D", "shopfront"),
]


def extract_pdf_upload_rows(pdf_path: Path) -> dict[str, Any]:
    """Extract review-table rows from a schedule PDF."""
    try:
        result = extract_schedules(str(pdf_path))
    except RuntimeError as exc:
        raise PdfIntakeUnavailableError(str(exc)) from exc

    rows = [_build_upload_row(item) for item in result.get("schedule_items", []) if item.get("code")]

    return {
        "rows": rows,
        "warnings": result.get("warnings", []),
        "page_count": result.get("page_count", 0),
        "schedule_page_count": result.get("schedule_page_count", 0),
    }


def _build_upload_row(item: dict[str, Any]) -> dict[str, Any]:
    code = str(item.get("code") or "").upper()
    schedule_type = str(item.get("schedule_type") or "").lower()
    system_group = _map_code_to_group(code, schedule_type)
    width_mm = _to_int(item.get("width"))
    height_mm = _to_int(item.get("height"))
    run_length_m = None
    flags = list(item.get("flags") or [])

    if system_group == "frameless_balustrade":
        run_length_m = round((width_mm or 0) / 1000, 2) if width_mm else None
        width_mm = None
        height_mm = None
        if run_length_m is None:
            flags.append("Missing run length")

    if system_group == "shopfront" and code.startswith("D"):
        flags.append("Door system defaulted to Shopfront for review")

    status = "ready" if _row_has_required_dimensions(system_group, width_mm, height_mm, run_length_m) and not flags else "review"

    return {
        "code": code,
        "system_group": system_group,
        "system_name": SYSTEM_DEFAULTS[system_group],
        "width_mm": width_mm,
        "height_mm": height_mm,
        "run_length_m": run_length_m,
        "glass_code": _map_glazing_to_glass(item.get("glazing"), bool(item.get("safety_flag"))),
        "frame_colour": _map_finish_to_frame(item.get("finish")),
        "hardware_colour": "standard",
        "quantity": 1,
        "hinge_type": "top_hung",
        "panel_count": 2,
        "leaf_count": 3,
        "door_type": "single_hinged",
        "door_quantity": 1,
        "status": status,
        "flags": flags,
    }


def _map_code_to_group(code: str, schedule_type: str) -> str:
    for prefix, group in CODE_GROUP_RULES:
        if code.startswith(prefix):
            return group
    if schedule_type == "door":
        return "shopfront"
    return "casement"


def _map_glazing_to_glass(glazing: Any, safety_flag: bool) -> str:
    text = str(glazing or "").upper()
    if "FROST" in text or "OBSC" in text:
        return "obscured"
    if "DOUBLE" in text or "DGU" in text:
        return "dgu"
    if "TINT" in text:
        return "tinted"
    if "6MM" in text and not safety_flag:
        return "6mm clear"
    if safety_flag or "LAMIN" in text or "SAFETY" in text or "6.3MM" in text:
        return "laminated"
    return "4mm clear"


def _map_finish_to_frame(finish: Any) -> str:
    text = str(finish or "").upper()
    if "ANOD" in text:
        return "anodised"
    if "BRONZE" in text:
        return "bronze"
    if "BLACK" in text or "DARK GREY" in text:
        return "black"
    return "white"


def _row_has_required_dimensions(
    system_group: str,
    width_mm: int | None,
    height_mm: int | None,
    run_length_m: float | None,
) -> bool:
    if system_group == "frameless_balustrade":
        return run_length_m is not None and run_length_m > 0
    return (width_mm or 0) > 0 and (height_mm or 0) > 0


def _to_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
