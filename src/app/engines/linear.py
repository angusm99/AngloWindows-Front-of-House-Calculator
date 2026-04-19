from __future__ import annotations

from decimal import Decimal

from app.engines.base import CostingEngine, EngineContext, build_result, colour_and_glass_factor, line_item
from app.schemas import CalculationRequest


class LinearEngine(CostingEngine):
    def calculate(self, request: CalculationRequest, context: EngineContext):
        assert request.run_length_m is not None
        rate = Decimal(str(context.rules["linear_rate"])) * colour_and_glass_factor(context)
        items = [
            line_item(
                context.rules["material_code"],
                f"{context.system_name} balustrade run",
                request.run_length_m * request.quantity,
                rate,
            )
        ]
        return build_result(request, context, items)
