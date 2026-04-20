from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.dependencies import (
    get_calculation_service,
    get_product_service,
    get_quote_service,
)
from app.schemas import (
    CalculatorOptionsResponse,
    CalculationRequest,
    CalculationResponse,
    GlassOptionResponse,
    PdfIntakeResponse,
    ProductResponse,
    QuoteCreateRequest,
    QuoteResponse,
    QuoteSummaryResponse,
    SystemGroupsResponse,
)
from app.services.calculation import CalculationService, CatalogLookupError
from app.services.pdf_uploads import PdfIntakeUnavailableError, extract_pdf_upload_rows
from app.services.products import ProductNotFoundError, ProductService
from app.services.quotes import QuoteNotFoundError, QuoteService


api_router = APIRouter(prefix="/api")


@api_router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@api_router.get("/catalog/system-groups", response_model=SystemGroupsResponse)
def list_system_groups(service: ProductService = Depends(get_product_service)) -> SystemGroupsResponse:
    return service.list_system_groups()


@api_router.get("/catalog/options", response_model=CalculatorOptionsResponse)
def list_calculator_options(service: ProductService = Depends(get_product_service)) -> CalculatorOptionsResponse:
    return service.list_options()


@api_router.post("/pdf-intake", response_model=PdfIntakeResponse)
async def intake_pdf(file: UploadFile = File(...)) -> PdfIntakeResponse:
    filename = file.filename or "drawing.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a PDF drawing.")

    temp_path: Path | None = None
    try:
        with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(await file.read())
            temp_path = Path(temp_file.name)
        payload = extract_pdf_upload_rows(temp_path, original_filename=filename)
        return PdfIntakeResponse(**payload)
    except PdfIntakeUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unable to process PDF: {exc}") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@api_router.get("/products", response_model=list[ProductResponse])
def list_products(service: ProductService = Depends(get_product_service)) -> list[ProductResponse]:
    return service.list_products()


@api_router.get(
    "/products/{product_id}/glass-options",
    response_model=list[GlassOptionResponse],
)
def list_product_glass_options(
    product_id: int,
    service: ProductService = Depends(get_product_service),
) -> list[GlassOptionResponse]:
    try:
        return service.list_glass_options(product_id)
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@api_router.post("/calculate", response_model=CalculationResponse)
def calculate_cost(
    request: CalculationRequest,
    service: CalculationService = Depends(get_calculation_service),
) -> CalculationResponse:
    try:
        return service.calculate(request)
    except CatalogLookupError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@api_router.post("/quotes", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
def create_quote(
    request: QuoteCreateRequest,
    service: QuoteService = Depends(get_quote_service),
) -> QuoteResponse:
    return service.create_quote(request)


@api_router.get("/quotes", response_model=list[QuoteSummaryResponse])
def list_quotes(
    q: str | None = None,
    service: QuoteService = Depends(get_quote_service),
) -> list[QuoteSummaryResponse]:
    return service.list_quotes(q)


@api_router.get("/quotes/{quote_id}", response_model=QuoteResponse)
def get_quote(
    quote_id: int,
    service: QuoteService = Depends(get_quote_service),
) -> QuoteResponse:
    try:
        return service.get_quote(quote_id)
    except QuoteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
