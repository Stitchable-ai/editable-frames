# Hair audit follow-up: isolate the model from the repair

2026-11-14. **MASK1 remains partial.** Fable's resumed audit is complete and the coordinator checked its delivered data and standalone renderer. This supersedes the earlier statement that the independent audit was unavailable. No paid calls, downloads or production approval.

## Better evidence changes the interpretation

The earlier coordinator audit held foreground RGB constant and compared alpha variants. It established background sensitivity and stability, not accurate hair extraction. The new study decodes the retained source without an additional lossy intermediate, isolates source compression, recurrent warm-up, resolution and support clipping, and adds two limited references that do not depend on optical flow.

Worker isolation findings on this one 96-frame excerpt:

- Replacing the original JPEG intermediates with lossless decoded frames reduces the flicker score by 39.5% at the same model settings. This was the largest measured single preparation change.
- At full resolution, 88 preceding frames of context improve the estimated missing-opacity proxy from 1.86 to 0.49, while average flicker barely changes.
- Warm full-resolution inference improves that proxy from 3.39 at half resolution to 0.49, but softens edges. Higher thin-structure energy can include texture/noise, not just hairs.
- Hard SAM support removes soft alpha in the hair region. Keep support masks distinct from fine-edge mattes.
- The five-frame repair reduces real-clip flow-compensated fluctuation by 32.5%, but also reduces thin-structure energy by 8.9%.

Inference was run by the worker, not rerun independently by the coordinator. Its port of the prior repair matched the retained outputs exactly according to its saved receipt. These isolation results improve the evidence, but do not generalize beyond this clip/model.

## What the references do and do not establish

The partial room plate is estimated from other frames of the same locked camera. An RVM-based exclusion mask chooses candidate empty-room samples. Similarity to that plate is useful evidence of a halo, but is **not proof that no low-contrast hair is present**. Coverage is only about one fifth of the hair boundary. The missing-opacity bound assumes the compositing/noise model and reliable plate estimates; avoid calling it an unconditional physical ground truth.

The known-alpha benchmark re-composites a presenter using an RVM-derived, sharpened matte, then compresses the result and processes it again. Alpha is known for this synthetic test, but the test is easier than natural fine curls and uses the same source. It is neither a manual annotation nor an independent footage benchmark.

On that synthetic test, the five-frame repair reduces temporal alpha error by only 4.5%, while yellow-background composite error gets slightly worse: 17.32 → 17.45 RGB codes. Do not describe 32.5% divided by 4.5% as a universal seven-fold correction: these are different metrics on real and constructed clips. The supported conclusion is that lower fluctuation alone cannot establish better compositing.

## Proposed repair and independently reproduced measurements

The proposed `clear_gated3` uses conservative room evidence to clear some opacity, applies a lower-bound correction, then a limited three-frame filter. It requires a fixed camera and background revealed elsewhere in the footage. It is not an automatic solution for arbitrary moving cameras.

| Measurement | Unfiltered full-resolution matte | Proposed repair |
|---|---:|---:|
| Real-room halo proxy, mean opacity-equivalent pixels | 87.79 | 45.84 |
| Same proxy during frames 24–53 | 116.22 | 45.33 |
| Real-room missing-opacity proxy | 0.495 | 0.148 |
| Synthetic false-opacity mass | 340.77 | 309.30 |
| Synthetic composite error on yellow, RGB codes | 17.32 | 16.96 |

The 48% real-room proxy reduction is **not** 48% overall hair accuracy. On the synthetic composite, the improvement is about 2%. All recomputed summary values agree with the worker's numbers within 0.0001. They reuse its plate, inference arrays and synthetic truth; the measurement code is independent, the reference data is not.

The synthetic matte resembles past truth more than future truth under the worker's lag indicator, including before filtering. This supports a model-origin lag problem in that benchmark. It does not establish exact lag in milliseconds or prove that no particular strand gains delay under filtering.

## Renderer and media checks

The coordinator freshly rendered 36 out-of-order samples across three cases: every PNG matches the saved sequential pass. Nine control edits change and restore the result, and a fresh mount reproduces it exactly. No page/resource errors. All 12 delivered MP4s decode and have their frame counts/rates recorded; two intentionally slowed diagnostic intervals are not full-length sequences. These are standalone EditableFrames renderer-host checks on one Mac, not app/exporter integration.

Selected stills were inspected. The concrete-side smoke is reduced, but faint wood-aligned fringes and ragged edges remain. A smear under the moving hand is visible and unaddressed. No normal-speed playback or audio listening acceptance is claimed; clips are silent.

## Revised route

1. Preserve losslessly decoded source frames before matting; do not introduce JPEG intermediates.
2. Keep recurrent context, inference scale and support-mask clipping explicit and test them separately.
3. Retain raw mattes and adjustable post-processing. Do not choose repair strength using flicker alone.
4. Offer the room-aware repair only for its fixed-camera, revealed-background case; uncertain room evidence must not erase plausible hair.
5. Test a stronger video-matting model against the same source and references, plus genuinely independent footage and annotated edges. The installed MobileNet model remains the main limitation in this study; stronger weights/runtime were not tested here.

The previous coordinator used linear-light compositing with fixed foreground RGB. This study uses encoded-sRGB canvas compositing and model foreground colours. Its 5.3× white/dark error ratio and the prior 7.7× alpha-edit sensitivity measure different quantities; neither replaces the other. Colour-space convention must be declared in comparisons. Keep both evidence sets and all failed repairs.

## Subsequent model comparison

The earlier stronger-model resource gap has now been exercised: [ResNet50 and ViTMatte comparison](hybrid-stronger-matting-2026-11-14.md). Neither earns adoption as a hair matte. The remaining acceptance gap is independent real-hair evidence and motion review, not merely access to larger weights.
