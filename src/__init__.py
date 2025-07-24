"""Tessellating PBR Texture Generator Package."""

__version__ = "1.0.0"
__author__ = "Tessellating PBR Generator Team"

from .core import generate_textures
from .config import load_config

__all__ = ['generate_textures', 'load_config']