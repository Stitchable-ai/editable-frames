# Direct-light calibration and the remaining reflection boundary

> Follow-up: [motion and spatial-proxy testing](hybrid-motion-proxy-2026-11-14.md) independently validates the one-bounce reference, demonstrates a polished-highlight shimmer limit, and corrects the old freeze/emitter/horizon claims. This page records the earlier checkpoint.

2026-11-14 · LIGHT1 remains partial · research options only

The unexplained café penumbra comparison is now explained and repaired for direct light in the retained research scenes. The remaining indirect-light discrepancy is explained but not repaired. A glossy direct-light reference has also been checked against a separate CPU integration method. None of the shader changes is adopted as a library default.

## What changed

The retained point-shadow bias was normalized against a roughly 500-unit depth range. A bias of -0.002 therefore allowed approximately one world unit of shadow leakage. That hid nearby cup, handle and saucer occlusion. The earlier arrangement-A agreement was partly cancellation between this leak and lamp-stem occlusion of the emitter samples, not a sound calibration.

The opt-in repair uses a 3 mm world-space bias, directs the normal offset toward each light, excludes the lamp stem inside the bulb from that bulb's shadow maps, and uses a symmetric emitter sample distribution. Fixing only the bias exposed lampshade-interior self-shadowing; the second correction matters. Two failed clipping implementations are retained.

| Direct lamp energy / Cycles reference; ideal = 1 | Retained | Repaired |
|---|---:|---:|
| A cup | 0.980 | 0.998 |
| A saucer | 1.060 | 1.007 |
| I cup | 1.351 | 1.000 |
| I saucer | 1.115 | 1.008 |

These are regional means, not per-pixel correctness. The coordinator independently recomputed them from the retained linear arrays and object masks. Absolute mean linear errors remain 0.00095–0.00520. The change in the retained styled café frames is subtle overall: worker measurements report 0.33–0.38 display codes mean frame change, with stronger differences at contacts. This is not a new finished advert.

## One glossy reference, with a narrow material contract

The worker matched geometry and matte lighting before comparing a white, single-scatter GGX metal cylinder. Cycles direct light agrees with the separate CPU GGX integral at approximately 1.000 mean ratio and 0.3–0.5% relative RMS over three tested poses. The coordinator recomputed the comparison on 1,486 / 1,649 / 1,649 retained sample points. This checks consistency of retained evidence, not an independent derivation or fresh render of the reference integrator.

The raster's specular anti-aliasing widens the highlight. Removing that term brings its tail energy ratio from 1.10–1.12 to 0.995–1.008, including the worker's held-out light pose. Regional mean improvement does not eliminate residual pixel error: relative RMS remains 4.7–6.9%. Disabling anti-aliasing could introduce shimmer; that has not been tested. Clearcoat, Principled materials, textured roughness and arbitrary metal finishes are not covered.

## Why the whole picture still differs

The reflection probe has the wrong spatial view of the floor and misses the neighbouring sphere. A floor-plane correction improves the lower cylinder, but the upper bright band remains around 1.75× the reference. The modified clip still has about 18.5 display codes mean cylinder error, versus about 22.3 for the frozen method. A brighter result is not automatically a better result.

The café probe captures mix bounce orders. After direct-light fixes, their indirect result matches neither a universal one-bounce nor a complete multi-bounce solution: it reaches 43–72% of the eight-bounce cup reference in these arrangements. The worker did not independently validate Cycles indirect light, and the eight-bounce still is noisy.

## Routing decision

1. **Editable raster:** useful for responsive staging and bounded direct-light/shadow work. Keep world-scale bias and emitter geometry explicit. Do not disable specular anti-aliasing globally from this study.
2. **Offline rendering of the same scene:** the demonstrated route when nearby reflections, nested transparent materials or multiple light bounces matter. This remains code-generated video; it is not outside code generation's capabilities. A production adapter must preserve geometry, camera, material and light identity, expose unsupported features, and test export parity.
3. **Joint diffusion take:** retain for photoreal human/object performance when usable geometry or controllable motion is missing. No diffusion was needed or tested here. A generated take keeps its internal lighting/action baked; overlays and whole-frame trim/crop remain editable under the earlier workflow.

The boundary is assets, physical requirements and compute budget—not “all hard lighting needs diffusion.” The worker's CPU timings are about 1.5 seconds per 480×270 glossy frame and 20 seconds per 1280×720 matte café frame. They do not establish performance on typical computers.

## Verification and next experiment

The coordinator read the relevant installed shader code, recomputed four café ratios and three glossy reference comparisons, verified all 14 delivered-file hashes, decoded all 48 frames of the 2-second 1440×270 comparison, and inspected the café and glossy comparison stills. No fresh rendering, normal-speed viewing, sound review or cross-hardware test was performed. No runtime source changes or paid model calls were made in this checkpoint.

Two scoped research subchecks are now resolved: direct café calibration for A/I, and retained direct-GGX reference agreement for three poses. LIGHT1 remains partial. Next: independently review the reference and test the anti-aliasing change under motion; try one bounded importance-sampled reflection lookup with explicit scene proxies against the same reference. Preserve failures and reject it if shimmer, cost or remaining errors make offline rendering the better route.
