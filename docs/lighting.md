# Product lighting and device finishes

The optional Three.js adapter is shared by the device library and the website product film. It loads the included Studio Small 09 HDR from Poly Haven, checks its SHA-256, and prefilters it for physically based reflections. Neutral tone mapping, sRGB output, a restrained key and no ambient wash retain the light/dark reflections that make metal readable. Environment angle, strength, exposure and background remain editable.

## Aluminium by default

`createDeviceMaterial()` creates a satin aluminium chassis: metalness 1, roughness 0.26, a neutral silver base color. Pass ordinary Three.js material options to specify another finish. It is a PBR approximation, not a measurement of an Apple product.

For imported GLBs, `prepareMaterials` clones materials and applies the same finish to identified body surfaces. It recognizes chassis/metal/aluminium names, accepts explicit roles, and uses digest-bound profiles for opaque material names. Displays, lenses, glass, plastic antenna inserts, keyboard keys and rubber keep their authored materials. Unknown or mixed surfaces are preserved: a material shared by a TV screen and casing cannot be safely turned entirely into metal. Separate these surfaces or supply a reviewed binding first. Authored colors, base-color textures and normal maps remain; pure-white chassis reflectance is reduced and body metallic/roughness maps are replaced by the satin preset. Other texture maps stay authored.

```js
import {createDeviceMaterial, prepareMaterials, createProductLighting} from 'editableframes/three';

const chassis = createDeviceMaterial();
const plastic = createDeviceMaterial({metalness: 0, roughness: 0.65});
const materials = prepareMaterials(model, renderer, asset, profiles, {
  roles: {HousingMesh: 'body', DisplayMesh: 'authored'},
}); // aluminium already applied
materials.apply('authored'); // restore original values, colors and maps
materials.apply('aluminium'); // return to the default
```

The iPhone 12 source merges its front bezel/notch and chassis into one material. Its digest-bound `surfaceRegions` profile assigns the front triangles a dark glass finish and keeps the sides aluminium. Positions, UVs and screen bindings are unchanged; selecting authored materials restores the source appearance.

For generated geometry, use `createDeviceMaterial` on every chassis, and use separate glass/display/keyboard materials. Custom renderer code remains unrestricted. Explicit roles (`mesh.name`, then `material.name`, or `userData.deviceRole`) override automatic recognition. `finish: 'authored'` opts out when preparing a model. The legacy boolean `apply(true/false)` remains compatible. Dispose the rig's retained material snapshots with `materials.dispose()` when releasing the model.

The website exposes **Body finish** and **Reflection angle** through its normal editable schema and undo/redo. The library viewer's **Satin aluminium bodies** toggle is saved with its existing appearance history. Screen content uses a separate unlit material so exposure does not alter interface colors. Look profiles record device, camera, HDR identity and material policy.

Lighting cannot recover missing geometry or separate parts merged in the source model. These are fan-made models with varying fidelity, not calibrated scans. New renderers may use other lighting and materials without changing the core document.

## Photographs versus models

A real product can enter a scene two ways, and they light differently. A trial on 2026-11-12 used official photographs of four products and third-party models of three.

| Route | Can | Cannot |
|---|---|---|
| Product photograph on an alpha plane | Keep the exact logo, controls and proportions; take restrained colour and exposure matching from the scene | Respond to a moving light. Its highlights and shadows are baked in and turn with the image, and it has no unseen sides. |
| 3D model | Respond to moving lights and environment: at a fixed pose, moving the lights changed a neutral patch from about 106 to 193 RGB | Look better than its materials. Two phone models read flat beside product photography and were unsuitable for close-ups. |

Name the operation the scene performs: on a photograph it is colour matching, not relighting. Keep a device's display out of the grade applied to its case. Downsample a large photograph explicitly before drawing it small; a fine grille aliased until it was downsampled in steps, which cut its error against a Lanczos reference by 58%. When a metal model washes out, check the environment before the lights: in the trial the pale plateau came from environment strength, and 0.8 → 0.2 restored the surface. Moving, correct highlights on a product only available as photographs need CAD with material maps, a photogrammetry capture, or photographs taken under several lights.

## Checking overlap between moving products

Two copies of each product in one scene, one turning and one orbiting behind and in front of it, were checked with separate object-id passes (A only, B only, both) at 35 crossing poses: no wrong foreground assignment over 353,771 interior pixels, antialiased edges excluded. Axis-aligned bounding boxes flagged 36 collisions between the two laptops that a rotation-invariant footprint showed were at least 0.44 scene units apart. Use a tight bound before reporting a collision. The photographed products rotated only in the image plane, with their baked highlights turning too; draw order cannot repair that. Reflections of one copy in the other, bounce light and area-light shadows were not simulated.

