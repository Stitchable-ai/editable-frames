# Reflection review: better flat surfaces, incomplete light transport

2026-11-14 · LIGHT1 remains partial · research implementation, not a library default

The independent review corrects three earlier interpretations: hiding the notebook from its own reflection capture caused the larger palm-rest error; the brighter café cup was partly justified bounce light and partly a sampling error; and nearby-product reflections were not negligible merely because the approximation failed to draw them. No finished-advert or general hardware approval follows.

## What changed

| Case | Earlier moving-reflection method | Review method | Remaining limit |
|---|---|---|---|
| Notebook palm-rest reflection energy / one-bounce reference, A / I / I0 | 2.04 / 1.57 / 1.53 | 1.01 / 0.94 / 0.91 | Flat up-facing deck only; mean energy agreement is not per-pixel agreement |
| Cup signed brightness bias, three arrangements | +5.9 to +13.0 image codes | −1.8 to −4.4 | Mean absolute error still 5.2–9.0 codes; glossy offline match untested |
| Saucer signed brightness bias | −3.0 to −10.3 codes | −0.2 to +3.7 | More than one bounce still missing |
| Nearby object on tuned notebook deck | About 1% of reference change | About 42% | Side-facing and curved surfaces remain weak |

The deck method samples a planar reflection with depth-aware, directionally stretched highlight taps. It recovers the lid/display in the deck without hiding the whole object. The café method places six probes around the cup, one in its bowl, and six above the exposed saucer, preserving the cup and its shadows in those captures. These are explicit scene-specific implementations, not a universal relighting model.

The reference gathers light at each tested surface point and integrates the material response. It is a useful one-bounce reference inside the same raster renderer, **not physical ground truth**. It excludes textured metal and points within 2 cm of other geometry; comparisons disable bump. Its anisotropic reference also removes a clamp found in the renderer's direct-light formula. Therefore its ratios cannot certify the entire product or a manufacturer's finish.

## Corrections to the earlier report

- A ray hitting the right object is a geometry check, not proof that the reflection's pixels have the right brightness or spread. The earlier 43/43 bulb-hit result and near-perfect planar scores must not be described as reflection accuracy.
- The notebook's clean display is partly a missing-reflection effect. Its reflected energy is 0.21, 0.68 and 0.97 of the per-point reference across three arrangements. Broad highlight tails outside the mirror image are missing. Avoiding a mirror-zone crossing remains useful art direction, but is not a material calibration.
- The old “at most 0.07 codes” neighbour effect was measured in a renderer that largely omitted it. The new reference sees up to 5 codes on the deck and 39 at a sampled base-side point. New rule-drawn arrangements barely show the neighbour, so they do not establish general neighbour handling. A separate designed stress case still over-responds.
- The café's roughly 30-code increase was not all an error. Roughly 20–25 codes are supported by the one-bounce gather; the remaining 6–13 mostly comes from probe placement. Lowering exposure would conceal rather than repair that distribution.

## Offline comparison and new bottleneck

In the directly lit café arrangement, matched matte, lamp-only Cycles gives direct light within 2%. The ring improves cup indirect light from 0.73 to 0.91 of the one-bounce reference and saucer light from 0.18 to 1.02. Eight bounces produce roughly twice the indirect light of one bounce.

However, the second arrangement sits in the lampshade penumbra: raster direct light is 1.35 times Cycles and indirect is about 1.9 times. That discrepancy is unexplained. The offline comparison is matte and lamp-only; **there is no matched glossy reference**. The next experiment must isolate this calibration discrepancy before using Cycles as an authority for these glossy shots.

Other remaining issues: side/bevel/lid self-reflections; per-pixel light occlusion; weak anisotropic effect despite improved direction; about 0.7–0.8 codes of fixed deck dither that may shimmer in motion; brass lamp reflections; and missing multi-bounce light.

## Cost and verification

On this Mac only, notebook rendering rose from 18.8 to 21.8 ms/frame. Café rendering at equal 32 samples rose from 48.7 to 70.6 ms/frame; at 64 samples, 75.6 to 95.9. These exclude capture/encoding and are not a claim of interactive performance on ordinary computers.

Worker receipts report 57 reverse/shuffled/edge seeks per clip across six clips (342 checks), 78 control edits/restorations, and no browser errors. Options-off regression matches the earlier build within one code on at most 11 pixels. The coordinator independently decoded all four previews (480 frames), recomputed notebook energy ratios from 360 retained point records and café indirect ratios from the raw point receipts, and inspected the notebook/café comparison sheets. This is arithmetic and delivery verification, **not a fresh render or independent validation of the reference integrator**. Neither review watched normal-speed playback. No new resolved dashboard count is added; the existing integrity checks already cover this kind of evidence.

## Routing decision

1. **Editable raster:** use for stylized scenes and bounded product shots with tested reflection paths. Keep exposure, camera, materials and lights editable; show limitations of the selected method.
2. **Offline rendering:** retain code-authored geometry and controls, but render expensive reflection/refraction and repeated bounces offline where the shot requires them. This remains code-driven, not diffusion. Match units, materials and tone mapping before comparing results.
3. **Joint diffusion:** keep for the previously demonstrated photorealistic contact/performance workflow when editable geometry and motion assets are unavailable or inadequate. It bakes interaction, camera and lighting into a take; live captions and graphics are composited afterward. This study made no diffusion calls and provides no new diffusion accuracy claim.

Do not promote the scene-specific shader patches into the library default yet. Preserve them as reproducible research assets while the penumbra discrepancy and glossy reference are investigated.
