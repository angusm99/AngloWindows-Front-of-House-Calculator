from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.domain import EngineType


class ProductResponse(BaseModel):
    id: int
    code: str
    name: str
    system_group: str
    system_name: str
    engine_type: EngineType
    opening_type: str
    default_config: str | None = None
    active: bool


class ProductSystemResponse(BaseModel):
    id: str
    name: str
    engine_type: EngineType
    description: str


class ProductGroupResponse(BaseModel):
    id: str
    name: str
    description: str
    systems: list[ProductSystemResponse]


class SystemGroupsResponse(BaseModel):
    groups: list[ProductGroupResponse]


class GlassOptionResponse(BaseModel):
    code: str
    description: str
    safety: bool


class ConfigOptionResponse(BaseModel):
    value: str
    label: str


class CalculatorOptionsResponse(BaseModel):
    glass_options: list[GlassOptionResponse]
    frame_colours: list[ConfigOptionResponse]
    hardware_colours: list[ConfigOptionResponse]
    hinge_types: list[ConfigOptionResponse]
    panel_counts: list[ConfigOptionResponse]
    door_types: list[ConfigOptionResponse]
    leaf_counts: list[ConfigOptionResponse]


class PdfIntakeRowResponse(BaseModel):
    code: str
    system_group: str
    system_name: str
    width_mm: int | None = None
    height_mm: int | None = None
    run_length_m: float | None = None
    glass_code: str
    frame_colour: str
    hardware_colour: str
    quantity: int = Field(ge=1)
    hinge_type: str | None = None
    panel_count: int | None = Field(default=None, ge=1)
    leaf_count: int | None = Field(default=None, ge=3, le=8)
    door_type: str | None = None
    door_quantity: int | None = Field(default=None, ge=1)
    status: Literal["ready", "review"] = "review"
    flags: list[str] = Field(default_factory=list)


class PdfIntakeResponse(BaseModel):
    rows: list[PdfIntakeRowResponse]
    warnings: list[str]
    page_count: int
    schedule_page_count: int


class LineItemResponse(BaseModel):
    code: str
    description: str
    qty: Decimal
    unit_price: Decimal
    total: Decimal


class BomItemResponse(BaseModel):
    material_code: str
    description: str
    quantity: Decimal
    unit: str
    length_mm: Decimal | None = None
    unit_cost_zar: Decimal | None = None
    total_cost_zar: Decimal | None = None
    waste_percent: Decimal | None = None


class CuttingItemResponse(BaseModel):
    material_code: str
    description: str
    quantity: int
    cut_length_mm: Decimal
    cut_instruction: str | None = None


class CalculationRequest(BaseModel):
    system_group: str = Field(min_length=1)
    system_name: str = Field(min_length=1)
    code: str | None = None
    width_mm: Decimal | None = Field(default=None, gt=0)
    height_mm: Decimal | None = Field(default=None, gt=0)
    quantity: int = Field(default=1, ge=1)
    hinge_type: str | None = None
    door_type: str | None = None
    panel_count: int | None = Field(default=None, ge=1)
    door_quantity: int | None = Field(default=None, ge=1)
    leaf_count: int | None = Field(default=None, ge=3, le=8)
    run_length_m: Decimal | None = Field(default=None, gt=0)
    glass_code: str = Field(min_length=1)
    frame_colour: str = Field(min_length=1)
    hardware_colour: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_dimensions(self) -> "CalculationRequest":
        if self.run_length_m is None and (self.width_mm is None or self.height_mm is None):
            raise ValueError("width_mm and height_mm are required unless run_length_m is supplied.")
        return self


class CalculationResponse(BaseModel):
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
    status: str
    message: str
    line_items: list[LineItemResponse]
    subtotal: Decimal
    markup_percent: Decimal
    markup: Decimal
    total: Decimal
    bom_items: list[BomItemResponse]
    cutting_list: list[CuttingItemResponse]


class QuoteLineCreateRequest(BaseModel):
    code: str | None = None
    description: str = Field(min_length=1)
    system_group: str = Field(min_length=1)
    system_name: str = Field(min_length=1)
    engine_type: EngineType
    width_mm: Decimal | None = Field(default=None, gt=0)
    height_mm: Decimal | None = Field(default=None, gt=0)
    quantity: int = Field(ge=1)
    glass_code: str = Field(min_length=1)
    frame_colour: str = Field(min_length=1)
    hardware_colour: str = Field(min_length=1)
    hinge_type: str | None = None
    door_type: str | None = None
    leaf_count: int | None = Field(default=None, ge=3, le=8)
    panel_count: int | None = Field(default=None, ge=1)
    door_quantity: int | None = Field(default=None, ge=1)
    run_length_m: Decimal | None = Field(default=None, gt=0)
    unit_price_zar: Decimal = Field(ge=0)


class QuoteCreateRequest(BaseModel):
    id: int | None = None
    quote_number: str | None = None
    customer_name: str = Field(min_length=1)
    phone_number: str | None = None
    address: str | None = None
    salesperson: str | None = None
    installer: str | None = None
    notes: str | None = None
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    markup_percent: Decimal = Field(default=Decimal("20"), ge=0)
    discount_type: Literal["amount", "percent"] = "amount"
    discount_value: Decimal = Field(default=Decimal("0"), ge=0)
    lines: list[QuoteLineCreateRequest] = Field(min_length=1)


class QuoteLineResponse(BaseModel):
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


class QuoteResponse(BaseModel):
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
    lines: list[QuoteLineResponse]


class QuoteSummaryResponse(BaseModel):
    id: int
    quote_number: str
    customer_name: str
    created_at: datetime
    total_zar: Decimal
    line_count: int
