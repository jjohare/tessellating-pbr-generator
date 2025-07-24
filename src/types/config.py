"""Configuration type definitions."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from .common import TextureType, TextureFormat, Resolution


@dataclass
class MaterialProperties:
    """Material-specific properties for texture generation."""
    roughness_range: tuple[float, float] = (0.0, 1.0)
    metallic_value: float = 0.0
    normal_strength: float = 1.0
    ao_intensity: float = 1.0
    additional_properties: Dict[str, Any] = None

    def __post_init__(self):
        if self.additional_properties is None:
            self.additional_properties = {}


@dataclass
class TextureConfig:
    """Configuration for texture generation."""
    resolution: Resolution
    format: TextureFormat
    types: List[TextureType]
    seamless: bool = True
    bit_depth: int = 8

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TextureConfig":
        """Create TextureConfig from dictionary."""
        resolution = Resolution(
            width=data["resolution"]["width"],
            height=data["resolution"]["height"]
        )
        format_enum = TextureFormat(data["format"])
        types = [TextureType(t) for t in data["types"]]

        return cls(
            resolution=resolution,
            format=format_enum,
            types=types,
            seamless=data.get("seamless", True),
            bit_depth=data.get("bit_depth", 8)
        )


@dataclass
class Config:
    """Main configuration class."""
    project_name: str
    project_version: str
    texture_config: TextureConfig
    material: str
    style: str
    material_properties: MaterialProperties
    model: str
    output_directory: str
    naming_convention: str
    create_preview: bool = True
    api_key: Optional[str] = None
    org_id: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Config":
        """Create Config from dictionary."""
        texture_config = TextureConfig.from_dict(data["textures"])

        material_props = MaterialProperties(
            roughness_range=tuple(data["material"]["properties"].get("roughness_range", [0.0, 1.0])),
            metallic_value=data["material"]["properties"].get("metallic_value", 0.0),
            normal_strength=data["material"]["properties"].get("normal_strength", 1.0),
            ao_intensity=data["material"]["properties"].get("ao_intensity", 1.0)
        )

        return cls(
            project_name=data["project"]["name"],
            project_version=data["project"]["version"],
            texture_config=texture_config,
            material=data["material"]["base_material"],
            style=data["material"].get("style", "realistic"),
            material_properties=material_props,
            model=data["generation"]["model"],
            output_directory=data["output"]["directory"],
            naming_convention=data["output"]["naming_convention"],
            create_preview=data["output"].get("create_preview", True),
            api_key=data.get("api", {}).get("openai_key"),
            org_id=data.get("api", {}).get("openai_org_id")
        )