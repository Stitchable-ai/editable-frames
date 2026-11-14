# Stronger local matting: no replacement earned

2026-11-14 · MASK1 remains partial · no paid calls · research only

RVM ResNet50 and ViTMatte-S were tested on the retained generated presenter. Neither earns adoption as the hair matte. MobileNetV3 plus the conservative room-aware `clear_gated3` repair remains the preferred candidate for this shot, not a production-approved general solution. Larger models can remove unwanted background while also removing real-looking curls.

## What was tested

One 96-frame, 3.84-second excerpt at 1280×720, with lossless decoding and 88 frames of recurrent warm-up. ResNet50 used resolution ratios 1.0 and 0.5; ViTMatte-S used narrow and wide trimaps derived from MobileNet. The same room-aware repair was applied to new candidates. A second generation of the same fictional presenter is a distinct clip, not independent real-camera or different-hair evidence. No real hair alpha is annotated.

| Head-region proxy | MobileNet + repair | ResNet50 r1.0 + repair |
|---|---:|---:|
| Room-like opacity (lower preferred) | 45.8 | 28.8 |
| Missing-opacity bound (lower preferred) | 0.15 | 0.45 |
| Thin-structure energy (descriptor, not accuracy) | 336 | 191 |

These are model-assisted proxies. A pixel resembling the room does not prove hair is absent. The alternative reference built where neither network sees a subject is a useful sensitivity check, not an unbiased reference. ViTMatte cleans the concrete-side haze but softens the low-contrast curls against wood. No candidate improves both principal proxies over the current candidate.

## Why the synthetic ranking cannot select a model

The coordinator independently recomputed the white-background RGB error over all 96 frames using the saved alpha and foreground arrays, without the worker's scoring function:

| Constructed alpha source | MobileNet error | ResNet50 error |
|---|---:|---:|
| MobileNet-derived truth | 23.7510 | 24.6416 |
| ResNet-derived truth | 19.6987 | 18.9538 |

The ranking reverses. Both synthetic clips have sharper, easier boundaries derived from this same source footage. Use them to expose tradeoffs, not to claim which model extracts real curls best. Numbers use the experiment's encoded-sRGB composite convention and are not interchangeable with the earlier linear-light audit.

## Body cleanup is a separate candidate

Brightened source frames reveal a chair in much of the previously described hand-shadow smear. ResNet50 removes more of those chair fragments. The delivered hybrid keeps MobileNet + repair around the head and ResNet50 on the body. It is an inspectable experiment, not an adopted model setting.

The head region is fixed at pixels (440, 0)–(850, 330), with a 12 px alpha blend at its sides and lower boundary. Foreground RGB switches at the blend midpoint rather than blending continuously. Moving heads, colour seams, hair outside the region, and normal-speed playback remain unvalidated. Do not generalize this crop into automatic subject routing or claim it solves contact/interaction masking.

## Coordinator verification

- 36 fresh renderer samples across four cases match the worker's saved frame hashes exactly.
- All 13 control changes alter the picture and restore it exactly; a fresh mount matches, with no browser errors.
- Independent synthetic error recomputation matches all four reported values exactly.
- Saved CPU/MPS alpha comparisons were independently rechecked: maximum difference is one alpha code for MobileNet, ResNet50 and narrow ViTMatte. These are comparisons of saved inference outputs, not new inference runs.
- All 12 comparison MP4s fully decode with no errors.
- Selected full-frame and hair-crop stills were inspected. Neither reviewer watched normal-speed playback or listened to audio; the delivered comparisons are silent. This is standalone renderer verification on one Mac, not native-app/exporter verification.

## Performance and distribution boundary

Worker single-run inference measurements on this Mac: MobileNet 0.46 s/frame CPU and 0.050 s/frame MPS; ResNet50 0.69 and 0.129; ViTMatte including its guide 1.15 and 0.27. These exclude the complete compositing/export pipeline and do not establish performance on ordinary PCs.

The retained provenance records identify RVM as GPL-3.0, and ViTMatte's model card as Apache-2.0 with MIT code; training-data terms still need review before distribution. RVM's published runtime instructions do not document MPS; it was experimentally exercised here. No weights or model runtime are added to the library by this update.

The worker downloaded about 227 MB and retained about 3,008 MiB of evidence. One initial library call wrote a one-byte Hugging Face cache version marker outside the study directory; later calls confined caches to the study. Nothing was deleted.

## Next acceptance gate

Obtain consented real footage with a known backing or annotated alpha on representative frames, including different hair and a moving camera/background. Compare lost detail, false opacity, temporal lag and normal-speed replacement-room playback together. The present bottleneck is independent evidence, not inference speed. A subject-memory video matting model is an untested future candidate requiring runtime and distribution review; downloading another model alone would not close MASK1.

The dashboard retains the larger-model failures, fine-curl and haze crops, chair cleanup, fixed-region hybrid, full-frame comparisons, source, model provenance and both verification records. No whole research item is closed by this study.
