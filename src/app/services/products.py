from __future__ import annotations

from app.engines.data import (
    DOOR_TYPE_OPTIONS,
    FRAME_COLOUR_OPTIONS,
    HARDWARE_COLOUR_OPTIONS,
    HINGE_TYPE_OPTIONS,
    LEAF_COUNT_OPTIONS,
    PANEL_COUNT_OPTIONS,
)
from app.repositories import ProductRepository
from app.schemas import (
    CalculatorOptionsResponse,
    ConfigOptionResponse,
    GlassOptionResponse,
    ProductGroupResponse,
    ProductResponse,
    ProductSystemResponse,
    SystemGroupsResponse,
)


class ProductNotFoundError(ValueError):
    """Raised when a product id does not exist."""


class ProductService:
    def __init__(self, repository: ProductRepository) -> None:
        self._repository = repository

    def list_products(self) -> list[ProductResponse]:
        return [ProductResponse.model_validate(product, from_attributes=True) for product in self._repository.list_products()]

    def list_system_groups(self) -> SystemGroupsResponse:
        groups = self._repository.list_system_groups()
        return SystemGroupsResponse(
            groups=[
                ProductGroupResponse(
                    id=group.id,
                    name=group.name,
                    description=group.description,
                    systems=[
                        ProductSystemResponse(
                            id=system.id,
                            name=system.name,
                            engine_type=system.engine_type,
                            description=system.description,
                        )
                        for system in group.systems
                    ],
                )
                for group in groups
            ]
        )

    def get_product_or_raise(self, product_id: int):
        product = self._repository.get_product(product_id)
        if product is None:
            raise ProductNotFoundError(f"Product {product_id} was not found.")
        return product

    def list_glass_options(self, product_id: int) -> list[GlassOptionResponse]:
        self.get_product_or_raise(product_id)
        options = self._repository.list_glass_options(product_id)
        return [GlassOptionResponse.model_validate(option, from_attributes=True) for option in options]

    def list_options(self) -> CalculatorOptionsResponse:
        example_product = self._repository.list_products()[0]
        glass_options = self._repository.list_glass_options(example_product.id)
        return CalculatorOptionsResponse(
            glass_options=[GlassOptionResponse.model_validate(option, from_attributes=True) for option in glass_options],
            frame_colours=[ConfigOptionResponse.model_validate(item) for item in FRAME_COLOUR_OPTIONS],
            hardware_colours=[ConfigOptionResponse.model_validate(item) for item in HARDWARE_COLOUR_OPTIONS],
            hinge_types=[ConfigOptionResponse.model_validate(item) for item in HINGE_TYPE_OPTIONS],
            panel_counts=[ConfigOptionResponse.model_validate(item) for item in PANEL_COUNT_OPTIONS],
            door_types=[ConfigOptionResponse.model_validate(item) for item in DOOR_TYPE_OPTIONS],
            leaf_counts=[ConfigOptionResponse.model_validate(item) for item in LEAF_COUNT_OPTIONS],
        )
