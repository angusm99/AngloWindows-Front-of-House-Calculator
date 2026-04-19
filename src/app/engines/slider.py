from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item, mm_to_m
from app.schemas import CalculationRequest


class SliderEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.width_mm is not None
        panels = request.panel_count or 2
        overlap = Decimal(str(context.rules["overlap_deduction_mm"])) * max(panels - 1, 1)
        rail_length_m = mm_to_m(request.width_mm + overlap)
        base_rate = Decimal(str(context.rules["material_rate"])) * colour_and_glass_factor(context)
        items = [
            line_item(
                context.rules["material_code"],
                f"{context.system_name} rail set ({panels} panels)",
                rail_length_m * request.quantity,
                base_rate,
            )
        ]

        if context.engine_type.name == "ENGINE_SLIDER_HEAVY":
            clip_rate = Decimal(str(context.rules["clip_stile_rate"])) * context.frame_multiplier
            items.append(
                line_item(
                    f"{context.rules['material_code']}-STILE",
                    "Clip 44 shared stiles",
                    Decimal(panels * request.quantity),
                    clip_rate,
                )
            )

        return build_result(request, context, items)
