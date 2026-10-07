# Changelog

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
