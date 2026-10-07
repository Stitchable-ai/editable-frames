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

For generated geometry, use `createDeviceMaterial` on every chassis, and use separate glass/display/keyboard materials. Custom renderer code remains unrestricted. Explicit roles (`mesh.name`, then `material.name`, or `userData.deviceRole`) override automatic recognition. `finish: 'authored'` opts out when preparing a model. The legacy boolean `apply(true/false)` remains compatible. Dispose the rig's retained material snapshots with `materials.dispose()` when releasing the model.

The website exposes **Body finish** and **Reflection angle** through its normal editable schema and undo/redo. The library viewer's **Satin aluminium bodies** toggle is saved with its existing appearance history. Screen content uses a separate unlit material so exposure does not alter interface colors. Look profiles record device, camera, HDR identity and material policy.

Lighting cannot recover missing geometry or separate parts merged in the source model. These are fan-made models with varying fidelity, not calibrated scans. New renderers may use other lighting and materials without changing the core document.
