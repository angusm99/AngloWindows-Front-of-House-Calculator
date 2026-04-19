from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from app.domain import Quote, QuoteLine
from app.repositories import QuoteRepository
from app.schemas import QuoteCreateRequest, QuoteResponse, QuoteSummaryResponse

TWO_PLACES = Decimal("0.01")


class QuoteNotFoundError(ValueError):
    """Raised when a quote id cannot be found."""


class QuoteService:
    def __init__(self, repository: QuoteRepository) -> None:
        self._repository = repository

    def create_quote(self, request: QuoteCreateRequest) -> QuoteResponse:
        lines: list[QuoteLine] = []
        subtotal = Decimal("0")

        for line in request.lines:
            line_total = money(line.unit_price_zar * line.quantity)
            subtotal += line_total
            lines.append(
                QuoteLine(
                    code=line.code,
                    description=line.description,
                    system_group=line.system_group,
                    system_name=line.system_name,
                    engine_type=line.engine_type,
                    width_mm=line.width_mm,
                    height_mm=line.height_mm,
                    glass_code=line.glass_code,
                    frame_colour=line.frame_colour,
                    hardware_colour=line.hardware_colour,
                    hinge_type=line.hinge_type,
                    door_type=line.door_type,
                    quantity=line.quantity,
                    leaf_count=line.leaf_count,
                    panel_count=line.panel_count,
                    door_quantity=line.door_quantity,
                    run_length_m=line.run_length_m,
                    unit_price_zar=line.unit_price_zar,
                    line_total_zar=line_total,
                )
            )

        markup_percent = request.markup_percent
        markup_zar = money(subtotal * (markup_percent / Decimal("100")))
        gross_total = subtotal + markup_zar
        discount_zar = money(
            gross_total * (request.discount_value / Decimal("100"))
            if request.discount_type == "percent"
            else request.discount_value
        )
        total = max(money(gross_total - discount_zar), Decimal("0.00"))

        quote = Quote(
            id=request.id or 0,
            quote_number=request.quote_number or "",
            customer_name=request.customer_name,
            phone_number=request.phone_number,
            address=request.address,
            salesperson=request.salesperson,
            installer=request.installer,
            notes=request.notes,
            created_at=datetime.now(timezone.utc),
            currency=request.currency.upper(),
            subtotal_zar=money(subtotal),
            markup_percent=money(markup_percent),
            markup_zar=markup_zar,
            discount_type=request.discount_type,
            discount_value=money(request.discount_value),
            discount_zar=discount_zar,
            total_zar=total,
            lines=lines,
        )

        stored = self._repository.create_quote(quote)
        return QuoteResponse.model_validate(stored, from_attributes=True)

    def list_quotes(self, query: str | None = None) -> list[QuoteSummaryResponse]:
        return [
            QuoteSummaryResponse(
                id=quote.id,
                quote_number=quote.quote_number,
                customer_name=quote.customer_name,
                created_at=quote.created_at,
                total_zar=quote.total_zar,
                line_count=len(quote.lines),
            )
            for quote in self._repository.list_quotes(query)
        ]

    def get_quote(self, quote_id: int) -> QuoteResponse:
        quote = self._repository.get_quote(quote_id)
        if quote is None:
            raise QuoteNotFoundError(f"Quote {quote_id} was not found.")
        return QuoteResponse.model_validate(quote, from_attributes=True)


def money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
