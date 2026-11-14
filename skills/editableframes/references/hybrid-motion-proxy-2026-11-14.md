# Moving highlights and spatial reflections: measured boundaries

2026-11-14 · LIGHT1 remains partial · no default shader adoption

A scene-aware reflection method now reproduces the tested nearby sphere and corrects the bright upper band. This extends the useful raster envelope, but its proxies are exact for the simple test geometry. It does not establish accuracy for real products. Offline rendering remains code-generated video, and these lighting errors do not require diffusion.

## What the new reference establishes

A separately written numpy integrator with analytic geometry and two estimators confirms the direct single-scatter GGX reference. It also independently checks one bounce from matte neighbours in five arrangements: Cycles/integrator energy ratios are 0.9976–1.0017. Per-pixel RMS remains 2.9–6.1% with Monte Carlo noise on both sides. Multiple bounces, arbitrary materials and real-product geometry are outside this validation.

The worker freshly reproduced eight retained raster arrays and one Cycles pose byte-identically. The coordinator checked retained evidence and delivery integrity; the coordinator did not repeat the rendering or derive a third integrator.

## Moving highlights: do not switch anti-aliasing off globally

The study moved the light, camera and product for 48 frames, at two resolutions and two roughness values. A 4×4 supersampled reference separates actual highlight movement from sampling error.

| Tested case | AA off | Default specular AA | Decision |
|---|---|---|---|
| Satin cylinder, roughness 0.35 | Under 0.2 display codes mean error in the tested cases | Broadens the highlight; error changes with output size | Bounded opt-in, not a new default |
| Polished cylinder, roughness 0.10, roughly 2-pixel highlight | 2.7% energy pumping; 17.6-code temporal reversal | 1.0% pumping, 5.7 codes, but tails about 3× too bright | Supersample final output |

Clipping the highlight to white hides shimmer; evaluate an unclipped exposure too. The alternative normal-derivative AA formula also widens the polished highlight excessively. Supersampling costs about 27 vs 9 ms for the satin case and 105 vs 34 ms for polished on this Mac. These are research render timings, not export or general-computer performance.

## Spatial reflections: a real improvement with a geometry condition

The new shader samples reflection directions from the material lobe and traces them against a floor plane, sphere and box. It uses a captured view at the hit, handles disoccluded hits explicitly, and returns the background when a ray misses the scene. Tuning used one pose; two arrangements and the motion path were frozen before method development.

| Measurement | Centre probe | Proxy taps |
|---|---:|---:|
| Upper-band reflected energy / one-bounce reference, five arrangements | 1.70–2.47 | 0.99–1.03 |
| Neighbour sphere effect, regression slope | −0.05 to 0.79 | 0.96–0.98 |
| Whole-picture error on cylinder pixels, five arrangements | 17.7–22.8 codes | 1.3–1.9 codes |
| Held-out motion, same cylinder metric | 20.0 codes | 2.4 codes |

The coordinator recomputed 45 whole/lower/upper energy ratios from packed linear arrays and independently constructed eroded object masks. All agree with the recorded rounded ratios. These are cylinder-region results, not whole-scene quality scores: matte neighbours remain 21–47 codes too dark.

At 64 taps, grain remains about 4.3 codes RMS against the 1024-tap version and changes over time. About 1024 taps reduces error against Cycles to 1.3 codes, without separating reference noise. Omitting the sphere proxy loses its reflection and increases error to as much as 7 codes. Approximate proxies for real devices, thin geometry, textured/coloured surfaces and broader materials remain untested.

The proxy pass takes 2.3–3.1 ms at 960×540 when the cylinder occupies about 10% of the frame. At 1080p and 75% occupancy it takes 12.9 ms at 64 taps or 47.1 ms at 256 taps. These exclude the separate direct-light pass and capture/encoding. One-bounce Cycles takes about 12 seconds per 960×540 frame on this Mac.

## Corrections to the preceding study

- The older frozen-method manifest no longer matches three retained source/bundle/capture files. Fresh baseline rendering still reproduces the evidence; the old manifest must not be cited as proof of a frozen protocol.
- The prior held-out light pose includes the highlight peak, not only its tail.
- Most residual AA-off direct-light error comes from different emitter models: uniform points inside a ball versus a Lambertian sphere. An alternative distribution was checked in the CPU model, not rendered as a new raster result.
- The upper-band error is not mainly prefiltering. Rays that miss scene geometry were incorrectly answered with nearby floor. A floor-plane-only correction fails one held-out arrangement at 1.78× lower-band energy.

## Routing and next gate

1. **Editable raster:** direct lights and shadows; tested satin highlights; spatial reflections with explicit, adequate proxies. Use more samples for polished or grain-sensitive delivery. Keep these options experimental.
2. **Offline rendering of the same scene:** complex nearby geometry, matte bounce, multiple reflections and nested glass/liquid. Preserve asset, camera and light identity. This is a compute/renderer choice within code generation.
3. **Generated joint performance:** use when photoreal interacting people or objects lack suitable assets, rigs or motion. Generated lighting and contact are baked; captions, branding overlays and whole-frame edits can stay live. Diffusion was not used in this lighting study.

Next test: approximate proxies for retained real-product meshes, compared with the actual mesh reference under camera/product/light motion. Include deliberate proxy omissions, self-reflection, an unseen arrangement, quality/cost at final resolution, and an explicit failure threshold. Stop at a measured route boundary rather than calling every partial result solved.

## Verification and retained failures

Coordinator: all 44 delivery hashes and 42 sibling input hashes match; all nine previews decode (408 frames); 45 regional ratios recomputed; three stale old-freeze hashes confirmed; comparison stills and the energy chart inspected. No coordinator fresh render, normal-speed playback, audio or second-device acceptance.

Worker: 352 out-of-order rerenders match, 13 controls change and restore exactly, no page errors. Retained failures include a tail-only motion test, the first proxy method, omitted disocclusion, omitted sphere proxy and over-soft polished AA. No paid calls, downloads or default runtime changes.

Three additional research subchecks are resolved only in scope: one-bounce reference validation; the measured satin/polished motion boundary; and exact-proxy reflection accuracy in the held-out simple scenes. LIGHT1 remains partial and is not approved for production.
