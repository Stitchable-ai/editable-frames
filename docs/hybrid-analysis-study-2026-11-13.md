# Video segmentation and tracker study — 2026-11-13

Status: isolated feasibility tests and one tracker correctness fix. No new hosted generation, no production segmentation integration, and no new independent Fable approval. Existing generated clips were reused. H4 preparation and H6 reference-conditioned shots are the next work; general camera solving, deformable surfaces and generated 3D worlds remain deferred.

## SAM 2: actual Mac video tests

Official SAM 2.1 Hiera Tiny, code revision `2b90b9f5ceec907a1c18123530e92e794ad901a4`, checkpoint SHA-256 `7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69`. PyTorch 2.15.0, float32, four CPU threads, Apple Metal (MPS) on a 16 GiB Mac (`Mac18,5`); no NVIDIA GPU. Video/state storage offloaded to CPU. Optional model postprocessing disabled, so these are raw thresholded segmentation masks, not refined alpha.

Two contiguous intervals, each starting 3.5 seconds into an existing generated clip:

| Case | Frames / rate / decoded test size | Prompted instances | Propagation wall time | Steady-step median / p95 |
|---|---|---|---|---|
| Full-body pickup, Metal | 48 / 24 fps / 630 × 360 | Person, headphones, gripping hand | 50.78 s | 1.108 / 1.120 s |
| Seated talking gesture, Metal | 48 / 25 fps / 640 × 360 | Person, image-left hand, image-right hand | 53.08 s | 1.180 / 1.195 s |
| Pickup CPU fallback smoke test | First 8 / 24 fps / 630 × 360 | Same three prompts | 9.63 s | 1.350 / 1.739 s |

The model internally uses 1024 × 1024 input. Manual positive/negative clicks were supplied only on interval frame 0; no correction clicks were added afterwards. All requested frames produced masks for all three IDs. CPU and Metal binary masks were identical over the eight shared frames; this is a narrow observation, not a cross-device determinism promise. The CPU timing sample is too short for a robust hardware ranking. Propagation wall time includes saved outputs; steady-step measurements exclude file saving, include output transfer, and omit the first yielded frame. Model load, decode/initialization and prompt time are recorded separately in the local receipts. This is not end-to-end app export throughput.

Visual inspection of nine sampled overlays per clip found broad subject identity retained through lift/reach. The hand mask includes some wrist/sleeve and product boundaries need review. Binary masks cannot resolve fractional hair alpha, motion blur, edge colour contamination or the depth of individual fingers. Up to four pixels belonged to both product and hand masks in the pickup interval; this is an overlap diagnostic, not measured ground-truth error. No annotated boundary accuracy, real-time playback approval, complete original-clip review, multiple-person test or native preview/export parity is claimed. The historical failed phone-thumb sequence was not rerun.

**Decision:** SAM 2 is a viable optional preparation adapter on this Mac. Cache reviewed masks before playback; do not infer on every render/seek. This performance is far from real-time 24/25 fps and says nothing about ordinary Windows/Linux hardware. Keep manual corrections and a separate alpha-refinement step. A model probability/logit is not physical alpha.

## SAM 3: access and device gate, not a quality result

The official repository supports text/visual prompting and temporal instance tracking, with SAM 3.1 multiplex checkpoints also available. This makes it a relevant candidate for finding and following several subjects, not a proven matting or contact-physics solution. Its documented installation requires CUDA; the inspected `Sam3VideoPredictorMultiGPU` selects a CUDA device and checks CUDA GPU IDs. No native MPS video route was validated. The official checkpoint request returned HTTP 401 without accepted/authenticated access. No credentials were requested or exposed and no paid endpoint was called.

**Decision:** do not ship a SAM 3 default or claim a SAM 2-versus-SAM 3 accuracy winner. Next comparison requires an approved checkpoint and supported runtime, or an accessible hosted endpoint with a quoted capped test. Run the same retained source intervals, prompt identities and annotated boundary protocol. Check checkpoint-specific licensing before distribution; SAM 3 uses its own SAM license, not SAM 2's Apache assumption.

Primary sources: [SAM 2](https://github.com/facebookresearch/sam2), [SAM 3 installation and examples](https://github.com/facebookresearch/sam3), [SAM 3 video predictor](https://github.com/facebookresearch/sam3/blob/main/sam3/model/sam3_video_predictor.py).

## Preparation architecture

An image encoder/interactive decoder split is useful: cache heavy image features, then allow quick positive/negative point corrections. Video needs more than repeated image inference: memory propagation, stable instance IDs, cuts, disappearance/reappearance and correction-range invalidation. The model and checkpoint, preprocessing transform, source digest, frame mapping and correction revision must accompany cached data. Different models cannot share embeddings merely because tensor dimensions match.

Produce separate subject/hand/product masks, optional refined foreground colour and alpha, and explicit review ranges. A union person mask is insufficient for independent hands or multiple presenters. Keep semantic segmentation, fractional alpha, surface registration and depth order distinct. Stale or incomplete required intervals must fail final composition; never stretch a short mask or hold a moving tail to fit a requested duration. Preparing a cropped test interval does not certify the full source.

H6 can generate the whole shot and use these masks for editable titles, screen inserts and bounded colour adjustments. The masks do not separate baked light, recover hidden background or expose editable generated product geometry.

## Tracker anomalies: what is known

The original S1 board and filmed orbit source videos could not be found among the retained local assets after the earlier temporary-file loss. Their written measurements remain available; the following reproductions are deliberately new synthetic fixtures, not reruns of those shots.

1. **S1: about 8 px error at confidence ≥0.976.** The exact cause is still unconfirmed. The tracker fits one homography to a low-resolution patch that normally includes a 25% margin. Texture or lighting outside the target can dominate; a blank interior supplies little constraint. A stationary synthetic panel with independently moving surrounding texture reproduced 6.86 px corner error, confidence 0.956 and zero lost frames. With the same surround fixed, error was 0 px and confidence 1.0. A weak-border variant reached 6.86 px at 0.959. These demonstrate the failure mechanism, not the historical shot's cause.
2. **Orbit: switching to the next box face at confidence ≥0.703.** The original report says reducing the margin produced 43–124 lost frames because the selected panel was blank. This is consistent with competing planes entering the shared template. The code has no semantic face identity, visibility test or independent corner evidence: it accepts correlation ≥0.6 plus a broad finite-coordinate sanity check. The existing evidence supports a wrong-plane failure; it does not establish exactly which pixels drove the optimizer without the original source.

Normalized correlation measures appearance agreement, not corner accuracy, subject identity, rigidity or visibility. Raising the threshold alone cannot solve this: the synthetic failure passes even 0.95. A segmentation mask may constrain the target but cannot provide texture or recover metric pose. Face changes, out-of-plane rotation and full occlusion need explicit rejection/reseeding or a more capable tracker, rather than silently inheriting the next surface.

### Separate preparation-tracker correctness bug

The external preparation tracker (not an EditableFrames runtime service) returned its updated homography with correlation measured before the last update. In a one-step diagnostic the returned warp had correlation 0.978855 while the reported score was 0.618937. Re-scoring the final warp fixes that mismatch; a regression independently samples the returned transform and compares the score. Its 13 plate-tools tests pass; no tracker implementation is added to this rendering library. The moving-surround fixture still fails by 6.86 px after this fix: it is not presented as a repair of S1 or the orbit.

### Next acceptance gate

Preserve source-level repeats and add annotated corner trajectories, surface masks and visibility intervals for static/pan/orbit footage. Record per-corner residuals, support distribution, local boundary agreement and forward/backward consistency alongside correlation; none alone certifies correctness. Inspect every crossing and face transition. Require correction or rejection when the intended surface disappears or independent evidence disagrees. Do not freeze a confidently wrong overlay and call the shot passed. Broader tracker redesign remains pending these measurements.
