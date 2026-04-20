from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from decimal import Decimal
from functools import lru_cache
from pathlib import Path

from app.domain import CalculationResult
from app.engines.base import EngineContext, build_result, line_item
from app.schemas import CalculationRequest

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "finished_goods_templates.csv"
PANEL_PATTERN = re.compile(r"(?<!\d)(\d+)\s*(?:panel|p)\b", re.IGNORECASE)


@dataclass(slots=True)
class FinishedGoodsTemplate:
    product_code: str
    reference: str
    description: str
    item_range: str
    width_mm: int
    height_mm: int
    item_sales_price_excl: Decimal
    item_colour: str
    labour_site_fit: Decimal
    labour_factory: Decimal
    is_template: bool

    @property
    def searchable_text(self) -> str:
        return " ".join(
            [
                self.product_code,
                self.reference,
                self.description,
                self.item_range,
                self.item_colour,
            ]
        ).lower()


@dataclass(slots=True)
class TemplateMatch:
    template: FinishedGoodsTemplate
    score: int
    exact_dimensions: bool
    exact_colour: bool


class TemplatePricingLookup:
    def calculate(self, request: CalculationRequest, context: EngineContext) -> CalculationResult | None:
        match = self._find_best_match(request, context)
        if match is None:
            return None

        description = f"{context.system_name} template price"
        result = build_result(
            request,
            context,
            [
                line_item(
                    match.template.product_code,
                    description,
                    Decimal(request.quantity),
                    match.template.item_sales_price_excl,
                )
            ],
        )
        result.status = "template_lookup"
        result.message = self._build_message(match)
        return result

    def _find_best_match(self, request: CalculationRequest, context: EngineContext) -> TemplateMatch | None:
        records = [
            record
            for record in load_finished_goods_templates()
            if _matches_system(record, context.system_group, context.system_name)
        ]

        if not records:
            return None

        request_colour = normalize_colour_bucket(request.frame_colour)
        request_width = int(request.width_mm) if request.width_mm is not None else 0
        request_height = int(request.height_mm) if request.height_mm is not None else 0
        request_panels = request.leaf_count or request.panel_count

        candidates: list[TemplateMatch] = []
        for record in records:
            if request.run_length_m is not None:
                continue

            template_colour = normalize_colour_bucket(record.item_colour)
            colour_penalty = 0 if template_colour == request_colour else _colour_penalty(request_colour, template_colour)
            glass_penalty = _glass_penalty(request.glass_code, record.searchable_text)
            width_delta = abs(record.width_mm - request_width)
            height_delta = abs(record.height_mm - request_height)
            panel_penalty = _panel_penalty(request_panels, extract_panel_count(record.searchable_text))
            hinge_penalty = _hinge_penalty(request.hinge_type, record.searchable_text)
            door_penalty = _door_type_penalty(request.door_type, record.searchable_text)
            template_penalty = 0 if record.is_template else 30
            score = (
                colour_penalty
                + glass_penalty
                + panel_penalty
                + hinge_penalty
                + door_penalty
                + width_delta
                + height_delta
                + template_penalty
            )
            candidates.append(
                TemplateMatch(
                    template=record,
                    score=score,
                    exact_dimensions=width_delta == 0 and height_delta == 0,
                    exact_colour=template_colour == request_colour,
                )
            )

        if not candidates:
            return None

        candidates.sort(key=lambda item: item.score)
        best = candidates[0]
        if best.score > 4500:
            return None
        return best

    def _build_message(self, match: TemplateMatch) -> str:
        template = match.template
        if match.exact_dimensions and match.exact_colour:
            return (
                f"Matched finished-goods template {template.product_code} "
                f"({template.width_mm} x {template.height_mm}, {template.item_colour})."
            )
        return (
            f"Used nearest finished-goods template {template.product_code} "
            f"({template.width_mm} x {template.height_mm}, {template.item_colour})."
        )


@lru_cache
def load_finished_goods_templates() -> tuple[FinishedGoodsTemplate, ...]:
    records: list[FinishedGoodsTemplate] = []
    with DATA_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            try:
                width = _to_int(row["Width"])
                height = _to_int(row["Height"])
                if width <= 0 or height <= 0:
                    continue

                records.append(
                    FinishedGoodsTemplate(
                        product_code=row["Product_Code"].strip(),
                        reference=row["Ref"].strip(),
                        description=row["Description"].strip(),
                        item_range=row["ItemRange"].strip(),
                        width_mm=width,
                        height_mm=height,
                        item_sales_price_excl=_parse_money(row["ItemSalesPrice_excl"]),
                        item_colour=row["ItemColour"].strip(),
                        labour_site_fit=_parse_money(row["LabourSiteFit"]),
                        labour_factory=_parse_money(row["LabourFactory"]),
                        is_template=row["IsTemplate"].strip().upper() == "TRUE",
                    )
                )
            except (KeyError, AttributeError, ValueError, TypeError):
                continue
    return tuple(records)


def normalize_colour_bucket(value: str) -> str:
    text = value.strip().lower()
    if "white" in text:
        return "white"
    if "charcoal" in text:
        return "charcoal"
    if "black" in text:
        return "black"
    if "bronze" in text:
        return "bronze"
    if "silver" in text or "nat25" in text or "mill" in text or "anod" in text:
        return "anodised"
    if "special" in text:
        return "custom"
    if not text:
        return "unspecified"
    return "custom"


def extract_panel_count(text: str) -> int | None:
    match = PANEL_PATTERN.search(text)
    if match is None:
        return None
    return int(match.group(1))


def _matches_system(record: FinishedGoodsTemplate, system_group: str, system_name: str) -> bool:
    text = record.searchable_text
    system_name_lower = system_name.lower()

    if system_group == "casement":
        if system_name_lower == "30.5mm":
            return "cas30.5" in text or "30.5" in text
        if system_name_lower == "38mm":
            return ("38 casement" in text or "38mm casement" in text) and "cas30.5" not in text and "30.5" not in text
        if system_name_lower == "baobab":
            return "baobab" in text

    if system_group == "sliding_window":
        if system_name_lower == "elite":
            return "elite" in text and "knysna" not in text
        if system_name_lower == "knysna":
            return "knysna" in text

    if system_group == "sliding_door_domestic" and system_name_lower == "patio":
        return "patio" in text

    if system_group == "sliding_door_hd":
        if system_name_lower == "palace":
            return "palace" in text and "frameless" not in text
        if system_name_lower == "valencia":
            return "valencia" in text

    if system_group == "sliding_folding" and system_name_lower == "vistafold":
        return "vistafold" in text and "frameless" not in text

    if system_group == "shopfront" and system_name_lower == "shopfront":
        return "shopfront" in text

    if system_group == "frameless_folding" and system_name_lower == "frameless folding":
        return "frameless" in text

    if system_group == "frameless_balustrade" and system_name_lower == "crystal view":
        return "balustrade" in text or "crystal" in text

    return False


def _colour_penalty(requested: str, template: str) -> int:
    if requested == template:
        return 0
    if requested == "custom" and template in {"custom", "bronze", "anodised"}:
        return 60
    if requested == "anodised" and template in {"bronze", "custom"}:
        return 80
    if requested == "bronze" and template in {"anodised", "custom"}:
        return 80
    if requested == "black" and template == "charcoal":
        return 120
    if requested == "charcoal" and template == "black":
        return 120
    if template == "unspecified":
        return 180
    return 250


def _panel_penalty(requested: int | None, template: int | None) -> int:
    if requested is None or template is None:
        return 0
    return 0 if requested == template else 350


def _glass_penalty(requested: str, searchable_text: str) -> int:
    requested = requested.lower()
    is_dgu = any(keyword in searchable_text for keyword in {"double glazed", "double-glazed", "double pane", "dgu"})
    is_laminated = any(keyword in searchable_text for keyword in {"laminated", "safety glass"})
    is_tinted = "tint" in searchable_text
    is_obscured = any(keyword in searchable_text for keyword in {"obscur", "frost", "opaque"})

    if requested == "dgu":
        return 0 if is_dgu else 260
    if requested == "laminated":
        return 0 if is_laminated else 180
    if requested == "tinted":
        return 0 if is_tinted else 150
    if requested == "obscured":
        return 0 if is_obscured else 150
    if requested in {"4mm clear", "6mm clear"}:
        return 160 if any((is_dgu, is_laminated, is_tinted, is_obscured)) else 0
    return 0


def _hinge_penalty(requested: str | None, searchable_text: str) -> int:
    if requested is None:
        return 0
    requested = requested.lower()
    if requested == "top_hung":
        if "top hung" in searchable_text:
            return 0
        if "side hung" in searchable_text:
            return 180
    if requested == "side_hung":
        if "side hung" in searchable_text:
            return 0
        if "top hung" in searchable_text:
            return 180
    if requested == "fixed" and "fix" in searchable_text:
        return 0
    return 20


def _door_type_penalty(requested: str | None, searchable_text: str) -> int:
    if requested is None:
        return 0
    if requested == "stable":
        return 0 if "stable" in searchable_text else 220
    if requested == "pivot":
        return 0 if "pivot" in searchable_text else 220
    if requested == "double_hinged":
        return 0 if "double" in searchable_text else 110
    if requested == "single_hinged":
        return 0 if "single" in searchable_text else 60
    return 0


def _parse_money(value: str) -> Decimal:
    cleaned = value.strip().replace("R", "").replace(",", "")
    if not cleaned:
        return Decimal("0")
    return Decimal(cleaned)


def _to_int(value: str) -> int:
    cleaned = value.strip().replace(",", "")
    if not cleaned:
        return 0
    return int(float(cleaned))
