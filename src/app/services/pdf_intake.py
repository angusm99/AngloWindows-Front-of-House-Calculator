"""
pdf_intake.py — Extract window and door data from architectural PDFs.

The extractor prefers machine-readable schedule text, but now falls back to OCR
for scanned rough copies and marked-up drawings where the PDF contains only an
image. The goal is not perfect automation; it is to prefill as much as we can
for reception and leave a reviewable result.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any

try:
    import fitz
except ImportError:  # pragma: no cover - environment-dependent import
    fitz = None

try:
    import numpy as np
except ImportError:  # pragma: no cover - environment-dependent import
    np = None

try:
    import pdfplumber
except ImportError:  # pragma: no cover - environment-dependent import
    pdfplumber = None

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError:  # pragma: no cover - environment-dependent import
    RapidOCR = None

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".jfif", ".bmp", ".tif", ".tiff", ".webp"}


class ScheduleExtractor:
    """Extract schedule rows and document metadata from PDFs."""

    SCHEDULE_PAGE_KEYWORDS = {
        "WINDOW SCHEDULE": "window",
        "DOOR SCHEDULE": "door",
        "W&D SCHEDULE": "mixed",
        "WINDOW & DOOR": "mixed",
    }

    CODE_PATTERN = r"\b(?:W|D|SD|SW|HD|SF|FF|FB)\s*-?\s*(\d{1,3})\b"
    DIMENSION_PATTERN = re.compile(r"\b(\d{3,4})\s*[xX]\s*(\d{3,4})\b")
    NUMBER_PATTERN = re.compile(r"\b(\d{3,4})\b")
    PHONE_PATTERN = re.compile(r"(?:\+27|0)\d(?:[\s-]?\d){8,}")
    DATE_PATTERN = re.compile(r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b")
    NON_CUSTOMER_MARKERS = (
        "PHASE",
        "REV",
        "AMENDED",
        "COMPRESSED",
        "COPY",
        "MUN",
        "JOB",
        "RC",
        "DRAWING",
    )

    FINISH_PATTERN = r"(ALUMINUM(?:\s*-\s*(?:EPOXY\s+COATED|ANODISED))?|TIMBER|TIMBER\s+FRAME|STEEL|MILD\s+STEEL)"
    GLAZING_PATTERN = r"((?:6\.3mm|6mm|4mm)\s+(?:Safety\s+)?Glazing|Safety\s+Glazing|FROSTED|CLEAR|AS\s+PER\s+RATIONAL\s+DESIGN|N/A)"
    SAFETY_GLASS_KEYWORDS = ["SAFETY GLAZING", "6.3MM", "6MM SAFETY", "SAFETY GLASS"]

    def __init__(self, pdf_path: str, source_name: str | None = None):
        self.pdf_path = pdf_path
        self.source_name = source_name
        self.pages = []
        self.schedule_pages: list[tuple[int, str, str]] = []
        self.schedule_items: list[dict[str, Any]] = []
        self.warnings: list[str] = []
        self.document_info: dict[str, Any] = {
            "customer_name": None,
            "phone_number": None,
            "address": None,
            "project_name": None,
            "source": "unknown",
            "summary": None,
        }

    def extract(self) -> dict[str, Any]:
        if pdfplumber is None:
            raise RuntimeError("PDF extraction requires pdfplumber. Run start.ps1 again to install it.")

        try:
            text_pages: list[str] = []
            with pdfplumber.open(self.pdf_path) as pdf:
                self.pages = pdf.pages

                for i, page in enumerate(self.pages):
                    page_text = page.extract_text() or ""
                    text_pages.append(page_text)
                    if self._is_schedule_page(page_text):
                        self.schedule_pages.append((i, page_text, self._classify_schedule_type(page_text)))

                for _, page_text, schedule_type in self.schedule_pages:
                    items = self._extract_from_schedule_page(page_text, schedule_type)
                    self.schedule_items.extend(items)

            page_count = len(self.pages)
            if self.schedule_items:
                combined_text = "\n".join(text_pages)
                self.document_info = self._extract_document_info(combined_text, "schedule_text")
            else:
                ocr_pages = self._run_ocr_pages()
                if ocr_pages:
                    combined_ocr_text = "\n".join(ocr_pages)
                    self.document_info = self._extract_document_info(combined_ocr_text, "ocr")
                    self.schedule_items = self._extract_from_ocr_text(ocr_pages)
                    if self.schedule_items:
                        self.warnings.append("Rows were extracted from OCR and should be reviewed before pricing.")
                    else:
                        self.warnings.append("No opening rows could be confidently extracted from the scanned drawing.")
                else:
                    self.document_info = self._extract_document_info("", "filename")
                    self.warnings.append("This PDF appears image-only and OCR could not read any text.")

            return {
                "schedule_items": self.schedule_items,
                "warnings": self.warnings,
                "page_count": page_count,
                "schedule_page_count": len(self.schedule_pages),
                "document_info": self.document_info,
            }
        except Exception as exc:
            self.warnings.append(f"Error during extraction: {exc}")
            return {
                "schedule_items": [],
                "warnings": self.warnings,
                "page_count": len(self.pages),
                "schedule_page_count": len(self.schedule_pages),
                "document_info": self.document_info,
            }

    def _run_ocr_pages(self) -> list[str]:
        if fitz is None or RapidOCR is None or np is None:
            self.warnings.append("OCR dependencies are unavailable for scanned drawings.")
            return []

        engine = RapidOCR()
        texts: list[str] = []
        document = fitz.open(self.pdf_path)
        try:
            for page in document[: min(3, len(document))]:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
                result, _ = engine(image)
                if not result:
                    continue
                lines = [entry[1] for entry in result if len(entry) >= 2 and str(entry[1]).strip()]
                if lines:
                    texts.append("\n".join(lines))
        finally:
            document.close()
        return texts

    def _extract_document_info(self, text: str, source: str) -> dict[str, Any]:
        filename_info = self._extract_document_info_from_filename()
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        top_lines = lines[:20]

        customer_name = filename_info["customer_name"]
        address = filename_info["address"]
        project_name = filename_info["project_name"]
        phone_number = None

        for line in top_lines:
            phone_match = self.PHONE_PATTERN.search(line)
            if phone_match:
                phone_number = phone_match.group(0)
                break

        if not customer_name:
            for line in top_lines:
                upper = line.upper()
                if any(token in upper for token in ("CLIENT", "CUSTOMER", "ATT", "TENANT")) and ":" in line:
                    candidate = line.split(":", 1)[1].strip()
                    if candidate:
                        customer_name = candidate
                        break

        if not address:
            for line in top_lines:
                upper = line.upper()
                if any(token in upper for token in ("ADDRESS", "SITE", "TABLE VIEW", "PARKLANDS", "BLOUBERG", "CAPE TOWN")):
                    if ":" in line:
                        address = line.split(":", 1)[1].strip() or line.strip()
                    else:
                        address = line.strip()
                    break

        summary_bits = [bit for bit in [project_name, customer_name, address] if bit]
        return {
            "customer_name": customer_name,
            "phone_number": phone_number,
            "address": address,
            "project_name": project_name,
            "source": source if any((customer_name, address, project_name, phone_number)) else "unknown",
            "summary": " | ".join(summary_bits) if summary_bits else None,
        }

    def _extract_document_info_from_filename(self) -> dict[str, Any]:
        stem = Path(self.source_name).stem if self.source_name else Path(self.pdf_path).stem
        parts = [part.strip() for part in stem.split(" - ") if part.strip()]
        cleaned_parts = [self._clean_filename_part(part) for part in parts]
        cleaned_parts = [part for part in cleaned_parts if part]

        project_name = cleaned_parts[0] if cleaned_parts else None
        address = None
        customer_name = None
        for part in cleaned_parts[1:]:
            if address is None and self._looks_like_location(part):
                address = part
                continue
            if customer_name is None and self._looks_like_customer_name(part):
                customer_name = part

        if address is None and len(cleaned_parts) > 1:
            address = cleaned_parts[1]

        return {
            "customer_name": customer_name,
            "address": address,
            "project_name": project_name,
        }

    def _clean_filename_part(self, value: str) -> str:
        cleaned = self.DATE_PATTERN.sub("", value)
        cleaned = re.sub(r"-\d{10,}", "", cleaned)
        cleaned = re.sub(r"\bRC\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bAMENDED\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bJOB\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned.strip(" -._")

    def _looks_like_customer_name(self, value: str) -> bool:
        upper = value.upper()
        if not value or any(marker in upper for marker in self.NON_CUSTOMER_MARKERS):
            return False
        if any(char.isdigit() for char in value):
            return False
        return len(value.split()) >= 2

    def _looks_like_location(self, value: str) -> bool:
        upper = value.upper()
        return any(
            token in upper
            for token in ("VIEW", "BEACH", "BAY", "VILLAGE", "COURT", "PARK", "TOWN", "CAPE", "TABLE", "FERNKLOOF", "PEARLY")
        )

    def _is_schedule_page(self, text: str) -> bool:
        text_upper = text.upper()
        return any(keyword in text_upper for keyword in self.SCHEDULE_PAGE_KEYWORDS)

    def _classify_schedule_type(self, text: str) -> str:
        text_upper = text.upper()
        if "WINDOW SCHEDULE" in text_upper:
            return "window"
        if "DOOR SCHEDULE" in text_upper:
            return "door"
        return "mixed"

    def _extract_from_schedule_page(self, page_text: str, schedule_type: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        cards = re.split(r"(?:WINDOW NAME|DOOR NAME|WINDOW SCHEDULE|DOOR SCHEDULE)", page_text)

        for card_idx, card_text in enumerate(cards):
            if not card_text.strip():
                continue
            item = self._parse_schedule_card(card_text, schedule_type, card_idx)
            if item:
                items.append(item)
        return items

    def _parse_schedule_card(self, card_text: str, schedule_type: str, card_idx: int) -> dict[str, Any] | None:
        card_text = card_text.strip()
        if not card_text:
            return None

        code_match = re.search(self.CODE_PATTERN, card_text, re.IGNORECASE)
        if not code_match:
            return None

        code = self._normalize_code(code_match.group(0))
        dimensions = self._extract_dimensions_improved(card_text, code)
        width = dimensions.get("width")
        height = dimensions.get("height")

        finish_match = re.search(self.FINISH_PATTERN, card_text, re.IGNORECASE)
        finish = finish_match.group(0).upper() if finish_match else "UNKNOWN"

        glazing_match = re.search(self.GLAZING_PATTERN, card_text, re.IGNORECASE)
        glazing = glazing_match.group(0) if glazing_match else "N/A"
        safety_flag = self._detect_safety_glass(card_text, glazing)

        flags = []
        if not width or not height:
            flags.append("Missing or ambiguous dimension")
        if finish == "UNKNOWN":
            flags.append("Unknown finish")
        if glazing == "N/A" and schedule_type == "window":
            flags.append("No glazing specified for window")

        return {
            "code": code,
            "width": width,
            "height": height,
            "finish": finish,
            "glazing": glazing,
            "safety_flag": safety_flag,
            "schedule_type": schedule_type,
            "flags": flags,
            "raw_text": card_text[:200],
        }

    def _extract_from_ocr_text(self, pages: list[str]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        seen_codes: set[str] = set()
        lines = [line.strip() for page in pages for line in page.splitlines() if line.strip()]

        for index, line in enumerate(lines):
            code_match = re.search(self.CODE_PATTERN, line, re.IGNORECASE)
            if not code_match:
                continue

            code = self._normalize_code(code_match.group(0))
            if code in seen_codes:
                continue

            nearby = "\n".join(lines[max(0, index - 1): min(len(lines), index + 3)])
            dimensions = self._extract_dimensions_improved(nearby, code)
            width = dimensions.get("width")
            height = dimensions.get("height")
            schedule_type = "door" if code.startswith("D") or code.startswith("SD") or code.startswith("HD") else "window"

            rows.append(
                {
                    "code": code,
                    "width": width,
                    "height": height,
                    "finish": "UNKNOWN",
                    "glazing": "N/A",
                    "safety_flag": False,
                    "schedule_type": schedule_type,
                    "flags": ["OCR fallback"] + ([] if width and height else ["Missing or ambiguous dimension"]),
                    "raw_text": nearby[:200],
                }
            )
            seen_codes.add(code)

        return rows

    def _extract_dimensions_improved(self, text: str, code: str) -> dict[str, int | None]:
        lines = text.splitlines()
        code_line_idx = -1
        for i, line in enumerate(lines):
            if code.replace(" ", "") in self._normalize_code(line):
                code_line_idx = i
                break

        context = text if code_line_idx == -1 else "\n".join(lines[max(0, code_line_idx - 2): min(len(lines), code_line_idx + 3)])

        pair_match = self.DIMENSION_PATTERN.search(context)
        if pair_match:
            first = int(pair_match.group(1))
            second = int(pair_match.group(2))
            if self._reasonable_dimension(first) and self._reasonable_dimension(second):
                return {"width": first, "height": second}

        candidates: list[int] = []
        for match in self.NUMBER_PATTERN.finditer(context):
            num = int(match.group(1))
            if self._reasonable_dimension(num):
                candidates.append(num)

        unique_candidates: list[int] = []
        for num in candidates:
            if num not in unique_candidates:
                unique_candidates.append(num)

        if len(unique_candidates) >= 2:
            return {"width": unique_candidates[0], "height": unique_candidates[1]}
        if len(unique_candidates) == 1:
            return {"width": unique_candidates[0], "height": None}
        return {"width": None, "height": None}

    def _reasonable_dimension(self, value: int) -> bool:
        return 300 <= value <= 3500

    def _detect_safety_glass(self, text: str, glazing: str) -> bool:
        text_upper = text.upper()
        for keyword in self.SAFETY_GLASS_KEYWORDS:
            if keyword in text_upper:
                return True
        glazing_upper = glazing.upper() if glazing else ""
        return "SAFETY" in glazing_upper or "6.3MM" in glazing_upper or "6MM" in glazing_upper

    def _normalize_code(self, value: str) -> str:
        compact = re.sub(r"[^A-Z0-9]", "", value.upper())
        return compact


def extract_schedules(pdf_path: str, source_name: str | None = None) -> dict[str, Any]:
    extractor = ScheduleExtractor(pdf_path, source_name=source_name)
    return extractor.extract()


class ImageScheduleExtractor(ScheduleExtractor):
    """Extract whatever we can from image-based quote requests."""

    def extract(self) -> dict[str, Any]:
        try:
            ocr_pages = self._run_ocr_image()
            if ocr_pages:
                combined_ocr_text = "\n".join(ocr_pages)
                self.document_info = self._extract_document_info(combined_ocr_text, "ocr")
                self.schedule_items = self._extract_from_ocr_text(ocr_pages)
                if self.schedule_items:
                    self.warnings.append("Rows were extracted from OCR and should be reviewed before pricing.")
                else:
                    self.warnings.append("Image text was read, but no opening rows could be confidently extracted.")
            else:
                self.document_info = self._extract_document_info("", "filename")
                self.warnings.append("This image could not be read clearly enough for intake.")

            return {
                "schedule_items": self.schedule_items,
                "warnings": self.warnings,
                "page_count": 1,
                "schedule_page_count": 0,
                "document_info": self.document_info,
            }
        except Exception as exc:
            self.warnings.append(f"Error during extraction: {exc}")
            return {
                "schedule_items": [],
                "warnings": self.warnings,
                "page_count": 1,
                "schedule_page_count": 0,
                "document_info": self.document_info,
            }

    def _run_ocr_image(self) -> list[str]:
        if fitz is None or RapidOCR is None or np is None:
            self.warnings.append("OCR dependencies are unavailable for image intake.")
            return []

        engine = RapidOCR()
        base_pixmap = fitz.Pixmap(self.pdf_path)
        pixmap = fitz.Pixmap(fitz.csRGB, base_pixmap) if base_pixmap.alpha or base_pixmap.colorspace.n != 3 else base_pixmap
        try:
            image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
            result, _ = engine(image)
        finally:
            if pixmap is not base_pixmap:
                pixmap = None
            base_pixmap = None

        if not result:
            return []

        lines = [entry[1] for entry in result if len(entry) >= 2 and str(entry[1]).strip()]
        return ["\n".join(lines)] if lines else []


def extract_document_intake(document_path: str, source_name: str | None = None) -> dict[str, Any]:
    suffix = Path(document_path).suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        extractor = ImageScheduleExtractor(document_path, source_name=source_name)
        return extractor.extract()
    return extract_schedules(document_path, source_name=source_name)


def to_csv(schedule_items: list[dict[str, Any]], output_path: str) -> None:
    if not schedule_items:
        return

    fieldnames = ["code", "width", "height", "finish", "glazing", "safety_flag", "schedule_type", "flags"]
    with open(output_path, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for item in schedule_items:
            row = {key: item.get(key, "") for key in fieldnames}
            if isinstance(row["flags"], list):
                row["flags"] = "; ".join(row["flags"])
            writer.writerow(row)


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) < 2:
        print("Usage: python pdf_intake.py <pdf_path> [output_csv_path]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_csv = sys.argv[2] if len(sys.argv) > 2 else "extracted_schedules.csv"
    result = extract_schedules(pdf_path)
    print(json.dumps(result, indent=2, default=str))
    to_csv(result["schedule_items"], output_csv)
