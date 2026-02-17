"""
Image processing utilities for AI photo editor.
Handles object removal, background removal, and image manipulation.
"""
import io
import os
from typing import Optional, Tuple
import numpy as np
from PIL import Image
import cv2

# Optional imports for advanced features
try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: rembg not available. Background removal will be disabled.")


class ImageProcessor:
    """Handles various image processing operations."""
    
    def __init__(self):
        """Initialize the image processor."""
        self.max_size = (2048, 2048)
    
    def load_image(self, image_data: bytes) -> Image.Image:
        """
        Load image from bytes.
        
        Args:
            image_data: Image data as bytes
            
        Returns:
            PIL Image object
        """
        return Image.open(io.BytesIO(image_data)).convert("RGB")
    
    def resize_image(self, image: Image.Image, max_size: Optional[Tuple[int, int]] = None) -> Image.Image:
        """
        Resize image while maintaining aspect ratio.
        
        Args:
            image: PIL Image object
            max_size: Maximum dimensions (width, height)
            
        Returns:
            Resized PIL Image
        """
        if max_size is None:
            max_size = self.max_size
        
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        return image
    
    def remove_background(self, image: Image.Image) -> Image.Image:
        """
        Remove background from image using rembg.
        
        Args:
            image: PIL Image object
            
        Returns:
            Image with transparent background
        """
        if not REMBG_AVAILABLE:
            raise RuntimeError("rembg library is not available. Please install it to use background removal.")
        
        # Convert to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Remove background
        output = rembg_remove(img_byte_arr)
        
        # Convert back to PIL Image
        return Image.open(io.BytesIO(output))
    
    def inpaint_object(self, image: Image.Image, mask: Image.Image) -> Image.Image:
        """
        Remove object from image using inpainting.
        
        Args:
            image: PIL Image object
            mask: Binary mask (white=remove, black=keep)
            
        Returns:
            Inpainted image
        """
        # Convert PIL images to numpy arrays
        img_array = np.array(image)
        mask_array = np.array(mask.convert('L'))
        
        # Ensure mask is binary
        _, mask_binary = cv2.threshold(mask_array, 127, 255, cv2.THRESH_BINARY)
        
        # Use OpenCV inpainting
        inpainted = cv2.inpaint(
            img_array,
            mask_binary,
            inpaintRadius=3,
            flags=cv2.INPAINT_TELEA
        )
        
        # Convert back to PIL Image
        return Image.fromarray(inpainted)
    
    def apply_filter(self, image: Image.Image, filter_type: str = "none") -> Image.Image:
        """
        Apply various filters to the image.
        
        Args:
            image: PIL Image object
            filter_type: Type of filter to apply
            
        Returns:
            Filtered image
        """
        img_array = np.array(image)
        
        if filter_type == "blur":
            filtered = cv2.GaussianBlur(img_array, (15, 15), 0)
        elif filter_type == "sharpen":
            kernel = np.array([[-1, -1, -1],
                             [-1, 9, -1],
                             [-1, -1, -1]])
            filtered = cv2.filter2D(img_array, -1, kernel)
        elif filter_type == "edge":
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            filtered = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
        elif filter_type == "grayscale":
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            filtered = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
        else:
            filtered = img_array
        
        return Image.fromarray(filtered)
    
    def adjust_brightness(self, image: Image.Image, factor: float = 1.0) -> Image.Image:
        """
        Adjust image brightness.
        
        Args:
            image: PIL Image object
            factor: Brightness factor (1.0 = no change, >1.0 = brighter, <1.0 = darker)
            
        Returns:
            Adjusted image
        """
        img_array = np.array(image)
        adjusted = np.clip(img_array * factor, 0, 255).astype(np.uint8)
        return Image.fromarray(adjusted)
    
    def to_bytes(self, image: Image.Image, format: str = "PNG") -> bytes:
        """
        Convert PIL Image to bytes.
        
        Args:
            image: PIL Image object
            format: Output format (PNG, JPEG, etc.)
            
        Returns:
            Image as bytes
        """
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=format)
        return img_byte_arr.getvalue()


# Global instance
_processor = None

def get_processor() -> ImageProcessor:
    """Get or create global image processor instance."""
    global _processor
    if _processor is None:
        _processor = ImageProcessor()
    return _processor
