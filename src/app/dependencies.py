from functools import lru_cache

from app.repositories import InMemoryProductRepository, InMemoryQuoteRepository
from app.services.calculation import CalculationService, HybridCalculationEngine
from app.services.products import ProductService
from app.services.quotes import QuoteService


@lru_cache
def get_product_repository() -> InMemoryProductRepository:
    return InMemoryProductRepository()


@lru_cache
def get_quote_repository() -> InMemoryQuoteRepository:
    return InMemoryQuoteRepository()


@lru_cache
def get_product_service() -> ProductService:
    return ProductService(get_product_repository())


@lru_cache
def get_calculation_service() -> CalculationService:
    return CalculationService(get_product_service(), HybridCalculationEngine())


@lru_cache
def get_quote_service() -> QuoteService:
    return QuoteService(get_quote_repository())
