#!/bin/bash
# Master test runner script for AI Photo Editor
# Runs all tests and generates comprehensive reports

set -e  # Exit on error

echo "=================================="
echo "  AI Photo Editor - Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TEST_DIR="./test_results"

# Create test results directory
mkdir -p "$TEST_DIR"

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo "  Results Directory: $TEST_DIR"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2

    echo -n "Checking $name... "
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Check if backend is running
if ! check_service "$API_URL/health" "Backend API"; then
    echo -e "${YELLOW}Warning: Backend is not running. Some tests will be skipped.${NC}"
    echo "Start backend with: cd backend && uvicorn main:app --reload"
    BACKEND_RUNNING=false
else
    BACKEND_RUNNING=true
fi

# Check if frontend is running (for visual tests)
if ! check_service "$FRONTEND_URL" "Frontend"; then
    echo -e "${YELLOW}Warning: Frontend is not running. Visual tests will be skipped.${NC}"
    echo "Start frontend with: cd frontend && npm run dev"
    FRONTEND_RUNNING=false
else
    FRONTEND_RUNNING=true
fi

echo ""

# Parse command line arguments
RUN_FUNCTIONAL=false
RUN_AI=false
RUN_VISUAL=false
RUN_PERFORMANCE=false
GENERATE_SCREENSHOTS=false
GENERATE_REPORT=true

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all                Run all tests"
    echo "  --functional         Run functional tests only"
    echo "  --ai                 Run AI model tests only"
    echo "  --visual             Run visual documentation tests"
    echo "  --performance        Run performance tests"
    echo "  --screenshots        Save screenshots during tests"
    echo "  --no-report          Skip report generation"
    echo "  -h, --help           Show this help message"
    echo ""
    exit 0
fi

# Process arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            RUN_FUNCTIONAL=true
            RUN_AI=true
            RUN_VISUAL=true
            shift
            ;;
        --functional)
            RUN_FUNCTIONAL=true
            shift
            ;;
        --ai)
            RUN_AI=true
            shift
            ;;
        --visual)
            RUN_VISUAL=true
            shift
            ;;
        --performance)
            RUN_PERFORMANCE=true
            shift
            ;;
        --screenshots)
            GENERATE_SCREENSHOTS=true
            shift
            ;;
        --no-report)
            GENERATE_REPORT=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no specific test type selected, run all
if ! $RUN_FUNCTIONAL && ! $RUN_AI && ! $RUN_VISUAL && ! $RUN_PERFORMANCE; then
    RUN_FUNCTIONAL=true
    RUN_AI=true
    GENERATE_SCREENSHOTS=true
fi

echo "Test Plan:"
echo "  Functional Tests: $(if $RUN_FUNCTIONAL; then echo '✓ Yes'; else echo '✗ No'; fi)"
echo "  AI Model Tests: $(if $RUN_AI; then echo '✓ Yes'; else echo '✗ No'; fi)"
echo "  Visual Documentation: $(if $RUN_VISUAL; then echo '✓ Yes'; else echo '✗ No'; fi)"
echo "  Performance Tests: $(if $RUN_PERFORMANCE; then echo '✓ Yes'; else echo '✗ No'; fi)"
echo "  Screenshots: $(if $GENERATE_SCREENSHOTS; then echo '✓ Yes'; else echo '✗ No'; fi)"
echo ""

# Exit if backend is required but not running
if ($RUN_FUNCTIONAL || $RUN_AI) && ! $BACKEND_RUNNING; then
    echo -e "${RED}Error: Backend must be running for functional and AI tests${NC}"
    exit 1
fi

# Exit if frontend is required but not running
if $RUN_VISUAL && ! $FRONTEND_RUNNING; then
    echo -e "${RED}Error: Frontend must be running for visual documentation tests${NC}"
    exit 1
fi

echo "Starting tests..."
echo ""

# Track overall success
ALL_TESTS_PASSED=true

# Run functional tests
if $RUN_FUNCTIONAL; then
    echo "=================================="
    echo "  Running Functional Tests"
    echo "=================================="
    echo ""

    SCREENSHOT_FLAG=""
    if $GENERATE_SCREENSHOTS; then
        SCREENSHOT_FLAG="--screenshots"
    fi

    if python test_runner.py --functional --report $SCREENSHOT_FLAG --url "$API_URL"; then
        echo -e "${GREEN}✓ Functional tests passed${NC}"
    else
        echo -e "${RED}✗ Functional tests failed${NC}"
        ALL_TESTS_PASSED=false
    fi
    echo ""
fi

# Run AI model tests
if $RUN_AI; then
    echo "=================================="
    echo "  Running AI Model Tests"
    echo "=================================="
    echo ""

    if python test_runner.py --ai --report --url "$API_URL"; then
        echo -e "${GREEN}✓ AI model tests passed${NC}"
    else
        echo -e "${RED}✗ AI model tests failed${NC}"
        ALL_TESTS_PASSED=false
    fi
    echo ""
fi

# Run visual documentation
if $RUN_VISUAL; then
    echo "=================================="
    echo "  Generating Visual Documentation"
    echo "=================================="
    echo ""

    if python visual_documentation.py --url "$FRONTEND_URL" --output "$TEST_DIR"; then
        echo -e "${GREEN}✓ Visual documentation generated${NC}"
    else
        echo -e "${RED}✗ Visual documentation generation failed${NC}"
        ALL_TESTS_PASSED=false
    fi
    echo ""
fi

# Run performance tests
if $RUN_PERFORMANCE; then
    echo "=================================="
    echo "  Running Performance Tests"
    echo "=================================="
    echo ""

    echo "Starting locust performance test..."
    echo "Note: This will run for 60 seconds with 10 concurrent users"
    echo ""

    # Check if locustfile exists
    if [ ! -f "locustfile.py" ]; then
        echo -e "${YELLOW}Warning: locustfile.py not found. Skipping performance tests.${NC}"
    else
        if locust -f locustfile.py --headless -u 10 -r 2 -t 60s --host "$API_URL"; then
            echo -e "${GREEN}✓ Performance tests completed${NC}"
        else
            echo -e "${RED}✗ Performance tests failed${NC}"
            ALL_TESTS_PASSED=false
        fi
    fi
    echo ""
fi

# Generate consolidated report
if $GENERATE_REPORT; then
    echo "=================================="
    echo "  Generating Consolidated Report"
    echo "=================================="
    echo ""

    REPORT_FILE="$TEST_DIR/CONSOLIDATED_TEST_REPORT.md"

    cat > "$REPORT_FILE" << EOF
# AI Photo Editor - Test Execution Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**API URL**: $API_URL
**Frontend URL**: $FRONTEND_URL

---

## Test Execution Summary

| Test Category | Status |
|--------------|--------|
| Functional Tests | $(if $RUN_FUNCTIONAL; then echo '✅ Executed'; else echo '⏭️ Skipped'; fi) |
| AI Model Tests | $(if $RUN_AI; then echo '✅ Executed'; else echo '⏭️ Skipped'; fi) |
| Visual Documentation | $(if $RUN_VISUAL; then echo '✅ Executed'; else echo '⏭️ Skipped'; fi) |
| Performance Tests | $(if $RUN_PERFORMANCE; then echo '✅ Executed'; else echo '⏭️ Skipped'; fi) |

**Overall Result**: $(if $ALL_TESTS_PASSED; then echo '✅ PASSED'; else echo '❌ FAILED'; fi)

---

## Test Results Location

- Test results: \`$TEST_DIR/\`
- Individual test reports: See timestamped JSON/MD files
- Screenshots: \`$TEST_DIR/screenshots/\`
- Visual documentation: \`$TEST_DIR/visual_docs/\`

---

## Quick Links

- [Testing Scenarios Documentation](../TESTING_SCENARIOS.md)
- [Model Training Guide](../MODEL_TRAINING_GUIDE.md)
- [Main README](../README.md)

---

## Next Steps

1. Review individual test reports in the test_results directory
2. Check screenshots for visual verification
3. Address any failed tests
4. Update documentation if needed

---

*This report was automatically generated by the test runner.*
EOF

    echo "Consolidated report saved to: $REPORT_FILE"
    echo ""
fi

# Final summary
echo "=================================="
echo "  Test Execution Complete"
echo "=================================="
echo ""

if $ALL_TESTS_PASSED; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check reports for details.${NC}"
    exit 1
fi
