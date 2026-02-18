"""
Advanced AI model integrations including ControlNet, SDXL, and other state-of-the-art models.
Provides cutting-edge image generation and manipulation capabilities.
"""
import os
from typing import Optional, Dict, List, Tuple
import torch
import numpy as np
from PIL import Image

try:
    from diffusers import (
        ControlNetModel,
        StableDiffusionControlNetPipeline,
        StableDiffusionXLPipeline,
        StableDiffusionXLImg2ImgPipeline,
        DPMSolverMultistepScheduler,
        EulerAncestralDiscreteScheduler,
        AutoencoderKL
    )
    ADVANCED_DIFFUSERS_AVAILABLE = True
except ImportError:
    ADVANCED_DIFFUSERS_AVAILABLE = False
    print("Warning: Advanced diffusers features not available.")

try:
    from controlnet_aux import (
        CannyDetector,
        HEDdetector,
        OpenposeDetector,
        MLSDdetector,
        LineartDetector
    )
    CONTROLNET_AUX_AVAILABLE = True
except ImportError:
    CONTROLNET_AUX_AVAILABLE = False
    print("Warning: controlnet_aux not available. Preprocessors will be disabled.")


# Available ControlNet models
CONTROLNET_MODELS = {
    "canny": {
        "id": "lllyasviel/sd-controlnet-canny",
        "description": "Edge detection for precise structure control",
        "preprocessor": "canny"
    },
    "depth": {
        "id": "lllyasviel/sd-controlnet-depth",
        "description": "Depth map for 3D structure awareness",
        "preprocessor": "depth"
    },
    "hed": {
        "id": "lllyasviel/sd-controlnet-hed",
        "description": "Holistically-nested edge detection",
        "preprocessor": "hed"
    },
    "mlsd": {
        "id": "lllyasviel/sd-controlnet-mlsd",
        "description": "Line detection for architectural images",
        "preprocessor": "mlsd"
    },
    "normal": {
        "id": "lllyasviel/sd-controlnet-normal",
        "description": "Normal map for surface details",
        "preprocessor": "normal"
    },
    "openpose": {
        "id": "lllyasviel/sd-controlnet-openpose",
        "description": "Human pose detection and control",
        "preprocessor": "openpose"
    },
    "scribble": {
        "id": "lllyasviel/sd-controlnet-scribble",
        "description": "Sketch/scribble-based generation",
        "preprocessor": "scribble"
    },
    "seg": {
        "id": "lllyasviel/sd-controlnet-seg",
        "description": "Semantic segmentation control",
        "preprocessor": "seg"
    }
}

# SDXL models
SDXL_MODELS = {
    "sdxl-base": {
        "id": "stabilityai/stable-diffusion-xl-base-1.0",
        "description": "SDXL Base - Highest quality generation",
        "memory_requirement": "8GB"
    },
    "sdxl-refiner": {
        "id": "stabilityai/stable-diffusion-xl-refiner-1.0",
        "description": "SDXL Refiner - Enhances SDXL base output",
        "memory_requirement": "8GB"
    }
}


class AdvancedAIModelManager:
    """Manages advanced AI models for state-of-the-art image generation."""

    def __init__(self, device: str = "cpu", model_cache_dir: str = "./models"):
        """
        Initialize advanced AI model manager.

        Args:
            device: Device to run models on ("cpu" or "cuda")
            model_cache_dir: Directory to cache downloaded models
        """
        self.device = device
        self.model_cache_dir = model_cache_dir
        self.controlnet_pipeline = None
        self.sdxl_pipeline = None
        self.sdxl_refiner = None
        self.sdxl_img2img = None
        self.loaded_models: Dict[str, any] = {}
        
        # Initialize preprocessors
        self.preprocessors = {}
        if CONTROLNET_AUX_AVAILABLE:
            self._init_preprocessors()

        os.makedirs(model_cache_dir, exist_ok=True)
        print(f"Advanced AI Model Manager initialized")
        print(f"Available ControlNet models: {list(CONTROLNET_MODELS.keys())}")
        print(f"Available SDXL models: {list(SDXL_MODELS.keys())}")

    def _init_preprocessors(self):
        """Initialize image preprocessors for ControlNet."""
        try:
            self.preprocessors["canny"] = CannyDetector()
            self.preprocessors["hed"] = HEDdetector.from_pretrained("lllyasviel/ControlNet")
            self.preprocessors["mlsd"] = MLSDdetector.from_pretrained("lllyasviel/ControlNet")
            self.preprocessors["openpose"] = OpenposeDetector.from_pretrained("lllyasviel/ControlNet")
            self.preprocessors["lineart"] = LineartDetector.from_pretrained("lllyasviel/ControlNet")
            print("ControlNet preprocessors initialized")
        except Exception as e:
            print(f"Warning: Could not initialize all preprocessors: {e}")

    def preprocess_image(self, image: Image.Image, preprocessor_type: str) -> Image.Image:
        """
        Preprocess image for ControlNet.

        Args:
            image: Input PIL Image
            preprocessor_type: Type of preprocessor to use

        Returns:
            Preprocessed image
        """
        if not CONTROLNET_AUX_AVAILABLE:
            return image

        if preprocessor_type not in self.preprocessors:
            print(f"Preprocessor {preprocessor_type} not available, returning original image")
            return image

        try:
            preprocessor = self.preprocessors[preprocessor_type]
            processed = preprocessor(image)
            return processed
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return image

    def load_controlnet_pipeline(self, controlnet_type: str = "canny", base_model: str = "runwayml/stable-diffusion-v1-5"):
        """
        Load ControlNet pipeline for guided image generation.

        Args:
            controlnet_type: Type of ControlNet to load
            base_model: Base Stable Diffusion model to use
        """
        if not ADVANCED_DIFFUSERS_AVAILABLE:
            raise RuntimeError("Advanced diffusers not available")

        if controlnet_type not in CONTROLNET_MODELS:
            raise ValueError(f"Unknown ControlNet type: {controlnet_type}")

        controlnet_model_id = CONTROLNET_MODELS[controlnet_type]["id"]
        
        print(f"Loading ControlNet: {CONTROLNET_MODELS[controlnet_type]['description']}")
        
        controlnet = ControlNetModel.from_pretrained(
            controlnet_model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )

        self.controlnet_pipeline = StableDiffusionControlNetPipeline.from_pretrained(
            base_model,
            controlnet=controlnet,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )
        
        self.controlnet_pipeline = self.controlnet_pipeline.to(self.device)
        
        # Optimize performance
        if self.device == "cuda":
            self.controlnet_pipeline.enable_attention_slicing()
        
        self.loaded_models[f"controlnet-{controlnet_type}"] = self.controlnet_pipeline
        print(f"ControlNet pipeline loaded successfully")

    def generate_with_controlnet(
        self,
        control_image: Image.Image,
        prompt: str,
        controlnet_type: str = "canny",
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        controlnet_conditioning_scale: float = 1.0,
        preprocess: bool = True
    ) -> Image.Image:
        """
        Generate image using ControlNet for precise control.

        Args:
            control_image: Control image (or raw image if preprocess=True)
            prompt: Text description
            controlnet_type: Type of ControlNet to use
            negative_prompt: What to avoid
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt
            controlnet_conditioning_scale: Strength of ControlNet guidance (0.0-2.0)
            preprocess: Whether to preprocess the control image

        Returns:
            Generated image
        """
        if self.controlnet_pipeline is None:
            self.load_controlnet_pipeline(controlnet_type)

        # Preprocess control image if requested
        if preprocess:
            control_image = self.preprocess_image(control_image, controlnet_type)

        # Ensure RGB format
        control_image = control_image.convert("RGB")

        # Resize to supported dimensions
        width, height = control_image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        control_image = control_image.resize((width, height), Image.Resampling.LANCZOS)

        result = self.controlnet_pipeline(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=control_image,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            controlnet_conditioning_scale=controlnet_conditioning_scale
        )

        return result.images[0]

    def load_sdxl_pipeline(self, use_refiner: bool = False):
        """
        Load Stable Diffusion XL for highest quality generation.

        Args:
            use_refiner: Whether to also load the SDXL refiner
        """
        if not ADVANCED_DIFFUSERS_AVAILABLE:
            raise RuntimeError("Advanced diffusers not available")

        print("Loading SDXL Base model...")
        
        # Load VAE for better quality
        vae = AutoencoderKL.from_pretrained(
            "madebyollin/sdxl-vae-fp16-fix",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir
        )

        self.sdxl_pipeline = StableDiffusionXLPipeline.from_pretrained(
            SDXL_MODELS["sdxl-base"]["id"],
            vae=vae,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir,
            use_safetensors=True
        )
        
        self.sdxl_pipeline = self.sdxl_pipeline.to(self.device)
        
        # Optimize
        if self.device == "cuda":
            self.sdxl_pipeline.enable_attention_slicing()
        
        self.loaded_models["sdxl-base"] = self.sdxl_pipeline
        
        if use_refiner:
            print("Loading SDXL Refiner model...")
            self.sdxl_refiner = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                SDXL_MODELS["sdxl-refiner"]["id"],
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=self.model_cache_dir,
                use_safetensors=True
            )
            self.sdxl_refiner = self.sdxl_refiner.to(self.device)
            self.loaded_models["sdxl-refiner"] = self.sdxl_refiner
        
        print("SDXL pipeline loaded successfully")

    def generate_with_sdxl(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        use_refiner: bool = False,
        refiner_steps: int = 50,
        seed: Optional[int] = None
    ) -> Image.Image:
        """
        Generate high-quality image using SDXL.

        Args:
            prompt: Text description
            negative_prompt: What to avoid
            width: Output width (recommended: 1024)
            height: Output height (recommended: 1024)
            num_inference_steps: Number of base denoising steps
            guidance_scale: How closely to follow the prompt
            use_refiner: Whether to use refiner for enhanced quality
            refiner_steps: Number of refiner steps
            seed: Random seed for reproducibility

        Returns:
            Generated high-quality image
        """
        if self.sdxl_pipeline is None:
            self.load_sdxl_pipeline(use_refiner=use_refiner)

        # Set seed if provided
        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)

        # Ensure dimensions are multiples of 8
        width = (width // 8) * 8
        height = (height // 8) * 8

        # Generate with base model
        if use_refiner and self.sdxl_refiner is not None:
            # Generate latent with base model
            image = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator,
                output_type="latent"
            ).images[0]

            # Refine the output
            image = self.sdxl_refiner(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,
                num_inference_steps=refiner_steps,
                guidance_scale=guidance_scale
            ).images[0]
        else:
            # Generate directly with base model
            result = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            )
            image = result.images[0]

        return image

    def load_sdxl_img2img(self):
        """Load SDXL img2img pipeline for image transformation."""
        if not ADVANCED_DIFFUSERS_AVAILABLE:
            raise RuntimeError("Advanced diffusers not available")

        print("Loading SDXL Img2Img pipeline...")
        
        self.sdxl_img2img = StableDiffusionXLImg2ImgPipeline.from_pretrained(
            SDXL_MODELS["sdxl-base"]["id"],
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            cache_dir=self.model_cache_dir,
            use_safetensors=True
        )
        
        self.sdxl_img2img = self.sdxl_img2img.to(self.device)
        
        if self.device == "cuda":
            self.sdxl_img2img.enable_attention_slicing()
        
        self.loaded_models["sdxl-img2img"] = self.sdxl_img2img
        print("SDXL Img2Img pipeline loaded")

    def transform_with_sdxl(
        self,
        image: Image.Image,
        prompt: str,
        negative_prompt: Optional[str] = None,
        strength: float = 0.75,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5
    ) -> Image.Image:
        """
        Transform image using SDXL img2img.

        Args:
            image: Input PIL Image
            prompt: Transformation description
            negative_prompt: What to avoid
            strength: Transformation strength (0.0-1.0)
            num_inference_steps: Number of denoising steps
            guidance_scale: How closely to follow the prompt

        Returns:
            Transformed image
        """
        if self.sdxl_img2img is None:
            self.load_sdxl_img2img()

        # Ensure RGB and proper size
        image = image.convert("RGB")
        width, height = image.size
        width = (width // 8) * 8
        height = (height // 8) * 8
        image = image.resize((width, height), Image.Resampling.LANCZOS)

        result = self.sdxl_img2img(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            strength=strength,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale
        )

        return result.images[0]

    def list_available_models(self) -> Dict:
        """Get list of all available advanced models."""
        return {
            "controlnet": CONTROLNET_MODELS,
            "sdxl": SDXL_MODELS
        }

    def get_loaded_models(self) -> List[str]:
        """Get list of currently loaded models."""
        return list(self.loaded_models.keys())

    def unload_models(self):
        """Unload all models to free memory."""
        print("Unloading advanced AI models...")
        self.controlnet_pipeline = None
        self.sdxl_pipeline = None
        self.sdxl_refiner = None
        self.sdxl_img2img = None
        self.loaded_models.clear()
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("Advanced models unloaded")


# Global instance
_advanced_model_manager = None


def get_advanced_model_manager(device: str = "cpu", model_cache_dir: str = "./models") -> AdvancedAIModelManager:
    """Get or create global advanced AI model manager instance."""
    global _advanced_model_manager
    if _advanced_model_manager is None:
        _advanced_model_manager = AdvancedAIModelManager(device=device, model_cache_dir=model_cache_dir)
    return _advanced_model_manager
