# Changelog

All notable changes to the Tessellating PBR Texture Generator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-24

### 🚀 Major Refactor - Python Implementation & AI-Driven Workflow

This release marks a complete reimplementation of the generator in Python and a fundamental shift to an **AI-first** workflow. The core of the tool is now centered around generating a diffuse map from a text prompt using AI, and then algorithmically deriving the remaining PBR maps.

### Added

#### Core Features
- ✅ **AI-Powered Diffuse Generation**: Integrated OpenAI DALL-E to generate base textures from text prompts.
- ✅ **Algorithmic PBR Pipeline**: Generates a full set of PBR maps from the AI-generated diffuse texture:
  - Normal maps with configurable strength
  - Roughness maps with contrast control
  - Metallic maps with threshold detection
  - Ambient Occlusion with multi-scale synthesis
  - Height/Displacement maps
- ✅ **Advanced Tessellation Engine**:
  - Three seamless tiling algorithms: `mirror`, `offset`, and `frequency`.
  - Automatic 2x2 tiled preview generation for quality verification.
- ✅ **Production-Ready CLI**:
  - Comprehensive command-line interface for controlling generation.
  - JSON-based configuration system with CLI overrides.
  - Support for multiple output formats (PNG, JPEG, etc.).

### Changed

- 🔄 **Core Workflow**: The architecture has been pivoted from processing a user-provided texture to an **AI-driven workflow** that starts with a text prompt.
- 🔄 **Language**: Complete migration from TypeScript to Python to leverage powerful imaging and scientific computing libraries.
- 🔄 **Dependencies**: Now uses `Pillow`, `NumPy`, and `openai` instead of Node.js packages.
- 🔄 **Focus**: Shifted from a proof-of-concept to a functional, AI-centric generation tool.

### Removed

- ❌ **User-Provided Texture Input**: The previous workflow requiring a user to supply a diffuse map has been removed in favor of AI generation.
- ❌ **TypeScript Core**: The original TypeScript implementation is now deprecated.

### Technical Details

#### Performance
- Parallel processing of PBR maps
- Memory-efficient streaming for large textures
- NumPy acceleration for image operations

#### Compatibility
- Python 3.9+ required
- Cross-platform (Windows, macOS, Linux)
- No external API dependencies

## [1.0.0] - 2023-12-01

### Initial Release (TypeScript)

- 🎯 Original TypeScript implementation
- 🤖 AI-powered texture generation concept
- 🧪 Comprehensive Jest testing framework
- 📚 Extensive documentation

---

## Migration Guide (1.0 → 2.0)

### For Users

1. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Update Usage**:
   - Old: `npm run generate` or providing a diffuse texture.
   - New: `python main.py --material "a descriptive text prompt"`

3. **Configuration Changes**:
   - Configuration now focuses on AI provider settings (API keys, model selection) and algorithmic parameters for the derived maps.

### For Developers

1. **Module Structure**:
   - TypeScript modules → Python modules
   - Promises → Synchronous/async Python
   - Jest tests → Pytest tests

2. **API Changes**:
   - No external API calls required
   - All processing done locally
   - New processor base classes

3. **Configuration**:
   - Same JSON structure
   - New generation parameters
   - CLI override system

## Future Roadmap

- [ ] GPU acceleration support
- [ ] Web interface
- [ ] Material preset library
- [ ] Real-time preview server
- [ ] Machine learning enhancements