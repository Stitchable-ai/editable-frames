# Changelog

## Unreleased

Hybrid scenes: code-rendered elements composited with filmed or generated footage. See [hybrid scenes](docs/hybrid-scenes.md).

- Add derived assets: a matte, depth map, normals, track, camera path or environment is pinned to the hash of the footage it was computed from. A replaced take, a second asset for one role, or a derived video with a different frame count is refused. `asset-add` gains `--role`, `--of` and depth-encoding flags; JSON `data` assets are accepted.
- Add `editableframes/plate`: corner-pin homographies, track and camera-path sampling, frame-rate conform and cadence, depth encodings, plate measurements (levels, light direction, noise), seeded grain, object-id colours and shutter sampling.
- Add `editableframes/three-plate`: depth occlusion by the footage, matte hold-out, lighting from the footage, camera-path replay, a shadow catcher and clay/depth/normal/id/matte passes.
- Add optional `mediaInfo` and `derived` renderer services, declared control passes (`passes`, `clock.pass`) and `render --pass`.
- Add shutter motion blur at export: `render --motion-blur ANGLE [--samples N]`.
- Add `init --hybrid`, a starter with a synthetic plate, and `npm run test:hybrid`.
- Document a trial of the hybrid helpers on generated footage, and how to conform mattes and depth maps made by other tools.
- The hybrid starter lights its can from the footage at environment intensity 1 (was 1.5, set while half of the panorama was empty), with aluminium lids at aluminium's reflectance. Measured against real cans in generated plates.
- Fix video frames looked up one frame early: media preparation read frame times as six-decimal seconds, so frame 1 of a 24 fps clip (0.041667) seemed to start after 1/24 s and a third of the frames of any 24 or 30 fps clip showed their predecessor. Frame times are now exact ticks in the stream's time base.
- Fix transparent DOM-root exports capturing the preview page's own header through the scene. Any transparent renderer export smaller than the header area was affected.

Runtime files changed, so existing projects need their normal `rebind`.

## 0.1.0-beta.1 — 2026-10-07

First beta for trusted local-code projects. No remote publication is implied.

- Persist browser edits through the same revision-checked project store as CLI edits; preserve undo/redo after reload and reject conflicting proposals.
- Add immutable media imports, asset hashes, source-PTS frame indexes, bounded image caches and frozen render snapshots.
- Add editable embedded-video/audio ports, source trims/delays/rates, audio mixing and PCM-backed preview playback.
- Share whole-project/selected-clip rendering with layer transforms, opacity, optional caption objects and explicit source time.
- Export MP4 with audio, transparent ProRes 4444 MOV and RGBA PNG sequences with WAV; preserve rational frame rates and record source/runtime/browser/encoder provenance.
- Add cancellation and no-overwrite output publishing, HTTP Range serving and guarded loopback editing.
- Support conditional controls, numeric macros and presets in generated panels.
- Fix playback's initial negative time delta, cache-budget validation and history cursor mutation before a failed replay.
- Add a synthetic media starter, automated beta integration suite and updated agent skill/reference.

See [beta scope](docs/beta.md) for prerequisites, alpha project rebinding, measured acceptance tests and remaining host-integration work. This release does not supply an untrusted-code sandbox, production streaming decoder, all-device screen calibration or the Stitchable v0.4.1 migration.
