# AI Photo Editor - Model Training and Optimization Guide

## Table of Contents
1. [Available Models Overview](#available-models-overview)
2. [Model Selection Guide](#model-selection-guide)
3. [Training Custom Models](#training-custom-models)
4. [Fine-Tuning Existing Models](#fine-tuning-existing-models)
5. [Model Optimization](#model-optimization)
6. [Performance Benchmarking](#performance-benchmarking)
7. [Best Practices](#best-practices)

---

## Available Models Overview

The AI Photo Editor supports multiple Stable Diffusion models, each optimized for different use cases:

### 1. Stable Diffusion v1.5 (`sd-v1-5`)
- **Model ID**: `runwayml/stable-diffusion-v1-5`
- **Description**: Fast and reliable general-purpose model
- **Memory Requirement**: 4GB RAM (2GB with half-precision on GPU)
- **Best For**: Quick generation, general-purpose images, low-resource environments
- **Speed**: ~30 seconds per image (CPU), ~3 seconds (GPU)
- **Quality**: Good quality for most use cases

### 2. Stable Diffusion v2.1 (`sd-v2-1`)
- **Model ID**: `stabilityai/stable-diffusion-2-1`
- **Description**: Higher quality with better understanding
- **Memory Requirement**: 6GB RAM (3GB with half-precision on GPU)
- **Best For**: High-quality outputs, better prompt following
- **Speed**: ~45 seconds per image (CPU), ~5 seconds (GPU)
- **Quality**: Superior quality, better coherence

### 3. Stable Diffusion v2.1 Base (`sd-v2-1-base`)
- **Model ID**: `stabilityai/stable-diffusion-2-1-base`
- **Description**: Faster variant of v2.1
- **Memory Requirement**: 4GB RAM
- **Best For**: Balance between speed and quality
- **Speed**: ~35 seconds per image (CPU), ~4 seconds (GPU)
- **Quality**: Very good quality, slightly faster than v2.1

### 4. Stable Diffusion Inpainting (`sd-inpainting`)
- **Model ID**: `runwayml/stable-diffusion-inpainting`
- **Description**: Specialized for object removal and inpainting
- **Memory Requirement**: 4GB RAM
- **Best For**: Object removal, image editing, content-aware fill
- **Speed**: ~30 seconds per inpainting (CPU), ~3 seconds (GPU)
- **Quality**: Excellent for inpainting tasks

---

## Model Selection Guide

### Choosing the Right Model

#### For General Image Generation:
```python
# Fast generation with good quality
model_key = "sd-v1-5"

# Higher quality, more resources needed
model_key = "sd-v2-1"

# Balanced approach
model_key = "sd-v2-1-base"
```

#### For Object Removal/Editing:
```python
# Always use the inpainting model
model_key = "sd-inpainting"
```

#### Usage Example:
```python
from ai_models import get_model_manager

# Initialize model manager
manager = get_model_manager(device="cuda", model_cache_dir="./models")

# List available models
print(manager.list_available_models())

# Load specific model
manager.load_stable_diffusion("sd-v2-1")

# Generate image with specific model
image = manager.generate_image(
    prompt="a beautiful landscape",
    model_key="sd-v2-1",
    num_inference_steps=50,
    guidance_scale=7.5
)
```

---

## Training Custom Models

While the application uses pre-trained models, you can train custom models for specific use cases.

### Prerequisites

```bash
pip install diffusers transformers accelerate datasets wandb
```

### Training a Text-to-Image Model

#### 1. Prepare Your Dataset

Your dataset should contain:
- Images (PNG/JPG format)
- Text captions describing each image
- Organized structure:

```
dataset/
├── images/
│   ├── image_001.jpg
│   ├── image_002.jpg
│   └── ...
└── metadata.jsonl
```

`metadata.jsonl` format:
```json
{"file_name": "image_001.jpg", "text": "a red sports car on a highway"}
{"file_name": "image_002.jpg", "text": "a sunset over the ocean"}
```

#### 2. Training Script

```python
# train_text_to_image.py
import torch
from diffusers import StableDiffusionPipeline, DDPMScheduler, UNet2DConditionModel
from transformers import CLIPTextModel, CLIPTokenizer
from accelerate import Accelerator
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import json

class CustomImageDataset(Dataset):
    def __init__(self, metadata_path, image_dir, tokenizer, size=512):
        self.tokenizer = tokenizer
        self.image_dir = image_dir
        self.size = size

        # Load metadata
        with open(metadata_path, 'r') as f:
            self.data = [json.loads(line) for line in f]

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]

        # Load and preprocess image
        image = Image.open(f"{self.image_dir}/{item['file_name']}")
        image = image.resize((self.size, self.size))
        image = torch.from_numpy(np.array(image)).permute(2, 0, 1).float() / 255.0

        # Tokenize text
        text_inputs = self.tokenizer(
            item['text'],
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt"
        )

        return {
            "pixel_values": image,
            "input_ids": text_inputs.input_ids[0]
        }

def train_model(
    base_model="runwayml/stable-diffusion-v1-5",
    dataset_path="./dataset",
    output_dir="./custom_model",
    num_epochs=100,
    batch_size=4,
    learning_rate=1e-5
):
    """
    Train a custom Stable Diffusion model.
    """
    # Initialize accelerator for mixed precision and distributed training
    accelerator = Accelerator(
        mixed_precision="fp16",
        gradient_accumulation_steps=4
    )

    # Load base model components
    tokenizer = CLIPTokenizer.from_pretrained(base_model, subfolder="tokenizer")
    text_encoder = CLIPTextModel.from_pretrained(base_model, subfolder="text_encoder")
    unet = UNet2DConditionModel.from_pretrained(base_model, subfolder="unet")

    # Freeze text encoder (only train UNet)
    text_encoder.requires_grad_(False)

    # Setup dataset and dataloader
    dataset = CustomImageDataset(
        metadata_path=f"{dataset_path}/metadata.jsonl",
        image_dir=f"{dataset_path}/images",
        tokenizer=tokenizer
    )

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4
    )

    # Setup optimizer
    optimizer = torch.optim.AdamW(
        unet.parameters(),
        lr=learning_rate,
        betas=(0.9, 0.999),
        weight_decay=1e-2
    )

    # Prepare for training
    unet, optimizer, dataloader = accelerator.prepare(
        unet, optimizer, dataloader
    )

    # Training loop
    for epoch in range(num_epochs):
        unet.train()
        for batch in dataloader:
            with accelerator.accumulate(unet):
                # Forward pass
                latents = encode_images(batch["pixel_values"])
                noise = torch.randn_like(latents)
                timesteps = torch.randint(0, 1000, (latents.shape[0],))

                noisy_latents = add_noise(latents, noise, timesteps)

                # Get text embeddings
                encoder_hidden_states = text_encoder(batch["input_ids"])[0]

                # Predict noise
                noise_pred = unet(
                    noisy_latents,
                    timesteps,
                    encoder_hidden_states
                ).sample

                # Calculate loss
                loss = torch.nn.functional.mse_loss(noise_pred, noise)

                # Backward pass
                accelerator.backward(loss)
                optimizer.step()
                optimizer.zero_grad()

        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {loss.item():.4f}")

        # Save checkpoint
        if (epoch + 1) % 10 == 0:
            accelerator.wait_for_everyone()
            unet_save = accelerator.unwrap_model(unet)
            unet_save.save_pretrained(f"{output_dir}/checkpoint-{epoch+1}")

    print(f"Training complete! Model saved to {output_dir}")
```

---

## Fine-Tuning Existing Models

Fine-tuning allows you to adapt pre-trained models to your specific use case with less data and time.

### Using DreamBooth

DreamBooth is ideal for customizing models for specific subjects or styles.

```bash
# Install requirements
pip install diffusers accelerate transformers

# Fine-tune with your images
python -m diffusers.examples.dreambooth.train_dreambooth \
  --pretrained_model_name_or_path="runwayml/stable-diffusion-v1-5" \
  --instance_data_dir="./training_images" \
  --instance_prompt="a photo of [unique-identifier] person" \
  --output_dir="./dreambooth_model" \
  --resolution=512 \
  --train_batch_size=1 \
  --gradient_accumulation_steps=1 \
  --learning_rate=5e-6 \
  --lr_scheduler="constant" \
  --max_train_steps=400 \
  --num_class_images=200 \
  --class_data_dir="./class_images" \
  --class_prompt="a photo of person"
```

### Using LoRA (Low-Rank Adaptation)

LoRA is more efficient and requires less VRAM:

```python
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.loaders import AttnProcsLayers
from diffusers.models.attention_processor import LoRAAttnProcessor

# Load base model
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16
)

# Add LoRA layers
unet = pipe.unet
unet.requires_grad_(False)

lora_attn_procs = {}
for name in unet.attn_processors.keys():
    lora_attn_procs[name] = LoRAAttnProcessor(
        hidden_size=unet.config.cross_attention_dim,
        rank=4  # LoRA rank (lower = fewer parameters)
    )

unet.set_attn_processor(lora_attn_procs)

# Train only LoRA parameters
# ... training loop ...

# Save LoRA weights (much smaller than full model)
AttnProcsLayers(unet.attn_processors).save_pretrained("./lora_weights")
```

---

## Model Optimization

### Optimization Techniques

#### 1. Quantization (Reduce Model Size)

```python
import torch
from diffusers import StableDiffusionPipeline

# Load model in 8-bit quantization
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
    load_in_8bit=True
)

# This reduces memory usage by ~50%
```

#### 2. Attention Slicing (Reduce Memory)

```python
# Enable attention slicing for lower memory usage
pipe.enable_attention_slicing()

# Generate image with less memory
image = pipe(
    "a beautiful landscape",
    num_inference_steps=50
).images[0]
```

#### 3. xFormers Optimization (Faster on GPU)

```bash
# Install xformers
pip install xformers

# Enable in code
pipe.enable_xformers_memory_efficient_attention()
```

#### 4. VAE Tiling (For Large Images)

```python
# Enable VAE tiling for generating large images
pipe.enable_vae_tiling()

# Generate large image without memory issues
image = pipe(
    "a detailed landscape",
    width=1024,
    height=1024
).images[0]
```

#### 5. CPU Offloading (Extreme Memory Saving)

```python
# Offload model parts to CPU as needed
pipe.enable_sequential_cpu_offload()

# Or for even more aggressive offloading
pipe.enable_model_cpu_offload()
```

---

## Performance Benchmarking

### Benchmark Script

```python
# benchmark_models.py
import time
import torch
from ai_models import get_model_manager

def benchmark_model(model_key, prompt, num_runs=5):
    """
    Benchmark a specific model.
    """
    manager = get_model_manager(device="cuda" if torch.cuda.is_available() else "cpu")

    print(f"\nBenchmarking {model_key}...")
    times = []

    for i in range(num_runs):
        start = time.time()
        image = manager.generate_image(
            prompt=prompt,
            model_key=model_key,
            num_inference_steps=50
        )
        elapsed = time.time() - start
        times.append(elapsed)
        print(f"  Run {i+1}: {elapsed:.2f}s")

    avg_time = sum(times) / len(times)
    print(f"  Average: {avg_time:.2f}s")

    return avg_time

# Benchmark all models
models = ["sd-v1-5", "sd-v2-1", "sd-v2-1-base"]
prompt = "a beautiful sunset over mountains"

results = {}
for model in models:
    try:
        results[model] = benchmark_model(model, prompt)
    except Exception as e:
        print(f"Error benchmarking {model}: {e}")

# Print comparison
print("\n" + "="*60)
print("BENCHMARK RESULTS")
print("="*60)
for model, time in sorted(results.items(), key=lambda x: x[1]):
    print(f"{model}: {time:.2f}s")
```

### Expected Performance

| Model | CPU (50 steps) | GPU (50 steps) | Memory Usage |
|-------|----------------|----------------|--------------|
| sd-v1-5 | ~30s | ~3s | 4GB |
| sd-v2-1-base | ~35s | ~4s | 4GB |
| sd-v2-1 | ~45s | ~5s | 6GB |
| sd-inpainting | ~30s | ~3s | 4GB |

*Times may vary based on hardware*

---

## Best Practices

### 1. Model Selection

✅ **Do**:
- Use `sd-v1-5` for fast prototyping and low-resource environments
- Use `sd-v2-1` for production when quality is critical
- Use `sd-inpainting` specifically for editing tasks
- Test multiple models to find the best fit

❌ **Don't**:
- Use high-quality models on CPU in production (too slow)
- Mix generation and inpainting models for the same task
- Load multiple models simultaneously (memory issues)

### 2. Prompt Engineering

✅ **Effective Prompts**:
```python
# Good: Specific and detailed
prompt = "a photorealistic portrait of a woman with blue eyes, soft lighting, professional photography, 4k"

# Good: Use negative prompts
negative_prompt = "blurry, low quality, distorted, ugly, deformed"

# Good: Adjust guidance scale
guidance_scale = 7.5  # Standard
guidance_scale = 12.0  # More adherence to prompt
guidance_scale = 5.0   # More creative freedom
```

❌ **Ineffective Prompts**:
```python
# Bad: Too vague
prompt = "a nice picture"

# Bad: Contradictory
prompt = "a sunny night scene"

# Bad: Too many concepts
prompt = "a dog cat bird horse flying swimming running jumping"
```

### 3. Inference Parameters

#### Number of Inference Steps
```python
# Fast but lower quality
num_inference_steps = 20

# Balanced (recommended)
num_inference_steps = 50

# High quality but slow
num_inference_steps = 100
```

#### Guidance Scale
```python
# Creative, less literal
guidance_scale = 3.0

# Balanced (recommended)
guidance_scale = 7.5

# Very literal interpretation
guidance_scale = 15.0
```

#### Image Size
```python
# Fast generation
width, height = 512, 512

# Higher quality (requires more memory)
width, height = 768, 768

# Production quality (GPU recommended)
width, height = 1024, 1024
```

### 4. Memory Management

```python
# Clear cache after generation
import gc
import torch

def generate_and_cleanup(prompt):
    image = manager.generate_image(prompt)

    # Cleanup
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return image
```

### 5. Reproducibility

```python
# Use seeds for reproducible results
image = manager.generate_image(
    prompt="a landscape",
    seed=42  # Same seed = same image
)
```

---

## Training All Available Models

To ensure optimal results across all use cases, we support training/fine-tuning for:

### 1. Text-to-Image Models
- **SD v1.5**: Fast generation
- **SD v2.1**: High quality
- **SD v2.1-base**: Balanced

### 2. Inpainting Models
- **SD Inpainting**: Object removal

### 3. Custom Models
- **DreamBooth**: Subject-specific
- **LoRA**: Style transfer
- **Textual Inversion**: New concepts

### Training Pipeline

```bash
# 1. Prepare dataset
python scripts/prepare_dataset.py --input ./raw_images --output ./processed_dataset

# 2. Train base model
python scripts/train_model.py \
  --base_model sd-v1-5 \
  --dataset ./processed_dataset \
  --output ./custom_model \
  --epochs 100

# 3. Fine-tune with LoRA
python scripts/finetune_lora.py \
  --base_model ./custom_model \
  --style_images ./style_dataset \
  --output ./lora_weights

# 4. Benchmark results
python scripts/benchmark_models.py --models sd-v1-5,custom_model

# 5. Deploy best model
python scripts/deploy_model.py --model ./custom_model --api
```

---

## Troubleshooting

### Common Issues

#### 1. Out of Memory (OOM)
```python
# Solution: Enable optimizations
pipe.enable_attention_slicing()
pipe.enable_vae_slicing()
pipe.enable_model_cpu_offload()

# Or use smaller image size
width, height = 512, 512  # Instead of 1024, 1024
```

#### 2. Slow Generation
```python
# Solution: Reduce inference steps
num_inference_steps = 25  # Instead of 50

# Or use faster scheduler
from diffusers import DPMSolverMultistepScheduler
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
```

#### 3. Poor Quality Results
```python
# Solution: Increase inference steps
num_inference_steps = 75

# Or adjust guidance scale
guidance_scale = 9.0

# Or use better model
model_key = "sd-v2-1"
```

---

## Resources

- **Hugging Face Diffusers**: https://huggingface.co/docs/diffusers
- **Stable Diffusion**: https://stability.ai/
- **Model Hub**: https://huggingface.co/models?pipeline_tag=text-to-image
- **Community**: https://huggingface.co/spaces

---

## Conclusion

This guide covers:
- ✅ Multiple model options for different use cases
- ✅ Training custom models from scratch
- ✅ Fine-tuning with DreamBooth and LoRA
- ✅ Optimization techniques for production
- ✅ Performance benchmarking
- ✅ Best practices and troubleshooting

By following this guide, you can train and deploy AI models that provide accurate, high-quality results for your specific use case.

---

*Document Version: 1.0*
*Last Updated: 2026-02-17*
*For support: https://github.com/MUSTAQ-AHAMMAD/AI-photo-editor*
