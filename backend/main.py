"""
FastAPI backend for AI Photo Editor.
Provides endpoints for image upload, processing, and AI-powered editing.
"""
import os
import io
import uuid
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from PIL import Image

from image_processor import get_processor
from ai_models import get_model_manager

# Load environment variables
load_dotenv()

# Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
DEVICE = os.getenv("DEVICE", "cpu")
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "./models")
ENABLE_STABLE_DIFFUSION = os.getenv("ENABLE_STABLE_DIFFUSION", "false").lower() == "true"

# Create upload directory
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="AI Photo Editor API",
    description="AI-powered photo editing with object removal, background removal, and more",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
processor = get_processor()
if ENABLE_STABLE_DIFFUSION:
    try:
        ai_models = get_model_manager(device=DEVICE, model_cache_dir=MODEL_CACHE_DIR)
    except Exception as e:
        print(f"Warning: Could not initialize AI models: {e}")
        ai_models = None
else:
    ai_models = None


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AI Photo Editor API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/upload",
            "remove_background": "/remove-background",
            "inpaint": "/inpaint",
            "apply_filter": "/apply-filter",
            "adjust_brightness": "/adjust-brightness",
            "generate_image": "/generate-image (requires Stable Diffusion)",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ai_models_enabled": ai_models is not None,
        "device": DEVICE
    }


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image for processing.
    
    Args:
        file: Image file to upload
        
    Returns:
        JSON with file_id and metadata
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1] or ".png"
    filename = f"{file_id}{file_extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Get image metadata
    image = processor.load_image(contents)
    width, height = image.size
    
    return {
        "file_id": file_id,
        "filename": filename,
        "width": width,
        "height": height,
        "size": len(contents)
    }


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """
    Remove background from an image.
    
    Args:
        file: Image file
        
    Returns:
        Image with transparent background
    """
    try:
        # Read and process image
        contents = await file.read()
        image = processor.load_image(contents)
        
        # Remove background
        result = processor.remove_background(image)
        
        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")
        
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=no-bg-{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")


@app.post("/inpaint")
async def inpaint_image(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    use_ai: Optional[bool] = Form(False),
    prompt: Optional[str] = Form("fill naturally")
):
    """
    Remove objects from image using inpainting.
    
    Args:
        image: Original image file
        mask: Binary mask (white=remove, black=keep)
        use_ai: Whether to use AI inpainting (requires Stable Diffusion)
        prompt: Prompt for AI inpainting
        
    Returns:
        Inpainted image
    """
    try:
        # Read images
        image_contents = await image.read()
        mask_contents = await mask.read()
        
        img = processor.load_image(image_contents)
        mask_img = processor.load_image(mask_contents)
        
        # Inpaint
        if use_ai and ai_models is not None:
            result = ai_models.inpaint_with_ai(img, mask_img, prompt=prompt)
        else:
            result = processor.inpaint_object(img, mask_img)
        
        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")
        
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=inpainted-{image.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")


@app.post("/apply-filter")
async def apply_filter(
    file: UploadFile = File(...),
    filter_type: str = Form("none")
):
    """
    Apply filter to an image.
    
    Args:
        file: Image file
        filter_type: Type of filter (blur, sharpen, edge, grayscale, none)
        
    Returns:
        Filtered image
    """
    try:
        # Read and process image
        contents = await file.read()
        image = processor.load_image(contents)
        
        # Apply filter
        result = processor.apply_filter(image, filter_type=filter_type)
        
        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")
        
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=filtered-{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filter application failed: {str(e)}")


@app.post("/adjust-brightness")
async def adjust_brightness(
    file: UploadFile = File(...),
    factor: float = Form(1.0)
):
    """
    Adjust image brightness.
    
    Args:
        file: Image file
        factor: Brightness factor (1.0 = no change, >1.0 = brighter, <1.0 = darker)
        
    Returns:
        Brightness-adjusted image
    """
    try:
        # Validate factor
        if factor < 0.1 or factor > 3.0:
            raise HTTPException(status_code=400, detail="Factor must be between 0.1 and 3.0")
        
        # Read and process image
        contents = await file.read()
        image = processor.load_image(contents)
        
        # Adjust brightness
        result = processor.adjust_brightness(image, factor=factor)
        
        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")
        
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=adjusted-{file.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brightness adjustment failed: {str(e)}")


@app.post("/generate-image")
async def generate_image(
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    width: int = Form(512),
    height: int = Form(512)
):
    """
    Generate image from text prompt using Stable Diffusion.
    Requires ENABLE_STABLE_DIFFUSION=true in .env
    
    Args:
        prompt: Text description of desired image
        negative_prompt: What to avoid in the image
        width: Output image width
        height: Output image height
        
    Returns:
        Generated image
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI image generation is not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )
    
    try:
        # Generate image
        result = ai_models.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height
        )
        
        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")
        
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=generated.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.get("/process-image")
async def process_image(image_url: str):
    """Legacy endpoint for backward compatibility."""
    return {
        "message": "This endpoint is deprecated. Please use the new endpoints.",
        "image_url": image_url,
        "new_endpoints": [
            "/upload",
            "/remove-background",
            "/inpaint",
            "/apply-filter",
            "/adjust-brightness",
            "/generate-image"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)