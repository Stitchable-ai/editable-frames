# EditableFrames 0.1.0-beta.1

Code the motion. Keep the control.

EditableFrames is an open-source framework for code-generated video with optional per-clip editing panels and reversible edits. Built by [Stitchable](https://stitchable.ai), the parent company behind [Stitchable Pro Studio](https://stitchable.ai).

This first beta includes:

- Stable editable anchors, validated commands, keyframes, undo/redo and revision-checked project persistence.
- A model-neutral CLI and shared agent skill, plus 11 creative film studies and 24 scoped effects with six composed looks.
- Editable embedded-video/audio ports, hash-pinned assets and explicit source time.
- MP4 with audio, transparent ProRes 4444 MOV, and RGBA PNG sequences with WAV.
- A self-contained Astro website with 12 editable studies, including real-phone swaps and product demo controls. Cloudflare deployment setup is documented; production domain availability is verified separately.
- A 55-model device catalog, five starter GLBs in the source tree, and the complete device pack attached to this release.

Read the README for setup and demos. Browser rendering requires Playwright Chromium and FFmpeg. Use the attached checksum and pack receipt to verify the full device pack; original asset licenses and credits travel with the pack.

Beta scope: trusted local code, provisional APIs, bounded local media decoding and static audio controls. This release does not include the Stitchable app migration, an untrusted-code sandbox, or production-scale streaming decode. The creative studies and device viewer are not all unified CLI export templates yet. See `docs/beta.md` and `NOTICE.md` in the source.

Validation: the framework, website and rendering regression checks passed on Ubuntu 24.04 in [GitHub Actions](https://github.com/Stitchable-ai/editable-frames/actions/runs/37670908538). The repeated grain-frame regression produced identical pixels in all three passes.
