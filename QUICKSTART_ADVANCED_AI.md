# Quick Start: Using Advanced AI Features

This guide helps you quickly get started with the new Gemini Pro, ControlNet, and SDXL features.

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Gemini API Key (FREE)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy your key

### 2. Configure the Application

Edit `backend/.env`:

```env
# Enable all new features
ENABLE_GEMINI=true
ENABLE_CONTROLNET=true
ENABLE_SDXL=true
ENABLE_STABLE_DIFFUSION=true

# Add your Gemini API key
GEMINI_API_KEY=your_key_here

# Use GPU if available (much faster!)
DEVICE=cuda  # or 'cpu'
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the Server

```bash
uvicorn main:app --reload
```

Visit: http://localhost:8000/docs for interactive API documentation

---

## 🎯 Quick Examples

### Example 1: Analyze an Image with Gemini

```bash
curl -X POST http://localhost:8000/analyze-image \
  -F "file=@photo.jpg" \
  -F "analysis_type=detailed"
```

### Example 2: Generate Smart Caption

```bash
curl -X POST http://localhost:8000/generate-caption \
  -F "file=@photo.jpg" \
  -F "style=creative"
```

### Example 3: Enhance Your Prompt

```bash
curl -X POST http://localhost:8000/enhance-prompt \
  -F "prompt=a sunset" \
  -F "context=image generation"
```

### Example 4: Generate with ControlNet (Canny)

```bash
curl -X POST http://localhost:8000/generate-with-controlnet \
  -F "file=@reference.jpg" \
  -F "prompt=oil painting of a city" \
  -F "controlnet_type=canny" \
  -F "preprocess=true" \
  --output result.png
```

### Example 5: High-Quality SDXL Generation

```bash
curl -X POST http://localhost:8000/generate-with-sdxl \
  -F "prompt=majestic dragon, epic fantasy art" \
  -F "width=1024" \
  -F "height=1024" \
  -F "use_refiner=true" \
  --output dragon.png
```

---

## 🎨 Use Cases

### For Photographers
- **Analyze**: Get technical analysis of photo quality
- **Suggest Edits**: AI recommendations for improvements
- **Color Palette**: Extract and analyze color schemes

### For Artists
- **Style Transfer**: Transform photos into art with ControlNet
- **Prompt Enhancement**: Better prompts = better AI art
- **SDXL Generation**: Highest quality AI art

### For Social Media
- **Smart Captions**: Generate engaging captions
- **Object Detection**: Tag objects automatically
- **Creative Enhancement**: Make images pop with AI

### For Developers
- **API Integration**: RESTful API for all features
- **Batch Processing**: Process multiple images
- **Custom Workflows**: Combine features for unique results

---

## 📊 Feature Comparison

| Feature | Regular SD | ControlNet | SDXL | Gemini Pro |
|---------|-----------|------------|------|------------|
| Image Generation | ✓ | ✓ | ✓✓✓ | - |
| Structure Control | - | ✓✓✓ | ✓ | - |
| Image Analysis | - | - | - | ✓✓✓ |
| Prompt Enhancement | - | - | - | ✓✓✓ |
| Quality | Good | Good | Excellent | - |
| Speed (GPU) | Fast | Fast | Medium | Fast |
| Speed (CPU) | Medium | Slow | Very Slow | Fast |

---

## 💡 Pro Tips

### Getting Best Results

1. **Always enhance prompts with Gemini first**
   ```
   Original: "a cat"
   Enhanced: "a realistic cat, professional photography, 
             highly detailed, sharp focus, 8k resolution"
   ```

2. **Use negative prompts (generate with Gemini)**
   - Improves quality significantly
   - Removes common artifacts

3. **ControlNet scale matters**
   - 1.0 = balanced (start here)
   - 1.2-1.5 = stronger control
   - 0.5-0.8 = more creative freedom

4. **SDXL tips**
   - Use 1024x1024 for best results
   - Enable refiner for final outputs
   - Disable refiner when iterating

5. **Gemini for workflow**
   ```
   Image → Analyze → Get Suggestions → 
   Enhance Prompt → Generate → Compare
   ```

### Cost Optimization

- **Gemini**: FREE tier is generous (use liberally!)
- **ControlNet**: Runs locally (one-time model download)
- **SDXL**: Runs locally (needs good GPU or patience)
- **Models**: Download once, use forever

### Hardware Recommendations

**Budget Setup (CPU only):**
- Use Gemini features (fast!)
- Use SD v1.5 (not SDXL)
- Skip ControlNet or use simple modes

**Recommended Setup:**
- GPU: RTX 3060 (12GB VRAM) or better
- RAM: 16GB
- Storage: 50GB for models
- Can use all features smoothly

**Pro Setup:**
- GPU: RTX 4090 (24GB VRAM)
- RAM: 32GB
- Multiple GPUs for batch processing
- Lightning fast generation

---

## 🐛 Troubleshooting

### "Gemini API Key not found"
➜ Add `GEMINI_API_KEY=your_key` to `backend/.env`

### "CUDA out of memory"
➜ Reduce image size or use CPU
➜ Disable SDXL refiner
➜ Close other programs

### "Model download slow/stuck"
➜ First run downloads ~10GB of models
➜ Be patient, only happens once
➜ Check internet connection

### "Generation too slow"
➜ Use GPU instead of CPU
➜ Reduce num_inference_steps (try 30)
➜ Use smaller image dimensions

---

## 📚 Learn More

- Full Documentation: `ADVANCED_AI_FEATURES.md`
- API Reference: http://localhost:8000/docs (when running)
- Examples: `ADVANCED_AI_FEATURES.md` (scroll to Examples)

---

## 🎓 Workflow Examples

### Complete Enhancement Workflow

```python
import requests

# 1. Analyze original image
files = {'file': open('photo.jpg', 'rb')}
analysis = requests.post('http://localhost:8000/analyze-image', files=files)

# 2. Get improvement suggestions
suggestions = requests.post('http://localhost:8000/suggest-edits', files=files)

# 3. Create enhanced prompt based on suggestions
prompt = "beautiful landscape, enhanced colors, professional photography"
enhanced = requests.post('http://localhost:8000/enhance-prompt',
    data={'prompt': prompt, 'context': 'image generation'})

# 4. Generate with SDXL
result = requests.post('http://localhost:8000/generate-with-sdxl',
    data={'prompt': enhanced.json()['enhanced_prompt'],
          'width': 1024, 'height': 1024, 'use_refiner': True})

with open('enhanced.png', 'wb') as f:
    f.write(result.content)
```

### Social Media Content Creation

```python
import requests

# 1. Upload photo
files = {'file': open('product.jpg', 'rb')}

# 2. Generate creative caption
caption = requests.post('http://localhost:8000/generate-caption',
    files=files, data={'style': 'social'})

# 3. Extract objects for tags
objects = requests.post('http://localhost:8000/extract-objects', files=files)

# 4. Analyze color palette
colors = requests.post('http://localhost:8000/suggest-color-palette', files=files)

# Now you have: caption, objects for hashtags, and color scheme!
```

---

## 🌟 What's New?

This update adds **10 new API endpoints** and **3 major AI integrations**:

### New Endpoints
1. `/analyze-image` - Gemini Vision analysis
2. `/generate-caption` - Smart captions
3. `/enhance-prompt` - AI prompt improvement
4. `/suggest-edits` - AI edit recommendations
5. `/extract-objects` - Object detection
6. `/generate-negative-prompt` - Quality improvement
7. `/suggest-color-palette` - Color analysis
8. `/generate-with-controlnet` - Structure control
9. `/generate-with-sdxl` - Highest quality generation
10. `/transform-with-sdxl` - High-quality transformations

### New Capabilities
- 🤖 Google Gemini Pro integration
- 🎯 8 ControlNet modes
- 💎 SDXL with optional refiner
- 📚 7 new advanced libraries

---

## ✨ Success!

You're now ready to use advanced AI features! Start with Gemini (it's fast and free), then explore ControlNet and SDXL as you get comfortable.

Happy creating! 🎨✨
