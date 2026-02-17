"""
AI model integrations for advanced image generation and manipulation.
Includes Stable Diffusion and other generative models.
"""
import os
from typing import Optional
import torch
from PIL import Image

# Optional imports for AI models
try:
    from diffusers import StableDiffusionPipeline, StableDiffusionInpaintPipeline
    DIFFUSERS_AVAILABLE = True
except ImportError:
    DIFFUSERS_AVAILABLE = False
    print("Warning: diffusers not available. AI generation features will be disabled.")


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
        
        # Create cache directory if it doesn't exist
        os.makedirs(model_cache_dir, exist_ok=True)
    
    def load_stable_diffusion(self, model_id: str = "runwayml/stable-diffusion-v1-5") -> None:
        """
        Load Stable Diffusion model for text-to-image generation.
        
        Args:
            model_id: HuggingFace model identifier
        """
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers library is not available. Please install it to use AI generation.")
        
        if self.sd_pipeline is None:
            print(f"Loading Stable Diffusion model: {model_id}")
            self.sd_pipeline = StableDiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=self.model_cache_dir
            )
            self.sd_pipeline = self.sd_pipeline.to(self.device)
            print("Stable Diffusion model loaded successfully")
    
    def load_inpaint_model(self, model_id: str = "runwayml/stable-diffusion-inpainting") -> None:
        """
        Load inpainting model for AI-powered object removal.
        
        Args:
            model_id: HuggingFace model identifier
        """
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers library is not available.")
        
        if self.inpaint_pipeline is None:
            print(f"Loading inpainting model: {model_id}")
            self.inpaint_pipeline = StableDiffusionInpaintPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=self.model_cache_dir
            )
            self.inpaint_pipeline = self.inpaint_pipeline.to(self.device)
            print("Inpainting model loaded successfully")
    
    def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        width: int = 512,
        height: int = 512
    ) -> Image.Image:
        """
        Generate image from text prompt using Stable Diffusion.
        
        Args:
            prompt: Text description of desired image
            negative_prompt: What to avoid in the image
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt
            width: Output image width
            height: Output image height
            
        Returns:
            Generated PIL Image
        """
        if self.sd_pipeline is None:
            self.load_stable_diffusion()
        
        result = self.sd_pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height
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
    
    def unload_models(self) -> None:
        """Unload models to free up memory."""
        self.sd_pipeline = None
        self.inpaint_pipeline = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


# Global instance
_model_manager = None

def get_model_manager(device: str = "cpu", model_cache_dir: str = "./models") -> AIModelManager:
    """Get or create global AI model manager instance."""
    global _model_manager
    if _model_manager is None:
        _model_manager = AIModelManager(device=device, model_cache_dir=model_cache_dir)
    return _model_manager
