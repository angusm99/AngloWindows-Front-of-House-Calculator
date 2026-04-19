from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone

from app.domain import GlassOption, Product, ProductGroup, ProductSystem, Quote
from app.engines.data import GLASS_OPTIONS, SYSTEM_GROUPS


class ProductRepository:
    def list_products(self) -> list[Product]:
        raise NotImplementedError

    def get_product(self, product_id: int) -> Product | None:
        raise NotImplementedError

    def list_system_groups(self) -> list[ProductGroup]:
        raise NotImplementedError

    def list_glass_options(self, product_id: int) -> list[GlassOption]:
        raise NotImplementedError


class QuoteRepository:
    def create_quote(self, quote: Quote) -> Quote:
        raise NotImplementedError

    def list_quotes(self, query: str | None = None) -> list[Quote]:
        raise NotImplementedError

    def get_quote(self, quote_id: int) -> Quote | None:
        raise NotImplementedError


class InMemoryProductRepository(ProductRepository):
    def __init__(self) -> None:
        self._groups = [
            ProductGroup(
                id=group["id"],
                name=group["name"],
                description=group["description"],
                systems=[
                    ProductSystem(
                        id=system["id"],
                        name=system["name"],
                        engine_type=system["engine_type"],
                        description=system["description"],
                    )
                    for system in group["systems"]
                ],
            )
            for group in SYSTEM_GROUPS
        ]
        self._products: list[Product] = []
        next_id = 1
        for group in self._groups:
            for system in group.systems:
                self._products.append(
                    Product(
                        id=next_id,
                        code=f"{group.id}:{system.id}",
                        name=system.name,
                        system_group=group.id,
                        system_name=system.name,
                        engine_type=system.engine_type,
                        opening_type=system.description,
                        default_config=None,
                        active=True,
                    )
                )
                next_id += 1
        self._glass_options = [
            GlassOption(product_id=None, code=item["code"], description=item["description"], safety=item["safety"])
            for item in GLASS_OPTIONS
        ]

    def list_products(self) -> list[Product]:
        return list(self._products)

    def get_product(self, product_id: int) -> Product | None:
        for product in self._products:
            if product.id == product_id:
                return product
        return None

    def list_system_groups(self) -> list[ProductGroup]:
        return list(self._groups)

    def list_glass_options(self, product_id: int) -> list[GlassOption]:
        if self.get_product(product_id) is None:
            return []
        return list(self._glass_options)


class InMemoryQuoteRepository(QuoteRepository):
    def __init__(self) -> None:
        self._quotes: list[Quote] = []
        self._next_id = 1
        self._next_quote_number = 1

    def create_quote(self, quote: Quote) -> Quote:
        if quote.id:
            for index, existing in enumerate(self._quotes):
                if existing.id == quote.id:
                    quote_number = quote.quote_number or existing.quote_number or self._generate_quote_number()
                    stored = replace(quote, id=existing.id, quote_number=quote_number)
                    self._quotes[index] = stored
                    return stored

        quote_number = quote.quote_number or self._generate_quote_number()
        stored = replace(quote, id=self._next_id, quote_number=quote_number)
        self._quotes.append(stored)
        self._next_id += 1
        return stored

    def list_quotes(self, query: str | None = None) -> list[Quote]:
        if not query:
            return list(reversed(self._quotes))
        query_lower = query.lower()
        return [
            quote
            for quote in reversed(self._quotes)
            if query_lower in quote.quote_number.lower() or query_lower in quote.customer_name.lower()
        ]

    def get_quote(self, quote_id: int) -> Quote | None:
        for quote in self._quotes:
            if quote.id == quote_id:
                return quote
        return None

    def _generate_quote_number(self) -> str:
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        quote_number = f"AW-{today}-{self._next_quote_number:03d}"
        self._next_quote_number += 1
        return quote_number
