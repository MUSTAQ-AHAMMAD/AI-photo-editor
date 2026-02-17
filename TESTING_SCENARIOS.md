# AI Photo Editor - Testing Scenarios Documentation

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [Functional Test Scenarios](#functional-test-scenarios)
3. [Integration Test Scenarios](#integration-test-scenarios)
4. [Performance Test Scenarios](#performance-test-scenarios)
5. [AI Model Test Scenarios](#ai-model-test-scenarios)
6. [Edge Cases and Error Handling](#edge-cases-and-error-handling)
7. [Visual Regression Testing](#visual-regression-testing)

---

## Test Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker and Docker Compose
- Test images (various formats, sizes)
- GPU (optional, for AI model testing)

### Environment Configuration
```bash
# Backend Environment
DEVICE=cpu  # or 'cuda' for GPU testing
ENABLE_STABLE_DIFFUSION=true  # Enable for AI model tests
MODEL_CACHE_DIR=./test_models
UPLOAD_DIR=./test_uploads

# Frontend Environment
VITE_API_URL=http://localhost:8000
```

---

## Functional Test Scenarios

### Scenario 1: Image Upload
**Test ID**: TS-001
**Priority**: High
**Description**: Verify that users can upload images successfully

**Test Steps**:
1. Navigate to the application homepage
2. Click on the upload area or drag-and-drop an image
3. Select a valid image file (PNG, JPG, JPEG)
4. Verify the image is displayed in the preview area

**Expected Results**:
- Image is displayed correctly in the preview
- File metadata (size, dimensions) is shown
- No error messages appear
- Original image is preserved

**Test Data**:
- `test_image_small.jpg` (< 1MB, 800x600)
- `test_image_medium.png` (1-5MB, 1920x1080)
- `test_image_large.jpg` (5-10MB, 4000x3000)

**Visual Verification**: Screenshot showing successful upload with preview

---

### Scenario 2: Background Removal
**Test ID**: TS-002
**Priority**: High
**Description**: Verify background removal functionality using RemBG

**Test Steps**:
1. Upload an image with a clear subject and background
2. Click on "Remove Background" button
3. Wait for processing to complete
4. Verify the background is removed and subject remains intact

**Expected Results**:
- Background is cleanly removed
- Subject edges are well-preserved
- Transparency is correctly applied
- Download option is available
- Processing time is reasonable (< 10 seconds for 1920x1080 image)

**Test Data**:
- `portrait_with_background.jpg` (Person with solid background)
- `object_with_complex_bg.jpg` (Object with complex background)
- `multiple_subjects.jpg` (Multiple subjects in frame)

**Visual Verification**: Before/after comparison screenshots

---

### Scenario 3: Object Removal (Inpainting)
**Test ID**: TS-003
**Priority**: High
**Description**: Verify object removal using inpainting feature

**Test Steps**:
1. Upload an image
2. Click "Show Object Removal Tool"
3. Use the canvas to draw mask over unwanted object
4. Click "Apply" to process
5. Verify object is removed and area is naturally filled

**Expected Results**:
- Canvas tool is responsive and easy to use
- Mask can be drawn accurately
- Object is removed seamlessly
- Inpainted area blends naturally with surroundings
- Undo/clear functionality works

**Test Data**:
- `image_with_person.jpg` (Remove person from scene)
- `image_with_text.jpg` (Remove text overlay)
- `image_with_watermark.jpg` (Remove watermark)

**Visual Verification**: Before/after with mask overlay screenshots

---

### Scenario 4: Filter Application
**Test ID**: TS-004
**Priority**: Medium
**Description**: Verify all filter effects work correctly

**Test Steps**:
1. Upload an image
2. Select each filter type from the dropdown:
   - Blur
   - Sharpen
   - Edge Detection
   - Grayscale
3. Apply each filter and verify the result

**Expected Results**:
- Each filter produces expected visual effect
- Filters can be applied multiple times
- Original image remains unchanged
- Processing is fast (< 2 seconds)

**Test Data**:
- `colorful_landscape.jpg` (High color variety)
- `portrait.jpg` (Human subject)
- `text_document.jpg` (Text-heavy image)

**Visual Verification**: Grid showing all filter effects on same image

---

### Scenario 5: Brightness Adjustment
**Test ID**: TS-005
**Priority**: Medium
**Description**: Verify brightness adjustment slider functionality

**Test Steps**:
1. Upload an image
2. Use the brightness slider to adjust:
   - Decrease brightness (factor < 1.0)
   - Increase brightness (factor > 1.0)
   - Reset to original (factor = 1.0)
3. Verify real-time preview or quick application

**Expected Results**:
- Slider moves smoothly
- Brightness changes are accurate
- No loss in image quality
- Values are within acceptable range (0.1 - 3.0)
- Image doesn't clip/lose detail

**Test Data**:
- `dark_image.jpg` (Underexposed photo)
- `bright_image.jpg` (Overexposed photo)
- `balanced_image.jpg` (Normal exposure)

**Visual Verification**: Brightness levels comparison (dark → normal → bright)

---

### Scenario 6: AI Image Generation
**Test ID**: TS-006
**Priority**: High
**Description**: Verify AI image generation using Stable Diffusion

**Test Steps**:
1. Ensure AI models are enabled (ENABLE_STABLE_DIFFUSION=true)
2. Enter a text prompt (e.g., "a beautiful sunset over mountains")
3. Optional: Add negative prompt (e.g., "blurry, low quality")
4. Click "Generate Image"
5. Wait for generation to complete
6. Verify generated image matches prompt

**Expected Results**:
- Image generation completes successfully
- Generated image reflects the prompt description
- Image quality is high (512x512 minimum)
- Generation time is reasonable (< 60 seconds on CPU)
- Error handling for invalid prompts

**Test Data**:
- Simple prompts: "a red car", "a cat sitting"
- Complex prompts: "a futuristic city at night with neon lights"
- Negative prompts: "avoid blurry, low quality, distorted"

**Visual Verification**: Generated images with their prompts

---

### Scenario 7: High-Resolution Export
**Test ID**: TS-007
**Priority**: Medium
**Description**: Verify image download functionality

**Test Steps**:
1. Process an image (any operation)
2. Click "Download" button
3. Verify downloaded file

**Expected Results**:
- File downloads successfully
- Downloaded image maintains quality
- Correct file format (PNG)
- Filename is descriptive
- File size is appropriate

**Test Data**:
- Various processed images from previous tests

**Visual Verification**: Downloaded file properties and quality check

---

## Integration Test Scenarios

### Scenario 8: API Health Check
**Test ID**: TS-008
**Priority**: High
**Description**: Verify backend API is running and responsive

**Test Steps**:
1. Send GET request to `/health` endpoint
2. Verify response status and content
3. Check AI models status

**Expected Results**:
```json
{
  "status": "healthy",
  "ai_models_enabled": true/false,
  "device": "cpu"/"cuda"
}
```

**API Test**: `curl http://localhost:8000/health`

---

### Scenario 9: CORS Configuration
**Test ID**: TS-009
**Priority**: High
**Description**: Verify Cross-Origin Resource Sharing is properly configured

**Test Steps**:
1. Start frontend on localhost:3000
2. Start backend on localhost:8000
3. Perform any API call from frontend
4. Verify no CORS errors in browser console

**Expected Results**:
- No CORS errors
- API calls complete successfully
- Proper headers are set

---

### Scenario 10: File Upload Validation
**Test ID**: TS-010
**Priority**: High
**Description**: Verify file type and size validation

**Test Steps**:
1. Attempt to upload invalid file types (.txt, .pdf, .exe)
2. Attempt to upload very large files (> 10MB)
3. Verify error handling

**Expected Results**:
- Invalid file types are rejected
- Appropriate error messages are shown
- Large files are handled gracefully
- No server crashes

**Test Data**:
- `invalid.txt`
- `large_image.jpg` (20MB+)

---

## Performance Test Scenarios

### Scenario 11: Concurrent User Load
**Test ID**: TS-011
**Priority**: Medium
**Description**: Test application under load

**Test Steps**:
1. Simulate 10 concurrent users
2. Each user performs image operations
3. Monitor response times and errors

**Expected Results**:
- Response time < 5 seconds for basic operations
- No timeouts or failures
- Server remains stable
- Memory usage is reasonable

**Tools**: Apache JMeter, Locust

---

### Scenario 12: Memory Management
**Test ID**: TS-012
**Priority**: Medium
**Description**: Verify proper memory cleanup

**Test Steps**:
1. Process 20 images sequentially
2. Monitor memory usage
3. Verify no memory leaks

**Expected Results**:
- Memory is released after processing
- No gradual memory increase
- Cache is properly managed

---

## AI Model Test Scenarios

### Scenario 13: Model Initialization
**Test ID**: TS-013
**Priority**: High
**Description**: Verify AI models load correctly

**Test Steps**:
1. Start backend with ENABLE_STABLE_DIFFUSION=true
2. Check model download/loading logs
3. Verify models are ready for inference

**Expected Results**:
- Models download successfully (if not cached)
- Models load into memory
- Device assignment is correct (CPU/CUDA)
- No initialization errors

---

### Scenario 14: Multiple Model Support
**Test ID**: TS-014
**Priority**: High
**Description**: Test different Stable Diffusion models

**Models to Test**:
- `runwayml/stable-diffusion-v1-5` (default)
- `stabilityai/stable-diffusion-2-1`
- `runwayml/stable-diffusion-inpainting`

**Test Steps**:
1. Configure model in environment
2. Test image generation with each model
3. Compare output quality
4. Measure inference time

**Expected Results**:
- All models work correctly
- Output quality varies appropriately
- Performance metrics are documented

---

### Scenario 15: AI Inpainting Quality
**Test ID**: TS-015
**Priority**: High
**Description**: Compare traditional vs AI inpainting

**Test Steps**:
1. Use same image and mask
2. Test with `use_ai=false` (OpenCV inpainting)
3. Test with `use_ai=true` (Stable Diffusion inpainting)
4. Compare results

**Expected Results**:
- AI inpainting produces more natural results
- Traditional inpainting is faster
- Both methods complete without errors

---

## Edge Cases and Error Handling

### Scenario 16: Corrupted Image Upload
**Test ID**: TS-016
**Priority**: Medium
**Description**: Handle corrupted image files

**Test Steps**:
1. Upload a corrupted image file
2. Verify error handling

**Expected Results**:
- Graceful error message
- No server crash
- User can retry

---

### Scenario 17: Missing Model Files
**Test ID**: TS-017
**Priority**: Medium
**Description**: Handle missing AI model files

**Test Steps**:
1. Delete model cache
2. Enable Stable Diffusion
3. Trigger model loading

**Expected Results**:
- Models are downloaded automatically
- Progress is shown/logged
- Fallback to non-AI features if download fails

---

### Scenario 18: Network Timeout
**Test ID**: TS-018
**Priority**: Low
**Description**: Handle network failures

**Test Steps**:
1. Disconnect network during processing
2. Verify error handling

**Expected Results**:
- Timeout error is caught
- User-friendly error message
- Ability to retry

---

### Scenario 19: GPU Memory Overflow
**Test ID**: TS-019
**Priority**: Medium
**Description**: Handle GPU memory issues

**Test Steps**:
1. Enable CUDA device
2. Process very large image or multiple concurrent requests
3. Monitor GPU memory

**Expected Results**:
- Fallback to CPU if GPU memory insufficient
- Clear error message
- No system crash

---

## Visual Regression Testing

### Scenario 20: UI Consistency
**Test ID**: TS-020
**Priority**: Low
**Description**: Verify UI renders correctly across browsers

**Test Steps**:
1. Open application in Chrome, Firefox, Safari
2. Compare UI elements
3. Test responsive design on mobile

**Expected Results**:
- Consistent rendering across browsers
- Mobile-friendly interface
- No layout issues

---

## Test Execution Results Template

| Test ID | Scenario | Status | Execution Time | Notes |
|---------|----------|--------|----------------|-------|
| TS-001 | Image Upload | ✅ Pass | 0.5s | All formats work |
| TS-002 | Background Removal | ✅ Pass | 3.2s | Clean results |
| TS-003 | Object Removal | ✅ Pass | 2.1s | Good blending |
| ... | ... | ... | ... | ... |

---

## Test Data Repository

All test images should be stored in `/backend/test_data/` directory:

```
test_data/
├── images/
│   ├── small/
│   ├── medium/
│   ├── large/
│   └── special_cases/
├── masks/
└── expected_outputs/
```

---

## Automated Test Execution

See `test_runner.py` for automated test execution script.

```bash
# Run all tests
python backend/test_runner.py --all

# Run specific category
python backend/test_runner.py --category functional

# Generate report with screenshots
python backend/test_runner.py --all --screenshots --report
```

---

## Known Issues and Limitations

1. **AI Model Loading**: First-time model download can take 5-10 minutes
2. **GPU Memory**: Stable Diffusion requires ~4GB GPU memory
3. **Large Images**: Images > 4000x4000 pixels may need resizing
4. **Browser Compatibility**: IE11 is not supported

---

## Testing Checklist

- [ ] All functional tests pass
- [ ] All integration tests pass
- [ ] Performance benchmarks meet requirements
- [ ] AI models load and work correctly
- [ ] Error handling is comprehensive
- [ ] Visual regression tests pass
- [ ] Documentation is complete
- [ ] Screenshots are captured for all scenarios

---

*Document Version: 1.0*
*Last Updated: 2026-02-17*
*Maintained by: MUSTAQ AHAMMAD*
