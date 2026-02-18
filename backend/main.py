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
from gemini_integration import get_gemini_integration
from advanced_ai_models import get_advanced_model_manager

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
ENABLE_GEMINI = os.getenv("ENABLE_GEMINI", "false").lower() == "true"
ENABLE_CONTROLNET = os.getenv("ENABLE_CONTROLNET", "false").lower() == "true"
ENABLE_SDXL = os.getenv("ENABLE_SDXL", "false").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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

# Initialize Gemini integration
if ENABLE_GEMINI:
    try:
        gemini = get_gemini_integration(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini: {e}")
        gemini = None
else:
    gemini = None

# Initialize advanced AI models
if ENABLE_CONTROLNET or ENABLE_SDXL:
    try:
        advanced_models = get_advanced_model_manager(device=DEVICE, model_cache_dir=MODEL_CACHE_DIR)
    except Exception as e:
        print(f"Warning: Could not initialize advanced models: {e}")
        advanced_models = None
else:
    advanced_models = None


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AI Photo Editor API",
        "version": "3.0.0",
        "description": "AI-powered photo editing with Gemini Pro, ControlNet, SDXL and advanced AI features",
        "endpoints": {
            "basic": {
                "upload": "/upload",
                "remove_background": "/remove-background",
                "inpaint": "/inpaint",
                "apply_filter": "/apply-filter",
                "adjust_brightness": "/adjust-brightness"
            },
            "ai_features": {
                "generative_fill": "/generative-fill",
                "outpaint": "/outpaint",
                "text_effect": "/text-effect",
                "style_transfer": "/style-transfer",
                "generate_with_style": "/generate-with-style"
            },
            "gemini_ai": {
                "analyze_image": "/analyze-image",
                "generate_caption": "/generate-caption",
                "enhance_prompt": "/enhance-prompt",
                "suggest_edits": "/suggest-edits",
                "extract_objects": "/extract-objects",
                "generate_negative_prompt": "/generate-negative-prompt",
                "suggest_color_palette": "/suggest-color-palette"
            },
            "advanced_ai": {
                "generate_with_controlnet": "/generate-with-controlnet",
                "generate_with_sdxl": "/generate-with-sdxl",
                "transform_with_sdxl": "/transform-with-sdxl"
            },
            "legacy": {
                "generate_image": "/generate-image"
            },
            "info": {
                "health": "/health",
                "style_presets": "/style-presets",
                "advanced_models_info": "/advanced-models-info"
            }
        },
        "features": {
            "stable_diffusion": ENABLE_STABLE_DIFFUSION,
            "gemini_pro": ENABLE_GEMINI,
            "controlnet": ENABLE_CONTROLNET,
            "sdxl": ENABLE_SDXL
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ai_models_enabled": ai_models is not None,
        "gemini_enabled": gemini is not None,
        "advanced_models_enabled": advanced_models is not None,
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


# Advanced AI Features

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
    Generative Fill: AI-powered object insertion/replacement.

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
    Image Extension/Outpainting: Extend image borders with AI.

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
    Generate text with artistic effects.

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
    Apply style transfer to an image.

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
    Generate image with style presets.
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


# Gemini AI Integration Endpoints

@app.post("/analyze-image")
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    analysis_type: str = Form("detailed")
):
    """
    Analyze an image using Gemini Vision Pro.
    
    Args:
        file: Image file to analyze
        analysis_type: Type of analysis ("detailed", "simple", "artistic", "technical")
    
    Returns:
        JSON with image analysis
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        result = gemini.analyze_image(image, analysis_type=analysis_type)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@app.post("/generate-caption")
async def generate_caption_endpoint(
    file: UploadFile = File(...),
    style: str = Form("descriptive")
):
    """
    Generate a caption for an image using Gemini Vision.
    
    Args:
        file: Image file
        style: Caption style ("descriptive", "creative", "technical", "social")
    
    Returns:
        JSON with generated caption
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        caption = gemini.generate_caption(image, style=style)
        return JSONResponse(content={"caption": caption, "style": style})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {str(e)}")


@app.post("/enhance-prompt")
async def enhance_prompt_endpoint(
    prompt: str = Form(...),
    context: str = Form("image generation")
):
    """
    Enhance a prompt using Gemini's language understanding.
    
    Args:
        prompt: Original prompt
        context: Context ("image generation", "style transfer", "editing")
    
    Returns:
        JSON with enhanced prompt
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        enhanced = gemini.enhance_prompt(prompt, context=context)
        return JSONResponse(content={
            "original_prompt": prompt,
            "enhanced_prompt": enhanced,
            "context": context
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt enhancement failed: {str(e)}")


@app.post("/suggest-edits")
async def suggest_edits_endpoint(file: UploadFile = File(...)):
    """
    Get AI-powered edit suggestions for an image using Gemini Vision.
    
    Args:
        file: Image file to analyze
    
    Returns:
        JSON with edit suggestions
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        result = gemini.suggest_edits(image)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit suggestion failed: {str(e)}")


@app.post("/extract-objects")
async def extract_objects_endpoint(file: UploadFile = File(...)):
    """
    Extract and list objects in an image using Gemini Vision.
    
    Args:
        file: Image file to analyze
    
    Returns:
        JSON with list of detected objects
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        objects = gemini.extract_objects(image)
        return JSONResponse(content={"objects": objects})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Object extraction failed: {str(e)}")


@app.post("/generate-negative-prompt")
async def generate_negative_prompt_endpoint(prompt: str = Form(...)):
    """
    Generate a negative prompt for image generation using Gemini.
    
    Args:
        prompt: Positive prompt
    
    Returns:
        JSON with generated negative prompt
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        negative = gemini.generate_negative_prompt(prompt)
        return JSONResponse(content={
            "positive_prompt": prompt,
            "negative_prompt": negative
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Negative prompt generation failed: {str(e)}")


@app.post("/suggest-color-palette")
async def suggest_color_palette_endpoint(file: UploadFile = File(...)):
    """
    Suggest color palette based on an image using Gemini Vision.
    
    Args:
        file: Image file to analyze
    
    Returns:
        JSON with color palette suggestions
    """
    if gemini is None:
        raise HTTPException(
            status_code=503,
            detail="Gemini features not enabled. Set ENABLE_GEMINI=true and GEMINI_API_KEY in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        result = gemini.suggest_color_palette(image)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color palette suggestion failed: {str(e)}")


# Advanced AI Model Endpoints (ControlNet, SDXL)

@app.post("/generate-with-controlnet")
async def generate_with_controlnet_endpoint(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    controlnet_type: str = Form("canny"),
    negative_prompt: Optional[str] = Form(None),
    num_inference_steps: int = Form(50),
    guidance_scale: float = Form(7.5),
    controlnet_conditioning_scale: float = Form(1.0),
    preprocess: bool = Form(True)
):
    """
    Generate image using ControlNet for precise structure control.
    
    Args:
        file: Control image (or raw image if preprocess=True)
        prompt: Text description
        controlnet_type: Type ("canny", "depth", "hed", "mlsd", "openpose", "scribble", etc.)
        negative_prompt: What to avoid
        num_inference_steps: Number of steps (20-100)
        guidance_scale: Prompt adherence (1.0-15.0)
        controlnet_conditioning_scale: ControlNet strength (0.0-2.0)
        preprocess: Auto-preprocess the control image
    
    Returns:
        Generated image with ControlNet guidance
    """
    if advanced_models is None or not ENABLE_CONTROLNET:
        raise HTTPException(
            status_code=503,
            detail="ControlNet not enabled. Set ENABLE_CONTROLNET=true in .env"
        )
    
    try:
        control_image = processor.load_from_upload(file)
        result = advanced_models.generate_with_controlnet(
            control_image=control_image,
            prompt=prompt,
            controlnet_type=controlnet_type,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            controlnet_conditioning_scale=controlnet_conditioning_scale,
            preprocess=preprocess
        )
        
        output = processor.to_bytes(result, format="PNG")
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=controlnet-{controlnet_type}.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ControlNet generation failed: {str(e)}")


@app.post("/generate-with-sdxl")
async def generate_with_sdxl_endpoint(
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    width: int = Form(1024),
    height: int = Form(1024),
    num_inference_steps: int = Form(50),
    guidance_scale: float = Form(7.5),
    use_refiner: bool = Form(False),
    refiner_steps: int = Form(50),
    seed: Optional[int] = Form(None)
):
    """
    Generate high-quality image using Stable Diffusion XL.
    
    Args:
        prompt: Text description
        negative_prompt: What to avoid
        width: Output width (recommended: 1024)
        height: Output height (recommended: 1024)
        num_inference_steps: Number of steps
        guidance_scale: Prompt adherence
        use_refiner: Use SDXL refiner for enhanced quality
        refiner_steps: Refiner steps
        seed: Random seed
    
    Returns:
        High-quality SDXL generated image
    """
    if advanced_models is None or not ENABLE_SDXL:
        raise HTTPException(
            status_code=503,
            detail="SDXL not enabled. Set ENABLE_SDXL=true in .env"
        )
    
    try:
        result = advanced_models.generate_with_sdxl(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            use_refiner=use_refiner,
            refiner_steps=refiner_steps,
            seed=seed
        )
        
        output = processor.to_bytes(result, format="PNG")
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=sdxl-generated.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SDXL generation failed: {str(e)}")


@app.post("/transform-with-sdxl")
async def transform_with_sdxl_endpoint(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    strength: float = Form(0.75),
    num_inference_steps: int = Form(50),
    guidance_scale: float = Form(7.5)
):
    """
    Transform image using SDXL img2img for high-quality style transfer.
    
    Args:
        file: Input image
        prompt: Transformation description
        negative_prompt: What to avoid
        strength: Transformation strength (0.0-1.0)
        num_inference_steps: Number of steps
        guidance_scale: Prompt adherence
    
    Returns:
        Transformed high-quality image
    """
    if advanced_models is None or not ENABLE_SDXL:
        raise HTTPException(
            status_code=503,
            detail="SDXL not enabled. Set ENABLE_SDXL=true in .env"
        )
    
    try:
        image = processor.load_from_upload(file)
        result = advanced_models.transform_with_sdxl(
            image=image,
            prompt=prompt,
            negative_prompt=negative_prompt,
            strength=strength,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale
        )
        
        output = processor.to_bytes(result, format="PNG")
        return StreamingResponse(
            io.BytesIO(output),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=sdxl-transformed.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SDXL transformation failed: {str(e)}")


@app.get("/advanced-models-info")
async def advanced_models_info():
    """Get information about available advanced AI models."""
    if advanced_models is None:
        return JSONResponse(content={
            "controlnet_enabled": ENABLE_CONTROLNET,
            "sdxl_enabled": ENABLE_SDXL,
            "gemini_enabled": ENABLE_GEMINI,
            "message": "Advanced models not initialized"
        })
    
    try:
        available = advanced_models.list_available_models()
        loaded = advanced_models.get_loaded_models()
        
        return JSONResponse(content={
            "controlnet_enabled": ENABLE_CONTROLNET,
            "sdxl_enabled": ENABLE_SDXL,
            "gemini_enabled": ENABLE_GEMINI,
            "available_models": available,
            "loaded_models": loaded
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)