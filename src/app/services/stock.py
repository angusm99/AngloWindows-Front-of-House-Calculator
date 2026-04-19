from __future__ import annotations

from datetime import datetime, timezone

from app.domain import StockTransaction
from app.repositories import StockRepository
from app.schemas import StockLevelResponse, StockTransactionCreateRequest, StockTransactionResponse


class StockService:
    def __init__(self, repository: StockRepository) -> None:
        self._repository = repository

    def list_levels(self) -> list[StockLevelResponse]:
        return [StockLevelResponse.model_validate(level, from_attributes=True) for level in self._repository.list_levels()]

    def record_transaction(self, request: StockTransactionCreateRequest) -> StockTransactionResponse:
        transaction = StockTransaction(
            id=0,
            material_code=request.material_code,
            quantity=request.quantity,
            transaction_type=request.transaction_type,
            reference=request.reference,
            occurred_at=datetime.now(timezone.utc),
        )
        stored = self._repository.record_transaction(transaction)
        return StockTransactionResponse.model_validate(stored, from_attributes=True)
