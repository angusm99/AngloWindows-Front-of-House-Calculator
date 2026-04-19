from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import StrEnum


class EngineType(StrEnum):
    ENGINE_MITRE = "ENGINE_MITRE"
    ENGINE_SLIDER_LIGHT = "ENGINE_SLIDER_LIGHT"
    ENGINE_SLIDER_DOM = "ENGINE_SLIDER_DOM"
    ENGINE_SLIDER_HEAVY = "ENGINE_SLIDER_HEAVY"
    ENGINE_LEAF_COUNT = "ENGINE_LEAF_COUNT"
    ENGINE_SHOPFRONT = "ENGINE_SHOPFRONT"
    ENGINE_LEAF = "ENGINE_LEAF"
    ENGINE_LINEAR = "ENGINE_LINEAR"


@dataclass(slots=True)
class ProductSystem:
    id: str
    name: str
    engine_type: EngineType
    description: str


@dataclass(slots=True)
class ProductGroup:
    id: str
    name: str
    description: str
    systems: list[ProductSystem]


@dataclass(slots=True)
class Product:
    id: int
    code: str
    name: str
    system_group: str
    system_name: str
    engine_type: EngineType
    opening_type: str
    default_config: str | None = None
    active: bool = True


@dataclass(slots=True)
class GlassOption:
    product_id: int | None
    code: str
    description: str
    safety: bool


@dataclass(slots=True)
class LineItem:
    code: str
    description: str
    qty: Decimal
    unit_price: Decimal
    total: Decimal


@dataclass(slots=True)
class BomItem:
    material_code: str
    description: str
    quantity: Decimal
    unit: str
    length_mm: Decimal | None = None
    unit_cost_zar: Decimal | None = None
    total_cost_zar: Decimal | None = None
    waste_percent: Decimal | None = None


@dataclass(slots=True)
class CuttingItem:
    material_code: str
    description: str
    quantity: int
    cut_length_mm: Decimal
    cut_instruction: str | None = None


@dataclass(slots=True)
class CalculationResult:
    engine_type: EngineType
    system_group: str
    system_name: str
    code: str | None
    width_mm: Decimal | None
    height_mm: Decimal | None
    quantity: int
    glass_code: str
    frame_colour: str
    hardware_colour: str
    hinge_type: str | None
    door_type: str | None
    leaf_count: int | None
    panel_count: int | None
    door_quantity: int | None
    run_length_m: Decimal | None
    line_items: list[LineItem]
    subtotal: Decimal
    markup_percent: Decimal
    markup: Decimal
    total: Decimal
    status: str = "calculated"
    message: str = "Calculation completed successfully."
    bom_items: list[BomItem] = field(default_factory=list)
    cutting_list: list[CuttingItem] = field(default_factory=list)


@dataclass(slots=True)
class QuoteLine:
    code: str | None
    description: str
    system_group: str
    system_name: str
    engine_type: EngineType
    width_mm: Decimal | None
    height_mm: Decimal | None
    quantity: int
    glass_code: str
    frame_colour: str
    hardware_colour: str
    hinge_type: str | None
    door_type: str | None
    leaf_count: int | None
    panel_count: int | None
    door_quantity: int | None
    run_length_m: Decimal | None
    unit_price_zar: Decimal
    line_total_zar: Decimal


@dataclass(slots=True)
class Quote:
    id: int
    quote_number: str
    customer_name: str
    phone_number: str | None
    address: str | None
    salesperson: str | None
    installer: str | None
    notes: str | None
    created_at: datetime
    currency: str
    subtotal_zar: Decimal
    markup_percent: Decimal
    markup_zar: Decimal
    discount_type: str
    discount_value: Decimal
    discount_zar: Decimal
    total_zar: Decimal
    lines: list[QuoteLine]


@dataclass(slots=True)
class StockLevel:
    material_code: str
    description: str
    on_hand: Decimal
    unit: str


@dataclass(slots=True)
class StockTransaction:
    id: int
    material_code: str
    quantity: Decimal
    transaction_type: str
    reference: str | None
    occurred_at: datetime
