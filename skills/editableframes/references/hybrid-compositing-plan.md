# Reliable hybrid compositing and motion design

**Local acceptance follow-up (2026-11-13):** [snapshot preparation, full-clip masks, tracker counterexample and continuous lighting](hybrid-acceptance-round1-2026-11-13.md). No new generated take yet; camera solve (feature 6) and generated worlds (feature 13) remain untested.

**Scene staging decision (2026-11-13):** object–object, living thing–object and living thing–living thing interactions default to **stage → approved snapshot + reference images → joint video generation → editable finishing**. Independent masks do not create a coupled performance. See [workflow, evidence and remaining integration](interaction-staging-workflow.md). The latest pickup improved, but the snapshot handoff and broader interaction categories remain untested.

**Interaction policy, 2026-11-13:** generate intended human–object interaction as a reference-conditioned whole shot, including looking and pointing. Masking and non-overlap do not establish gaze, natural support, gesture or contact. Keep screen-space cards outside person holdouts. Unrelated avatar footage plus an independently placed product image is rejected for an interaction shot; the code compositor remains responsible for editable overlays and non-interacting layouts. This is a routing decision, not a new implemented renderer API.

Status: proposed next work, 2026-11-11. This is a design and acceptance plan, not an implemented API. It supersedes any inference that a successful render or a few attractive frames establish a usable hybrid clip. Existing primitives and their tested scope remain documented in [hybrid guide](hybrid.md).

Implementation update: the [prepared-media primitives](prepared-plates.md) now implement receipts, exact frame access, holdouts, corrections, cylinder/mesh replay and kinetic text. These mechanisms have synthetic regression coverage; the real-shot acceptance gates below still require full visual QA. Automatic geometry solving and production model selection remain research.

## What the failed shots teach us

| Observed failure | Diagnosis supported by the authored scenes | Required correction |
|---|---|---|
| A phone screen paints over a thumb, leaving a detached skin patch | The supplied matte loses the hand: foreground area drops from 12.44% at frame 59 to 0.18% at frame 60 and stays below 0.25% through frame 70. This is a missing foreground input, not just a rough edge. | Inspect plate, matte and composite together across the entire crossing; correct the subject track and correspondence, then refine its alpha edges. |
| Menu text crosses a person's forehead | The menu scene has no subject matte. Its footer is clipped at the board's lower boundary in the inspected frames. Screen blending preserves board texture but cannot infer who is in front. | Fit the entire animated layout within the actual surface, then clip it; protect the person with a foreground holdout. |
| An opaque price card erases the person's hair/head | There is no foreground holdout. Good planar tracking cannot fix layer order. | Treat all intersecting foreground subjects as required inputs. A plausible-looking board is not a passing result. |
| A hand appears sliced through an added can | The example inserts a second can at an offset from the tracked original. Relative depth with hand-tuned near/far is being used as if it were registered scene geometry. | First distinguish insertion from reskinning. For a hand known to be in front, use its coherent alpha as the foreground constraint. |
| A small labeled can sits over a larger generated can | Generating a world from a clay still did not preserve the product silhouette or proportions. | Reject the take for exact-object recomposition, or solve an explicit replacement workflow including removal of the original. Do not hide the mismatch with a smaller overlay. |

These clips fail final-quality acceptance. The phone's 121 matte frames were measured using decoded grayscale coverage above 127/255, with zero-based frame indices. The other failures were verified in sampled frames and the authored scenes, not an exhaustive pixel audit. Earlier tracking numbers remain measurements of tracking, not evidence of correct occlusion, placement, materials or whole-shot quality. No new implementation or corrected full-length video is claimed by this plan.

## Architecture decision: analyze, correct, cache, then render

Keep the core model-neutral. A host or optional analysis package produces versioned masks, tracks, surface mappings and diagnostic reports. An author can correct them. Preview and export consume the same immutable artifacts. No model runs implicitly inside `render(clock)` and no model weights become a mandatory library dependency.

Real-time compositing and real-time inference are different budgets. GPU/CPU acceleration can make preparation faster and enable interactive draft masks; it does not supply reliable geometry or physics by itself. Start with prepared per-frame data and GPU composition. Offer live draft inference only after profiling actual devices, with conspicuous provisional results and explicit promotion to a frozen render artifact.

Bilibili provides a concrete live-inference precedent: its 2024 web.dev case study describes on-device MediaPipe Selfie Segmenter, worker/offscreen processing, reduced-resolution masks and CSS `mask-image` for comments behind people. Its older W3C presentation also describes mask-based rendering. These demonstrate a person-silhouette feature, not hair-level export alpha or collision simulation. Our choice to freeze reviewed masks for export is an architectural recommendation, not a claim that Bilibili precomputes everything. These are published primary sources; no authenticated production reverse engineering was performed. [Bilibili case study](https://web.dev/case-studies/bilibili-web-ai-improvements), [W3C presentation](https://www.w3.org/2019/03/23-chinese-web-zhaoxin-bilibili.pdf)

### Proposed prepared-data contract

Extend the existing derived-asset relationship with a versioned manifest. Names below are proposed fields, not accepted CLI flags:

- Identity: source content digest, exact decoded dimensions/orientation/crop, frame count, rational time base and per-frame presentation timestamps; subject/surface IDs; model/checkpoint digest, preprocessing version and correction revision.
- Semantics: `subject-alpha`, `foreground-color` where available, `surface-coverage`, `surface-map`, `depth`, `confidence` and `validity`. A binary segmentation probability is not silently relabeled as an alpha matte. Foreground alpha is white for foreground; linear alpha/data is not color-managed as display RGB.
- Time: explicit source-frame correspondence and valid ranges. Plate, mask and track are fetched through one source-frame mapping, including trim, speed and reverse. Equal duration/FPS/count alone does not establish correspondence.
- Storage: bounded, chunked cache; stream/prefetch under the existing decoded-memory budget. Use lossless data for final alpha and sufficiently precise depth/maps; lossy MP4 is diagnostic input, not the canonical final data format.
- Failure: missing, stale, out-of-range, invalid or wrong-sized data fails final validation. Draft rendering can show the original plate plus a diagnostic. Never silently replace a missing holdout with an all-background mask, repeat a moving matte's last frame, or stretch a short matte to fit.

Changing source bytes, orientation, crop or interpretation invalidates dependent analysis. Changing only the timeline edit map reuses analysis through an explicitly verified remap. Text edits reuse approved geometry/alpha, but invalidate content-dependent layout and occlusion review if the visible region changes.

## Foreground preservation and layer order

Start with explicit relationships such as `person in front of title` and `hand in front of screen`. Scope a holdout to the affected layer/group; a hand protecting the phone need not hide a separate foreground caption. Validate cycles and contradictory depth/ordering constraints. Occlusion state can change over a shot, but that change needs a tracked spatial relationship or an authored interval, not unrelated per-pixel guesses.

For known foreground crossings, subject alpha owns the silhouette. Use temporally consistent, calibrated depth for ordering genuinely interleaved objects; raw per-frame normalized monocular depth must not slice fingers or faces. Depth confidence is separate from alpha confidence. One global foreground matte also cannot solve a hand that is simultaneously behind one object and in front of another.

The preparation workflow is prompted video segmentation → tracked identity → positive/negative corrections at difficult frames → temporal propagation → alpha refinement around hair/fingers/motion blur → review. Track through disappearance/reappearance; reset temporal state at cuts. Sudden area collapse triggers a review/re-seeding candidate, not blind automatic acceptance: genuine occlusion or leaving the frame can also shrink a subject. Preserve legitimate holes between fingers and never assume every disconnected component is an error. Do not blur consecutive masks indiscriminately: that creates lag and ghost hands.

Composite with explicit premultiplied-alpha and color-space conventions. Opaque protected interiors must preserve source pixels. At soft edges, copying `alpha × original plate` over a new background can retain the old background in hair and create a double edge. High-quality edge replacement requires decontaminated foreground color or a credible original-background estimate; document the approximation when those are absent. A soft mask alone does not prove a clean composite.

Add diagnostic views for source, subject alpha, surface coverage, correspondence, confidence, final composite and difference inside protected regions. Provide brush/polygon corrections and an event-range view. Start with people in front of a title/board, then a separately gated close-up hand correction workflow; a portrait matting model is not proven on isolated fingers.

## Four different placement operations

1. **Planar insert:** board or phone. Render animated artwork in surface coordinates, project it with the track, clip to surface coverage, then apply foreground visibility. Explicitly exclude the bezel and check the full animated text bounds.
2. **Reskin an existing rigid curved object:** select the original can, identify its body/silhouette and cap, estimate its pose/axis/radius and camera relationship, and fit a cylindrical UV or mesh mapping over time. Map the editable label into that surface; preserve lids, highlights, existing silhouette and contact shadow where appropriate. Reapply hand visibility. A featureless cylinder has ambiguous rotation; allow an authored seam/pose constraint and mark unobservable ranges.
3. **Replace or insert a 3D object:** requires explicit camera/scale/contact placement and foreground ordering. If replacing an object whose silhouette changes, remove the old object's exposed pixels and recover newly revealed background. Clean-plate/inpainting work is separate, reviewed, and cannot be substituted by an extra mesh on top. Added objects need their own shadows/reflections; reskinning normally retains the original contact evidence.
4. **Deforming surface:** cloth/skin needs a tracked mesh, dense UV correspondence or an atlas with visibility and disocclusion handling. A homography or cylinder is not sufficient. Start with a short cloth patch and a correction/import path; leave arbitrary bodies and loose folds experimental until tested.

No mask fixes an impossible placement: if the recorded hand sweeps through the volume of an inserted can, making the whole hand foreground only changes the visible contradiction. Move the insert to a collision-free location, choose another take, or regenerate blocking. Reskinning the existing can avoids creating that new volume. Preserving shading during a reskin also needs an appearance model: a simple multiply blend retains the old albedo and cannot freely change a dark label into a light one. Begin with a blank neutral can, fit a shading/specular residual, and document where exact material recovery is ambiguous.

Existing tools demonstrate the video surface-editing route. Mocha Pro documents PowerMesh-driven inserts, grid warps and tracked motion blur. Layered Neural Atlases learns per-shot mappings/alpha to propagate an atlas edit; CoDeF fits a canonical field and temporal deformation. These are evidence for feasibility, not drop-in real-time browser solutions or licenses to copy proprietary engines. [Mocha](https://borisfx.com/products/mocha-pro/), [Neural Atlases](https://layered-neural-atlases.github.io/), [CoDeF](https://qiuyu96.github.io/CoDeF/)

Lovart advertises texture generation and image editing. Its public page does not establish which model implements an observed wrap effect or that exact artwork can be transferred through video with temporal geometry guarantees. Use it as a visual reference, not an inferred backend architecture. [Lovart texture feature](https://www.lovart.ai/features/ai-3d-texture)

## Motion design is part of acceptance

Every authored example declares its attachment space and timing: screen-space graphic, surface-attached artwork, or world-space object with a camera. Surface-attached text inherits the observed perspective; world text requires a real solve or an explicitly labeled authored approximation. Static printed labels should remain attached naturally; expressive animation belongs in a reveal, digital display or surrounding title when the brief calls for it.

Deliver editable examples covering: staggered word/character reveals with readable holds; masked wipes and line draws; spring-like scale/rotation settles; text-on-path/orbits; tracked perspective titles; and a foreground-aware headline passing behind a person. Include at least one 3D/extruded or shader-treated title. Expose timing, stagger, easing, amplitude, path, typography, palette and attachment controls without restricting arbitrary renderer code.

All code motion is a deterministic function of explicit clip animation time and seeded parameters, with any source/timeline mapping authored explicitly. Analytic curves or baked simulation caches make reverse/random seeks reproducible; never integrate a spring from the previous requested frame. Paused Web Animations can be driven through `currentTime` rather than wall-clock playback. Load fonts before measurement and verify script shaping, fallback and localized wrapping. [Web Animations clock](https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime)

Compose the local animation before surface/camera projection, then visibility. Preserve the existing fixed `clock.mediaTime` for held footage/derived frames while code samples the shutter. Evaluate holdout against each code shutter sample so blurred letters cannot trail onto a protected face. This keeps correspondence; it does not reconstruct sub-frame subject motion absent from the plate. Label that physical limit and test moving masks rather than promising perfect motion-blurred edges.

## Candidate analysis runtimes and evidence

| Candidate | Intended role | Evidence and decision |
|---|---|---|
| SAM 2 / SAM 3.1 | Prompted object identity and temporal masks | SAM 2 code/checkpoints are Apache-2.0. SAM 3.1 is released, but uses SAM-specific terms and documented CUDA prerequisites; do not assume it runs in the target webview or inherits SAM 2's license. Neither automatically supplies hair alpha. [SAM 2](https://github.com/facebookresearch/sam2), [SAM 3](https://github.com/facebookresearch/sam3), [SAM license](https://github.com/facebookresearch/sam3/blob/main/LICENSE) |
| EdgeTAM | Optional lightweight tracked-mask candidate | Apache-2.0 code/checkpoints; upstream includes CoreML export and reports 16 FPS on iPhone 15 Pro Max. This is a segmentation benchmark, not a measured desktop export rate or alpha-quality guarantee. [Repository](https://github.com/facebookresearch/EdgeTAM) |
| Robust Video Matting | Human-alpha benchmark and candidate adapter | Temporal recurrence; upstream provides ONNX, CoreML and TF.js variants. Reported RTX 3090 HD throughput is 172 FPS with FP16, downsample ratio .25, batch/chunk 1, excluding the video conversion pipeline. This is not a measured app speed. GPL-3.0 requires a deliberate distribution/compliance decision; it is not a permissive drop-in. [RVM](https://github.com/PeterL1n/RobustVideoMatting) |
| MatAnyone family | Quality comparator for temporal matting | MatAnyone's S-Lab terms restrict ordinary use to non-commercial purposes; separately negotiate rights before commercial integration. Do not mistake a hosted listing for a redistribution grant. [License](https://github.com/pq-yang/MatAnyone/blob/main/LICENSE), [MatAnyone2 license](https://github.com/pq-yang/MatAnyone2/blob/main/LICENSE.txt) |
| Video Depth Anything Small | Coarse temporally coherent depth | Upstream Small is Apache-2.0, Base/Large CC-BY-NC-4.0. Pin the exact checkpoint and verify its terms. Relative depth still needs registration/calibration and cannot be the sole skin-edge matte. [Repository](https://github.com/DepthAnything/Video-Depth-Anything) |
| ONNX Runtime Web / native adapters | Optional execution backends | WebGPU where supported; WASM CPU fallback for validated small models. CoreML/native GPU candidates belong behind a host adapter. Probe operators, memory, webview support and seek/reset behavior; API support does not establish model portability. [ORT WebGPU](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html) |

No model is selected for distribution yet. Benchmark host-native and browser paths on actual Apple Silicon, Windows discrete/integrated GPU and CPU-only systems. Record decode + resize + inference + transfer + composition + encode, cold/warm latency, p50/p95, memory and energy, plus edge/temporal quality. Target cached 1080p playback at the project's 24/30 FPS; real-time inference is a measured optional tier, not a prerequisite for final export.

## Ordered milestones and release gates

| Phase | Deliverable | Exit evidence |
|---|---|---|
| H0 | Reclassify failed examples; retain originals; establish regression fixtures and source-frame annotations | Each reported failure has a reproducible source/mask/composite range; no production-ready badge on an unreviewed shot. |
| H1a | Versioned correspondence/validity contract, shared frame access, explicit per-group holdout, correction import; human foreground first | Person crossing board/title passes every crossing frame in preview and export; missing/stale/short data fails safely. Include one kinetic headline now. |
| H1b | Close-up hand segmentation, collapse detection and correction propagation | Thumb remains whole through entry, tap, lift and exit; all-frame correspondence, visibility and edge checks pass. Portrait-model success cannot waive this gate. |
| H2 | Rigid-cylinder surface mapping and appearance-preserving label wrap | One original can, correct scale and placement, readable exact label, no exposed duplicate body, hand fully coherent through the crossing. |
| H3 | Full kinetic typography examples and controls | At least three distinct treatments, random-seek/reverse/shutter checks, localization, readable holds and correct occlusion for every treatment. |
| H4 | Optional accelerated analysis adapters | Actual device/end-to-end benchmark plus license/checkpoint receipts; cached fallback remains usable. |
| H5 | Deformable meshes/atlases, calibrated 3D insertion and controlled generation | Separate experimental gates for cloth folds, camera/geometry consistency, clean background recovery and material fidelity. |

Use generated and filmed examples; static, pan/push and handheld; fast finger entry, loose hair, motion blur, full occlusion/reappearance, crops, reverse/retime, and missing frames. For short clips, inspect every decoded output frame in contact sheets and full-resolution crossing crops, plus normal/slow playback. For longer clips, automated all-frame checks and reviewed event ranges supplement a complete playback; disclose unreviewed frames. Three-frame checks are smoke tests only.

Proposed measurable gates: zero missing correspondence entries; no overlay pixels in annotated opaque foreground interiors before encoding; no detached/erased finger or head in any reviewed frame; measured boundary error on annotated events (target p95 ≤2 output pixels at 1080p, any >4 triggers correction); surface landmark drift and silhouette mismatch reported separately from tracker confidence; no unplanned subject-depth flips; layout bounds valid throughout animation. These are engineering targets to calibrate against annotations, not achieved benchmark results. Semi-transparent hair is evaluated with alpha/edge-color and temporal metrics, not a binary zero-overlap test. Flow-warp residuals, sudden area changes and components flag review, but cannot establish truth without annotations.

The acceptance report records exact revisions, frame ranges, assets, model/correction provenance, annotated failures, best and worst frames, the full playable clip, and separate **render correctness**, **analysis correctness**, **art direction** and **final usability** verdicts. An export that completes can still fail the shot.
