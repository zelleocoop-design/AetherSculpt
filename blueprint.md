# 🌌 AetherSculpt 3D — Single Source of Truth & Project Blueprint

## 1. Overview & Purpose
**AetherSculpt 3D** is a web-based spatial drawing, 3D sculpting, and creative suite designed for artists, designers, and 3D creators. It enables real-time volumetric drawing in true 3D space with camera-relative planes, symmetry engines, PBR physical materials, dynamic shaders, synthesized audio feedback, and direct export to industry-standard 3D formats (glTF / GLB, OBJ) and high-resolution renders.

---

## 2. Implemented Features & Technical Architecture

### 🎨 3D Volumetric Brush Engines (`js/brushEngine.js`, `js/drawController.js`)
- **Neon Tube**: Continuous volumetric tubular extrusion with smooth spline interpolation and round caps.
- **Calligraphy Ribbon**: Camera/tangent oriented smooth ribbon geometry with variable tapering and normal orientation.
- **Stardust Trail**: Luminous particle streams with additive blending, custom radial glow particle texture generator, and dynamic particle size.
- **Wireframe Lattice**: Structural architectural lattice with wireframe tubular geometry.
- **Crystal Facets**: Sharp, multi-faceted geometric crystalline extrusions.
- **Voxel Block**: Spatial 3D cubic stroke extrusion.
- **Plasma Arc**: High-energy jagged sinusoidal wave beams.
- **Single-Click / Dot Support**: Creates 3D spherical stamps with symmetry handling when clicked without dragging.

### 🔮 Materials & Shaders (`js/materials.js`)
- **MeshPhysicalMaterial PBR suite**:
  - **Gloss Lacquer**: High clearcoat (1.0), roughness 0.1, mirror reflectivity.
  - **Matte Clay**: Non-reflective, earthy, tactile sculpting feel.
  - **Crystal Glass**: High transmission (0.9), IOR 1.5, low roughness.
  - **Neon Glow / Emissive**: High emissive intensity with postprocessing bloom integration.
  - **Liquid Chrome**: Metalness 1.0, roughness 0.05, mirror-like specular highlights.
  - **Iridescent Pearl**: Thin-film iridescence with clearcoat and subtle color shifting.
  - **Spectrum Rainbow**: Dynamic HSV-interpolated spatial coloring along the stroke trajectory.
- **Dynamic Particle Shader / Additive Blending**: Procedurally generated soft circular glow sprites for stardust trails.

### 📐 Spatial Planes & Symmetry Engine (`js/symmetry.js`, `js/drawController.js`)
- **In-Front Distance Lock (Camera Ray Plane)**: Intersects the camera's forward ray at a user-defined distance, allowing freehand 3D sketching directly into the view.
- **Origin Planes**: Fixed coordinate planes (`XY` Front Wall, `XZ` Ground Floor, `YZ` Side Wall).
- **Symmetry Modes**:
  - Mirror across `X`, `Y`, or `Z` axes.
  - Radial Symmetry: 4-fold and 8-fold radial duplication with rotation matrices.

### 🎥 Navigation & Viewport Controls (`main.js`, `js/environment.js`)
- **6-DOF Movement**: `WASD` navigation + `Q`/`E` vertical flight, with `Shift`/`Ctrl` acceleration.
- **Pointer / Camera Controls**: Right-click look/orbit, middle-click pan, left-click draw.
- **Auto-Showcase**: 360° turntable presentation mode.
- **Zen / Immersive Mode**: `Tab` toggles all chrome and HUD elements for focused creation.

### 💾 Export & Capture Capabilities (`js/exporter.js`)
- **glTF / GLB Export**: Bundles all active meshes, particle systems, and materials into binary GLB files ready for Blender, Unreal Engine, Unity, and WebXR.
- **Wavefront OBJ Export**: Standard geometry export compatible with traditional DCC tools.
- **4K Screenshot Capture**: Direct canvas buffer rendering to high-res PNG.

### 🎵 Synthesized Spatial Audio Feedback (`js/audioFeedback.js`)
- Web Audio API synthesizer for drawing feedback (frequency modulated based on stroke velocity), preset switching clicks, and export chimes.

### 🎨 Visual & UI Design System (`style.css`, `index.html`)
- Dark glassmorphism interface with backdrop-filter blur.
- Typography: Plus Jakarta Sans & JetBrains Mono via Google Fonts.
- Responsive HUD layout with floating control palettes, shortcuts modal, and real-time status indicators.

---

## 3. Current Requested Change: Deployment to GitHub
- **Target Repository**: `https://github.com/zelleocoop-design/AetherSculpt.git`
- **Target Branch**: `main`
- **Action Plan**:
  1. Verify working tree files and ensure all source code, assets, and documentation are properly staged.
  2. Commit all project files with a clear, descriptive message (`Deploy AetherSculpt 3D Studio`).
  3. Push the `main` branch to the remote repository.
  4. Verify the push status against `https://github.com/zelleocoop-design/AetherSculpt.git`.
