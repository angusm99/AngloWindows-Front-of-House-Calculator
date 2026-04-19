"""
pdf_intake.py — Extract window and door schedule data from architectural PDFs.

This module reads architectural drawing PDFs, identifies schedule pages,
extracts structured data (code, width, height, finish, glazing), and outputs
a CSV ready for product matching and costing.

Improved extraction focuses on:
- Accurate dimension parsing from schedule cards (avoiding page numbers, artifacts)
- Robust finish and glazing detection
- Safety glass flag detection
- Reduced false positives and warnings

Usage:
    from pdf_intake import extract_schedules
    result = extract_schedules('path/to/drawing.pdf')
    print(result['schedule_items'])  # List of dicts with extracted data
    print(result['warnings'])        # Ambiguous or flagged rows
"""

import re
import csv
from typing import List, Dict, Any, Optional

try:
    import pdfplumber
except ImportError:  # pragma: no cover - environment-dependent import
    pdfplumber = None


class ScheduleExtractor:
    """Extract window and door schedule data from architectural PDFs."""

    # Keywords that identify schedule pages
    SCHEDULE_PAGE_KEYWORDS = {
        'WINDOW SCHEDULE': 'window',
        'DOOR SCHEDULE': 'door',
        'W&D SCHEDULE': 'mixed',
        'WINDOW & DOOR': 'mixed',
    }

    # Regex patterns for extracting data from schedule cards
    # Pattern: opening code (W1, D10, SD5, etc.)
    CODE_PATTERN = r'\b([WD]|SD)(\d+)\b'

    # Pattern: finish specifications (ALUMINUM, TIMBER, STEEL, etc.)
    # Must match full phrases like "ALUMINUM - EPOXY COATED - DARK GREY"
    FINISH_PATTERN = r'(ALUMINUM(?:\s*-\s*(?:EPOXY\s+COATED|ANODISED))?|TIMBER|TIMBER\s+FRAME|STEEL|MILD\s+STEEL)'

    # Pattern: glazing and safety glass notes
    # Matches specific glazing specs like "6.3mm Safety Glazing", "6mm", "FROSTED", etc.
    GLAZING_PATTERN = r'((?:6\.3mm|6mm|4mm)\s+(?:Safety\s+)?Glazing|Safety\s+Glazing|FROSTED|CLEAR|AS\s+PER\s+RATIONAL\s+DESIGN|N/A)'

    # Safety glass indicators
    SAFETY_GLASS_KEYWORDS = ['SAFETY GLAZING', '6.3MM', '6MM SAFETY', 'SAFETY GLASS']

    def __init__(self, pdf_path: str):
        """Initialize extractor with PDF file path."""
        self.pdf_path = pdf_path
        self.pages = []
        self.schedule_pages = []
        self.schedule_items = []
        self.warnings = []

    def extract(self) -> Dict[str, Any]:
        """
        Main extraction pipeline.
        
        Returns:
            Dict with keys:
            - 'schedule_items': List of extracted schedule rows
            - 'warnings': List of ambiguous or flagged rows
            - 'page_count': Total pages processed
            - 'schedule_page_count': Number of schedule pages found
        """
        if pdfplumber is None:
            raise RuntimeError("PDF extraction requires pdfplumber. Run start.ps1 again to install it.")

        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                self.pages = pdf.pages
                
                # Classify pages and identify schedules
                for i, page in enumerate(self.pages):
                    page_text = page.extract_text() or ""
                    if self._is_schedule_page(page_text):
                        self.schedule_pages.append((i, page_text, self._classify_schedule_type(page_text)))
                
                # Extract data from each schedule page
                for page_idx, page_text, schedule_type in self.schedule_pages:
                    items = self._extract_from_schedule_page(page_text, schedule_type)
                    self.schedule_items.extend(items)
            
            return {
                'schedule_items': self.schedule_items,
                'warnings': self.warnings,
                'page_count': len(self.pages),
                'schedule_page_count': len(self.schedule_pages),
            }
        except Exception as e:
            self.warnings.append(f"Error during extraction: {str(e)}")
            return {
                'schedule_items': [],
                'warnings': self.warnings,
                'page_count': 0,
                'schedule_page_count': 0,
            }

    def _is_schedule_page(self, text: str) -> bool:
        """Check if page contains schedule data."""
        text_upper = text.upper()
        for keyword in self.SCHEDULE_PAGE_KEYWORDS.keys():
            if keyword in text_upper:
                return True
        return False

    def _classify_schedule_type(self, text: str) -> str:
        """Classify schedule as window, door, or mixed."""
        text_upper = text.upper()
        if 'WINDOW SCHEDULE' in text_upper:
            return 'window'
        elif 'DOOR SCHEDULE' in text_upper:
            return 'door'
        else:
            return 'mixed'

    def _extract_from_schedule_page(self, page_text: str, schedule_type: str) -> List[Dict[str, Any]]:
        """
        Extract schedule items from a single schedule page.
        
        Splits page into card chunks (separated by repeated headers) and extracts
        {code, width, height, finish, glazing, safety_flag} from each card.
        """
        items = []
        
        # Split by common schedule card delimiters
        # Cards are typically separated by repeated header lines or blank sections
        card_delimiter = r'(?:WINDOW NAME|DOOR NAME|WINDOW SCHEDULE|DOOR SCHEDULE)'
        cards = re.split(card_delimiter, page_text)
        
        for card_idx, card_text in enumerate(cards):
            if not card_text.strip():
                continue
            
            item = self._parse_card(card_text, schedule_type, card_idx)
            if item:
                items.append(item)
        
        return items

    def _parse_card(self, card_text: str, schedule_type: str, card_idx: int) -> Optional[Dict[str, Any]]:
        """
        Parse a single schedule card and extract structured data.
        
        Returns:
            Dict with keys: code, width, height, finish, glazing, safety_flag, schedule_type
            or None if parsing fails.
        """
        card_text = card_text.strip()
        if not card_text:
            return None
        
        # Extract opening code (W1, D10, SD5, etc.)
        code_match = re.search(self.CODE_PATTERN, card_text)
        if not code_match:
            return None
        
        code = code_match.group(0)
        
        # Extract dimensions using improved parsing
        dimensions = self._extract_dimensions_improved(card_text, code)
        width = dimensions.get('width')
        height = dimensions.get('height')
        
        # Extract finish (ALUMINUM, TIMBER, etc.)
        finish_match = re.search(self.FINISH_PATTERN, card_text, re.IGNORECASE)
        finish = finish_match.group(0).upper() if finish_match else "UNKNOWN"
        
        # Extract glazing and safety flag
        glazing_match = re.search(self.GLAZING_PATTERN, card_text, re.IGNORECASE)
        glazing = glazing_match.group(0) if glazing_match else "N/A"
        
        # Detect safety glass
        safety_flag = self._detect_safety_glass(card_text, glazing)
        
        # Flag ambiguous rows
        flags = []
        if not width or not height:
            flags.append("Missing or ambiguous dimension")
        if finish == "UNKNOWN":
            flags.append("Unknown finish")
        if glazing == "N/A" and schedule_type == 'window':
            flags.append("No glazing specified for window")
        
        return {
            'code': code,
            'width': width,
            'height': height,
            'finish': finish,
            'glazing': glazing,
            'safety_flag': safety_flag,
            'schedule_type': schedule_type,
            'flags': flags,
            'raw_text': card_text[:200],  # For debugging
        }

    def _extract_dimensions_improved(self, text: str, code: str) -> Dict[str, Optional[int]]:
        """
        Extract width and height dimensions from card text with improved accuracy.
        
        Strategy:
        1. Look for lines that contain the opening code
        2. Extract dimensions from the immediate context of the code
        3. Prefer dimensions that appear on the same line or nearby lines
        4. Filter out page numbers and other artifacts (very large or very small numbers)
        """
        # Find the line containing the code
        lines = text.split('\n')
        code_line_idx = -1
        
        for i, line in enumerate(lines):
            if code in line:
                code_line_idx = i
                break
        
        if code_line_idx == -1:
            return {'width': None, 'height': None}
        
        # Extract numbers from the code line and surrounding lines (context window)
        context_start = max(0, code_line_idx - 2)
        context_end = min(len(lines), code_line_idx + 3)
        context_text = '\n'.join(lines[context_start:context_end])
        
        # Find all 4-digit numbers (typical for mm dimensions in architectural drawings)
        # Filter out very large numbers (page numbers, etc.)
        candidates = []
        for match in re.finditer(r'\b(\d{3,4})\b', context_text):
            num = int(match.group(1))
            # Reasonable range for window/door dimensions: 300mm to 3500mm
            if 300 <= num <= 3500:
                candidates.append(num)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_candidates = []
        for num in candidates:
            if num not in seen:
                unique_candidates.append(num)
                seen.add(num)
        
        if len(unique_candidates) >= 2:
            return {
                'width': unique_candidates[0],
                'height': unique_candidates[1],
            }
        elif len(unique_candidates) == 1:
            return {
                'width': unique_candidates[0],
                'height': None,
            }
        
        return {'width': None, 'height': None}

    def _detect_safety_glass(self, text: str, glazing: str) -> bool:
        """
        Detect if safety glass is specified.
        
        Looks for explicit safety glass keywords or specific glazing thicknesses
        that indicate safety glass (e.g., 6.3mm, 6mm).
        """
        text_upper = text.upper()
        
        # Check for explicit safety glass keywords
        for keyword in self.SAFETY_GLASS_KEYWORDS:
            if keyword in text_upper:
                return True
        
        # Check glazing string for safety indicators
        if glazing:
            glazing_upper = glazing.upper()
            if 'SAFETY' in glazing_upper or '6.3MM' in glazing_upper or '6MM' in glazing_upper:
                return True
        
        return False


def extract_schedules(pdf_path: str) -> Dict[str, Any]:
    """
    Extract window and door schedules from an architectural PDF.
    
    Args:
        pdf_path: Path to the PDF file
    
    Returns:
        Dict with:
        - 'schedule_items': List of extracted schedule rows
        - 'warnings': List of ambiguous or flagged rows
        - 'page_count': Total pages processed
        - 'schedule_page_count': Number of schedule pages found
    
    Example:
        result = extract_schedules('drawing.pdf')
        for item in result['schedule_items']:
            print(f"{item['code']}: {item['width']}x{item['height']} ({item['finish']})")
    """
    extractor = ScheduleExtractor(pdf_path)
    return extractor.extract()


def to_csv(schedule_items: List[Dict[str, Any]], output_path: str) -> None:
    """
    Write extracted schedule items to a CSV file for product matching.
    
    Args:
        schedule_items: List of extracted schedule dicts
        output_path: Path to output CSV file
    """
    if not schedule_items:
        return
    
    fieldnames = ['code', 'width', 'height', 'finish', 'glazing', 'safety_flag', 'schedule_type', 'flags']
    
    with open(output_path, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for item in schedule_items:
            row = {k: item.get(k, '') for k in fieldnames}
            # Convert flags list to string
            if isinstance(row['flags'], list):
                row['flags'] = '; '.join(row['flags'])
            writer.writerow(row)


if __name__ == '__main__':
    # Test against Jones-Fernkloof PDF
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python pdf_intake.py <pdf_path> [output_csv_path]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_csv = sys.argv[2] if len(sys.argv) > 2 else 'extracted_schedules.csv'
    
    print(f"Extracting schedules from: {pdf_path}")
    result = extract_schedules(pdf_path)
    
    print(f"\nResults:")
    print(f"  Pages processed: {result['page_count']}")
    print(f"  Schedule pages found: {result['schedule_page_count']}")
    print(f"  Items extracted: {len(result['schedule_items'])}")
    
    if result['warnings']:
        print(f"\nWarnings ({len(result['warnings'])}):")
        for warning in result['warnings'][:10]:
            print(f"  - {warning}")
    
    # Write CSV
    to_csv(result['schedule_items'], output_csv)
    print(f"\nSchedule items written to: {output_csv}")
    
    # Print first few items
    print(f"\nFirst 5 items:")
    for item in result['schedule_items'][:5]:
        print(f"  {item['code']}: {item['width']}×{item['height']} | {item['finish']} | {item['glazing']} | Safety: {item['safety_flag']}")
