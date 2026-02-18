# AI Photo Editor - Detailed Setup Guide

This guide provides detailed instructions for setting up and running the AI Photo Editor application.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Docker Setup](#docker-setup)
4. [Local Development Setup](#local-development-setup)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB (16GB recommended for AI features)
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows 10+

### Software Requirements
- Docker 20.10+ and Docker Compose 2.0+ (for Docker setup)
- OR:
  - Python 3.12+ (3.12.3 tested and recommended)
  - Node.js 20+
  - npm or yarn

### Optional (for GPU acceleration)
- NVIDIA GPU with CUDA support
- CUDA Toolkit 11.8+
- cuDNN 8.0+

## Installation Methods

### Method 1: Docker (Recommended)

Docker provides the easiest way to run the application with all dependencies included.

#### Step 1: Install Docker

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

**macOS:**
Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

**Windows:**
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

#### Step 2: Clone the Repository

```bash
git clone https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor.git
cd AI-photo-editor
```

#### Step 3: Configure Environment

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration  
cp frontend/.env.example frontend/.env
```

Edit the `.env` files as needed (see [Configuration](#configuration) section).

#### Step 4: Build and Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

#### Step 5: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

#### Step 6: Stop the Application

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Method 2: Local Development Setup

For development or if you prefer not to use Docker.

#### Backend Setup

1. **Install Python 3.12+**
   ```bash
   python --version  # Should be 3.12 or higher
   ```

2. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Activate virtual environment
   # On Linux/macOS:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env as needed
   ```

5. **Run Backend Server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Install Node.js 20+**
   ```bash
   node --version  # Should be 20 or higher
   npm --version
   ```

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env to point to backend (default: http://localhost:8000)
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## Configuration

### Backend Configuration (`backend/.env`)

```env
# Server Settings
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Upload Settings
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.webp

# Model Settings
DEVICE=cpu  # Use 'cuda' for GPU acceleration
MODEL_CACHE_DIR=./models
ENABLE_STABLE_DIFFUSION=false  # Set to 'true' to enable AI generation

# AI Model Configuration
STABLE_DIFFUSION_MODEL=runwayml/stable-diffusion-v1-5
HUGGINGFACE_TOKEN=  # Optional: for private models
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

### Docker Configuration (`docker-compose.yml`)

Key settings to adjust:

```yaml
services:
  backend:
    environment:
      - DEVICE=cpu  # Change to 'cuda' for GPU
      - ENABLE_STABLE_DIFFUSION=false  # Enable AI features
    ports:
      - "8000:8000"  # Change if port 8000 is in use
    
  frontend:
    ports:
      - "3000:80"  # Change if port 3000 is in use
```

## Running the Application

### Development Mode

**Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode

**Docker:**
```bash
docker-compose -f docker-compose.yml up -d
```

**Manual:**
```bash
# Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8000
sudo lsof -i :8000  # Linux/macOS
netstat -ano | findstr :8000  # Windows

# Kill the process or change ports in docker-compose.yml
```

#### 2. Docker Build Fails

**Error:** Various build errors

**Solution:**
```bash
# Clear Docker cache
docker-compose down
docker system prune -a
docker-compose up --build
```

#### 3. Backend Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**
```bash
# Ensure you're in virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Frontend Build Fails

**Error:** `npm install` errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 5. RemBG Not Working

**Error:** Background removal fails

**Solution:**
```bash
# Ensure rembg is properly installed
pip uninstall rembg
pip install rembg[gpu]  # For GPU
# or
pip install rembg[cpu]  # For CPU
```

#### 6. Out of Memory

**Error:** Process killed or OOM

**Solution:**
- Reduce image sizes before processing
- Disable Stable Diffusion (`ENABLE_STABLE_DIFFUSION=false`)
- Increase Docker memory limit
- Use smaller batch sizes

### Enable GPU Support

#### 1. Install CUDA

Follow NVIDIA's official guide to install CUDA Toolkit for your OS.

#### 2. Install GPU-enabled PyTorch

```bash
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

#### 3. Update Configuration

```env
DEVICE=cuda
```

#### 4. Docker GPU Support

Update `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Production Deployment

### Security Considerations

1. **Use HTTPS**: Set up SSL/TLS certificates
2. **Environment Variables**: Use secure secrets management
3. **CORS**: Restrict `ALLOWED_ORIGINS` to your domain
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Authentication**: Add user authentication for production use

### Deployment Platforms

#### AWS/DigitalOcean/GCP

1. Deploy using Docker Compose or Kubernetes
2. Use managed databases if storing user data
3. Set up load balancers for scaling
4. Configure auto-scaling based on load

#### Heroku

```bash
# Backend
heroku create your-app-backend
git subtree push --prefix backend heroku main

# Frontend
heroku create your-app-frontend
git subtree push --prefix frontend heroku main
```

#### Vercel (Frontend)

```bash
cd frontend
npm install -g vercel
vercel
```

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- Memory usage
- Disk space (for uploads)

Recommended tools:
- Prometheus + Grafana
- DataDog
- New Relic

## Performance Optimization

### Backend

1. **Use GPU**: Significant speed improvement for AI operations
2. **Caching**: Implement Redis for caching processed images
3. **Queue System**: Use Celery for background processing
4. **CDN**: Serve processed images via CDN

### Frontend

1. **Code Splitting**: Lazy load components
2. **Image Optimization**: Compress uploaded images
3. **CDN**: Use CDN for static assets
4. **Caching**: Implement service workers

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor/discussions)
- **Email**: Contact repository owner

## Next Steps

1. Explore the API documentation at http://localhost:8000/docs
2. Try different image processing features
3. Enable AI generation for advanced features
4. Customize the UI to match your brand
5. Add authentication for production use

---

Happy Editing! 🎨