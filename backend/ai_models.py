"""
AI model integrations for advanced image generation and manipulation.
Includes Stable Diffusion and other generative models.
Supports multiple model versions for optimal results.
"""
import os
from typing import Optional, Dict, List
import torch
from PIL import Image

# Optional imports for AI models
try:
    from diffusers import StableDiffusionPipeline, StableDiffusionInpaintPipeline
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


# Global instance
_model_manager = None

def get_model_manager(device: str = "cpu", model_cache_dir: str = "./models") -> AIModelManager:
    """Get or create global AI model manager instance."""
    global _model_manager
    if _model_manager is None:
        _model_manager = AIModelManager(device=device, model_cache_dir=model_cache_dir)
    return _model_manager
