from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.domain import CalculationResult, CuttingItem, EngineType, LineItem
from app.schemas import CalculationRequest

TWO_PLACES = Decimal("0.01")
THREE_PLACES = Decimal("0.001")
ONE_PLACE = Decimal("0.1")
THOUSAND = Decimal("1000")
MILLION = Decimal("1000000")


@dataclass(slots=True)
class EngineContext:
    system_group: str
    system_name: str
    engine_type: EngineType
    rules: dict
    markup_rate: Decimal
    glass_multiplier: Decimal
    frame_multiplier: Decimal
    hardware_multiplier: Decimal


class CostingEngine:
    def calculate(self, request: CalculationRequest, context: EngineContext) -> CalculationResult:
        raise NotImplementedError


def to_decimal(value: float | int | str | Decimal) -> Decimal:
    return Decimal(str(value))


def money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def qty(value: Decimal) -> Decimal:
    return value.quantize(THREE_PLACES, rounding=ROUND_HALF_UP)


def mm_to_m(value_mm: Decimal) -> Decimal:
    return qty(value_mm / THOUSAND)


def mm2_to_m2(value_mm2: Decimal) -> Decimal:
    return qty(value_mm2 / MILLION)


def build_result(
    request: CalculationRequest,
    context: EngineContext,
    line_items: list[LineItem],
) -> CalculationResult:
    subtotal = money(sum((item.total for item in line_items), start=Decimal("0")))
    markup = money(subtotal * context.markup_rate)
    total = money(subtotal + markup)
    return CalculationResult(
        engine_type=context.engine_type,
        system_group=context.system_group,
        system_name=context.system_name,
        code=request.code,
        width_mm=request.width_mm,
        height_mm=request.height_mm,
        quantity=request.quantity,
        glass_code=request.glass_code,
        frame_colour=request.frame_colour,
        hardware_colour=request.hardware_colour,
        hinge_type=request.hinge_type,
        door_type=request.door_type,
        leaf_count=request.leaf_count,
        panel_count=request.panel_count,
        door_quantity=request.door_quantity,
        run_length_m=request.run_length_m,
        line_items=line_items,
        subtotal=subtotal,
        markup_percent=(context.markup_rate * Decimal("100")),
        markup=markup,
        total=total,
        bom_items=[],
        cutting_list=[],
    )


def colour_and_glass_factor(context: EngineContext) -> Decimal:
    return context.glass_multiplier * context.frame_multiplier * context.hardware_multiplier


def line_item(code: str, description: str, quantity: Decimal, unit_price: Decimal) -> LineItem:
    unit_price = money(unit_price)
    total = money(quantity * unit_price)
    return LineItem(code=code, description=description, qty=qty(quantity), unit_price=unit_price, total=total)


def perimeter_mm(width_mm: Decimal, height_mm: Decimal) -> Decimal:
    return (width_mm + height_mm) * 2


def default_cutting_list(code: str, description: str, pieces: int, cut_length_mm: Decimal) -> list[CuttingItem]:
    return [
        CuttingItem(
            material_code=code,
            description=description,
            quantity=pieces,
            cut_length_mm=cut_length_mm.quantize(ONE_PLACE, rounding=ROUND_HALF_UP),
            cut_instruction="Factory cut",
        )
    ]
