"""
AI model integrations for advanced image generation and manipulation.
Includes Stable Diffusion and other generative models.
Supports multiple model versions for optimal results.
Advanced features: Generative Fill, Outpainting, Style Transfer, etc.
"""
import os
from typing import Optional, Dict, List, Tuple
import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Optional imports for AI models
try:
    from diffusers import (
        StableDiffusionPipeline,
        StableDiffusionInpaintPipeline,
        StableDiffusionImg2ImgPipeline,
        DPMSolverMultistepScheduler
    )
    DIFFUSERS_AVAILABLE = True
except ImportError:
    DIFFUSERS_AVAILABLE = False
    print("Warning: diffusers not available. AI generation features will be disabled.")

# Available model configurations
AVAILABLE_MODELS = {
    "sd-v1-5": {
        "id": "runwayml/stable-diffusion-v1-5",
        "description": "Stable Diffusion v1.5 - Fast and reliable",
        "recommended_for": "General purpose image generation",
        "memory_requirement": "4GB"
    },
    "sd-v2-1": {
        "id": "stabilityai/stable-diffusion-2-1",
        "description": "Stable Diffusion v2.1 - Higher quality",
        "recommended_for": "Higher quality outputs",
        "memory_requirement": "6GB"
    },
    "sd-inpainting": {
        "id": "runwayml/stable-diffusion-inpainting",
        "description": "Specialized inpainting model",
        "recommended_for": "Object removal and inpainting",
        "memory_requirement": "4GB"
    },
    "sd-v2-1-base": {
        "id": "stabilityai/stable-diffusion-2-1-base",
        "description": "SD 2.1 Base - Faster than full model",
        "recommended_for": "Quick generation with good quality",
        "memory_requirement": "4GB"
    }
}


class AIModelManager:
    """Manages AI models for image generation and manipulation."""

    def __init__(self, device: str = "cpu", model_cache_dir: str = "./models"):
        """
        Initialize AI model manager.

        Args:
            device: Device to run models on ("cpu" or "cuda")
            model_cache_dir: Directory to cache downloaded models
        """
        self.device = device
        self.model_cache_dir = model_cache_dir
        self.sd_pipeline = None
        self.inpaint_pipeline = None
        self.img2img_pipeline = None
        self.loaded_models: Dict[str, any] = {}
        self.current_model_id = None

        # Create cache directory if it doesn't exist
        os.makedirs(model_cache_dir, exist_ok=True)

        # Log available models
        print(f"Available AI Models: {list(AVAILABLE_MODELS.keys())}")

    def list_available_models(self) -> Dict[str, Dict]:
        """
        Get list of all available models with their configurations.

        Returns:
            Dictionary of model configurations
        """
        return AVAILABLE_MODELS

    def get_model_info(self, model_key: str) -> Optional[Dict]:
        """
        Get information about a specific model.

        Args:
            model_key: Model identifier key

        Returns:
            Model configuration dictionary or None
        """
        return AVAILABLE_MODELS.get(model_key)
    
    def load_stable_diffusion(self, model_key: str = "sd-v1-5") -> None:
        """
        Load Stable Diffusion model for text-to-image generation.

        Args:
            model_key: Model key from AVAILABLE_MODELS (e.g., 'sd-v1-5', 'sd-v2-1')
                      Or direct HuggingFace model identifier
        """
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers library is not available. Please install it to use AI generation.")

        # Check if model_key is a predefined key or a custom model ID
        if model_key in AVAILABLE_MODELS:
            model_id = AVAILABLE_MODELS[model_key]["id"]
            print(f"Loading {AVAILABLE_MODELS[model_key]['description']}")
        else:
            model_id = model_key
            print(f"Loading custom model: {model_id}")

        # Check if already loaded
        if self.sd_pipeline is not None and self.current_model_id == model_id:
            print(f"Model {model_id} already loaded")
            return

        print(f"Loading Stable Diffusion model: {model_id}")
        self.sd_pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )
        self.sd_pipeline = self.sd_pipeline.to(self.device)
        self.current_model_id = model_id
        self.loaded_models[model_id] = self.sd_pipeline
        print(f"Stable Diffusion model loaded successfully: {model_id}")
    
    def load_inpaint_model(self, model_key: str = "sd-inpainting") -> None:
        """
        Load inpainting model for AI-powered object removal.

        Args:
            model_key: Model key from AVAILABLE_MODELS (e.g., 'sd-inpainting')
                      Or direct HuggingFace model identifier
        """
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers library is not available.")

        # Check if model_key is a predefined key or a custom model ID
        if model_key in AVAILABLE_MODELS:
            model_id = AVAILABLE_MODELS[model_key]["id"]
            print(f"Loading {AVAILABLE_MODELS[model_key]['description']}")
        else:
            model_id = model_key
            print(f"Loading custom inpainting model: {model_id}")

        # Check if already loaded
        if self.inpaint_pipeline is not None:
            print(f"Inpainting model already loaded")
            return

        print(f"Loading inpainting model: {model_id}")
        self.inpaint_pipeline = StableDiffusionInpaintPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )
        self.inpaint_pipeline = self.inpaint_pipeline.to(self.device)
        self.loaded_models[model_id] = self.inpaint_pipeline
        print(f"Inpainting model loaded successfully: {model_id}")
    
    def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        width: int = 512,
        height: int = 512,
        model_key: str = "sd-v1-5",
        seed: Optional[int] = None
    ) -> Image.Image:
        """
        Generate image from text prompt using Stable Diffusion.

        Args:
            prompt: Text description of desired image
            negative_prompt: What to avoid in the image
            num_inference_steps: Number of denoising steps (more = better quality, slower)
            guidance_scale: How closely to follow the prompt (7.5 is standard)
            width: Output image width (must be multiple of 8)
            height: Output image height (must be multiple of 8)
            model_key: Which model to use (see AVAILABLE_MODELS)
            seed: Random seed for reproducibility (optional)

        Returns:
            Generated PIL Image
        """
        if self.sd_pipeline is None or self.current_model_id != AVAILABLE_MODELS.get(model_key, {}).get("id"):
            self.load_stable_diffusion(model_key)

        # Set seed for reproducibility if provided
        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)

        result = self.sd_pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height,
            generator=generator
        )

        return result.images[0]
    
    def inpaint_with_ai(
        self,
        image: Image.Image,
        mask: Image.Image,
        prompt: str = "fill naturally",
        num_inference_steps: int = 50
    ) -> Image.Image:
        """
        AI-powered inpainting using Stable Diffusion.
        
        Args:
            image: Original PIL Image
            mask: Binary mask (white=inpaint, black=keep)
            prompt: Description of what to fill with
            num_inference_steps: Number of denoising steps
            
        Returns:
            Inpainted image
        """
        if self.inpaint_pipeline is None:
            self.load_inpaint_model()
        
        # Ensure images are RGB
        image = image.convert("RGB")
        mask = mask.convert("RGB")
        
        result = self.inpaint_pipeline(
            prompt=prompt,
            image=image,
            mask_image=mask,
            num_inference_steps=num_inference_steps
        )
        
        return result.images[0]
    
    def generate_variations(
        self,
        image: Image.Image,
        prompt: str,
        num_variations: int = 3
    ) -> list[Image.Image]:
        """
        Generate variations of an image based on a prompt.
        
        Args:
            image: Source PIL Image
            prompt: Description of desired variations
            num_variations: Number of variations to generate
            
        Returns:
            List of generated images
        """
        if self.sd_pipeline is None:
            self.load_stable_diffusion()
        
        variations = []
        for i in range(num_variations):
            result = self.sd_pipeline(
                prompt=prompt,
                num_inference_steps=50,
                guidance_scale=7.5
            )
            variations.append(result.images[0])
        
        return variations
    
    def switch_model(self, model_key: str) -> None:
        """
        Switch to a different model.

        Args:
            model_key: Model key to switch to
        """
        print(f"Switching to model: {model_key}")
        self.unload_models()
        self.load_stable_diffusion(model_key)

    def unload_models(self) -> None:
        """Unload models to free up memory."""
        print("Unloading AI models...")
        self.sd_pipeline = None
        self.inpaint_pipeline = None
        self.loaded_models.clear()
        self.current_model_id = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("Models unloaded successfully")

    def get_loaded_models(self) -> List[str]:
        """
        Get list of currently loaded models.

        Returns:
            List of loaded model identifiers
        """
        return list(self.loaded_models.keys())

    # Advanced AI Features

    def generative_fill(
        self,
        image: Image.Image,
        mask: Image.Image,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5
    ) -> Image.Image:
        """
        Generative Fill: AI-powered object insertion/replacement.

        Args:
            image: Original PIL Image
            mask: Binary mask (white=generate, black=keep original)
            prompt: Description of what to generate in masked area
            negative_prompt: What to avoid generating
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt

        Returns:
            Image with generative fill applied
        """
        if self.inpaint_pipeline is None:
            self.load_inpaint_model()

        # Ensure images are RGB
        image = image.convert("RGB")
        mask = mask.convert("RGB")

        # Resize to supported dimensions (multiples of 8)
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        mask = mask.resize((width, height), Image.Resampling.LANCZOS)

        result = self.inpaint_pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            mask_image=mask,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale
        )

        return result.images[0]

    def outpaint_image(
        self,
        image: Image.Image,
        direction: str = "all",
        expand_pixels: int = 256,
        prompt: str = "",
        num_inference_steps: int = 50
    ) -> Image.Image:
        """
        Image Extension/Outpainting: Extend image borders with AI.

        Args:
            image: Original PIL Image
            direction: Direction to extend ("left", "right", "top", "bottom", "all")
            expand_pixels: Number of pixels to expand
            prompt: Description to guide the extension (empty for automatic)
            num_inference_steps: Number of denoising steps

        Returns:
            Extended image
        """
        if self.inpaint_pipeline is None:
            self.load_inpaint_model()

        width, height = image.size

        # Calculate new dimensions
        if direction == "all":
            new_width = width + expand_pixels * 2
            new_height = height + expand_pixels * 2
            paste_x, paste_y = expand_pixels, expand_pixels
        elif direction == "left":
            new_width = width + expand_pixels
            new_height = height
            paste_x, paste_y = expand_pixels, 0
        elif direction == "right":
            new_width = width + expand_pixels
            new_height = height
            paste_x, paste_y = 0, 0
        elif direction == "top":
            new_width = width
            new_height = height + expand_pixels
            paste_x, paste_y = 0, expand_pixels
        elif direction == "bottom":
            new_width = width
            new_height = height + expand_pixels
            paste_x, paste_y = 0, 0
        else:
            raise ValueError(f"Invalid direction: {direction}")

        # Ensure dimensions are multiples of 8
        new_width = (new_width // 8) * 8
        new_height = (new_height // 8) * 8

        # Create extended canvas
        extended_image = Image.new("RGB", (new_width, new_height), (255, 255, 255))
        extended_image.paste(image, (paste_x, paste_y))

        # Create mask (white = areas to fill)
        mask = Image.new("RGB", (new_width, new_height), (255, 255, 255))
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rectangle(
            [(paste_x, paste_y), (paste_x + width, paste_y + height)],
            fill=(0, 0, 0)
        )

        # Use image content as prompt if not provided
        if not prompt:
            prompt = "natural continuation of the image, seamless extension, consistent style"

        result = self.inpaint_pipeline(
            prompt=prompt,
            image=extended_image,
            mask_image=mask,
            num_inference_steps=num_inference_steps,
            guidance_scale=7.5
        )

        return result.images[0]

    def load_img2img_pipeline(self, model_key: str = "sd-v1-5") -> None:
        """
        Load image-to-image pipeline for style transfer and variations.

        Args:
            model_key: Model key from AVAILABLE_MODELS
        """
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers library is not available.")

        if model_key in AVAILABLE_MODELS:
            model_id = AVAILABLE_MODELS[model_key]["id"]
        else:
            model_id = model_key

        if self.img2img_pipeline is not None:
            print(f"Img2Img pipeline already loaded")
            return

        print(f"Loading Img2Img pipeline: {model_id}")
        self.img2img_pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )
        self.img2img_pipeline = self.img2img_pipeline.to(self.device)
        self.loaded_models[f"{model_id}-img2img"] = self.img2img_pipeline
        print(f"Img2Img pipeline loaded successfully")

    def apply_style_transfer(
        self,
        image: Image.Image,
        style_prompt: str,
        strength: float = 0.75,
        num_inference_steps: int = 50
    ) -> Image.Image:
        """
        Apply style transfer to an image.

        Args:
            image: Original PIL Image
            style_prompt: Description of desired style
            strength: How much to transform (0.0-1.0)
            num_inference_steps: Number of denoising steps

        Returns:
            Styled image
        """
        if self.img2img_pipeline is None:
            self.load_img2img_pipeline()

        # Ensure image is RGB
        image = image.convert("RGB")

        # Resize to supported dimensions
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)

        result = self.img2img_pipeline(
            prompt=style_prompt,
            image=image,
            strength=strength,
            num_inference_steps=num_inference_steps,
            guidance_scale=7.5
        )

        return result.images[0]

    def generate_text_effect(
        self,
        text: str,
        style: str = "3d metallic",
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 50
    ) -> Image.Image:
        """
        Generate text with artistic effects.

        Args:
            text: The text to generate
            style: Style description (e.g., "3d metallic", "neon glow", "watercolor")
            width: Output width
            height: Output height
            num_inference_steps: Number of denoising steps

        Returns:
            Generated text effect image
        """
        if self.sd_pipeline is None:
            self.load_stable_diffusion()

        # Create detailed prompt for text effect
        prompt = f"{style} text effect with the word '{text}', high quality, artistic, professional design"

        result = self.sd_pipeline(
            prompt=prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=7.5,
            width=width,
            height=height
        )

        return result.images[0]

    def enhance_with_style_presets(
        self,
        prompt: str,
        style_preset: str = "none"
    ) -> str:
        """
        Enhance prompt with style presets.

        Args:
            prompt: Base prompt
            style_preset: Style preset name

        Returns:
            Enhanced prompt
        """
        style_presets = {
            "none": prompt,
            "photorealistic": f"{prompt}, photorealistic, highly detailed, 8k, professional photography",
            "digital_art": f"{prompt}, digital art, trending on artstation, detailed, vibrant colors",
            "illustration": f"{prompt}, illustration, hand drawn, artistic, detailed",
            "3d_render": f"{prompt}, 3d render, octane render, highly detailed, professional",
            "anime": f"{prompt}, anime style, detailed, vibrant, professional anime art",
            "oil_painting": f"{prompt}, oil painting, artistic, painterly, detailed brushwork",
            "watercolor": f"{prompt}, watercolor painting, artistic, soft colors, flowing",
            "sketch": f"{prompt}, pencil sketch, hand drawn, artistic, detailed linework",
            "cinematic": f"{prompt}, cinematic lighting, dramatic, film grain, professional cinematography",
            "fantasy": f"{prompt}, fantasy art, magical, ethereal, detailed, epic",
            "minimalist": f"{prompt}, minimalist, simple, clean design, elegant",
            "vintage": f"{prompt}, vintage style, retro, aged, nostalgic",
            "neon": f"{prompt}, neon lights, vibrant colors, glowing, cyberpunk",
            "steampunk": f"{prompt}, steampunk style, mechanical, brass, Victorian era technology"
        }

        return style_presets.get(style_preset, prompt)

    def generate_with_style(
        self,
        prompt: str,
        style_preset: str = "none",
        negative_prompt: Optional[str] = None,
        aspect_ratio: str = "1:1",
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None
    ) -> Image.Image:
        """
        Generate image with style presets.

        Args:
            prompt: Text description
            style_preset: Style preset to apply
            negative_prompt: What to avoid
            aspect_ratio: Aspect ratio ("1:1", "16:9", "9:16", "4:3", "3:4")
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow prompt
            seed: Random seed for reproducibility

        Returns:
            Generated image
        """
        # Apply style preset
        enhanced_prompt = self.enhance_with_style_presets(prompt, style_preset)

        # Calculate dimensions based on aspect ratio
        aspect_ratios = {
            "1:1": (512, 512),
            "16:9": (768, 432),
            "9:16": (432, 768),
            "4:3": (640, 480),
            "3:4": (480, 640),
            "2:3": (512, 768),
            "3:2": (768, 512)
        }

        width, height = aspect_ratios.get(aspect_ratio, (512, 512))

        # Ensure dimensions are multiples of 8
        width = (width // 8) * 8
        height = (height // 8) * 8

        return self.generate_image(
            prompt=enhanced_prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            seed=seed
        )


# Global instance
_model_manager = None

def get_model_manager(device: str = "cpu", model_cache_dir: str = "./models") -> AIModelManager:
    """Get or create global AI model manager instance."""
    global _model_manager
    if _model_manager is None:
        _model_manager = AIModelManager(device=device, model_cache_dir=model_cache_dir)
    return _model_manager
