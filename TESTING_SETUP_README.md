# AI Photo Editor - Testing and Model Training Setup

This document provides instructions for running the comprehensive testing suite and training AI models for accurate results.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Running Tests](#running-tests)
4. [Visual Documentation](#visual-documentation)
5. [Model Training](#model-training)
6. [Test Results](#test-results)

---

## Prerequisites

### System Requirements

- Python 3.11+
- Node.js 20+
- 8GB RAM minimum (16GB recommended for AI models)
- GPU with 4GB+ VRAM (optional, for faster AI model inference)

### Install Testing Dependencies

```bash
# Backend testing dependencies
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt

# Install Playwright browsers (for visual documentation)
playwright install chromium
```

---

## Quick Start

### 1. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Run All Tests

**Terminal 3 - Tests:**
```bash
cd backend
./run_all_tests.sh --all --screenshots
```

This will:
- ✅ Run all functional tests
- ✅ Run AI model tests
- ✅ Generate visual documentation with screenshots
- ✅ Create comprehensive reports

---

## Running Tests

### Test Categories

#### 1. Functional Tests
Tests all API endpoints and basic functionality.

```bash
cd backend
python test_runner.py --functional --screenshots --report
```

Tests include:
- Health check
- Image upload
- Background removal
- Filter application
- Brightness adjustment
- Object removal (inpainting)
- File validation

#### 2. AI Model Tests
Tests AI image generation with different models.

```bash
cd backend
python test_runner.py --ai --report
```

Tests include:
- Stable Diffusion v1.5
- Stable Diffusion v2.1
- Inpainting models
- Different prompts and parameters

#### 3. Visual Documentation
Generates screenshots showing application functionality.

```bash
cd backend
python visual_documentation.py --url http://localhost:3000
```

Captures:
- Homepage
- Image upload flow
- Background removal
- Filter effects
- Brightness adjustment
- Object removal tool
- Responsive design

#### 4. All Tests at Once
```bash
cd backend
./run_all_tests.sh --all --screenshots
```

### Test Script Options

```bash
# Run specific test categories
./run_all_tests.sh --functional      # Functional tests only
./run_all_tests.sh --ai              # AI model tests only
./run_all_tests.sh --visual          # Visual documentation only

# With screenshots
./run_all_tests.sh --all --screenshots

# Without report generation
./run_all_tests.sh --all --no-report

# Show help
./run_all_tests.sh --help
```

---

## Visual Documentation

The visual documentation system automatically captures screenshots of the application in action.

### Generate Documentation

```bash
cd backend
python visual_documentation.py --url http://localhost:3000 --output test_results
```

### Output

The script generates:
- **Screenshots**: Saved in `test_results/visual_docs/`
- **Markdown Report**: `test_results/VISUAL_DOCUMENTATION.md`

The markdown report includes:
- Homepage overview
- Image upload demonstration
- Background removal before/after
- All filter effects
- Brightness adjustment levels
- Object removal workflow
- Responsive design on different devices

---

## Model Training

To train and optimize AI models for accurate results, follow the [Model Training Guide](MODEL_TRAINING_GUIDE.md).

### Available Models

The application supports multiple AI models:

| Model | Speed | Quality | Memory | Best For |
|-------|-------|---------|--------|----------|
| SD v1.5 | Fast | Good | 4GB | Quick generation |
| SD v2.1 | Slower | Excellent | 6GB | High quality |
| SD v2.1 Base | Medium | Very Good | 4GB | Balanced |
| SD Inpainting | Fast | Excellent | 4GB | Object removal |

### Quick Training Example

```python
from ai_models import get_model_manager

# Initialize model manager
manager = get_model_manager(device="cuda", model_cache_dir="./models")

# Load and test different models
models = ["sd-v1-5", "sd-v2-1", "sd-v2-1-base"]

for model_key in models:
    print(f"\nTesting {model_key}...")
    image = manager.generate_image(
        prompt="a beautiful landscape with mountains",
        model_key=model_key,
        num_inference_steps=50
    )
    image.save(f"test_output_{model_key}.png")
    print(f"✓ Generated image with {model_key}")
```

### Benchmarking Models

```python
cd backend
python -c "
from ai_models import get_model_manager
import time

manager = get_model_manager()

models = ['sd-v1-5', 'sd-v2-1', 'sd-v2-1-base']
prompt = 'a beautiful sunset over mountains'

for model in models:
    start = time.time()
    image = manager.generate_image(prompt=prompt, model_key=model)
    elapsed = time.time() - start
    print(f'{model}: {elapsed:.2f}s')
"
```

### Fine-Tuning for Your Use Case

See [MODEL_TRAINING_GUIDE.md](MODEL_TRAINING_GUIDE.md) for:
- Training custom models
- Fine-tuning with DreamBooth
- Using LoRA for efficient adaptation
- Optimization techniques
- Best practices

---

## Test Results

### Test Report Structure

After running tests, you'll find:

```
test_results/
├── screenshots/                    # Test result images
│   ├── TS-001_result.png
│   ├── TS-002_result.png
│   └── ...
├── visual_docs/                    # Visual documentation screenshots
│   ├── 01_homepage_full.png
│   ├── 02_homepage_viewport.png
│   └── ...
├── test_report_YYYYMMDD_HHMMSS.json   # Detailed JSON report
├── test_report_YYYYMMDD_HHMMSS.md     # Markdown report
├── VISUAL_DOCUMENTATION.md            # Visual guide with screenshots
└── CONSOLIDATED_TEST_REPORT.md        # Overall summary
```

### Understanding Test Reports

**JSON Report** (`test_report_*.json`):
- Machine-readable format
- Detailed execution data
- Individual test results
- Timing information

**Markdown Report** (`test_report_*.md`):
- Human-readable format
- Summary table
- Test details
- Pass/fail status

**Consolidated Report** (`CONSOLIDATED_TEST_REPORT.md`):
- Overall test execution summary
- Links to detailed reports
- Next steps

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install -r requirements-test.txt

    - name: Start backend
      run: |
        cd backend
        uvicorn main:app &
        sleep 10

    - name: Run functional tests
      run: |
        cd backend
        python test_runner.py --functional --report

    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: backend/test_results/
```

---

## Test Scenarios Coverage

See [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) for complete test scenario documentation, including:

- 20+ test scenarios
- Functional tests
- Integration tests
- Performance tests
- AI model tests
- Edge cases
- Visual regression tests

---

## Troubleshooting

### Backend Not Starting

```bash
# Check if port 8000 is in use
lsof -ti:8000 | xargs kill -9

# Start backend
cd backend
uvicorn main:app --reload
```

### Frontend Not Starting

```bash
# Check if port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Tests Failing

1. **Check services are running:**
   ```bash
   curl http://localhost:8000/health  # Backend
   curl http://localhost:3000         # Frontend
   ```

2. **Check logs:**
   ```bash
   # Backend logs
   tail -f backend/logs/*.log

   # Test logs
   cat test_results/test_report_*.json
   ```

3. **Re-run specific test:**
   ```bash
   cd backend
   python test_runner.py --functional
   ```

### AI Models Not Loading

1. **Check environment variables:**
   ```bash
   cat backend/.env
   # Should have: ENABLE_STABLE_DIFFUSION=true
   ```

2. **Check disk space:**
   ```bash
   df -h  # Models can be 4-6GB each
   ```

3. **Clear model cache:**
   ```bash
   rm -rf backend/models/*
   # Models will be re-downloaded
   ```

---

## Performance Optimization

### For Faster Tests

```bash
# Skip AI tests (much faster)
./run_all_tests.sh --functional

# Skip screenshots
./run_all_tests.sh --functional --no-screenshots

# Reduce inference steps in code:
# num_inference_steps = 20  # Instead of 50
```

### For Better AI Results

```bash
# Enable GPU
export DEVICE=cuda

# Use better model
# In .env: MODEL_ID=stabilityai/stable-diffusion-2-1

# Increase inference steps
# num_inference_steps = 75  # Instead of 50
```

---

## Contributing

When adding new features:

1. ✅ Add test scenarios to `TESTING_SCENARIOS.md`
2. ✅ Update `test_runner.py` with new tests
3. ✅ Run full test suite: `./run_all_tests.sh --all`
4. ✅ Update this README if needed

---

## Support

- **Documentation**: [README.md](README.md)
- **Test Scenarios**: [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md)
- **Model Training**: [MODEL_TRAINING_GUIDE.md](MODEL_TRAINING_GUIDE.md)
- **Issues**: https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor/issues

---

*Last Updated: 2026-02-17*
*For questions or issues, please open a GitHub issue.*
