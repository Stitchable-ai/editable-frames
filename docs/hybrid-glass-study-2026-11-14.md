# Nested glass, liquid and ice: verified limits

2026-11-14. **GLASS1: partial. No production approval or integration patch.** The previously interrupted study resumed and completed. Its original failures and coordinator verification are retained. New hosted-model spend: $0.

## What changed

The stock three.js r180 transmission capture samples opaque objects and, on this tested GPU path, back faces of double-sided transmissive objects. Transmissive front faces do not generally see each other. This explains why the glass can conceal the liquid and ice. The coordinator inspected this path in the installed renderer source. Clean geometry fails too; removing overlaps alone does not solve the capture limitation. The double-sided back-face path is skipped when WEBGL_multisampled_render_to_texture is present, so the single-sheet workaround is not a portable default.

| Route | Adding liquid: mean RGB code change in the same region | Main limit |
|---|---:|---|
| Original stock approach | 0.37 | Contents almost invisible |
| Clean geometry, stock approach | 0.74 | Geometry cleanup alone does not fix capture |
| Closed double-sided shell | 0.68 | Inner shell wins the capture |
| Single-sheet workaround (R1) | 43.96 | Flat tint, milky ice; abandons closed shell |
| Layered cylinder refraction (R2) | 72.10 | Over-bright liquid, dark upper ice, submerged ice omitted |
| Cycles reference | 50.30 | Slow, authored interface setup and physical approximations |

These are visibility signals, not quality scores. A larger signal is not necessarily better. R2 restores cylinder lens inversion, but has a bright base band and only supports a vertical liquid cylinder with a flat top. Its omission of submerged ice is explicit, not a solved feature.

## Independent coordinator verification

- 54 new out-of-order raster frames across three routes and two shots match the saved lossless video pixels exactly.
- Five independent control edits change pixels and restore identical PNGs; no page errors.
- Eight full lossless clips and eight full MP4s decode: 72 frames each, 1280×720, 24 fps. There are eight unique sequences, not sixteen independent scenes.
- Recomputed the six liquid-visibility values above from retained geometry masks and stills.
- Recomputed liquid-region brightness range under the moving practical: R1 4.73, R2 2.78, Cycles 12.56 luma codes. The fast routes respond weakly through the liquid.
- Rechecked all five emissive calibration swatches: maximum difference at most one code in the sampled patches.

The coordinator inspected still comparisons and renderer source. No fresh Cycles rendering, normal-speed perceptual review, or independent performance benchmark was performed. Geometry masks are worker-generated, not human ground truth. An initial measurement invocation ran before queued capture finished and failed for a missing receipt; the subsequent complete verification passed.

## Reference boundaries

The reference shares geometry export, camera path, HDR and the three.js Neutral+sRGB display transform. It is a much better controlled comparison than the earlier mismatched tone maps. It is still not physical ground truth: caustics are off, glass casts an opaque shadow, nested interfaces use small insets and relative IOR changes, and pixel filters differ. Raster omits scene reflections and indirect bounce, while the reference includes them; raster uses a point highlight versus an 8 mm source in Cycles. The worker measured a 4.2-code grey-sphere difference and a 20.6-code chrome-sphere difference, with chrome-only environment alignment correlation 0.92. Do not attribute every pixel difference solely to transmission.

## Route decision

Keep editable raster as the default for the already-supported opaque scenes. For hero shots whose nested transparent contents matter, offer a separately validated offline quality route; the tested Cycles setup is the strongest candidate for this particular drink, not a general certified export path. Keep R2 experimental and opt-in for authored cylindrical drinks with its omitted ice and lighting limitations disclosed. Do not silently replace closed geometry or omit nested objects in a quality export.

Worker timings on one Apple M6 / 16 GB Mac: R2 about 11.5 ms per frame for synchronized rendering, about 96 ms including capture; Cycles 7.2–8.4 seconds per frame at 64 samples plus denoising, approximately 9–10 minutes per 72-frame clip, with peak RSS 4.3–5.1 GB. These measure different pipeline scopes and are not ordinary-computer guarantees. No NVIDIA hardware was used.

Still open: arbitrary liquid shapes, glass/base refraction, submerged and above-surface ice, scene reflections, calibrated brightness, moving practical-light response, other hardware, native integration, and visual approval. No whole research item is closed by the passing integrity checks.
