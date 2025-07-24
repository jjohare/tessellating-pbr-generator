#!/usr/bin/env python3
"""Main entry point for the Tessellating PBR Texture Generator."""

import argparse
import asyncio
import sys
from pathlib import Path
from src.config import load_config
from src.types.config import Config
from src.utils.logging import setup_logger, get_logger


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate seamless PBR textures using AI"
    )
    
    parser.add_argument(
        "-c", "--config",
        type=str,
        help="Path to configuration file (default: config/default.json)"
    )
    
    parser.add_argument(
        "-m", "--material",
        type=str,
        help="Material to generate (overrides config)"
    )
    
    parser.add_argument(
        "-r", "--resolution",
        type=str,
        help="Resolution (e.g., 2048x2048, overrides config)"
    )
    
    parser.add_argument(
        "-o", "--output",
        type=str,
        help="Output directory (overrides config)"
    )
    
    parser.add_argument(
        "-t", "--types",
        nargs="+",
        help="Texture types to generate (e.g., diffuse normal roughness)"
    )
    
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Generate preview image"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    return parser.parse_args()


async def main():
    """Main function."""
    # Parse arguments
    args = parse_arguments()
    
    # Setup logging
    setup_logger(debug=args.debug)
    logger = get_logger(__name__)
    
    logger.info("Starting Tessellating PBR Texture Generator")
    
    try:
        # Load configuration
        config_dict = load_config(args.config)
        
        # Override with command line arguments
        if args.material:
            config_dict["material"]["base_material"] = args.material
        
        if args.resolution:
            width, height = map(int, args.resolution.split('x'))
            config_dict["textures"]["resolution"]["width"] = width
            config_dict["textures"]["resolution"]["height"] = height
        
        if args.output:
            config_dict["output"]["directory"] = args.output
        
        if args.types:
            config_dict["textures"]["types"] = args.types
        
        if args.preview:
            config_dict["output"]["create_preview"] = True
        
        # Create Config object
        config = Config.from_dict(config_dict)
        
        # Log configuration
        logger.info(f"Material: {config.material}")
        logger.info(f"Style: {config.style}")
        logger.info(f"Resolution: {config.texture_config.resolution}")
        logger.info(f"Texture types: {[t.value for t in config.texture_config.types]}")
        logger.info(f"Output directory: {config.output_directory}")
        
        # Import generator here to avoid circular imports
        from src.core.generator import generate_textures
        
        # Generate textures
        logger.info("Starting texture generation...")
        results = await generate_textures(config)
        
        # Log results
        logger.info(f"Successfully generated {len(results)} textures")
        for result in results:
            logger.info(f"  - {result.texture_type.value}: {result.file_path}")
        
        logger.info("Texture generation complete!")
        
    except FileNotFoundError as e:
        logger.error(f"Configuration file not found: {e}")
        sys.exit(1)
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())