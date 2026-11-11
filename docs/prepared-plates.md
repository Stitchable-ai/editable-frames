# Prepared foreground and surface artwork

The plate utilities now include versioned analysis receipts, explicit source-frame sampling, foreground holdouts, source-space corrections, cylinder/mesh artwork mapping and deterministic kinetic text. These are rendering and authoring primitives. Real footage still requires a reviewed subject mask and surface track; model success does not certify either.

## Frozen analysis

`validatePreparedAnalysis(receipt, sourceInfo)` checks source content identity, decoded raster, rational frame rate, presentation times, correspondence, mask identity, correction revision and preparation provenance. A receipt has `version:1`, `kind:"prepared-plate"`, `source`, `alpha`, `subject`, `revision`, `provenance` and one entry per source frame in `frames`. Each entry contains `sourceFrame`, `maskFrame`, `valid`, `reviewed` and optional diagnostic `issues`.

`preparedFrame(receipt, seconds, {start, speed})` maps explicit clip time to a source frame, including trim and reverse. Final sampling rejects unreviewed, invalid and out-of-range data. Correction tools can explicitly opt into draft sampling with `requireReviewed:false, allowInvalid:true`; this is not export approval. Missing data never repeats its last frame.

Import a receipt as a data asset with `--role analysis --of plate`, and its explicit-alpha media with `--role alpha --of plate`. `--subject ID` distinguishes derived assets for multiple subjects. `derived(plate, role, subject)` resolves that subject; the original two-argument form still resolves an unqualified role. The CLI verifies content hashes, while media preparation checks the receipt against the actual decoded plate and mask.

The optional `sourceFrame(id, index, info)` host service returns the exact decoded frame. Prepared media uses indices even when lossless container timestamps have different precision. `mediaInfo` includes digest and presentation times. Existing `mediaFrame` calls on derived videos now follow the parent plate's frame index.

## Foreground and corrections

`createForegroundHoldout({root,width,height})` creates a child `root` for the affected code layers. Call `update(decodedMask,{channel,frame,...})` before capturing. `channel` is `alpha` or `luminance`; missing or wrong-sized masks throw. An uncorrected explicit-alpha image uses CSS GPU masking where supported. Luminance masks and live corrections use the CPU fallback. No model runs inside the renderer.

Correction books bind `sourceSha256`, `subject` and increasing frame keys. Each key has polygons with `operation:"add"|"subtract"|"replace"` and source-raster `points`. `interpolation:"linear"` propagates only between matching polygon keys; it never extrapolates beyond them. `createMaskCorrectionSession` turns renderer gestures into immutable book proposals. The host applies revision checks and Undo. Re-prepare and review the corrected result before final export.

`analyzeMask` reports coverage, bounds and collapse flags without deleting components. `foregroundLeakage` measures changed pixels inside an annotated opaque foreground. `diagnosticMask()` exposes the current subject coverage as a green overlay for a source/mask review view. These diagnostics flag work to review; they do not infer ground truth.

## Surface mapping and motion

`cylinderMesh` maps a label to an authored/tracked projected body quad. It preserves that body's screen bounds; the seam is an author control when a blank cylinder makes rotation unobservable. `sampleSurface` accepts externally tracked deforming UV meshes. `drawSurfaceArtwork` rasterizes UV triangles without translucent clip seams. `relightArtwork` preserves observed shading under a specified neutral-albedo assumption. Arbitrary old printing requires a separate clean albedo/shading estimate.

The [surface example](../examples/hybrid-surfaces/clip.mjs) combines exact source frames, a selected original body, foreground protection, editable labeling and a motion headline. Supply assets named `plate`, `foreground`, `analysis` and `track`, or pass a prepared receipt/track and declared source/mask IDs as props. The body track must describe the original object's body, excluding lids, rims and background.

`createKineticText` and `typeMotion` provide staggered rise, wipe, spring-like settle, orbit and CSS extrusion treatments. Timing, text, stagger, easing treatment and displacement are explicit inputs; random/reverse seeks reproduce the same state. Character splitting uses grapheme clusters where available. Font readiness and surface safe-area checks remain part of layout acceptance.

## Verification and limits

`npm run test:prepared` checks real pixels through the CLI: all protected opaque interiors survive every frame of an animated crossing, using both alpha and luminance paths, and missing masks reject capture. `tests/hybrid-prepared.test.mjs` checks identity, correspondence, reverse seeks, correction history, layout overflow and seam-free UV coverage.

The primitives do not solve a camera, infer cloth geometry, remove an old object or recover uncontaminated hair colors automatically. The mesh and camera import paths accept externally prepared data. A physically impossible insertion still needs changed blocking or a different plate. The [delivery plan](hybrid-compositing-plan.md) retains separate quality gates for these tasks; device performance and real-shot usability require measurement.
