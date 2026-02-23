"""
Multi-AI Engine Adapter System.

Provides a pluggable architecture for integrating multiple AI image generation
engines: OpenAI DALL-E, Replicate, HuggingFace Inference API, and local
Stable Diffusion models.
"""
import io
import os
import uuid
import base64
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class GenerationOptions:
    """Unified options passed to every AI engine adapter."""
    prompt: str
    negative_prompt: str = ""
    width: int = 1024
    height: int = 1024
    aspect_ratio: str = "1:1"
    style_preset: str = "none"
    lighting: str = "natural"
    camera_angle: str = "eye level"
    num_inference_steps: int = 30
    guidance_scale: float = 7.5
    seed: Optional[int] = None
    reference_images: list = field(default_factory=list)


@dataclass
class GenerationResult:
    """Returned by every AI engine adapter."""
    engine_id: str
    engine_name: str
    image: Image.Image
    prompt_used: str
    metadata: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Abstract base class
# ---------------------------------------------------------------------------

class AIEngineAdapter(ABC):
    """
    Pluggable interface for AI image generation engines.

    Every concrete adapter must implement ``generate_image`` and expose
    ``engine_id`` / ``engine_name`` / ``is_available``.
    """

    @property
    @abstractmethod
    def engine_id(self) -> str:
        """Unique identifier, e.g. 'openai_dalle3'."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Human-readable name, e.g. 'OpenAI DALL-E 3'."""

    @property
    @abstractmethod
    def description(self) -> str:
        """Short description of the engine."""

    @abstractmethod
    def is_available(self) -> bool:
        """Return True when the engine can be used (API key set, model loaded, …)."""

    @abstractmethod
    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        """Generate an image and return a ``GenerationResult``."""


# ---------------------------------------------------------------------------
# Style/lighting/camera prompt helpers
# ---------------------------------------------------------------------------

STYLE_PROMPT_MAP = {
    "photorealistic": "photorealistic, professional photography, 8k uhd, sharp focus",
    "digital_art": "digital art, vibrant colors, detailed, trending on artstation",
    "illustration": "illustration, hand-drawn, ink and watercolor",
    "3d_render": "3d render, octane render, cinema4d, highly detailed",
    "anime": "anime style, studio ghibli, vibrant, cel shaded",
    "oil_painting": "oil painting, old masters technique, textured canvas",
    "watercolor": "watercolor painting, wet on wet, soft edges",
    "sketch": "pencil sketch, detailed line art, graphite",
    "cinematic": "cinematic, anamorphic lens, film grain, dramatic lighting",
    "fantasy": "fantasy art, epic, magical, detailed environment",
    "minimalist": "minimalist, clean lines, simple composition",
    "vintage": "vintage, retro, aged, film photo",
    "neon": "neon cyberpunk, glowing neon lights, dark atmosphere",
    "steampunk": "steampunk, brass gears, Victorian industrial",
    "none": "",
}

LIGHTING_PROMPT_MAP = {
    "natural": "natural lighting",
    "golden_hour": "golden hour lighting, warm tones, long shadows",
    "blue_hour": "blue hour lighting, cool tones, twilight",
    "studio": "studio lighting, soft boxes, white background",
    "dramatic": "dramatic lighting, high contrast, chiaroscuro",
    "neon": "neon lighting, colorful glow",
    "backlit": "backlit, silhouette, rim lighting",
    "overcast": "overcast lighting, diffuse, soft shadows",
    "candlelight": "candlelight, warm glow, intimate",
}

CAMERA_PROMPT_MAP = {
    "eye level": "eye level shot",
    "low angle": "low angle shot, dramatic perspective, looking up",
    "high angle": "high angle shot, bird's eye perspective",
    "aerial": "aerial view, drone shot, overhead",
    "close up": "close up shot, macro detail",
    "wide angle": "wide angle shot, expansive view",
    "portrait": "portrait shot, shallow depth of field, bokeh",
    "cinematic": "cinematic wide shot, 2.39:1 aspect ratio",
}


def build_enhanced_prompt(options: GenerationOptions) -> str:
    """Assemble a prompt that embeds style/lighting/camera modifiers."""
    parts = [options.prompt]

    style_tag = STYLE_PROMPT_MAP.get(options.style_preset, "")
    if style_tag:
        parts.append(style_tag)

    lighting_tag = LIGHTING_PROMPT_MAP.get(options.lighting, "")
    if lighting_tag:
        parts.append(lighting_tag)

    camera_tag = CAMERA_PROMPT_MAP.get(options.camera_angle, "")
    if camera_tag:
        parts.append(camera_tag)

    return ", ".join(p for p in parts if p)


# ---------------------------------------------------------------------------
# Concrete adapter: OpenAI DALL-E 3
# ---------------------------------------------------------------------------

class OpenAIAdapter(AIEngineAdapter):
    """DALL-E 3 via the OpenAI API."""

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY", "")

    @property
    def engine_id(self) -> str:
        return "openai_dalle3"

    @property
    def engine_name(self) -> str:
        return "OpenAI DALL-E 3"

    @property
    def description(self) -> str:
        return "OpenAI's DALL-E 3 — high-quality, instruction-following image generation"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        try:
            import openai  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "openai package is not installed. Run: pip install openai"
            ) from exc

        client = openai.OpenAI(api_key=self._api_key)

        # DALL-E 3 supports 1024x1024, 1024x1792, 1792x1024
        size = self._map_size(options.width, options.height)
        enhanced_prompt = build_enhanced_prompt(options)

        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            n=1,
            size=size,
            response_format="b64_json",
        )

        b64_data = response.data[0].b64_json
        image_bytes = base64.b64decode(b64_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        return GenerationResult(
            engine_id=self.engine_id,
            engine_name=self.engine_name,
            image=image,
            prompt_used=enhanced_prompt,
            metadata={"model": "dall-e-3", "size": size},
        )

    @staticmethod
    def _map_size(width: int, height: int) -> str:
        ratio = width / max(height, 1)
        if ratio > 1.2:
            return "1792x1024"
        if ratio < 0.8:
            return "1024x1792"
        return "1024x1024"


# ---------------------------------------------------------------------------
# Concrete adapter: Replicate (e.g. SDXL, Flux)
# ---------------------------------------------------------------------------

class ReplicateAdapter(AIEngineAdapter):
    """
    Any model accessible via the Replicate API.
    Defaults to black-forest-labs/flux-schnell for speed.
    """

    DEFAULT_MODEL = "black-forest-labs/flux-schnell"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("REPLICATE_API_KEY", "")
        self._model = model or os.getenv("REPLICATE_MODEL", self.DEFAULT_MODEL)

    @property
    def engine_id(self) -> str:
        return "replicate"

    @property
    def engine_name(self) -> str:
        return "Replicate (Flux Schnell)"

    @property
    def description(self) -> str:
        return "Replicate API — access to hundreds of open-source models including Flux and SDXL"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        try:
            import replicate  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "replicate package is not installed. Run: pip install replicate"
            ) from exc

        os.environ["REPLICATE_API_TOKEN"] = self._api_key
        enhanced_prompt = build_enhanced_prompt(options)

        output = replicate.run(
            self._model,
            input={
                "prompt": enhanced_prompt,
                "negative_prompt": options.negative_prompt,
                "width": options.width,
                "height": options.height,
                "num_inference_steps": options.num_inference_steps,
                "guidance_scale": options.guidance_scale,
                **({"seed": options.seed} if options.seed is not None else {}),
            },
        )

        # Replicate returns a list of URLs or file-like objects
        image_url = output[0] if isinstance(output, list) else output
        image = self._fetch_image(image_url)

        return GenerationResult(
            engine_id=self.engine_id,
            engine_name=self.engine_name,
            image=image,
            prompt_used=enhanced_prompt,
            metadata={"model": self._model},
        )

    @staticmethod
    def _fetch_image(url_or_file) -> Image.Image:
        import urllib.request
        if hasattr(url_or_file, "read"):
            return Image.open(url_or_file).convert("RGB")
        with urllib.request.urlopen(str(url_or_file)) as resp:
            return Image.open(io.BytesIO(resp.read())).convert("RGB")


# ---------------------------------------------------------------------------
# Concrete adapter: HuggingFace Inference API
# ---------------------------------------------------------------------------

class HuggingFaceAPIAdapter(AIEngineAdapter):
    """
    HuggingFace Inference API — free tier available for many models.
    Defaults to stabilityai/stable-diffusion-xl-base-1.0.
    """

    DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or os.getenv("HUGGINGFACE_TOKEN", "")
        self._model = model or os.getenv("HF_MODEL", self.DEFAULT_MODEL)

    @property
    def engine_id(self) -> str:
        return "huggingface"

    @property
    def engine_name(self) -> str:
        return "HuggingFace (SDXL)"

    @property
    def description(self) -> str:
        return "HuggingFace Inference API — SDXL and many community models"

    def is_available(self) -> bool:
        return bool(self._api_key)

    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        import urllib.request
        import json

        enhanced_prompt = build_enhanced_prompt(options)
        api_url = f"https://api-inference.huggingface.co/models/{self._model}"
        payload = json.dumps({
            "inputs": enhanced_prompt,
            "parameters": {
                "negative_prompt": options.negative_prompt,
                "width": min(options.width, 1024),
                "height": min(options.height, 1024),
                "num_inference_steps": options.num_inference_steps,
                "guidance_scale": options.guidance_scale,
            },
        }).encode()

        req = urllib.request.Request(
            api_url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            image_bytes = resp.read()

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return GenerationResult(
            engine_id=self.engine_id,
            engine_name=self.engine_name,
            image=image,
            prompt_used=enhanced_prompt,
            metadata={"model": self._model},
        )


# ---------------------------------------------------------------------------
# Concrete adapter: Local Stable Diffusion (wraps existing ai_models)
# ---------------------------------------------------------------------------

class StableDiffusionLocalAdapter(AIEngineAdapter):
    """Wraps the existing local Stable Diffusion model manager."""

    def __init__(self, model_manager):
        self._model_manager = model_manager

    @property
    def engine_id(self) -> str:
        return "stable_diffusion_local"

    @property
    def engine_name(self) -> str:
        return "Stable Diffusion (Local)"

    @property
    def description(self) -> str:
        return "Local Stable Diffusion model — runs on your hardware, no API key required"

    def is_available(self) -> bool:
        return self._model_manager is not None

    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        if self._model_manager is None:
            raise RuntimeError("Local Stable Diffusion model is not loaded.")

        enhanced_prompt = build_enhanced_prompt(options)
        image = self._model_manager.generate_image(
            prompt=enhanced_prompt,
            negative_prompt=options.negative_prompt or None,
            width=options.width,
            height=options.height,
        )

        return GenerationResult(
            engine_id=self.engine_id,
            engine_name=self.engine_name,
            image=image,
            prompt_used=enhanced_prompt,
            metadata={"model": "stable-diffusion-local"},
        )


# ---------------------------------------------------------------------------
# Fallback adapter: Placeholder (always available, produces a labelled image)
# ---------------------------------------------------------------------------

class PlaceholderAdapter(AIEngineAdapter):
    """
    Demo adapter — creates a placeholder image so the UI always works
    without any API keys configured.
    """

    @property
    def engine_id(self) -> str:
        return "placeholder"

    @property
    def engine_name(self) -> str:
        return "Demo (Placeholder)"

    @property
    def description(self) -> str:
        return "Demo mode — generates a placeholder image. Configure an API key to use a real engine."

    def is_available(self) -> bool:
        return True

    def generate_image(self, options: GenerationOptions) -> GenerationResult:
        from PIL import ImageDraw, ImageFont

        enhanced_prompt = build_enhanced_prompt(options)
        w, h = min(options.width, 1024), min(options.height, 1024)

        # Gradient background
        image = Image.new("RGB", (w, h))
        draw = ImageDraw.Draw(image)
        for y in range(h):
            r = int(100 + 80 * y / h)
            g = int(60 + 60 * y / h)
            b = int(200 - 60 * y / h)
            draw.line([(0, y), (w, y)], fill=(r, g, b))

        # Centered text
        label = f"[Demo] {options.prompt[:60]}"
        try:
            font = ImageFont.load_default(size=max(16, w // 30))
        except TypeError:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        draw.text(
            ((w - text_w) // 2, (h - text_h) // 2),
            label,
            fill=(255, 255, 255),
            font=font,
        )

        return GenerationResult(
            engine_id=self.engine_id,
            engine_name=self.engine_name,
            image=image,
            prompt_used=enhanced_prompt,
            metadata={"note": "placeholder — configure API keys for real generation"},
        )


# ---------------------------------------------------------------------------
# Engine Registry
# ---------------------------------------------------------------------------

class AIEngineRegistry:
    """
    Central registry that holds all available AI engine adapters.
    Call ``register`` to add custom adapters.
    """

    def __init__(self):
        self._engines: dict[str, AIEngineAdapter] = {}

    def register(self, adapter: AIEngineAdapter) -> None:
        self._engines[adapter.engine_id] = adapter
        logger.info("Registered AI engine: %s (available=%s)", adapter.engine_name, adapter.is_available())

    def get(self, engine_id: str) -> AIEngineAdapter:
        if engine_id not in self._engines:
            raise ValueError(f"Unknown engine '{engine_id}'. Available: {list(self._engines)}")
        return self._engines[engine_id]

    def list_engines(self) -> list[dict]:
        return [
            {
                "id": eng.engine_id,
                "name": eng.engine_name,
                "description": eng.description,
                "available": eng.is_available(),
            }
            for eng in self._engines.values()
        ]

    def available_engines(self) -> list[AIEngineAdapter]:
        return [e for e in self._engines.values() if e.is_available()]


def build_registry(ai_models=None) -> AIEngineRegistry:
    """
    Build and return the default ``AIEngineRegistry`` populated with all
    known adapters (availability depends on env variables / loaded models).
    """
    registry = AIEngineRegistry()
    registry.register(OpenAIAdapter())
    registry.register(ReplicateAdapter())
    registry.register(HuggingFaceAPIAdapter())
    registry.register(StableDiffusionLocalAdapter(ai_models))
    registry.register(PlaceholderAdapter())
    return registry
