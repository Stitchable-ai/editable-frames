# Product lighting

The Three.js adapter uses the included Studio Small 09 HDR from Poly Haven, checked by SHA-256, and prefilters it for physically based reflections. Neutral product tone mapping and sRGB output preserve a useful product-preview baseline. HDR rotation, strength, exposure and background remain editable.

Avoid bright ambient wash, which hides metallic reflections. Preserve authored PBR materials by default; explicit reviewed corrections are keyed to the exact model digest. Screen content uses a separate unlit material so exposure does not unnecessarily alter interface colors. A saved look records camera, device, screen mapping, HDR identity and appearance history.

Lighting cannot recover geometry or missing texture quality. These are fan-made models with varying fidelity, not calibrated color measurements of physical products. The adapter is optional: a future renderer can implement its own lighting approach without changing the core document.
