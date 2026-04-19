from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item, mm_to_m, perimeter_mm
from app.schemas import CalculationRequest


class LeafCountEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.width_mm is not None and request.height_mm is not None and request.leaf_count is not None
        sash_rate = Decimal(str(context.rules["sash_component_rate"])) * colour_and_glass_factor(context)
        frame_rate = Decimal(str(context.rules["frame_rate"])) * context.frame_multiplier
        frame_length_m = mm_to_m(perimeter_mm(request.width_mm, request.height_mm))
        items = [
            line_item(
                context.rules["material_code"],
                "Vistafold sash tops",
                Decimal(request.leaf_count * request.quantity),
                sash_rate,
            ),
            line_item(
                f"{context.rules['material_code']}-BOT",
                "Vistafold sash bottoms",
                Decimal(request.leaf_count * request.quantity),
                sash_rate,
            ),
            line_item(
                f"{context.rules['material_code']}-FRAME",
                "Vistafold outer frame",
                frame_length_m * request.quantity,
                frame_rate,
            ),
        ]
        return build_result(request, context, items)
