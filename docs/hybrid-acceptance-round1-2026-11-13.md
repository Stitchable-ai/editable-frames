# Hybrid acceptance round 1 — 2026-11-13

Status: local experiments, no new generated take, no independent reviewer approval, no native-host integration claim. Existing generated footage and cached local models were reused. Hosted generation spending in this round: $0.

## Staged snapshot handoff

A seller/product scene now renders through the current renderer-host with editable product horizontal/vertical position, scale, image-plane rotation and an approximate foreshortening control. The headphones lie camera-left on the table, within reach of the presenter's hand, against a detailed warm-lamp/cool-window background. Repeated frame-zero captures are byte-identical in the tested browser; changing horizontal placement changes the PNG. Source, assets, controls and captured PNG are hashed into a local manifest.

This is a 2D reference composition, not solved 3D product orientation, contact or lighting. The snapshot plus separate product and presenter references has **not been submitted** to a model. The latest provider schema supports start-image plus references and explicitly numbers the start image before the references. The quoted 5-second 720p image-input trial is approximately $0.785 at $0.157/s; re-check pricing before submission. The previous video-edit pickup does not establish this round trip.

The earlier local Scene Studio suite passed 19 checks, including clean capture during active drafts and identical capture-button/programmatic outputs. An offline packet prototype exercised eight integrity cases. These do not replace real provider receipts, ambiguous-job recovery or native integration tests.

## Full-clip masking through a pickup

The complete previously generated pickup was processed: 121 frames, 24 fps, 5.0417 seconds. Source SHA256: `3b9aaf790d8f639eda5005808e08977ae951b0de05f8418c6f73acf66512d6cf`. Analysis resolution was 640×360; this is not 1080p boundary acceptance.

- SAM 2.1 Hiera Tiny on Apple Metal propagated separate person/product/gripping-hand prompts across every frame. Raw thresholded masks, no correction clicks or optional model postprocessing. Propagation plus saving took 136.67 s; steady-step median/p95 1.157/1.176 s; process peak RSS about 2.14 GB. These are preparation costs, not render FPS.
- RVM MobileNetV3 FP32 on CPU processed all 121 frames with continuous recurrent state, at 640×360 and downsample ratio 1. Wall time including saved foreground/alpha was 24.27 s. Some local workloads overlapped, so this is not an isolated hardware/model benchmark. RVM and SAM solve different problems.
- The comparison preserves the original table below y=277 and replaces the background above it with a bright yellow diagnostic field. Original contact and lighting remain baked. SAM binary edges visibly lose soft hair detail. RVM softens the hair but introduces background remnants below the arms; neither raw route is an automatic pass.
- A second candidate constrains RVM alpha with each frame's SAM person support: alpha is unchanged up to 3 pixels outside support, tapers to zero by 6 pixels, and the product is separately restored from its SAM mask. This reduces the observed spill. It can still clip hair missed by SAM and retains boundary defects; it is a heuristic requiring review, not ground-truth matting or physical depth.

Both comparisons export all 121 frames and repeat frame 48 with maximum RGB code difference zero in the tested browser. These are renderer checks. Sampled full-frame images and contact sheets were inspected; no annotated hair/hand error, full normal/slow playback approval, identity guarantee or production-quality badge is claimed. Whole-clip processing is broader evidence than the previous short interval, but not completion of the static/pan/handheld/multi-person stress matrix.

**Plan change:** keep semantic masks, foreground colour/alpha and support correction as separate, versioned preparation artifacts. Add whole-shot bright/dark edge checks and correction ranges. A successful segmentation job is insufficient for background-swap acceptance.

## Tracking: a negative forward/backward result

A new diagnostic reuses the synthetic stationary panel with independently moving surrounding texture. It runs the current tracker on the 49-frame clip forwards and on a losslessly re-encoded reversed clip, then compares corresponding returned quads.

Worst corner error against the known stationary panel: **6.861 px**. Maximum forward/backward disagreement: **0 px**. For 25 frames, actual error exceeds 4 px while correlation exceeds 0.95 and forward/backward disagreement is below 1 px. At the worst frame the score is 0.956. The motion is symmetric, making this a deliberately revealing case where both directions share the same wrong solution.

**Plan change:** forward/backward agreement is a diagnostic, never sufficient acceptance. Independent intended-surface boundaries, visibility and distributed target evidence are required; ambiguous/blank surfaces need correction or rejection. No production rejection algorithm was implemented here. The original missing S1/orbit footage remains unretested; this experiment does not establish its exact cause.

## Lighting: continuous controls and a representation boundary

A new 120-frame, 24 fps clip holds camera, geometry, exposure and authored scene frame fixed while continuously changing a practical lamp from warm to cool. The scene uses a scanned pastry, procedural cup/plate/lamp, and a photographed HDR panorama. It is a renderer diagnostic, not a real moving room or final advertisement. Lamp source colour, bulb emission and shade emission change together.

Matched warm/cool rectangular image regions show mean absolute RGB changes of 0.22/255 on the pastry, 5.74 on the cup and 24.96 on the table reflection. The tested upper-left photographed backdrop is byte-identical (0 change). These ROIs include some surrounding pixels and measure response, not material accuracy. Repeat-frame pixels match; no page errors were recorded.

**Plan change:** continuous editable colour/intensity is supported; named presets are starting values, not a finite lighting catalogue. Accept per-object light response separately from the bulb looking brighter. Light placement must serve the intended hero object; the weak pastry response is a failed stress target. A baked panorama, product photo or human video does not acquire physically correct new illumination merely because a 3D light was added. Keep that distinction explicit and test separate relighting routes for those representations. Ordinary-computer performance and mixed human/product emitter scenes remain open.

## Remaining order and numbering

1. Submit and inspect the actual staged snapshot plus references once a fresh spending cap is settled; then test object–object contact and two-person handoff separately.
2. Implement real handoff receipts, failure recovery, accepted-take import and source-bound analysis in the host. The local packet prototype is not that implementation.
3. Annotated full-resolution mask/alpha acceptance, disappearance/re-entry, multiple people and actual-device comparison. SAM 3 remains an access/runtime and comparison gate.
4. Independent-surface tracker rejection and repeatable real-footage visibility tests.
5. Stronger hero-object light response, mixed human/product emitters and additional actual computers.

**Feature item 6 (camera solve): not tested here. Feature item 13 (generated worlds): research only, not tested here.** Authored Three.js cameras, photographed HDR backdrops and homography tracking prove neither feature. The separate journey table also has an item 6, “many versions from one take”; that is a different, partially exercised editable-content journey. H5, feature 6 and feature 13 remain deferred under the prior scope decision, not silently completed.

Primary references: [Kling input and pricing documentation](https://replicate.com/kwaivgi/kling-v4.0), [SAM 2](https://github.com/facebookresearch/sam2), [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting). Measurements above come from local retained experiment receipts, not those references.
