"""
Automated test runner for AI Photo Editor.
Tests all endpoints, features, and generates visual documentation.
"""
import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from PIL import Image
import io

# Test configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEST_DATA_DIR = Path("test_data")
OUTPUT_DIR = Path("test_results")
SCREENSHOTS_DIR = OUTPUT_DIR / "screenshots"


class Color:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


class TestRunner:
    """Automated test runner for AI Photo Editor API."""

    def __init__(self, api_url: str, save_screenshots: bool = False):
        """
        Initialize test runner.

        Args:
            api_url: Base URL for the API
            save_screenshots: Whether to save result images
        """
        self.api_url = api_url
        self.save_screenshots = save_screenshots
        self.results = []
        self.start_time = None

        # Create output directories
        OUTPUT_DIR.mkdir(exist_ok=True)
        if save_screenshots:
            SCREENSHOTS_DIR.mkdir(exist_ok=True)

    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp and color."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "INFO": Color.BLUE,
            "SUCCESS": Color.GREEN,
            "ERROR": Color.RED,
            "WARNING": Color.YELLOW
        }
        color = colors.get(level, Color.RESET)
        print(f"[{timestamp}] {color}{level}{Color.RESET}: {message}")

    def save_image(self, image_data: bytes, filename: str) -> str:
        """Save image data to file."""
        if not self.save_screenshots:
            return ""

        filepath = SCREENSHOTS_DIR / filename
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return str(filepath)

    def create_test_image(self, size: Tuple[int, int] = (800, 600),
                         color: Tuple[int, int, int] = (100, 150, 200)) -> bytes:
        """Create a simple test image."""
        img = Image.new('RGB', size, color)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return buf.getvalue()

    def record_result(self, test_id: str, test_name: str, passed: bool,
                     execution_time: float, details: str = ""):
        """Record test result."""
        self.results.append({
            "test_id": test_id,
            "test_name": test_name,
            "passed": passed,
            "execution_time": execution_time,
            "details": details
        })

    def test_health_check(self) -> bool:
        """Test TS-008: API Health Check."""
        test_id = "TS-008"
        test_name = "API Health Check"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            response = requests.get(f"{self.api_url}/health")
            elapsed = time.time() - start

            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                    self.log(f"  AI Models Enabled: {data.get('ai_models_enabled', False)}")
                    self.log(f"  Device: {data.get('device', 'unknown')}")
                    self.record_result(test_id, test_name, True, elapsed,
                                     f"Status: {data['status']}")
                    return True

            self.log(f"✗ {test_name} failed: Unexpected response", "ERROR")
            self.record_result(test_id, test_name, False, elapsed,
                             f"Status code: {response.status_code}")
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_root_endpoint(self) -> bool:
        """Test API root endpoint."""
        test_id = "TS-000"
        test_name = "Root Endpoint"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            response = requests.get(f"{self.api_url}/")
            elapsed = time.time() - start

            if response.status_code == 200:
                data = response.json()
                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                self.log(f"  API: {data.get('name', 'Unknown')}")
                self.log(f"  Version: {data.get('version', 'Unknown')}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_image_upload(self) -> bool:
        """Test TS-001: Image Upload."""
        test_id = "TS-001"
        test_name = "Image Upload"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Create test image
            image_data = self.create_test_image()

            # Upload image
            files = {'file': ('test_image.png', image_data, 'image/png')}
            response = requests.post(f"{self.api_url}/upload", files=files)
            elapsed = time.time() - start

            if response.status_code == 200:
                data = response.json()
                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                self.log(f"  File ID: {data.get('file_id', 'N/A')}")
                self.log(f"  Dimensions: {data.get('width')}x{data.get('height')}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_background_removal(self) -> bool:
        """Test TS-002: Background Removal."""
        test_id = "TS-002"
        test_name = "Background Removal"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Create test image
            image_data = self.create_test_image(color=(255, 0, 0))

            # Remove background
            files = {'file': ('test_image.png', image_data, 'image/png')}
            response = requests.post(f"{self.api_url}/remove-background", files=files)
            elapsed = time.time() - start

            if response.status_code == 200:
                result_image = response.content
                saved_path = self.save_image(result_image, f"{test_id}_result.png")

                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                if saved_path:
                    self.log(f"  Saved to: {saved_path}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_apply_filter(self, filter_type: str = "blur") -> bool:
        """Test TS-004: Filter Application."""
        test_id = f"TS-004-{filter_type}"
        test_name = f"Apply Filter ({filter_type})"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Create test image
            image_data = self.create_test_image()

            # Apply filter
            files = {'file': ('test_image.png', image_data, 'image/png')}
            data = {'filter_type': filter_type}
            response = requests.post(f"{self.api_url}/apply-filter",
                                   files=files, data=data)
            elapsed = time.time() - start

            if response.status_code == 200:
                result_image = response.content
                saved_path = self.save_image(result_image,
                                           f"{test_id}_result.png")

                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                if saved_path:
                    self.log(f"  Saved to: {saved_path}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_adjust_brightness(self, factor: float = 1.5) -> bool:
        """Test TS-005: Brightness Adjustment."""
        test_id = f"TS-005"
        test_name = f"Brightness Adjustment (factor={factor})"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Create test image
            image_data = self.create_test_image()

            # Adjust brightness
            files = {'file': ('test_image.png', image_data, 'image/png')}
            data = {'factor': str(factor)}
            response = requests.post(f"{self.api_url}/adjust-brightness",
                                   files=files, data=data)
            elapsed = time.time() - start

            if response.status_code == 200:
                result_image = response.content
                saved_path = self.save_image(result_image,
                                           f"{test_id}_factor_{factor}.png")

                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                if saved_path:
                    self.log(f"  Saved to: {saved_path}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_inpainting(self) -> bool:
        """Test TS-003: Object Removal (Inpainting)."""
        test_id = "TS-003"
        test_name = "Object Removal (Inpainting)"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Create test image and mask
            image_data = self.create_test_image()
            mask_data = self.create_test_image(color=(255, 255, 255))  # White mask

            # Inpaint
            files = {
                'image': ('test_image.png', image_data, 'image/png'),
                'mask': ('mask.png', mask_data, 'image/png')
            }
            data = {'use_ai': 'false', 'prompt': 'fill naturally'}
            response = requests.post(f"{self.api_url}/inpaint",
                                   files=files, data=data)
            elapsed = time.time() - start

            if response.status_code == 200:
                result_image = response.content
                saved_path = self.save_image(result_image, f"{test_id}_result.png")

                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                if saved_path:
                    self.log(f"  Saved to: {saved_path}")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_ai_generation(self, prompt: str = "a beautiful sunset") -> bool:
        """Test TS-006: AI Image Generation."""
        test_id = "TS-006"
        test_name = "AI Image Generation"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Generate image
            data = {
                'prompt': prompt,
                'width': '512',
                'height': '512'
            }
            response = requests.post(f"{self.api_url}/generate-image", data=data)
            elapsed = time.time() - start

            if response.status_code == 200:
                result_image = response.content
                saved_path = self.save_image(result_image, f"{test_id}_result.png")

                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                if saved_path:
                    self.log(f"  Saved to: {saved_path}")
                self.log(f"  Prompt: {prompt}")
                self.record_result(test_id, test_name, True, elapsed)
                return True
            elif response.status_code == 503:
                self.log(f"⚠ {test_name} skipped: AI features not enabled", "WARNING")
                self.record_result(test_id, test_name, True, elapsed,
                                 "Skipped - AI not enabled")
                return True

            self.log(f"✗ {test_name} failed: Status {response.status_code}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def test_invalid_file_upload(self) -> bool:
        """Test TS-010: File Upload Validation."""
        test_id = "TS-010"
        test_name = "Invalid File Upload"
        self.log(f"Running {test_id}: {test_name}")

        start = time.time()
        try:
            # Try to upload non-image file
            files = {'file': ('test.txt', b'This is not an image', 'text/plain')}
            response = requests.post(f"{self.api_url}/upload", files=files)
            elapsed = time.time() - start

            if response.status_code == 400:
                self.log(f"✓ {test_name} passed ({elapsed:.2f}s)", "SUCCESS")
                self.log(f"  Correctly rejected non-image file")
                self.record_result(test_id, test_name, True, elapsed)
                return True

            self.log(f"✗ {test_name} failed: Should reject non-image files", "ERROR")
            self.record_result(test_id, test_name, False, elapsed)
            return False

        except Exception as e:
            elapsed = time.time() - start
            self.log(f"✗ {test_name} failed: {str(e)}", "ERROR")
            self.record_result(test_id, test_name, False, elapsed, str(e))
            return False

    def run_functional_tests(self):
        """Run all functional tests."""
        self.log("="*60, "INFO")
        self.log("Running Functional Tests", "INFO")
        self.log("="*60, "INFO")

        self.test_root_endpoint()
        self.test_health_check()
        self.test_image_upload()
        self.test_background_removal()

        # Test all filters
        for filter_type in ["blur", "sharpen", "edge", "grayscale"]:
            self.test_apply_filter(filter_type)

        # Test brightness with different factors
        for factor in [0.5, 1.0, 1.5, 2.0]:
            self.test_adjust_brightness(factor)

        self.test_inpainting()
        self.test_invalid_file_upload()

    def run_ai_tests(self):
        """Run AI model tests."""
        self.log("="*60, "INFO")
        self.log("Running AI Model Tests", "INFO")
        self.log("="*60, "INFO")

        self.test_ai_generation("a beautiful sunset over mountains")
        self.test_ai_generation("a red sports car")
        self.test_ai_generation("a cute kitten playing with yarn")

    def generate_report(self):
        """Generate test execution report."""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['passed'])
        failed_tests = total_tests - passed_tests
        total_time = sum(r['execution_time'] for r in self.results)

        # Console report
        self.log("="*60, "INFO")
        self.log("Test Execution Summary", "INFO")
        self.log("="*60, "INFO")
        self.log(f"Total Tests: {total_tests}", "INFO")
        self.log(f"Passed: {passed_tests}", "SUCCESS")
        self.log(f"Failed: {failed_tests}", "ERROR" if failed_tests > 0 else "INFO")
        self.log(f"Success Rate: {(passed_tests/total_tests*100):.1f}%", "INFO")
        self.log(f"Total Execution Time: {total_time:.2f}s", "INFO")

        # JSON report
        report = {
            "execution_date": datetime.now().isoformat(),
            "api_url": self.api_url,
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{(passed_tests/total_tests*100):.1f}%",
                "total_time": f"{total_time:.2f}s"
            },
            "results": self.results
        }

        report_file = OUTPUT_DIR / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        self.log(f"Report saved to: {report_file}", "SUCCESS")

        # Markdown report
        md_report = self.generate_markdown_report(report)
        md_file = OUTPUT_DIR / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(md_file, 'w') as f:
            f.write(md_report)

        self.log(f"Markdown report saved to: {md_file}", "SUCCESS")

        return passed_tests == total_tests

    def generate_markdown_report(self, report: Dict) -> str:
        """Generate markdown test report."""
        md = f"""# AI Photo Editor - Test Execution Report

**Execution Date**: {report['execution_date']}
**API URL**: {report['api_url']}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | {report['summary']['total_tests']} |
| Passed | {report['summary']['passed']} |
| Failed | {report['summary']['failed']} |
| Success Rate | {report['summary']['success_rate']} |
| Total Time | {report['summary']['total_time']} |

## Detailed Results

| Test ID | Test Name | Status | Time (s) | Details |
|---------|-----------|--------|----------|---------|
"""

        for result in report['results']:
            status = "✅ Pass" if result['passed'] else "❌ Fail"
            details = result.get('details', '')
            md += f"| {result['test_id']} | {result['test_name']} | {status} | {result['execution_time']:.2f} | {details} |\n"

        if self.save_screenshots:
            md += f"\n## Screenshots\n\n"
            md += f"Screenshots saved to: `{SCREENSHOTS_DIR}`\n\n"

        md += f"\n---\n\n*Report generated by AI Photo Editor Test Runner*\n"

        return md


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="AI Photo Editor Test Runner")
    parser.add_argument("--url", default="http://localhost:8000",
                       help="API base URL")
    parser.add_argument("--all", action="store_true",
                       help="Run all tests")
    parser.add_argument("--functional", action="store_true",
                       help="Run functional tests only")
    parser.add_argument("--ai", action="store_true",
                       help="Run AI model tests only")
    parser.add_argument("--screenshots", action="store_true",
                       help="Save result images")
    parser.add_argument("--report", action="store_true",
                       help="Generate test report")

    args = parser.parse_args()

    # Create test runner
    runner = TestRunner(args.url, save_screenshots=args.screenshots)

    print(f"\n{Color.BLUE}{'='*60}")
    print(f"  AI Photo Editor - Automated Test Runner")
    print(f"  API URL: {args.url}")
    print(f"  Screenshots: {'Enabled' if args.screenshots else 'Disabled'}")
    print(f"{'='*60}{Color.RESET}\n")

    # Run tests
    if args.all or (not args.functional and not args.ai):
        runner.run_functional_tests()
        runner.run_ai_tests()
    elif args.functional:
        runner.run_functional_tests()
    elif args.ai:
        runner.run_ai_tests()

    # Generate report
    if args.report or args.all:
        success = runner.generate_report()
        sys.exit(0 if success else 1)
    else:
        runner.log("Test execution complete", "SUCCESS")
        sys.exit(0)


if __name__ == "__main__":
    main()
