# Motion desk: AE-style controls proof of concept

Run `npm run dev:motion`, then open the printed loopback URL. This is a standalone HTML editor; it is not yet wired to Stitchable's KDV timeline. It imports no Remotion packages.

## Try it

1. Play **Trail / 3D device**. Change Rotation Y while playing. Auto-key inserts a source-frame key and playback continues.
2. Expand/select a property beneath the clip. Drag a diamond or type its frame/value. Choose Linear, Smooth, Hold or Bezier; drag either curve handle.
3. Switch the real iPhone model between iPhone 17 Pro, iPhone 12 and Pixel 6. The mapped procedural hiking screen follows the model. Models and HDR bytes are checked against their manifests. Geometry and screen calibration remain asset-specific adapters.
4. Select Camera to edit orbit, height, dolly and exposure. Select Screen to animate route reveal separately from the device.
5. Switch to **Orbit / graphic**. Drag a planet or headline in the preview. X/Y changes are one atomic history entry. The Canvas scene uses the same editor and command API as the Three.js scene.
6. Preview an agent edit, then change something manually before applying it: the stale proposal is rejected. Generate another proposal and apply it; its actor is recorded as `model`. This is a deterministic example proposal, not a connected model call.
7. Undo/redo. Save the project and open it again to restore edits and history. Browser storage also persists each study. A changed source binding refuses old saved studies; explicit migration/rebinding is not built into this editor yet.

## Direct object selection study

Click the actual headline or route callout in the preview: these are HTML elements
bound to stable anchors through `data-ef-anchor`, including clicks on their child
spans. The right panel selects that component and the tracks below the clip focus
on its properties. “Selected object only” can be turned off to see other lanes.
Click empty space or “V1 / Clip” to return to clip selection. Enter/Space activate
HTML objects; the object selector also reaches camera and invisible objects.

The phone uses Three raycasting against the currently visible GLB, not a fixed
rectangle. Clicking the screen selects `screen.route`; “Select device” selects its
parent `phone.hero`. Clicking the chassis directly also selects the phone. Bounds
follow model transforms and camera projection. Orbit uses circular/path picking,
so a planet's empty bounding-box corner does not select it. The framework core
still has no required DOM or 3D scene vocabulary: these are optional example adapters.

A click does not change the document revision or stop playback. A real 2D drag
pauses to author the gesture, then writes X/Y in one reversible batch. Inspector
edits during playback still continue playing. Selection borders and labels are
host overlays and are omitted from the clean PNG drawing path. HTML typography
in this study uses a Canvas counterpart for PNGs; this does not prove exact
DOM-to-pixel export parity for arbitrary CSS.

The study is one clip at a time. Native KDV selection needs clip-instance identity,
scoped sandbox messages, stale-frame rejection, nested coordinate transforms,
full clipping/mask/occlusion policy, and source-rebind handling. Those remain
acceptance work, as do multi-selection, all arbitrary DOM elements and 3D drag gizmos.
Unbound elements do not automatically acquire editable properties.

`examples/ae-controls/selection.mjs` contains the renderer-side coordinate, geometry
and visibility helpers. `tests/selection.test.mjs` tests letterboxing coordinates,
Canvas silhouettes/layer order, screen versus chassis, hidden and occluded geometry,
and projected bounds after parent/camera changes. These tests do not require a GPU.
The study binding covers its JS/dependencies plus HTML and CSS.

## The reusable API

`editableframes/animation` exports `editKeyframe`, `moveKeyframe`, `removeKeyframe`, `frameSeconds`, `validateEasing`, and `easeProgress`. The edit helpers return normal Studio commands; they do not mutate a document. Apply them with `studio.execute(command, baseRevision, actor)`. Existing `keyframes` commands, atomic batches, schema validation, history, undo/redo, save and restore are reused.

Keys address `(clip ID, stable anchor ID, property)` and carry **source seconds**, not timeline frame indices. A key's easing governs its outgoing segment. This differs from the old Stitchable parameter tracks, which use the arriving key's easing; a future importer must translate this deliberately. Do not rename the old structure and assume equivalence.

Cubic Bezier is represented by `{type: 'cubic-bezier', points: [x1,y1,x2,y2]}`. This implementation constrains all coordinates to [0,1], so it supports bounded temporal easing, not overshoot or spatial motion-path tangents. Sampling solves the Bezier time coordinate before reading its value coordinate. Old linear/smooth/hold keys still work.

The study runs at 30 fps; the core frame helper accepts rational rates. Clip source time remains explicit under trim and playback rate. There are no wall-clock-driven scene transforms, accumulated simulations or new scene primitives in core. Arbitrary future renderers remain free to consume sampled values. The screen's map drawing code is an example renderer, not a mandatory grammar.

The study's source/dependency hash changes on rebuild. The CLI runtime binding now also includes the animation module, and source snapshots retain that imported module beside core.mjs. Existing CLI projects need their normal explicit rebind after this runtime change.

## Honest scope

Implemented: per-object numeric tracks; add/move/delete keys; single-gesture undo; bounded temporal Bezier, hold and linear curves; live edits; camera/device/screen properties; 2D direct positioning; model swapping; presets; atomic agent proposals; local saved history; a source-bound standalone editor.

Not implemented by this PoC: native KDV track integration, the legacy `paramTracks` adapter, complete Remotion removal, full video export from this editor, arbitrary uploaded MP4s on the phone, web-page screen capture, multi-clip nested compositions, multi-key selection/ripple editing, property parenting, expressions, spatial Bezier tangents, quaternion interpolation, masks/mattes, motion blur, audio automation, GPU-independent output or large-project performance guarantees. Clean PNG download is a frame export, not a video export.

The reference Studio still clones documents during transactions and stores bounded patch history. It is not proof of a scalable hundreds-of-clips editor. Stage 2 must choose indexed track sampling, gesture transactions, host history ownership, source-time mapping, dependency identity, asset residency and preview/export parity before replacing the app's current path. This is evidence for that discussion, not a stage 2 migration plan.

## Validation

`npm run build:motion` then `node --test tests/animation.test.mjs` covers curve inversion/endpoints, old easing behavior, deterministic seeking, rational frames, trim/rate mapping, key collisions/deletion, atomic invalid-batch rejection, stale proposals, history restore and source-binding mismatch.

Browser checks on 2026-10-08 exercised real GLB loading, iPhone model swap, rotation changes during playback, numeric key retiming, diamond dragging, Bezier handle dragging, undo/redo and stale/valid agent proposals. Native Tauri integration and video export are not verified by these checks.

Before the selection extension, 32 Node regression tests passed, including importing a retained CLI core snapshot with its animation dependency; the public-source path/credential-pattern check and diff whitespace check pass. Browser verification also confirmed one atomic X/Y drag with undo/redo, Pixel 6 screen binding and restored history after reload. The browser automation did not receive a download event for the Save button, so the Save/Open file-picker round trip remains unverified; serialization/restoration is tested at the core level. No native app migration or video-export acceptance gate is closed by this result.

## When a Stitchable generation agent reports a blocker

A native `phone_3d`/`three_scene` generator and an EditableFrames control declaration do not prove the live KDV preview, timeline inspection or export tools have switched engines. Do not route a no-Remotion task through those legacy tools or pretend this study has made that cutover.

For an explicitly authorized standalone study, use this repo's Motion Desk example as the concrete renderer/editor reference. Lack of a built-in coin generator is not a prohibition on authored physics: code may calculate a seeded, explicit-time trajectory or replay a fixed-step simulation from a known initial state. Collision/settling fidelity and seeking must be tested, and isolated coin/floor approximations must not be described as a full interacting rigid-body engine. The current Motion Desk examples demonstrate the phone and graphic controls, not coin collisions.

For a native KDV deliverable, the missing work is the renderer-neutral create/preview/inspect/export path plus parameter-track sampling and its shared history bridge. That needs implementation in Stitchable; changing prompts or deleting package dependencies is insufficient. Existing legacy clip compatibility is no longer a user requirement, but the new path still needs its own verification.

Direct-selection browser checks on 2026-10-08 confirmed HTML headline selection,
scoped text editing/undo, a single X/Y drag transaction with undo/redo, selection
without stopping playback, 3D screen/parent/chassis selection, Pixel 6 swap,
selection after a 45-degree rotation, empty-space clip selection, keyboard Enter,
scene switching and Canvas silhouette picking at a 700px viewport. Native KDV,
nested scenes and the complete export pipeline are not verified by this study.

Current selection verification: all 37 Node tests pass, including five geometry/selection tests. The existing server test required loopback permission in the test environment. Public-source checks pass. Browser testing of the rebuilt canonical example also verified the real HTML callout, its generated property lane, edit/history restoration after reload and undo after reload; no console errors were recorded. Each source binding now uses a separate browser-storage key, preserving older study edits when the example is rebuilt.
