from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item, mm2_to_m2
from app.schemas import CalculationRequest


class LeafEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.width_mm is not None and request.height_mm is not None
        panels = request.panel_count or 3
        area_per_panel_m2 = mm2_to_m2(request.width_mm * request.height_mm)
        total_area_m2 = area_per_panel_m2 * Decimal(panels * request.quantity)
        rate = Decimal(str(context.rules["glass_area_rate"])) * colour_and_glass_factor(context)
        items = [
            line_item(
                context.rules["material_code"],
                f"{context.system_name} glass panels",
                total_area_m2,
                rate,
            )
        ]
        return build_result(request, context, items)
