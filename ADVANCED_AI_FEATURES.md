# Advanced AI Features Guide 🤖✨

This guide documents the advanced AI capabilities integrated into the AI Photo Editor, including **Google Gemini Pro**, **ControlNet**, and **SDXL**.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [Google Gemini Pro Features](#google-gemini-pro-features)
- [ControlNet Features](#controlnet-features)
- [SDXL Features](#sdxl-features)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Overview

The AI Photo Editor now includes state-of-the-art AI libraries for superior image generation and analysis:

### Technologies Integrated
- **Google Gemini Pro 2.0**: Advanced language and vision AI for image understanding
- **ControlNet**: Precise structure control for image generation
- **Stable Diffusion XL (SDXL)**: Highest quality image generation at 1024x1024
- **Advanced Libraries**: Accelerate, SafeTensors, ControlNet-Aux, Timm, Einops

---

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create or update `backend/.env`:

```env
# Enable Advanced Features
ENABLE_GEMINI=true
ENABLE_CONTROLNET=true
ENABLE_SDXL=true
ENABLE_STABLE_DIFFUSION=true

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Model Settings
DEVICE=cpu  # Use 'cuda' for GPU acceleration
MODEL_CACHE_DIR=./models
```

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the key and add to `.env`

### 4. Hardware Requirements

**Minimum (CPU-only):**
- RAM: 16GB
- Storage: 20GB free space for models

**Recommended (GPU):**
- GPU: NVIDIA with 8GB+ VRAM (RTX 3060 or better)
- RAM: 16GB system RAM
- Storage: 20GB free space for models

**For SDXL:**
- GPU with 10GB+ VRAM recommended
- Can run on CPU but very slow

---

## Google Gemini Pro Features

Gemini Pro provides intelligent image understanding and text generation capabilities.

### 1. Image Analysis

Analyze images with different depths of analysis:

**API Endpoint:** `POST /analyze-image`

**Parameters:**
- `file`: Image file (multipart/form-data)
- `analysis_type`: Type of analysis
  - `detailed`: Comprehensive analysis (default)
  - `simple`: Quick 2-3 sentence description
  - `artistic`: Focus on artistic elements
  - `technical`: Technical quality assessment

**Example Response:**
```json
{
  "success": true,
  "analysis": "This image features a serene landscape with...",
  "analysis_type": "detailed"
}
```

**Use Cases:**
- Understanding image content before editing
- Getting improvement suggestions
- Analyzing artistic style
- Technical quality assessment

### 2. Smart Captions

Generate captions in various styles:

**API Endpoint:** `POST /generate-caption`

**Parameters:**
- `file`: Image file
- `style`: Caption style
  - `descriptive`: Clear, informative
  - `creative`: Engaging for social media
  - `technical`: Technical description
  - `social`: With hashtags

**Example Response:**
```json
{
  "caption": "A breathtaking sunset over calm waters",
  "style": "creative"
}
```

### 3. Prompt Enhancement

Enhance prompts for better AI generation:

**API Endpoint:** `POST /enhance-prompt`

**Parameters:**
- `prompt`: Original prompt text
- `context`: Context type
  - `image generation`: For text-to-image
  - `style transfer`: For style modifications
  - `editing`: For editing instructions

**Example:**
```
Original: "a cat"
Enhanced: "a realistic cat, professional photography, highly detailed, 
          sharp focus, natural lighting, 8k resolution, photorealistic"
```

### 4. Edit Suggestions

Get AI-powered improvement suggestions:

**API Endpoint:** `POST /suggest-edits`

**Parameters:**
- `file`: Image file

**Response:** Detailed suggestions for improvements including color adjustments, composition, and style enhancements.

### 5. Object Detection

Extract objects present in images:

**API Endpoint:** `POST /extract-objects`

**Example Response:**
```json
{
  "objects": ["person", "bicycle", "tree", "sky", "road"]
}
```

### 6. Color Palette Analysis

Get intelligent color palette suggestions:

**API Endpoint:** `POST /suggest-color-palette`

**Response:** Dominant colors, color harmony type, and suggested adjustments.

### 7. Negative Prompt Generation

Generate negative prompts for better image quality:

**API Endpoint:** `POST /generate-negative-prompt`

**Example:**
```
Positive: "a beautiful landscape"
Negative: "low quality, blurry, distorted, bad anatomy, oversaturated,
          watermark, text, signature, ugly"
```

---

## ControlNet Features

ControlNet enables precise control over image generation using structure guidance.

### Available Control Modes

1. **Canny Edge Detection**
   - Use Case: Preserve image structure precisely
   - Best For: Line art, architectural images, detailed structures

2. **Depth Maps**
   - Use Case: 3D-aware generation
   - Best For: Scenes with depth, landscape transformation

3. **OpenPose**
   - Use Case: Human pose control
   - Best For: Character posing, figure drawing, dance poses

4. **MLSD (Line Detection)**
   - Use Case: Straight line detection
   - Best For: Architecture, interior design, technical drawings

5. **HED (Holistically-Nested Edge Detection)**
   - Use Case: Soft edge detection
   - Best For: Natural scenes, organic shapes

6. **Scribble/Sketch**
   - Use Case: Rough sketch to detailed image
   - Best For: Quick concept art, ideation

7. **Segmentation**
   - Use Case: Semantic segmentation control
   - Best For: Object replacement, scene composition

### Generate with ControlNet

**API Endpoint:** `POST /generate-with-controlnet`

**Parameters:**
- `file`: Control image or raw image (if preprocess=true)
- `prompt`: Text description
- `controlnet_type`: Control mode (see above)
- `negative_prompt`: What to avoid (optional)
- `num_inference_steps`: Number of steps (20-100, default: 50)
- `guidance_scale`: Prompt adherence (1.0-15.0, default: 7.5)
- `controlnet_conditioning_scale`: ControlNet strength (0.0-2.0, default: 1.0)
- `preprocess`: Auto-preprocess control image (default: true)

**Example Usage:**

```python
import requests

# Upload an image and generate with Canny edge control
files = {'file': open('my_photo.jpg', 'rb')}
data = {
    'prompt': 'a beautiful oil painting of the scene',
    'controlnet_type': 'canny',
    'preprocess': True,
    'num_inference_steps': 50,
    'controlnet_conditioning_scale': 1.0
}

response = requests.post('http://localhost:8000/generate-with-controlnet', 
                        files=files, data=data)

with open('output.png', 'wb') as f:
    f.write(response.content)
```

**Tips:**
- Use higher `controlnet_conditioning_scale` (1.2-1.5) for stronger control
- Use lower scale (0.5-0.8) for more creative freedom
- Set `preprocess=False` if you already have a processed control image
- Combine with enhanced prompts from Gemini for best results

---

## SDXL Features

Stable Diffusion XL provides the highest quality image generation.

### 1. High-Quality Generation

**API Endpoint:** `POST /generate-with-sdxl`

**Parameters:**
- `prompt`: Text description
- `negative_prompt`: What to avoid (optional)
- `width`: Output width (default: 1024, must be multiple of 8)
- `height`: Output height (default: 1024, must be multiple of 8)
- `num_inference_steps`: Number of steps (30-100, default: 50)
- `guidance_scale`: Prompt adherence (1.0-15.0, default: 7.5)
- `use_refiner`: Use SDXL refiner for enhanced detail (default: false)
- `refiner_steps`: Number of refiner steps (default: 50)
- `seed`: Random seed for reproducibility (optional)

**Example:**
```python
import requests

data = {
    'prompt': 'a majestic dragon flying over mountains, epic fantasy art, highly detailed',
    'negative_prompt': 'low quality, blurry, distorted',
    'width': 1024,
    'height': 1024,
    'num_inference_steps': 50,
    'use_refiner': True,
    'refiner_steps': 50
}

response = requests.post('http://localhost:8000/generate-with-sdxl', data=data)
```

**When to Use Refiner:**
- Enable for highest quality (slower but better detail)
- Disable for faster generation
- Refiner adds ~50% more time but improves fine details

### 2. Advanced Image Transformation

**API Endpoint:** `POST /transform-with-sdxl`

**Parameters:**
- `file`: Input image
- `prompt`: Transformation description
- `negative_prompt`: What to avoid (optional)
- `strength`: Transformation strength (0.0-1.0, default: 0.75)
  - 0.0-0.3: Subtle changes
  - 0.4-0.7: Moderate transformation
  - 0.8-1.0: Strong transformation
- `num_inference_steps`: Number of steps (default: 50)
- `guidance_scale`: Prompt adherence (default: 7.5)

**Use Cases:**
- Style transfer at highest quality
- Photo enhancement
- Artistic transformation
- Quality upscaling

---

## API Reference

### Model Information

**Endpoint:** `GET /advanced-models-info`

**Response:**
```json
{
  "controlnet_enabled": true,
  "sdxl_enabled": true,
  "gemini_enabled": true,
  "available_models": {
    "controlnet": {
      "canny": {...},
      "depth": {...},
      ...
    },
    "sdxl": {...}
  },
  "loaded_models": ["sdxl-base", "controlnet-canny"]
}
```

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "ai_models_enabled": true,
  "gemini_enabled": true,
  "advanced_models_enabled": true,
  "device": "cuda"
}
```

---

## Examples

### Example 1: Complete Workflow with Gemini + SDXL

```python
import requests

# 1. Enhance prompt with Gemini
prompt_response = requests.post('http://localhost:8000/enhance-prompt', 
    data={'prompt': 'a sunset', 'context': 'image generation'})
enhanced_prompt = prompt_response.json()['enhanced_prompt']

# 2. Generate negative prompt with Gemini
neg_response = requests.post('http://localhost:8000/generate-negative-prompt',
    data={'prompt': enhanced_prompt})
negative_prompt = neg_response.json()['negative_prompt']

# 3. Generate high-quality image with SDXL
image_response = requests.post('http://localhost:8000/generate-with-sdxl',
    data={
        'prompt': enhanced_prompt,
        'negative_prompt': negative_prompt,
        'width': 1024,
        'height': 1024,
        'use_refiner': True
    })

with open('sunset_sdxl.png', 'wb') as f:
    f.write(image_response.content)
```

### Example 2: Analyze and Transform with ControlNet

```python
import requests

# 1. Analyze original image
files = {'file': open('photo.jpg', 'rb')}
analysis = requests.post('http://localhost:8000/analyze-image',
    files=files, data={'analysis_type': 'detailed'})
print(analysis.json()['analysis'])

# 2. Get edit suggestions
suggestions = requests.post('http://localhost:8000/suggest-edits',
    files={'file': open('photo.jpg', 'rb')})
print(suggestions.json()['suggestions'])

# 3. Transform with ControlNet (canny edge)
files = {'file': open('photo.jpg', 'rb')}
result = requests.post('http://localhost:8000/generate-with-controlnet',
    files=files,
    data={
        'prompt': 'oil painting style, vibrant colors',
        'controlnet_type': 'canny',
        'preprocess': True
    })

with open('transformed.png', 'wb') as f:
    f.write(result.content)
```

### Example 3: Pose-Controlled Character Generation

```python
import requests

# Upload reference pose image
files = {'file': open('pose_reference.jpg', 'rb')}

# Generate character with same pose
response = requests.post('http://localhost:8000/generate-with-controlnet',
    files=files,
    data={
        'prompt': 'fantasy warrior character, detailed armor, heroic pose',
        'negative_prompt': 'low quality, blurry, distorted',
        'controlnet_type': 'openpose',
        'preprocess': True,
        'num_inference_steps': 50,
        'controlnet_conditioning_scale': 1.2
    })

with open('warrior.png', 'wb') as f:
    f.write(response.content)
```

---

## Performance Tips

### Memory Optimization

1. **Use Attention Slicing** (automatic on GPU)
2. **Clear Cache** between model switches
3. **Use CPU offload** for low VRAM systems

### Quality vs Speed

- **Fast (CPU):** Stable Diffusion v1.5, 20-30 steps
- **Balanced:** SDXL without refiner, 40-50 steps
- **Best Quality:** SDXL with refiner, 50+ steps

### Best Practices

1. **Prompt Enhancement:** Always use Gemini to enhance prompts
2. **Negative Prompts:** Generate negative prompts with Gemini
3. **ControlNet Scale:** Start at 1.0, adjust based on results
4. **SDXL Refiner:** Use for final outputs, not iteration
5. **Batch Processing:** Process multiple images sequentially

---

## Troubleshooting

### Gemini API Issues

**Error:** "GEMINI_API_KEY must be set"
- Solution: Add valid API key to `.env`

**Error:** "Quota exceeded"
- Solution: Check Google AI Studio quota limits

### ControlNet Issues

**Error:** "Preprocessor not available"
- Solution: Ensure `controlnet-aux` is installed
- Try: `pip install controlnet-aux`

### SDXL Memory Issues

**Error:** "CUDA out of memory"
- Solution 1: Reduce image size (768x768 instead of 1024x1024)
- Solution 2: Disable refiner
- Solution 3: Use CPU (slower but works)

### Model Download Issues

**Error:** "Connection timeout"
- Solution: Models download on first use (~4-10GB)
- Check internet connection and allow time

---

## Support and Resources

- **Google AI Studio:** https://makersuite.google.com/
- **ControlNet Models:** https://huggingface.co/lllyasviel
- **SDXL Models:** https://huggingface.co/stabilityai
- **API Documentation:** http://localhost:8000/docs (when running)

---

## License

This software integrates with:
- Google Gemini Pro (subject to Google's terms)
- HuggingFace models (various licenses)
- Stable Diffusion (CreativeML Open RAIL-M)

Please review individual model licenses before commercial use.
