# AI Photo Editor 🎨✨

A comprehensive AI-powered photo editing application that brings professional-grade image manipulation to your fingertips. Built with FastAPI, React, and cutting-edge machine learning models.

![AI Photo Editor](https://img.shields.io/badge/AI-Photo%20Editor-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal)

## ✨ Features

- 🖼️ **Image Upload**: Drag-and-drop interface for easy image uploads
- 🎯 **Object Removal**: Interactive canvas to select and remove unwanted objects
- 🌟 **Background Removal**: One-click background removal using RemBG
- 🎨 **Filters**: Apply various filters (blur, sharpen, edge detection, grayscale)
- 💡 **Brightness Adjustment**: Fine-tune image brightness
- 🤖 **AI Generation**: Generate images from text prompts (with Stable Diffusion)
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

- `GET /`: API information
- `GET /health`: Health check
- `POST /upload`: Upload an image
- `POST /remove-background`: Remove background from image
- `POST /inpaint`: Remove objects using inpainting
- `POST /apply-filter`: Apply filters to image
- `POST /adjust-brightness`: Adjust image brightness
- `POST /generate-image`: Generate images from text (requires Stable Diffusion)

Full API documentation available at http://localhost:8000/docs

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
DEVICE=cpu  # or 'cuda' for GPU
ENABLE_STABLE_DIFFUSION=false  # Set to 'true' to enable AI generation
MODEL_CACHE_DIR=./models
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

## 🔧 Advanced Features

### Enable AI Image Generation

To enable Stable Diffusion for AI image generation:

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
├── docker-compose.yml      # Docker orchestration
├── README.md               # This file
├── SETUP_GUIDE.md         # Detailed setup guide
└── .gitignore             # Git ignore rules
```

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