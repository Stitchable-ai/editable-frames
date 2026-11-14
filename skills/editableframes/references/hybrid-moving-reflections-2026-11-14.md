# Moving-camera and moving-product reflections

2026-11-14 · LIGHT1 remains partial · two scenes on one Mac

The new raster method uses colocated visible emitters and direct/specular light, per-object reflection captures, and planar mirrors for flat surfaces. It improves reflection placement under camera orbit and product rotation. It does not establish calibrated product realism or general self-reflection support.

## What the worker measured

| Observation | Earlier method | New method |
|---|---|---|
| Notebook screen veil, tuned / held-out | 24.1 / 28.8 image codes | Below 1 in both |
| Notebook light-source reflection samples reproduced, tuned | 147/180, with 138 false positives | 180/180, with 8 false positives |
| Cup bulb-reflection samples reproduced | 0/43 | 43/43 |

These are worker-reported image-code and geometric-content measurements, not physical radiometry or independent image-quality scores. The mirror audit shares the rendering geometry, so perfect planar agreement validates plumbing rather than physical accuracy. Held-out layouts were adjusted using ID passes before their first beauty renders; this was a constrained arrangement test, not a blind external benchmark.

The clean screen depends on what it reflects. A lower key crosses the mirror zone and produces visible glare; raising the key avoids it without changing the display material. The emission-only UI differs by a mean 0.0095 codes rather than being byte-identical. The photographed café backdrop remains baked; changes there are confined to the existing steam overlay.

## Remaining defects and failed approaches

- Hiding each object during its reflection capture removes self-reflections. About 52–56% of notebook chassis mirror rays hit the notebook itself. Including it naively shifts the palm rests by about 60 codes.
- A planar deck experiment improves geometric content agreement but loses the brushed streak; it was added after the held-out run and is not held-out evidence.
- Nearby-product reflections remain weak or missing on the notebook body. Reflections between the cup and saucer change by several codes on a second bounce.
- The new café cup is about 30 codes brighter, with no independent energy calibration. The saucer diffuse probe sits inside the cup. These are open defects, not an approved look.
- The new studio background and neighbouring desktop are darker; held-out contact contrast is weaker.
- Emitter-only cube captures missed the nearby bulb. A single room probe turned the café table orange. Both failures are retained.

## Verification and limits

The worker reports exact shuffled/reverse seeks and control restoration, plus a three-frame real-CLI edit/stale-edit/undo specimen. The coordinator independently decoded all five comparison previews (120 frames each, 24 fps), checked the CLI receipt's internal consistency, and inspected notebook/café comparison stills. The coordinator has not rerun the reflection measurements. Neither review watched normal-speed playback. There is no offline reference, other hardware, measured GPU utilisation, or finished-advert approval.

Notebook steady rendering is reported at 19–21 ms/frame versus 11–12 previously. Café timing is not a fair speed comparison because the sample count changed from 64 to 32. Capture/encoding costs are separate.

## Next experiment and routing consequence

Independently verify self-reflection, nearby-object visibility and local irradiance before adopting the method. Use fixed geometry and material settings, isolate direct/specular/diffuse terms, retain failures, and freeze the method before a genuinely new arrangement. Recover the saucer probe placement and test whether extra bounces conserve a plausible brightness range.

Code can keep geometry, lights, camera and material edits live. These failures bound this raster implementation; they do not prove that code cannot solve the shot. Offline rendering remains a candidate for complex reflection/refraction. Joint diffusion generation remains the tested route for difficult photorealistic interaction, with baked internals and live code overlays afterward.
