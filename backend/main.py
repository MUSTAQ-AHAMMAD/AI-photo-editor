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
        "version": "2.0.0",
        "description": "Adobe Firefly-like AI photo editing capabilities",
        "endpoints": {
            "basic": {
                "upload": "/upload",
                "remove_background": "/remove-background",
                "inpaint": "/inpaint",
                "apply_filter": "/apply-filter",
                "adjust_brightness": "/adjust-brightness"
            },
            "adobe_firefly_features": {
                "generative_fill": "/generative-fill",
                "outpaint": "/outpaint",
                "text_effect": "/text-effect",
                "style_transfer": "/style-transfer",
                "generate_with_style": "/generate-with-style"
            },
            "legacy": {
                "generate_image": "/generate-image"
            },
            "info": {
                "health": "/health",
                "style_presets": "/style-presets"
            }
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


# Adobe Firefly-like Features

@app.get("/style-presets")
async def get_style_presets():
    """Get list of available style presets."""
    return {
        "style_presets": [
            {"id": "none", "name": "None", "description": "No style applied"},
            {"id": "photorealistic", "name": "Photorealistic", "description": "Professional photography style"},
            {"id": "digital_art", "name": "Digital Art", "description": "Digital artwork style"},
            {"id": "illustration", "name": "Illustration", "description": "Hand-drawn illustration"},
            {"id": "3d_render", "name": "3D Render", "description": "3D rendered style"},
            {"id": "anime", "name": "Anime", "description": "Anime/manga style"},
            {"id": "oil_painting", "name": "Oil Painting", "description": "Traditional oil painting"},
            {"id": "watercolor", "name": "Watercolor", "description": "Watercolor painting style"},
            {"id": "sketch", "name": "Sketch", "description": "Pencil sketch style"},
            {"id": "cinematic", "name": "Cinematic", "description": "Cinematic film style"},
            {"id": "fantasy", "name": "Fantasy", "description": "Fantasy art style"},
            {"id": "minimalist", "name": "Minimalist", "description": "Minimalist design"},
            {"id": "vintage", "name": "Vintage", "description": "Vintage/retro style"},
            {"id": "neon", "name": "Neon", "description": "Neon cyberpunk style"},
            {"id": "steampunk", "name": "Steampunk", "description": "Steampunk aesthetic"}
        ],
        "aspect_ratios": [
            {"id": "1:1", "name": "Square", "width": 512, "height": 512},
            {"id": "16:9", "name": "Landscape Wide", "width": 768, "height": 432},
            {"id": "9:16", "name": "Portrait Tall", "width": 432, "height": 768},
            {"id": "4:3", "name": "Landscape", "width": 640, "height": 480},
            {"id": "3:4", "name": "Portrait", "width": 480, "height": 640},
            {"id": "2:3", "name": "Portrait Photo", "width": 512, "height": 768},
            {"id": "3:2", "name": "Landscape Photo", "width": 768, "height": 512}
        ]
    }


@app.post("/generative-fill")
async def generative_fill(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    num_inference_steps: int = Form(50),
    guidance_scale: float = Form(7.5)
):
    """
    Generative Fill: AI-powered object insertion/replacement (Adobe Firefly-like).

    Args:
        image: Original image file
        mask: Binary mask (white=generate, black=keep original)
        prompt: Description of what to generate in masked area
        negative_prompt: What to avoid generating
        num_inference_steps: Number of denoising steps (10-50)
        guidance_scale: How closely to follow prompt (1.0-15.0)

    Returns:
        Image with generative fill applied
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI features not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )

    try:
        # Read images
        image_contents = await image.read()
        mask_contents = await mask.read()

        img = processor.load_image(image_contents)
        mask_img = processor.load_image(mask_contents)

        # Apply generative fill
        result = ai_models.generative_fill(
            image=img,
            mask=mask_img,
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale
        )

        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")

        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=generative-fill-{image.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generative fill failed: {str(e)}")


@app.post("/outpaint")
async def outpaint_image(
    image: UploadFile = File(...),
    direction: str = Form("all"),
    expand_pixels: int = Form(256),
    prompt: Optional[str] = Form(""),
    num_inference_steps: int = Form(50)
):
    """
    Image Extension/Outpainting: Extend image borders with AI (Adobe Firefly-like).

    Args:
        image: Original image file
        direction: Direction to extend ("left", "right", "top", "bottom", "all")
        expand_pixels: Number of pixels to expand (64-512)
        prompt: Description to guide the extension
        num_inference_steps: Number of denoising steps (10-50)

    Returns:
        Extended image
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI features not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )

    try:
        # Validate parameters
        if direction not in ["left", "right", "top", "bottom", "all"]:
            raise HTTPException(status_code=400, detail="Invalid direction")

        if expand_pixels < 64 or expand_pixels > 512:
            raise HTTPException(status_code=400, detail="expand_pixels must be between 64 and 512")

        # Read image
        image_contents = await image.read()
        img = processor.load_image(image_contents)

        # Apply outpainting
        result = ai_models.outpaint_image(
            image=img,
            direction=direction,
            expand_pixels=expand_pixels,
            prompt=prompt,
            num_inference_steps=num_inference_steps
        )

        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")

        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=outpainted-{image.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outpainting failed: {str(e)}")


@app.post("/text-effect")
async def generate_text_effect(
    text: str = Form(...),
    style: str = Form("3d metallic"),
    width: int = Form(512),
    height: int = Form(512),
    num_inference_steps: int = Form(50)
):
    """
    Generate text with artistic effects (Adobe Firefly-like text effects).

    Args:
        text: The text to generate
        style: Style description (e.g., "3d metallic", "neon glow", "watercolor")
        width: Output width (256-1024)
        height: Output height (256-1024)
        num_inference_steps: Number of denoising steps (10-50)

    Returns:
        Generated text effect image
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI features not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )

    try:
        # Validate dimensions
        if width < 256 or width > 1024 or height < 256 or height > 1024:
            raise HTTPException(status_code=400, detail="Width and height must be between 256 and 1024")

        # Generate text effect
        result = ai_models.generate_text_effect(
            text=text,
            style=style,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps
        )

        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")

        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=text-effect-{text}.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text effect generation failed: {str(e)}")


@app.post("/style-transfer")
async def apply_style_transfer(
    image: UploadFile = File(...),
    style_prompt: str = Form(...),
    strength: float = Form(0.75),
    num_inference_steps: int = Form(50)
):
    """
    Apply style transfer to an image (Adobe Firefly-like recolor/style).

    Args:
        image: Original image file
        style_prompt: Description of desired style
        strength: How much to transform (0.0-1.0)
        num_inference_steps: Number of denoising steps (10-50)

    Returns:
        Styled image
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI features not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )

    try:
        # Validate strength
        if strength < 0.0 or strength > 1.0:
            raise HTTPException(status_code=400, detail="Strength must be between 0.0 and 1.0")

        # Read image
        image_contents = await image.read()
        img = processor.load_image(image_contents)

        # Apply style transfer
        result = ai_models.apply_style_transfer(
            image=img,
            style_prompt=style_prompt,
            strength=strength,
            num_inference_steps=num_inference_steps
        )

        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")

        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=styled-{image.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Style transfer failed: {str(e)}")


@app.post("/generate-with-style")
async def generate_with_style(
    prompt: str = Form(...),
    style_preset: str = Form("none"),
    negative_prompt: Optional[str] = Form(None),
    aspect_ratio: str = Form("1:1"),
    num_inference_steps: int = Form(50),
    guidance_scale: float = Form(7.5),
    seed: Optional[int] = Form(None)
):
    """
    Generate image with style presets (Adobe Firefly-like).
    Enhanced version of text-to-image with style presets and aspect ratios.

    Args:
        prompt: Text description of desired image
        style_preset: Style preset to apply (see /style-presets)
        negative_prompt: What to avoid in the image
        aspect_ratio: Aspect ratio ("1:1", "16:9", "9:16", "4:3", "3:4", etc.)
        num_inference_steps: Number of denoising steps (10-50)
        guidance_scale: How closely to follow prompt (1.0-15.0)
        seed: Random seed for reproducibility

    Returns:
        Generated image with applied style
    """
    if ai_models is None:
        raise HTTPException(
            status_code=503,
            detail="AI features not enabled. Set ENABLE_STABLE_DIFFUSION=true in .env"
        )

    try:
        # Generate image with style
        result = ai_models.generate_with_style(
            prompt=prompt,
            style_preset=style_preset,
            negative_prompt=negative_prompt,
            aspect_ratio=aspect_ratio,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            seed=seed
        )

        # Convert to bytes
        output = processor.to_bytes(result, format="PNG")

        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=generated-{style_preset}.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)