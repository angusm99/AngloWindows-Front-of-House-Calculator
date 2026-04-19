from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item, mm_to_m, perimeter_mm
from app.schemas import CalculationRequest


class MitreEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.width_mm is not None and request.height_mm is not None
        deduction = Decimal(str(context.rules["mitre_deduction_mm"]))
        perimeter_m = mm_to_m(perimeter_mm(request.width_mm, request.height_mm) - deduction)
        rate = Decimal(str(context.rules["material_rate"])) * colour_and_glass_factor(context)
        items = [
            line_item(
                context.rules["material_code"],
                f"{context.system_name} frame perimeter",
                perimeter_m * request.quantity,
                rate,
            )
        ]
        result = build_result(request, context, items)
        result.cutting_list = []
        return result
