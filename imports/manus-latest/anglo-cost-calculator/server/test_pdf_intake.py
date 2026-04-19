"""
Test suite for pdf_intake.py

Tests the extraction pipeline against the Jones-Fernkloof PDF.
"""

import pytest
import os
import tempfile
from pdf_intake import extract_schedules, to_csv, ScheduleExtractor


class TestPdfIntake:
    """Test PDF extraction pipeline."""

    @pytest.fixture
    def jones_pdf_path(self):
        """Path to test PDF."""
        return '/home/ubuntu/upload/Jones-Fernkloof-MunRev04_compressed.pdf'

    def test_extract_schedules_returns_dict(self, jones_pdf_path):
        """Test that extract_schedules returns expected dict structure."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        
        assert isinstance(result, dict)
        assert 'schedule_items' in result
        assert 'warnings' in result
        assert 'page_count' in result
        assert 'schedule_page_count' in result

    def test_extract_schedules_finds_pages(self, jones_pdf_path):
        """Test that extractor identifies schedule pages."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        
        assert result['page_count'] == 11, "Jones PDF should have 11 pages"
        assert result['schedule_page_count'] >= 2, "Should find at least 2 schedule pages"

    def test_extract_schedules_yields_items(self, jones_pdf_path):
        """Test that extractor yields schedule items."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        
        assert len(result['schedule_items']) > 0, "Should extract at least one item"
        
        # Check structure of first item
        item = result['schedule_items'][0]
        assert 'code' in item
        assert 'width' in item
        assert 'height' in item
        assert 'finish' in item
        assert 'glazing' in item
        assert 'safety_flag' in item
        assert 'schedule_type' in item

    def test_extract_schedules_finds_doors_and_windows(self, jones_pdf_path):
        """Test that extractor finds both doors and windows."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        items = result['schedule_items']
        
        # Check for door codes (D, SD)
        door_items = [i for i in items if i['code'].startswith('D') or i['code'].startswith('SD')]
        assert len(door_items) > 0, "Should extract door items"
        
        # Check for window codes (W)
        window_items = [i for i in items if i['code'].startswith('W')]
        assert len(window_items) > 0, "Should extract window items"

    def test_extract_schedules_captures_finish(self, jones_pdf_path):
        """Test that extractor captures finish specifications."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        items = result['schedule_items']
        
        # Check that at least some items have recognized finishes
        finishes = [i['finish'] for i in items if i['finish'] != 'UNKNOWN']
        assert len(finishes) > 0, "Should extract at least some finish specifications"
        
        # Check for expected finish types
        finish_types = set(finishes)
        assert any('ALUMINUM' in f or 'TIMBER' in f for f in finish_types), \
            "Should find ALUMINUM or TIMBER finishes"

    def test_extract_schedules_captures_glazing(self, jones_pdf_path):
        """Test that extractor captures glazing specifications."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        items = result['schedule_items']
        
        # Check that glazing data is captured
        glazing_specs = [i['glazing'] for i in items if i['glazing'] != 'N/A']
        assert len(glazing_specs) > 0, "Should extract glazing specifications"

    def test_extract_schedules_flags_safety_glass(self, jones_pdf_path):
        """Test that extractor identifies safety glass."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        items = result['schedule_items']
        
        # Check for safety flags
        safety_items = [i for i in items if i['safety_flag']]
        assert len(safety_items) > 0, "Should identify safety glass items"

    def test_to_csv_writes_file(self, jones_pdf_path):
        """Test that to_csv writes a valid CSV file."""
        if not os.path.exists(jones_pdf_path):
            pytest.skip(f"Test PDF not found: {jones_pdf_path}")
        
        result = extract_schedules(jones_pdf_path)
        items = result['schedule_items']
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            csv_path = f.name
        
        try:
            to_csv(items, csv_path)
            
            # Verify file was created and has content
            assert os.path.exists(csv_path), "CSV file should be created"
            
            with open(csv_path, 'r') as f:
                lines = f.readlines()
            
            assert len(lines) > 1, "CSV should have header + data rows"
            assert 'code' in lines[0], "CSV header should contain 'code'"
            assert 'width' in lines[0], "CSV header should contain 'width'"
            assert 'height' in lines[0], "CSV header should contain 'height'"
        finally:
            if os.path.exists(csv_path):
                os.remove(csv_path)

    def test_extract_dimensions_single_number(self):
        """Test dimension extraction with single number."""
        extractor = ScheduleExtractor('')
        result = extractor._extract_dimensions('Width: 1000mm')
        
        assert result['width'] == 1000
        assert result['height'] is None

    def test_extract_dimensions_two_numbers(self):
        """Test dimension extraction with two numbers."""
        extractor = ScheduleExtractor('')
        result = extractor._extract_dimensions('1000 / 2000')
        
        assert result['width'] == 1000
        assert result['height'] == 2000

    def test_extract_dimensions_no_numbers(self):
        """Test dimension extraction with no valid numbers."""
        extractor = ScheduleExtractor('')
        result = extractor._extract_dimensions('No dimensions here')
        
        assert result['width'] is None
        assert result['height'] is None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
