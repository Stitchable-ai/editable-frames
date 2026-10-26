# Local 3D Scene Studio

A standalone consumer of EditableFrames' spatial editing contracts, with two 12-second scenes: **The exchange** (two-person drama blocking) and **Mecha vs Titan** (procedural robot/giant-ape action). Scene geometry, motion and shot cuts remain ordinary authored Three.js code. There is no generation service or Blender dependency.

```sh
npm ci
npm run build:scene
npm run dev:scene
```

Open `http://127.0.0.1:4189`. The build also produces a self-contained `artifacts/scene-editor/scene-studio.html`; it works offline. Use the localhost server for browser persistence. The page checks that Web Locks and browser storage are usable. If either is unavailable or denied (including restricted local-file contexts), editing runs in memory: use **Download scene** before closing or reloading, and **Open scene** to restore that JSON. It never substitutes unlocked writes to shared browser storage. Downloaded JSON is tied to the source/assets binding that created it; keep the HTML and JSON together. A source rebuild can intentionally make an older snapshot incompatible.

## Try it

1. Select an actor or set from the object list, or click its visible geometry.
2. **W** moves along X/Y/Z arrows or planes; **E** rotates; **R** scales uniformly. Choose world/local axes. Red is X, green Y, blue Z. Grid uses 0.25 world/local-parent units, 15 degrees, and 0.1 authored scale units. Bounds take precedence over the grid. Scaling respects authored positive bounds; absent a positive minimum, its fallback floor is 0.001 or the smaller positive maximum.
   **Surface snap** is on by default for actors: release a move to settle the evaluated character's lowest geometry onto an admitted surface below (floor/table in the drama; ground, rubble or rooftops in battle). Lift above a table first to place an actor on it. Turn it off for floating/free placement. The final world-Y correction intentionally overrides the drag axis and grid height, keeps orientation, and commits with the move as one undo step. Exact numeric edits, stationary clicks, rotation, scale, lights, cameras and the combined set/floor are unaffected. Escape cancels both movement and snapping. The preference is frozen when the drag starts and resets to on when the page opens.
3. Right-drag orbits the independent director camera; Shift + right-drag pans; scroll dollies. **Use this view as shot** commits the view as the output camera. Editing a shot camera starts from its evaluated position, target and lens. A custom camera replaces the authored shot sequence; keyframe it for a custom camera move.
4. Select **Key light** for position, intensity and color. Select **Shot camera** for position, look-at target and FOV. Camera targets are numeric controls in this slice, not a second target gizmo.
5. Scrub the source-time timeline. Enable **Auto-key**, edit at one frame, then at another. Existing keyed properties continue editing their track even when Auto-key is off. Edits use the current source frame, with smooth temporal easing. Each released drag commits one reversible transaction; Escape discards the draft. Undo/redo and JSON retain history.
6. **Save reference PNG** captures an immutable committed revision through the authored/custom shot camera. Director navigation, selection, helper pixels and active gesture drafts are excluded. Capturing does not commit or cancel an active drag.

Surface placement uses nine downward probes across the visible posed bounding box, takes the highest upward-facing support they hit, starting 0.25 world units above the higher of the initial and dragged base. This catches downward drags through a floor while allowing only a small upward step from an initially grounded pose. A missing support or a correction outside control bounds leaves the dragged placement unchanged. It is approximate: thin features can fall between probes, wide bounding boxes can bridge gaps, and feet are not individually solved or aligned to slopes. Snapping acts at the current frame; it does not keep an animated character grounded at subsequent frames.

Actor transforms offset the authored motion. They do not re-solve hand contact, feet, collisions or combat choreography. These are blocking/reference scenes, not physical simulations or photorealistic film renders. The robot and ape are original procedural figures, not licensed franchise models.

## Optional local rigged characters

The public build uses original procedural stand-ins. To reuse authorized local models, supply a directory containing `Michelle.glb` and `Civilian.glb`:

```sh
node examples/scene-editor/build.mjs --assets /path/to/authorized/models
```

The supplied models are embedded into the local HTML, hashed into its source binding, and recorded in an ignored asset receipt. No model download occurs. External buffers/textures are refused; models must be self-contained. Rig names compatible with the example's authored arm solver enable its hand poses; other rigs still render but require an authored adapter for that posing. Supplying assets does not establish redistribution rights. Do not commit generated HTML or third-party models without their applicable rights and notices.

## Integration boundaries

- `packages/core/rotation.mjs`: normalized quaternion values and sign-invariant shortest-path interpolation, including deterministic 180-degree ties.
- `packages/core/spatial-session.mjs`: independent gesture-v2 negotiation, binding/operation key scopes, complete presentation identity, transient proposals, final-point evaluation, cancellation before publication and reconciliation after uncertain publication. Hosts own trusted admission and durable idempotent writes. Legacy gestures never receive v2 operations.
- `packages/three/spatial-editor.mjs`: pinned Three r180 facade, semantic handle hits, selection, separate helper scene and renderer-local proxies. It forwards no raw `Object3D` into saved state. Parent ancestry must be rigid or positively uniformly scaled; shear/reflection/nonuniform ancestry is refused.
- `packages/three/surface-snap.mjs`: optional visible-pose bounds and downward support probing. A Three adapter host supplies `surfaceTargets`, opts each movable binding into `surfaceSnap:true`, passes the toggle to `begin`, and requests `update(point,{final:true})` only for release. Targets must belong to the same frozen source presentation; external scene changes cancel the gesture. Selected descendants, hidden geometry and steep/underside faces are excluded.
- `packages/three/spatial-math.mjs`: explicit pivot conventions, parent conversion, axis/plane-preserving constraints, snap frame and positive scale saturation.
- `app.mjs`: host wiring to the existing Studio history and controls; local Web Locks plus a saved nonce prevent lost updates between cooperating tabs. JSON snapshots remain a separate download/import operation. This is not the general project server's file transaction API, a remote persistence service or a security sandbox.
- `cinema.mjs`: renderer-specific transient view capability and frozen-content capture. New renderer code can expose different bindings; these controls do not restrict drawable scene types.

Stitchable native gesture transport, renderer-host capability negotiation across IPC, the native Library importer and KDV presentation are still integration work. The existing generic editor retains its earlier controls/gesture behavior; the new spatial UI is opt-in through this consumer. Movie export UI, arbitrary skeleton posing/IK authoring, model downloading, multi-object transforms and automatic snapshot migration are not provided here.

## Verification

```sh
npm test
npm run test:scene
# Optional same browser suite with local rigged models:
EF_SCENE_ASSETS=/path/to/authorized/models npm run test:scene
```

The scene suite uses real browser mouse gestures for translation, rotation, scale and Escape; verifies keyframe interpolation, undo/redo, reload, light edits, camera continuity, clean capture during a draft, both scenes and disposal on switching. Core tests cover transformed-parent math, strict bounds, skinned picking, quaternion signs, negotiation, stale views, final evaluation and uncertain publication. It records local screenshots and reference PNGs under ignored `artifacts/scene-editor/`. Browser/renderer tests establish behavior on the tested browser/GPU, not cross-GPU pixel identity.
