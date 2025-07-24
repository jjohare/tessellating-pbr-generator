"""Main texture generation function."""

from typing import List
from ..types.config import Config
from ..types.results import GenerationResult
from ..interfaces.openai_api import OpenAIInterface
from ..utils.file_handlers import save_texture
import asyncio
import time
async def generate_textures(config: Config) -> List[GenerationResult]:
    """Generate PBR textures based on configuration.

    Args:
        config: Configuration object with all settings.

    Returns:
        List of generation results.
    """
    openai_interface = OpenAIInterface(api_key=config.api_key, org_id=config.org_id)
    results = []

    for texture_type in config.texture_config.types:
        start_time = time.time()
        resolution = config.texture_config.resolution
        prompt = f"A {resolution.width}x{resolution.height} photorealistic, seamless {texture_type.value} map of {config.material} with a {config.style} style."

        image_data = await openai_interface.generate_image(
            prompt=prompt,
            model=config.model,
            size=f"{resolution.width}x{resolution.height}",
        )

        generation_time = time.time() - start_time

        if image_data:
            resolution = config.texture_config.resolution
            file_path = f"{config.output_directory}/{config.naming_convention.format(material=config.material, type=texture_type.value, resolution=f'{resolution.width}x{resolution.height}')}.{config.texture_config.format.value}"
            save_texture(image_data, file_path)
            results.append(GenerationResult(texture_type=texture_type, file_path=file_path, generation_time=generation_time, success=True))
        else:
            results.append(GenerationResult(texture_type=texture_type, file_path="", generation_time=generation_time, success=False, error_message="Failed to generate image."))

    return results