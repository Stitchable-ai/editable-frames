---
name: editableframes
description: Create and refine code-generated video clips with clip-specific controls, reproducible frame rendering, and reversible edit history. Use for motion graphics, explainers, product demos, device mockups, or targeted edits to an EditableFrames clip.
---

# EditableFrames

Code owns the picture. Optional typed controls make details addressable; do not confine a new visual idea to the existing examples or a fixed JSON scene language.

Use `node <this-skill-directory>/scripts/editableframes.mjs help` to locate the installed CLI. It needs an EditableFrames checkout with `npm ci`. There is no hosted model service or API key requirement. Execute only source code trusted for the user's task.

For a new clip, run `init <empty-output-folder>`. Edit its `clip.mjs` to implement the requested art and animation. Export `template` and `createRenderer(canvas)` as in the starter. Add stable anchor IDs and typed schemas for meaningful controllables such as camera, materials, typography, timing or screen content. Rendering receives explicit time; avoid wall-clock motion and unseeded randomness. Source changes invalidate the saved renderer binding: run `rebind <clip-folder>` for a compatible schema change, or `rebind <clip-folder> --reset` to use new defaults when the schema changes. Rebinding archives the prior project and snapshots the new code. Property edits do not need source regeneration.

For an existing clip, run `inspect <clip-folder>`. Use its exact `baseRevision`, clip ID, anchor and property in an `apply <clip-folder> <proposal.json>` command. A stale revision requires inspecting again, not bypassing the check. UI and agent edits share validation and history. `undo` and `redo` work across CLI invocations.

For the command and renderer contract, read [references/authoring.md](references/authoring.md). For 3D device licensing, screen swaps and lighting, read [references/devices.md](references/devices.md).

Use `preview <clip-folder>` and inspect more than one meaningful frame. For an MP4, `render <clip-folder> <output.mp4>` needs Playwright Chromium and FFmpeg; report missing prerequisites directly. MP4 includes declared media-port audio; MOV exports ProRes 4444 alpha; `--format png` exports RGBA frames with WAV. Read [references/media.md](references/media.md) for embedded video, editable ports and transparency. Project-preview edits save to disk and share CLI history; standalone studies still download changes. Preserve source/project and output receipt alongside deliverables. Do not describe a test image or a browser preview as a completed video export.

The bundled `studio` has effect and creative studies plus the device library. Study their code when useful, while keeping new renderers free to use other libraries. EffectCraft's 306-entry map is research; only 24 scoped visual prototypes are demonstrated. Device assets keep their individual licenses and credits.
