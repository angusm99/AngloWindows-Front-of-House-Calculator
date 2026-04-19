from __future__ import annotations

from decimal import Decimal
from typing import Protocol

from app.domain import CalculationResult, EngineType
from app.engines.data import (
    DEFAULT_MARKUP_RATE,
    FRAME_COLOUR_MULTIPLIERS,
    GLASS_MULTIPLIERS,
    HARDWARE_COLOUR_MULTIPLIERS,
    SYSTEM_GROUPS,
    SYSTEM_RULES,
)
from app.engines.leaf import LeafEngine
from app.engines.leaf_count import LeafCountEngine
from app.engines.linear import LinearEngine
from app.engines.mitre import MitreEngine
from app.engines.shopfront import ShopfrontEngine
from app.engines.slider import SliderEngine
from app.engines.base import EngineContext
from app.schemas import CalculationRequest, CalculationResponse
from app.services.products import ProductService
from app.services.template_pricing import TemplatePricingLookup


class CalculationEngine(Protocol):
    def calculate(self, request: CalculationRequest, context: EngineContext) -> CalculationResult:
        ...


class CatalogLookupError(ValueError):
    """Raised when a requested system group, system, or option does not exist."""


class CalculationService:
    def __init__(self, product_service: ProductService, engine: CalculationEngine) -> None:
        self._product_service = product_service
        self._engine = engine

    def calculate(self, request: CalculationRequest) -> CalculationResponse:
        result = self._engine.calculate(request, self._build_context(request))
        return CalculationResponse.model_validate(result, from_attributes=True)

    def _build_context(self, request: CalculationRequest) -> EngineContext:
        catalog = self._product_service.list_system_groups()
        group_match = _match_by_id_or_name(catalog.groups, request.system_group)
        if group_match is None:
            raise CatalogLookupError(f"Unknown system group: {request.system_group}")

        system_match = _match_by_id_or_name(group_match.systems, request.system_name)
        if system_match is None:
            raise CatalogLookupError(f"Unknown system: {request.system_name}")

        rules = SYSTEM_RULES.get((group_match.id, system_match.name))
        if rules is None:
            raise CatalogLookupError(f"No pricing rules found for {group_match.name} / {system_match.name}")

        return EngineContext(
            system_group=group_match.id,
            system_name=system_match.name,
            engine_type=system_match.engine_type,
            rules=rules,
            markup_rate=Decimal(str(DEFAULT_MARKUP_RATE)),
            glass_multiplier=_get_multiplier(GLASS_MULTIPLIERS, request.glass_code, "glass"),
            frame_multiplier=_get_multiplier(FRAME_COLOUR_MULTIPLIERS, request.frame_colour, "frame colour"),
            hardware_multiplier=_get_multiplier(HARDWARE_COLOUR_MULTIPLIERS, request.hardware_colour, "hardware colour"),
        )


class CompositeCalculationEngine:
    def __init__(self) -> None:
        shared_slider = SliderEngine()
        self._engines: dict[EngineType, CalculationEngine] = {
            EngineType.ENGINE_MITRE: MitreEngine(),
            EngineType.ENGINE_SLIDER_LIGHT: shared_slider,
            EngineType.ENGINE_SLIDER_DOM: shared_slider,
            EngineType.ENGINE_SLIDER_HEAVY: shared_slider,
            EngineType.ENGINE_LEAF_COUNT: LeafCountEngine(),
            EngineType.ENGINE_SHOPFRONT: ShopfrontEngine(),
            EngineType.ENGINE_LEAF: LeafEngine(),
            EngineType.ENGINE_LINEAR: LinearEngine(),
        }

    def calculate(self, request: CalculationRequest, context: EngineContext) -> CalculationResult:
        engine = self._engines.get(context.engine_type)
        if engine is None:
            raise CatalogLookupError(f"Unsupported engine: {context.engine_type}")
        return engine.calculate(request, context)


class HybridCalculationEngine:
    def __init__(self) -> None:
        self._template_lookup = TemplatePricingLookup()
        self._formula_engine = CompositeCalculationEngine()

    def calculate(self, request: CalculationRequest, context: EngineContext) -> CalculationResult:
        template_result = self._template_lookup.calculate(request, context)
        if template_result is not None:
            return template_result
        return self._formula_engine.calculate(request, context)


def _normalize(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def _match_by_id_or_name(items: list, raw_value: str):
    normalized = _normalize(raw_value)
    for item in items:
        item_id = getattr(item, "id", "")
        item_name = getattr(item, "name", "")
        if _normalize(item_id) == normalized or _normalize(item_name) == normalized:
            return item
    return None


def _get_multiplier(lookup: dict[str, float], raw_value: str, label: str) -> Decimal:
    key = raw_value.strip().lower()
    if key not in lookup:
        raise CatalogLookupError(f"Unknown {label}: {raw_value}")
    return Decimal(str(lookup[key]))
