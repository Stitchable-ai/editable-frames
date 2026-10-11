---
name: editableframes
description: Create and refine code-generated video clips with clip-specific controls, reproducible frame rendering, and reversible edit history. Use for motion graphics, explainers, product demos, device mockups, or targeted edits to an EditableFrames clip.
---

# EditableFrames

Code owns the picture. Optional typed controls make details addressable; do not confine a new visual idea to the existing examples or a fixed JSON scene language.

Use `node <this-skill-directory>/scripts/editableframes.mjs help` to locate the installed CLI. It needs an EditableFrames checkout with `npm ci`. There is no hosted model service or API key requirement. Execute only source code trusted for the user's task.

For a new clip, run `init <empty-output-folder> --renderer`. Edit `clip.mjs` using a default `defineRenderer` export from `editableframes/renderer`. Read [references/renderer.md](references/renderer.md) before authoring; it includes a runnable scene and the exact controls/host contract. The renderer name is open, source code may use arbitrary locally available browser libraries, and controls are optional. Do not stop because the requested subject has no existing generator. Keep imports available locally, defer DOM work to `create`, and derive animation from `clock.frame / clock.fps` so repeated/backward seeks work. Read changing props inside `render`; they update without recreating the active scene.

Use stable control keys, paths, types, units and anchor/property IDs for details worth editing. Small changes use the generated panel or validated commands; larger style changes edit the source. Source changes invalidate the saved binding: `rebind <clip-folder>` validates compatible controls and retains edits/history. Use `--reset` only for an intentional incompatible replacement; it archives the prior project and starts from defaults. It is not a shortcut for preserving manual edits. The original `init` template and `--media` starter still work with their legacy renderer API.

For an existing clip, run `inspect <clip-folder>`. Use its exact `baseRevision`, clip ID, anchor and property in an `apply <clip-folder> <proposal.json>` command. A stale revision requires inspecting again, not bypassing the check. UI and agent edits share validation and history. `undo` and `redo` work across CLI invocations.

For object parent/child selection or authored direct manipulation, read [references/interaction-contract.md](references/interaction-contract.md). Keep rendering valid without controls; never claim a gesture consumer exists merely because metadata or a hook was declared.

For the command and renderer contract, read [references/authoring.md](references/authoring.md). For 3D device licensing, screen swaps and lighting, read [references/devices.md](references/devices.md).

Use `preview <clip-folder>` and inspect more than one meaningful frame. For an MP4, `render <clip-folder> <output.mp4>` needs Playwright Chromium and FFmpeg; report missing prerequisites directly. MP4 includes declared media-port audio; MOV exports ProRes 4444 alpha; `--format png` exports RGBA frames with WAV. Read [references/media.md](references/media.md) for embedded video, editable ports and transparency. Project-preview edits save to disk and share CLI history; standalone studies still download changes. Preserve source/project and output receipt alongside deliverables. Do not describe a test image or a browser preview as a completed video export.

The bundled `studio` has effect and creative studies plus the device library. Study their code when useful, while keeping new renderers free to use other libraries. EffectCraft's 306-entry map is research; only 24 scoped visual prototypes are demonstrated. Device assets keep their individual licenses and credits.
