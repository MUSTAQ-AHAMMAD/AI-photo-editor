"""
Google Gemini Pro AI Integration for Advanced Image Analysis and Generation.
Provides intelligent image understanding, captioning, and prompt enhancement.
"""
import os
from typing import Optional, List, Dict
from PIL import Image
import io
import base64

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not available. Gemini features will be disabled.")


class GeminiIntegration:
    """Manages Google Gemini Pro API integration for intelligent image processing."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini integration.

        Args:
            api_key: Google Gemini API key (if None, loads from environment)
        """
        if not GEMINI_AVAILABLE:
            raise RuntimeError("google-generativeai library is not available. Please install it.")

        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment or passed to constructor")

        genai.configure(api_key=self.api_key)
        
        # Initialize models
        self.text_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.vision_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        print("Gemini Pro integration initialized successfully")

    def analyze_image(self, image: Image.Image, analysis_type: str = "detailed") -> Dict:
        """
        Analyze an image using Gemini Vision Pro.

        Args:
            image: PIL Image to analyze
            analysis_type: Type of analysis ("detailed", "simple", "artistic", "technical")

        Returns:
            Dictionary with analysis results
        """
        # Convert PIL Image to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        prompts = {
            "detailed": """Analyze this image in detail. Provide:
1. Main subject and composition
2. Colors, lighting, and mood
3. Style and artistic elements
4. Technical quality
5. Suggested improvements for photo editing""",
            
            "simple": "Describe this image in 2-3 sentences.",
            
            "artistic": """Analyze the artistic qualities of this image:
- Style and technique
- Composition and balance
- Color palette and harmony
- Emotional impact
- Artistic inspirations or influences""",
            
            "technical": """Provide a technical analysis of this image:
- Image quality and resolution
- Exposure and lighting
- Color accuracy and balance
- Sharpness and detail
- Any technical issues or artifacts"""
        }

        prompt = prompts.get(analysis_type, prompts["detailed"])

        try:
            response = self.vision_model.generate_content([prompt, image])
            return {
                "success": True,
                "analysis": response.text,
                "analysis_type": analysis_type
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "analysis_type": analysis_type
            }

    def generate_caption(self, image: Image.Image, style: str = "descriptive") -> str:
        """
        Generate a caption for an image.

        Args:
            image: PIL Image to caption
            style: Caption style ("descriptive", "creative", "technical", "social")

        Returns:
            Generated caption text
        """
        prompts = {
            "descriptive": "Generate a clear, descriptive caption for this image in one sentence.",
            "creative": "Generate a creative, engaging caption for this image suitable for social media.",
            "technical": "Generate a technical caption describing the image composition and elements.",
            "social": "Generate a catchy social media caption with relevant hashtag suggestions."
        }

        prompt = prompts.get(style, prompts["descriptive"])

        try:
            response = self.vision_model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            return f"Error generating caption: {str(e)}"

    def enhance_prompt(self, user_prompt: str, context: str = "image generation") -> str:
        """
        Enhance a user's prompt using Gemini's language understanding.

        Args:
            user_prompt: Original user prompt
            context: Context for enhancement ("image generation", "style transfer", "editing")

        Returns:
            Enhanced prompt text
        """
        enhancement_prompts = {
            "image generation": f"""Enhance this image generation prompt to be more detailed and effective for AI image generation.
Original prompt: "{user_prompt}"

Provide an enhanced version that:
- Adds relevant artistic details
- Specifies quality and style
- Includes technical parameters
- Maintains the user's original intent

Enhanced prompt (provide ONLY the enhanced prompt, no explanations):""",

            "style transfer": f"""Enhance this style transfer prompt to be more specific and effective.
Original prompt: "{user_prompt}"

Provide an enhanced version that clearly describes the target style.
Enhanced prompt (provide ONLY the enhanced prompt, no explanations):""",

            "editing": f"""Enhance this image editing instruction to be clearer and more specific.
Original instruction: "{user_prompt}"

Provide an enhanced version that is clear and actionable.
Enhanced instruction (provide ONLY the enhanced instruction, no explanations):"""
        }

        prompt = enhancement_prompts.get(context, enhancement_prompts["image generation"])

        try:
            response = self.text_model.generate_content(prompt)
            enhanced = response.text.strip()
            # Remove quotes if present
            enhanced = enhanced.strip('"').strip("'")
            return enhanced
        except Exception as e:
            print(f"Error enhancing prompt: {e}")
            return user_prompt

    def suggest_edits(self, image: Image.Image) -> Dict:
        """
        Suggest possible edits for an image using Gemini Vision.

        Args:
            image: PIL Image to analyze

        Returns:
            Dictionary with edit suggestions
        """
        prompt = """Analyze this image and suggest specific edits that could improve it.
Provide suggestions in these categories:
1. Color adjustments (brightness, contrast, saturation)
2. Composition improvements (cropping, straightening)
3. Object removal or addition
4. Style enhancements
5. Background modifications

Format your response as actionable suggestions."""

        try:
            response = self.vision_model.generate_content([prompt, image])
            return {
                "success": True,
                "suggestions": response.text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def compare_images(self, image1: Image.Image, image2: Image.Image) -> str:
        """
        Compare two images and describe the differences.

        Args:
            image1: First PIL Image
            image2: Second PIL Image

        Returns:
            Comparison description
        """
        prompt = """Compare these two images and describe:
1. Main differences
2. Which aspects are better in each
3. Overall comparison

Be specific and objective."""

        try:
            response = self.vision_model.generate_content([prompt, image1, image2])
            return response.text
        except Exception as e:
            return f"Error comparing images: {str(e)}"

    def generate_negative_prompt(self, positive_prompt: str) -> str:
        """
        Generate a negative prompt to improve image generation quality.

        Args:
            positive_prompt: The positive prompt for generation

        Returns:
            Suggested negative prompt
        """
        prompt = f"""Given this image generation prompt: "{positive_prompt}"

Generate a comprehensive negative prompt that lists things to avoid in the generation.
Include common unwanted elements like: bad quality, distortion, artifacts, etc.

Negative prompt (provide ONLY the negative prompt, no explanations):"""

        try:
            response = self.text_model.generate_content(prompt)
            negative = response.text.strip()
            negative = negative.strip('"').strip("'")
            return negative
        except Exception as e:
            print(f"Error generating negative prompt: {e}")
            return "low quality, blurry, distorted, ugly, bad anatomy, watermark"

    def extract_objects(self, image: Image.Image) -> List[str]:
        """
        Extract and list objects present in an image.

        Args:
            image: PIL Image to analyze

        Returns:
            List of detected objects
        """
        prompt = "List all the main objects and elements visible in this image. Provide just a comma-separated list."

        try:
            response = self.vision_model.generate_content([prompt, image])
            objects_text = response.text.strip()
            # Parse comma-separated list
            objects = [obj.strip() for obj in objects_text.split(',')]
            return objects
        except Exception as e:
            print(f"Error extracting objects: {e}")
            return []

    def generate_image_prompt(self, description: str, style: str = "photorealistic") -> str:
        """
        Generate a detailed image generation prompt from a simple description.

        Args:
            description: Simple image description
            style: Desired style

        Returns:
            Detailed prompt for image generation
        """
        prompt = f"""Create a detailed image generation prompt for Stable Diffusion based on this description:
"{description}"

Style: {style}

Generate a comprehensive prompt that includes:
- Main subject with details
- Style specifications
- Lighting and atmosphere
- Quality tags
- Technical details

Prompt (provide ONLY the prompt, no explanations):"""

        try:
            response = self.text_model.generate_content(prompt)
            generated_prompt = response.text.strip()
            generated_prompt = generated_prompt.strip('"').strip("'")
            return generated_prompt
        except Exception as e:
            print(f"Error generating prompt: {e}")
            return f"{description}, {style}, high quality, detailed"

    def suggest_color_palette(self, image: Image.Image) -> Dict:
        """
        Suggest a color palette based on an image.

        Args:
            image: PIL Image to analyze

        Returns:
            Dictionary with color palette suggestions
        """
        prompt = """Analyze the color palette of this image and provide:
1. The dominant colors (name and approximate hex values)
2. The overall color harmony (complementary, analogous, etc.)
3. Suggested color adjustments to improve the image
4. Alternative color schemes that would work well

Format the response clearly with color names and hex codes."""

        try:
            response = self.vision_model.generate_content([prompt, image])
            return {
                "success": True,
                "palette_analysis": response.text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Global instance
_gemini_integration = None


def get_gemini_integration(api_key: Optional[str] = None) -> Optional[GeminiIntegration]:
    """Get or create global Gemini integration instance."""
    global _gemini_integration
    
    if not GEMINI_AVAILABLE:
        return None
    
    if _gemini_integration is None:
        try:
            _gemini_integration = GeminiIntegration(api_key=api_key)
        except (ValueError, RuntimeError) as e:
            print(f"Could not initialize Gemini integration: {e}")
            return None
    
    return _gemini_integration
