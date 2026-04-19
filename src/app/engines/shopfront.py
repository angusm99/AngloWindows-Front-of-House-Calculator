from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item, mm_to_m, perimeter_mm
from app.schemas import CalculationRequest


class ShopfrontEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.width_mm is not None and request.height_mm is not None
        door_qty = request.door_quantity or 1
        frame_perimeter_m = mm_to_m(perimeter_mm(request.width_mm, request.height_mm))
        frame_rate = Decimal(str(context.rules["frame_rate"])) * context.frame_multiplier
        door_rate = Decimal(str(context.rules["door_rate"])) * colour_and_glass_factor(context)
        items = [
            line_item(
                context.rules["material_code"],
                "Clip 44 shopfront frame",
                frame_perimeter_m * request.quantity,
                frame_rate,
            ),
            line_item(
                f"{context.rules['material_code']}-DOOR",
                "Hinged door set",
                Decimal(door_qty * request.quantity),
                door_rate,
            ),
        ]
        return build_result(request, context, items)
