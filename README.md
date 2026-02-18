# AI Photo Editor 🎨✨

A comprehensive AI-powered photo editing application with **Adobe Firefly-like features** that brings professional-grade image manipulation to your fingertips. Built with FastAPI, React, and cutting-edge machine learning models.

![AI Photo Editor](https://img.shields.io/badge/AI-Photo%20Editor-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal)
![Tests](https://img.shields.io/badge/Tests-93%25%20Passing-brightgreen)

---

## 🎨 See It In Action!

**Want to see how the application looks?** Check out our complete visual documentation:

- 🖼️ **[Visual Gallery (HTML)](docs/VISUAL_GALLERY.html)** - Interactive gallery with all 16 screenshots
- 📸 **[Visual README](docs/README_VISUAL.md)** - All screenshots displayed inline
- 📋 **[Quick Reference](docs/QUICK_REFERENCE.md)** - Fast access to all resources
- 📊 **[Complete Testing Report](FEATURE_TESTING_SUMMARY.md)** - Detailed test results

**Sample Screenshots:**

<table>
  <tr>
    <td><img src="docs/visual_documentation/04_04_after_upload.png" alt="Main Interface" width="400"/></td>
    <td><img src="docs/visual_documentation/08_09_brightness_control.png" alt="Editing Tools" width="400"/></td>
  </tr>
  <tr>
    <td align="center"><b>Main Interface with Image Loaded</b></td>
    <td align="center"><b>Brightness Adjustment Control</b></td>
  </tr>
</table>

---

## ✨ Features

### Adobe Firefly-like AI Features
- ✨ **Generative Fill**: AI-powered object insertion and replacement in selected areas
- 🖼️ **Image Extension (Outpainting)**: Extend image borders intelligently in any direction
- 🎭 **Style Transfer**: Transform images with AI-powered style recoloring
- 📝 **Text Effects**: Generate artistic text with various effects (3D, neon, watercolor, etc.)
- 🎨 **Advanced Text-to-Image**: Generate images with 15+ style presets and multiple aspect ratios
- 🎯 **Style Presets**: Photorealistic, Digital Art, Anime, Oil Painting, Cinematic, and more
- 📐 **Aspect Ratios**: Square, Landscape, Portrait, and custom ratios (1:1, 16:9, 9:16, 4:3, etc.)

### Basic Editing Features
- 🖼️ **Image Upload**: Drag-and-drop interface for easy image uploads
- 🎯 **Object Removal**: Interactive canvas to select and remove unwanted objects
- 🌟 **Background Removal**: One-click background removal using RemBG
- 🎨 **Filters**: Apply various filters (blur, sharpen, edge detection, grayscale)
- 💡 **Brightness Adjustment**: Fine-tune image brightness
- 📥 **High-Resolution Export**: Download processed images in full quality
- 🐳 **Docker Support**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Python 3.11+ and Node.js 20+ (for local development)

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor.git
cd AI-photo-editor
```

2. Start the application:
```bash
docker-compose up --build
```

3. Open your browser:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📖 Usage

1. **Upload an Image**: Drag and drop or click to select an image
2. **Choose an Operation**:
   - Remove background with one click
   - Apply filters for different effects
   - Adjust brightness using the slider
   - Use the object removal tool to mark areas for removal
3. **Process**: Click the appropriate button to process your image
4. **Download**: Save your edited image in high resolution

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **PyTorch**: Deep learning framework for AI models
- **Stable Diffusion**: Advanced image generation
- **RemBG**: Background removal
- **OpenCV**: Computer vision and image processing
- **Pillow**: Python Imaging Library

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Next-generation frontend tooling
- **Axios**: HTTP client for API calls
- **React Dropzone**: Drag-and-drop file uploads

### Infrastructure
- **Docker**: Containerization
- **Nginx**: Web server for frontend
- **Uvicorn**: ASGI server for FastAPI

## 📋 API Endpoints

### Basic Endpoints
- `GET /`: API information
- `GET /health`: Health check
- `POST /upload`: Upload an image
- `POST /remove-background`: Remove background from image
- `POST /inpaint`: Remove objects using inpainting
- `POST /apply-filter`: Apply filters to image
- `POST /adjust-brightness`: Adjust image brightness

### Adobe Firefly-like Endpoints
- `POST /generative-fill`: AI-powered object insertion/replacement
- `POST /outpaint`: Extend image borders with AI
- `POST /text-effect`: Generate artistic text effects
- `POST /style-transfer`: Apply style transformation to images
- `POST /generate-with-style`: Enhanced text-to-image with style presets
- `GET /style-presets`: Get available style presets and aspect ratios

Full API documentation available at http://localhost:8000/docs

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
DEVICE=cpu  # or 'cuda' for GPU
ENABLE_STABLE_DIFFUSION=true  # Set to 'true' to enable Adobe Firefly-like AI features
MODEL_CACHE_DIR=./models
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

## 🔧 Adobe Firefly-like Features

### Generative Fill
AI-powered object insertion and replacement. Select an area with the canvas tool and describe what you want to generate.

### Image Extension (Outpainting)
Extend your images beyond their original borders. Choose direction (left, right, top, bottom, or all) and let AI seamlessly continue the image.

### Style Transfer
Transform your images with different artistic styles. Apply styles like oil painting, cyberpunk, watercolor, and more.

### Text Effects
Generate stunning text with artistic effects:
- 3D Metallic
- Neon Glow
- Watercolor
- Fire Effect
- Ice Crystal
- Gold Texture

### Advanced Text-to-Image
Generate images with enhanced control:
- **15+ Style Presets**: Photorealistic, Digital Art, Illustration, 3D Render, Anime, Oil Painting, Watercolor, Sketch, Cinematic, Fantasy, Minimalist, Vintage, Neon, Steampunk
- **Multiple Aspect Ratios**: 1:1, 16:9, 9:16, 4:3, 3:4, 2:3, 3:2
- **Negative Prompts**: Specify what to avoid in generated images
- **Guidance Scale**: Control how closely the AI follows your prompt

## 🔧 Advanced Configuration

### Enable AI Features

To enable Adobe Firefly-like AI features:

1. Set `ENABLE_STABLE_DIFFUSION=true` in `backend/.env`
2. Ensure you have sufficient RAM (8GB+) or use GPU
3. First run will download model weights (~4GB)

### GPU Support

For faster processing with NVIDIA GPU:

1. Install CUDA and cuDNN
2. Set `DEVICE=cuda` in `backend/.env`
3. Ensure PyTorch is installed with CUDA support

## 📁 Project Structure

```
AI-photo-editor/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API application
│   ├── image_processor.py  # Image processing utilities
│   ├── ai_models.py        # AI model integrations
│   ├── test_runner.py      # Automated test suite
│   ├── visual_documentation.py  # Visual documentation generator
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API integration
│   │   ├── styles/         # CSS styles
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── package.json        # Node dependencies
│   ├── Dockerfile          # Frontend container
│   └── nginx.conf          # Nginx configuration
├── docs/                   # Documentation & test results
│   ├── VISUAL_DOCUMENTATION.md      # Visual feature guide
│   ├── QUICK_REFERENCE.md           # Quick reference guide
│   ├── visual_documentation/        # 16 feature screenshots
│   └── test_results/                # API test results
├── FEATURE_TESTING_SUMMARY.md      # Complete testing report
├── TESTING_SCENARIOS.md             # Test scenarios
├── docker-compose.yml               # Docker orchestration
├── README.md                        # This file
└── SETUP_GUIDE.md                  # Detailed setup guide
```

## 🧪 Testing & Documentation

The application includes comprehensive testing and visual documentation:

### 📊 Test Results
- **93% Success Rate** (28/30 tests passing)
- **Backend API**: 13/14 tests passing
- **Frontend UI**: All 8 components verified
- **Responsive Design**: Tested on desktop, tablet, mobile

### 📸 Visual Documentation
Complete visual guide with 16 high-quality screenshots demonstrating:
- Image upload and processing workflow
- All editing features (filters, brightness, object removal)
- Responsive design across different devices
- User interface components

**View Documentation**:
- 📖 [Complete Testing Report](FEATURE_TESTING_SUMMARY.md) - Detailed test results and recommendations
- 📸 [Visual Documentation](docs/VISUAL_DOCUMENTATION.md) - Screenshot gallery with feature descriptions
- 📋 [Quick Reference](docs/QUICK_REFERENCE.md) - Quick access to all test resources

### Running Tests

```bash
# Backend API tests
cd backend
pip install -r requirements-test.txt
python test_runner.py --url http://localhost:8000 --functional --screenshots

# Generate visual documentation
playwright install chromium
python visual_documentation.py --url http://localhost:3000 --output test_results
```

For detailed testing instructions, see [TESTING_SETUP_README.md](TESTING_SETUP_README.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Stable Diffusion](https://github.com/CompVis/stable-diffusion)
- [RemBG](https://github.com/danielgatis/rembg)
- [OpenCV](https://opencv.org/)

## 📧 Contact

MUSTAQ AHAMMAD - [@MUSTAQ-AHAMMAD](https://github.com/MUSTAQ-AHAMMAD)

Project Link: [https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor](https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor)

---

Made with ❤️ by MUSTAQ AHAMMAD