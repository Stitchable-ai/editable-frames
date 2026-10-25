# Editable 3D scenes: requirements and implementation design

Status: **standalone implementation available; native host integration pending**.
The [Scene Studio example](../examples/scene-editor/README.md) implements an opt-in
Three.js editor with spatial controls, keyframes, reversible transforms, local
persistence and committed-state reference capture. The reusable core/adapter
modules are included. Native Stitchable transport, Library and KDV integration
remain pending; this document is the full target contract, not a claim that every
host acceptance fixture has shipped. The baseline source audit below describes
EditableFrames `27f26c9158dc87b729d554dae9accba7e293ab44` (2026-10-26), before this PR.

## 1. Outcome and scope

A person selects an exposed character, prop, camera or light, moves it with
**X/Y/Z arrows**, adjusts its orientation and size, and sees the result without
regenerating scene code. The inspector, viewport and agent edit the same declared
values through the same revision-checked history. Existing screen-plane dragging,
uniform resize, object selection, numeric controls and animation tracks continue
to work. A scene without spatial bindings remains fully renderable.

The initial use cases are drama blocking with rigged characters, action blocking
with procedural figures, and product/set composition. These scenes may later
supply still or motion references to video generation. Editing must work locally
without a model call, account, paid service or Blender installation.

Required scope is object placement, rotation, uniform scale, scene cameras and
lights. Character root placement is required; arbitrary skeletal posing, walking,
retargeting, full-body IK, physical contact and simulation are separate extensions.
A hand target can use the same spatial interface when an authored solver exists;
exposing a target does not supply that solver. Mesh modelling, rig construction,
multi-object transforms, animated reparenting and negative/nonuniform scale are
not initial release requirements.

## 2. What exists and what must change

These are verified **baseline** source observations, before the implementation in this PR:

- [Controls](../packages/core/controls.mjs) support typed fields, stable bindings,
  units and animation. Spatial roles are limited to position (`vec3`) and positive
  scalar scale. The normalizer accepts controls version 1 only; rotations are not
  a spatial role. [Core sampling](../packages/core/index.mjs) interpolates vec3
  components; it does not provide quaternion rotation tracks through portable controls.
- [Object metadata](../packages/core/objects.mjs) supplies a semantic hierarchy,
  pivots and inherited selection policy. This hierarchy is **not** the Three.js
  transform hierarchy. [The current spatial adapter](../packages/core/manipulation.mjs)
  picks projected rectangles in reverse binding order; this is insufficient for
  occluded 3D geometry.
- [The Three helper](../packages/three/manipulation.mjs) freezes a camera-facing
  plane and converts pointer intersections to parent-local coordinates. It is a
  useful screen-plane move/resize helper, not an axis-constrained gizmo. Its
  projected Box3 bounds need special treatment for behind-camera/near-plane cases.
- [Gesture sessions](../packages/core/interaction.mjs) already validate bounded,
  sparse absolute proposals, selected-anchor bindings and revisions. The Studio
  consumer produces one reversible batch. However, `gestureEvent` currently maps
  every operation except `resize` to `move`: new operations must not pass through
  that legacy coercion.
- [The portable mount](../packages/runtime/renderer-host.mjs) forwards `pick` and
  `gesture`, but does not expose the full bounds/capabilities/edit-overlay surface.
  [The interaction contract](interaction-contract.md) explicitly does not claim a
  universal drag widget in the portable editor. Both the framework host and native
  host require implementation, not just a new scene helper.
- [The package](../package.json) pins Three.js **0.180.0**. The inspected Stitchable
  integration uses **0.170.0**, a vendored framework snapshot, admitted libraries
  and its own gesture transport. This is a consumer compatibility observation,
  not a new framework dependency; verify it again when implementing that consumer.

## 3. User-visible requirements

### R1. Selection and coexistence

Select an authored object by mesh hit or object list. A mesh maps to a stable
anchor, never a generated Three UUID, mesh index or ambiguous node name. Selecting
any body part normally selects the character placement root; optional pose handles
are a distinct mode. Support selection of lights and cameras through editor-only
icons and the object list. Honour inherited hidden/locked selection policy.

Keep the existing 2D clip-level transform handles distinct from scene-object
handles. Object mode offers Translate, Rotate and Scale only when the selected
binding implements them. Retain screen-plane dragging as an explicit affordance.
Selection, changing modes and viewing the scene must not create keys or history.
The inspector remains usable when a gizmo is unavailable and explains why.

### R2. Translation, rotation and scale

Translation shows labelled X/Y/Z arrows, with conventional red/green/blue colours
and labels so colour is not the only cue. Offer XY/XZ/YZ plane handles, world/local
axis orientation, numeric entry, keyboard adjustment, optional snapping and reset.
A Z drag must actually change scene depth; a decorative overlay is not sufficient.

Rotation uses axis rings and numeric angles. Uniform scale uses a distinct handle;
its positive scalar meaning stays compatible with existing scenes. Do not display
axis stretch handles when only uniform scale is supported. Keep handles legible
across zoom levels with a bounded screen size. Show active axis, value and units.
Snap increments and numeric precision are host preferences, not hardcoded metres.

Use one selected object initially. Clicking a gizmo takes priority over object
selection and camera navigation. Escape and unexpected capture loss cancel before
publication; normal capture loss after release follows the finalization rules in
§5D. Never leave an invisible or occluded handle intercepting input.

### R3. Cameras, lighting and scene editing

Separate **editor view** from **shot camera**. Orbit/pan/dolly in editor view changes
no authored property and no export. Provide Return to shot and an explicit Use
this view as shot action, which commits supported camera fields atomically.
Manipulating a shot camera from another editor view uses its own selectable proxy.
Navigation and object manipulation cannot own the same pointer simultaneously.
Navigation requires an opt-in renderer capability for transient view state,
separate from authored props. Subject rendering, helpers, picking and constraints
must use the same accepted editor camera and viewport. A view change requests a
render even at unchanged source time; it invalidates outstanding picks. Renderers
without this capability remain renderable and report navigation as unsupported.

Expose declared camera position, orientation OR look-at target, perspective FOV
(or orthographic size), and relevant clipping bounds. Do not simultaneously drive
orientation and look-at with conflicting controls. Focal length needs an explicit
film/sensor convention; avoid an unexplained conversion from FOV. Camera changes
must update projection matrices and reproduce in exports at the same source time.

Expose declared light position, target/direction, colour, intensity and appropriate
shadow/shape parameters. A point light has no useful aim control; an environment
light has no useful position arrow. Renderer-specific intensity units and colour
handling must be labelled. Camera/light target controls that must change together
should share one semantic anchor so single-anchor validation can commit them
atomically. Initially there is one placement gizmo binding per anchor; aim targets
may remain numeric controls. Additional target gizmos need explicit binding IDs
and control-key mappings, not another ambiguous position role. Props, backgrounds
and additional characters reuse the object contract rather than a fixed catalogue.

### R4. Animation and history

Freeze the child-confirmed painted presentation when a drag is admitted. It
identifies renderer instance, document/source revision, source clock, active shot,
editor-view revision and viewport-mapping revision. Rendering, picking, handle
hit-testing and gesture initialization must agree on that presentation. Freeze its
editor-camera pose/projection separately from the authored shot camera, plus parent
transform, pivot and sampled authoring values. Suspend navigation, including
inertia, during manipulation. External view/mapping changes invalidate the gesture. Unanimated
fields with Auto-key off change the base value; an animated field or Auto-key on
inserts/updates the source-time key, preserving existing easing and rational timing.
Follow [current key timing](object-manipulation.md); do not write object motion to
outer clip transform tracks. One completed drag is one undo entry, no matter how
many pointer updates arrive. A no-op produces no entry. Cancellation before the
publication boundary produces no entry; after it, reconcile the outcome (§5D).

After edits, backward/random seeks and export must evaluate from source time and
saved controls, without accumulating pointer deltas or animation playback state.
Cancel before publication on a camera cut, seek, source rebind, selected-object
replacement, viewport mapping change or conflicting writer. Do not silently rebase
a gesture; after publication begins, report its authoritative outcome.

## 4. Proposed portable interfaces

The following is an **API sketch, not valid current v1 syntax**. Final naming can
change. The requirements are explicit negotiation, typed bindings and bounded data.

```js
// Proposed controls v2: preserve v1 as a supported input format.
controls: {
  version: 2,
  objects: [{id: 'actor', label: 'Actor', pivot: [0, 0, 0]}],
  fields: [
    {key: 'actor.position', anchor: 'actor', property: 'position',
      path: '/actor/position', type: 'vec3', role: 'position',
      coordinateSpace: 'local', unit: 'world-unit', animatable: true},
    {key: 'actor.orientation', anchor: 'actor', property: 'orientation',
      path: '/actor/orientation', type: 'quaternion', role: 'rotation',
      coordinateSpace: 'local', animatable: true, interpolation: 'slerp'},
    {key: 'actor.scale', anchor: 'actor', property: 'scale',
      path: '/actor/scale', type: 'number', role: 'scale',
      min: 0.001, animatable: true}
  ]
}

// Proposed adapter capabilities: independent of controls schema version.
spatialCapabilities({anchor: 'actor', presentationId}) // =>
({gestureProtocols: [2], bindings: [{id: 'placement', operations: {
  translate: {handles: ['x','y','z','xy','xz','yz','screen'],
    spaces: ['world','local'], keys: ['actor.position']},
  rotate: {handles: ['x','y','z'], spaces: ['world','local'],
    keys: ['actor.orientation']},
  scale: {handles: ['uniform'], spaces: ['local'], keys: ['actor.scale']}
}}]})

// New fields extend the existing begin/update/commit/cancel envelope.
// The host retains its admission, identity and ordered response state.
gesture({version: 2, phase: 'update', id, anchor: 'actor',
  bindingId: 'placement', operation: 'translate', handle: 'z', space: 'world',
  start, point, clock}) // => {values: {'actor.position': [1, 0, 2]}}
```

Renderer protocol, controls schema and gesture protocol are **independent**.
Controls-v1 scenes can use a v2 manipulation adapter; new quaternion fields require
a controls schema that understands them. Before admission, every intervening host,
transport and adapter must explicitly support the selected gesture protocol.
Missing negotiation means legacy-only: send only existing move/resize envelopes on
that path. Never probe v2 operations through the legacy normalizer. A v2-only
adapter rejects unversioned input. Unsupported combinations leave saved state
unchanged; old hosts reject unsupported schemas without resetting history.

Keep identity and authority outside authored code. Validate and freeze the binding,
operation, handle, space, permitted control keys and snapping configuration at
admission. Revalidate them before publication. A translate proposal cannot alter
rotation or another field just because it shares the anchor. Coupled transforms
must explicitly declare all permitted keys and publish atomically. Capability
advertisements and renderer hit results are proposals, not write authorization.

The edit surface also needs a versioned handle-hit query, for example
`hitTestHandle({point, presentationId}) -> {anchor, bindingId, operation, handle}`.
Only bounded semantic data crosses the host bridge. The host checks it against
the current capabilities and accepted presentation; stale results are discarded.
A busy/replaced renderer is distinct from a confirmed empty hit. Expose disabled
reasons for unsupported transforms. Presentation IDs are host-generated correlation
values; neither they nor a renderer message grant permission to commit.

The optional runtime view/overlay service must deliver transient view state to
subject rendering as well as the adapter; it supplies an editor-only surface and
invalidates it with the same presentation. It is absent during content capture.
The exact facade is a spike deliverable, but both host implementations must share
these semantics. Existing content rendering remains usable without that service.

Add normalized quaternion validation and sampling through the control normalizer,
core value type, template mapping, keyframes, inspector, serialization and consumers.
Use `[x,y,z,w]` unit quaternions, finite/nonzero validation, documented tolerance,
shortest-path spherical interpolation and sign-equivalence-aware no-op comparison.
Euler degrees are an inspector presentation with an explicit order; do not
component-interpolate them as if they were ordinary positions. Preserve deliberate
multi-turn animation through a separate authored angle/spin control; shortest-path
quaternions alone cannot encode winding. [Three quaternion reference](https://threejs.org/docs/pages/Quaternion.html).

Sampling must be invariant under negating either endpoint. At an exact zero-dot
(180-degree) tie, choose representatives whose first nonzero component in
`[w,x,y,z]` is positive before interpolation; otherwise choose the shortest
hemisphere. Apply existing temporal easing to the interpolation parameter. Do not
rewrite a track for a sign-only no-op. Test intermediate orientations for all four
endpoint-sign combinations, not only equality at the keys.

Separate **persistent spatial-semantics identity** from **transient binding
generation**. The persistent identity is deterministic across mounts and includes
authored mappings, units and transform/pivot conventions; it excludes runtime
instance IDs and generation counters. Preserve legacy v1 identity and history;
opening a project does not implicitly migrate it. Incompatible authored semantics
require explicit migration/reset, while remounting alone never does.

The host captures transient binding generation at admission and checks it when
accepting results and immediately before publication. Replacing the bound root,
camera object or conversion mapping invalidates that generation; ordinary draft
repaints do not. View-pose changes separately invalidate presentation identity.
Existing component rounding must not invalidate unit quaternions: normalize after
permitted rounding, and compare orientations rather than raw component signs.

A runtime-only Three adapter binds an anchor to its editable root, camera, picking
objects and conversions between rendered transforms and declared controls. Persist
only values/metadata; never serialize Object3D instances, callbacks or DOM nodes.
The same contract must remain implementable by other renderers.

## 5. How to implement the gizmo without breaking editing

### A. Reuse Three geometry and interaction through a controlled adapter

Evaluate pinned Three `TransformControls` as the gizmo engine, not a second source
of project state. Its documented features include translate/rotate/scale modes,
local/world space, snapping and `getHelper()`. `OrbitControls` supplies editor-view
navigation. These do not supply EditableFrames history or authorization.
[TransformControls](https://threejs.org/docs/pages/TransformControls.html),
[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).

Attach the gizmo to a **transient proxy**, not the authoritative rig or sampled
props. The adapter reads proxy transforms, converts them to sparse absolute
control values and submits proposals. Only validated draft props drive the subject
preview. Commit publishes one host transaction; cancel rebuilds from current
authoritative state. Avoid feedback loops between sampling, proxy updates and
`objectChange` callbacks. The pinned [r180 implementation](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/controls/TransformControls.js)
is the implementation reference; current online docs may describe newer APIs.

Host-owned pointer capture/admission must remain authoritative. An authored
`mouseUp` or synthetic event is not permission to save. Prototype a pinned adapter
that accepts the host's normalized pointer stream, with automatic DOM listeners
unconnected, before adopting this dependency. Do not depend on undocumented methods
without a version-pinned facade and conformance tests. If that integration fails,
retain the portable protocol and implement an adapter-specific solver; do not
bypass the admission layer to make the arrows work.

### B. Coordinate and pivot rules

Define the chain explicitly: client CSS pixels → host stage/clip inverse transform
→ renderer-local pixels → active viewport NDC → camera ray → constrained world
transform → declared authoring values. Account for letterboxing, nested clip
transforms, CSS zoom, device pixel ratio and sub-viewports exactly once. Pointer
coordinates are logical pixels; do not multiply by DPR twice.

Gizmo axis orientation and storage space are different. A world-X drag may produce
several changed components in a parent-local position field. Capture the parent's
world matrix `P` and inverse at begin. Here `local` position means parent-local,
not object-axis coordinates. For the explicit pivot convention
`M = T(t) T(p) R S T(-p)`, recover `t = P⁻¹(worldPivot) − p`.
For ordinary Three `M = T(t) R S`, instead recover
`t = P⁻¹(worldPivot) − R S p`. The binding must declare which convention it consumes
or provide explicit conversions. A noncentral pivot may therefore require a
rotation proposal to include a compensating position field. Declare that coupled
key set in capabilities; never move the visible pivot accidentally. Do not use a
changing animated bounding-box centre as the gesture pivot.

Prefer a proxy beneath an identity-transform editor root, expressed at the frozen
world pivot with world orientation. Convert its output back through the captured
parent and declared convention; do not copy proxy position directly to a local
field. A different proxy hierarchy must prove the same round-trip invariants.

Adopt explicit authoring units, handedness and up axis in each adapter; imported
asset normalization belongs below a stable placement root. Do not refit/recentre
a GLB each frame or reparent its skeleton to attach a gizmo. Preserve bones and
skins under the placement root. Procedural animation and user transforms need an
explicit composition order; editing a placement layer is the default. Arbitrary
noninvertible code-derived transforms can decline a capability.

Initially support editable roots under invertible rigid or positive uniformly
scaled ancestry. Detect and explain nonuniform scale, shear, reflections and
singular ancestry rather than approximating rotations. A future adapter may
advertise tested support for more cases. Matrix decomposition and reparenting are
not universally safe under nonuniform scale; [Three's Object3D documentation](https://threejs.org/docs/pages/Object3D.html)
notes an explicit limitation for `attach`.

When an axis projects almost to a point or a ray is nearly parallel to the chosen
drag plane, keep values finite and stable: disable that handle with guidance to
orbit or use numeric input, or use a tested frozen alternative. Never change the
constraint halfway through a drag. Freeze snapping at admission. Initial snapping
uses **displacement from the starting pivot**, with zero displacement preserving
the starting pose; absolute grid snapping is a separately declared option. World
increments use world units along frozen world axes. Local increments use authored
placement units along frozen object-oriented axes, with ancestor uniform scale
included in conversion and the object's own visual scale excluded. Report those
units in the inspector. Rotation uses angular displacement; scale uses the authored
positive scalar. Preserve coordinates outside the selected axes. Do not assume
r180 `translationSnap` handles rotated/scaled ancestry: its world branch adds
parent translation but does not perform a full parent-space conversion. Implement
the declared snap frame in the adapter and cover it with numeric fixtures.

Enforce storage-space bounds while retaining the frozen axis/plane constraint.
For an axis, derive the feasible interval for scalar displacement from field bounds;
do not independently clamp converted X/Y/Z components. For a plane, project the
candidate onto the feasible region in its two declared coordinates. Bounds take
precedence over snapping: allow an off-grid boundary value rather than leave the
constraint or fail the gesture. Reaching a limit must permit reverse travel.

Uniform scale saturates at a documented positive lower bound (and declared upper
bound), preserving equal components. Pivot crossing must not create a negative
scale, cancel an otherwise valid drag or prevent reversing direction. A degenerate
starting radius uses a tested fallback or refuses admission with guidance.
Snapping cannot emit zero/negative scale; no nonfinite value reaches a proposal.

### C. Picking, overlay and disposal

Raycast eligible subject meshes with the active editor camera and map hits to
anchors; use a declared proxy where deformation or custom shaders make mesh hits
inaccurate. Define nearest eligible hit, transparent/helper filtering and an
object-list escape hatch. Do not let a large projected rectangle select a hidden
object in front of the visible one. For skinned meshes, update pose-dependent bounds
as needed and test actual picking against the supported Three version.

Render gizmos, selection outlines and camera/light helpers in an editor-only
surface; a separate overlay pass/canvas shares the accepted view and viewport.
Specify its occlusion policy. DOM ancestry alone cannot exclude editor pixels:
[the current exporter](../scripts/render.mjs) screenshots an element's visible
rectangle, which can contain overlapping sibling overlays. Use an isolated content
render, or an acknowledged capture transition that excludes editor pixels from the
actual captured image and restores the editor afterwards.

Direct stills, movies and generation references sample an immutable **committed**
revision, requested source time and its authored shot camera. Exclude transient
pose drafts and editor-view state. Capture concurrent with publication chooses
one complete committed revision, records its identity and never mixes revisions.
Capture during a drag does not commit or cancel it. An optional draft-capture
feature would need explicit draft identity; it is not implied by this contract.
Authored captions and other content overlays remain included. Dispose editor
resources, listeners and pending proposals on unmount/rebind; no second uncontrolled
animation loop or stale GPU context may survive.

### D. Async host transaction

Use an explicit lifecycle: admitted/preparing → active → finalizing → publishing
→ committed/failed/uncertain. Canceled is terminal before publishing. Keep the
existing gesture validator, but extend its host consumer for this lifecycle.

- Trusted begin freezes the accepted presentation, binding generation and identity.
  Keep at most one executing update and one latest pending point. Serialize or
  number responses; late work cannot replace a newer draft.
- A matching trusted release fixes the final point and enters finalizing, including
  when begin is still pending. Expected capture loss after release is not cancel;
  unexpected loss before release is. Disable new updates and drain/evaluate that
  final point. If its evaluation fails, do not publish an earlier draft.
- Escape/invalidation can cancel until the host atomically consumes admission for
  publication. Immediately before that boundary, recheck cancellation, identity,
  generation, allowed fields and the final proposal. Publish with a document-revision
  compare-and-swap, not only an earlier frontend revision check.
- After publication starts, report the authoritative transaction outcome. Do not
  announce cancellation if a dispatched save may still succeed. A lost acknowledgment
  is uncertain: reconcile by a stable host transaction ID/receipt before retrying.
  Never duplicate an undo entry or overwrite a newer revision. A later reversal of
  a successful publication is a separate normal undo, not gesture cancellation.

Retain byte/key/time budgets and lease renewal through finalization. A deadline
before publication cancels; after dispatch it may require reconciliation. Neither
renderer callbacks nor transport tokens can consume the host's write admission.

No LLM, filesystem write, asset download or provider call occurs per pointer move.
Benchmark drag-to-paint latency on representative hardware; a proposed target is
p95 below 50 ms for a declared reference scene/device. Report actual measurements,
scene complexity and degradation rather than promising this on arbitrary scenes.

## 6. Ownership and delivery slices

**EditableFrames owns** portable schemas, transform semantics, adapters, gesture
proposal validation, deterministic sampling, standalone editor integration,
examples and conformance fixtures. Keep Three imports out of renderer-independent
core modules. Optional capabilities must not narrow arbitrary creative source.

**Stitchable owns** its KDV selected-clip panel and pointer admission, native
transport, Library import/custody, runtime-library admission and revisioned timeline
writes. Follow-up integration must update all relevant validators/types/consumers,
not only render a new toolbar. Its inspected host currently carries move/resize
operations and rounds spatial values; both require deliberate compatibility work.
Use one matching Three instance for objects, controls and loaders within a runtime;
either support/test both host versions or explicitly upgrade the consumer. Do not
mix r180 addons into an r170 runtime and assume compatibility.

GLBs remain immutable Library/project assets with stable version references.
EditableFrames loads admitted bytes and instantiates scene objects; it does not
become an asset marketplace or download manager. An LLM may propose imports or
changes through tools, but cannot create a second persistence path.
Persist immutable asset/version references, never resolved runtime URLs. Resolution
and private package bindings stay host-owned and cannot be overridden by gesture
proposals. Asset identity covers every model dependency used in preview/export.
Initial fixtures may require self-contained GLBs; external buffers/textures need
separately admitted, pinned references or explicit rejection. Preserve native
private-binding and self-containment checks. Standalone projects provide equivalent
project-local custody without requiring Stitchable Library.

1. **Contract and math spike:** negotiate protocol, specify field/rotation identity,
   prove proxy input, transformed-parent conversion and overlay-free capture in a
   minimal procedural scene. Resolve unsupported ancestry policy before UI polish.
2. **XYZ placement:** ship arrows/planes, world/local orientation, numeric fallback,
   screen-plane compatibility, snapping, one-undo gestures and standalone tests.
3. **Orientation, cameras and lights:** quaternion tracks and rings, uniform scale,
   editor-view/shot distinction, targeted light controls and reproducible animation.
4. **Consumer integration and character fixture:** import the framework changes into
   Stitchable separately; prove native KDV selection, admission, reload, tracks and
   export using a licensed rigged figure and procedural fallback. No large asset
   pack is required in this PR.

A pending clip retains its editable scene and revision. A host may derive stills,
first/last frames, appearance references or a clay motion video according to the
selected generation endpoint. These are derived assets, not a replacement for the
scene. An edit invalidates affected reference renders; it must not purchase a new
generation automatically. Provider APIs, budgets and generation jobs are outside
this framework change.

## 7. Acceptance criteria for implementation

These are release gates for follow-up code, **not tests claimed to pass in this PR**.

- [ ] Existing v1 controls, screen-plane moves, resize, hierarchy selection and
  2D/DOM/Canvas scenes retain their behaviour and serialized history.
- [ ] A rotated character root moves on each world/local axis and plane correctly;
  a parent rotation/uniform scale, noncentral pivot and off-screen position do not
  introduce jumps. Unsupported transforms produce an actionable disabled state.
- [ ] CSS scaling, letterboxing, DPR 1/2, clipped/nested viewport and perspective/
  orthographic cameras preserve picking and drag direction. Near-parallel axes,
  behind-camera objects and near-plane bounds never emit NaN or huge jumps.
- [ ] Overlapping meshes select the correct eligible anchor; locked/hidden objects
  cannot initiate gestures. A character limb normally selects its placement root.
- [ ] Translate/rotate/scale inspector values match the gizmo and replay after
  save/reload, undo/redo and CLI/agent edits. Numeric and keyboard alternatives work.
- [ ] Auto-key off/on, existing tracks, trimmed/rate-adjusted clips and rational
  source rates update only the intended key/value. Quaternion sign equivalence,
  180-degree transitions, normalization and explicit spin tracks are covered.
- [ ] Thousands of pointer events remain bounded; one drag creates one transaction.
  The final pointer wins. Cancel, timeout, source rewrite, concurrent agent edit,
  seek, camera cut, disposal and lost capture cannot commit stale drafts.
- [ ] Renderer-generated events cannot grant save authority. Unknown operation,
  handle, space, version, anchor or field fails without modifying the document.
- [ ] Editor orbit creates no keys/history and does not change export; Use this view
  creates one undoable camera edit. Object drag cannot also orbit the view.
- [ ] Light position/target/intensity edits reproduce at the same frame; fields that
  have no meaning for that light type do not advertise working affordances.
- [ ] Captured content from preview, direct stills, movies and reference renders
  contains no editor helpers; the interactive editing surface may display them.
  Forward/backward/random seeks yield the same authored transforms;
  do not claim cross-GPU pixel identity.
- [ ] An asynchronous pick begun in editor view A is rejected after orbit to B at
  the same source time; subject rendering, helper picking and constraints agree.
  Editing a shot camera from a different editor view never moves the editor view.
- [ ] Delayed begin, final evaluation and persistence each exercise release, Escape,
  expected/unexpected capture loss and conflicting writes. Lost acknowledgment
  reconciles without duplicate history; a failed final point never saves old data.
- [ ] Controls-v1 plus v2 gestures works when negotiated; legacy adapters never
  receive v2 input. A v2-only adapter rejects unversioned input. Unsupported bridge
  versions, operation/key mismatches and stale handle hits leave state unchanged.
- [ ] Remount preserves persistent semantics/history but invalidates old runtime
  bindings. A draft repaint does not invalidate its own gesture.
- [ ] Mid-drag capture followed by cancellation matches the captured committed
  revision, not the draft; overlapping editor canvases do not enter its pixels.
  Capture concurrent with commit identifies either whole revision, never a mixture.
- [ ] Numeric fixtures cover world snapping under rotated/scaled parents,
  axis-preserving bounds, plane bounds/snap conflicts, pivot conventions, scale
  pivot-crossing/degenerate starts and quaternion 180-degree sign ties.
- [ ] A GLB with an external dependency is either fully pinned/admitted or rejected;
  temporary URLs and private bindings cannot be persisted through transform edits.
- [ ] Standalone and native consumer tests report supported runtime versions,
  resource cleanup and latency measurements. A browser-only demo is insufficient
  evidence for native-host completion.

Extend existing [interaction tests](../tests/interaction.test.mjs),
[portable control tests](../tests/portable-controls.test.mjs),
[key timing tests](../tests/key-timing.test.mjs) and renderer/browser suites.
Use conformance fixtures shared with consumers for quaternion semantics and gesture
negotiation. Add meaningful end-to-end tests around trusted input, persistence and
capture, not merely a snapshot of the new schema.

## 8. Decisions to settle during the spike

The recommended defaults above allow implementation to start. Resolve these with
measured prototypes, rather than presenting them as existing features:

- Can pinned TransformControls accept the admitted pointer pipeline cleanly,
  including cancellation and the final release, without private API coupling?
- Can the standalone and native host share an overlay adapter, or do they need
  separate presenters over the same protocol and math?
- Should the consumer upgrade Three first, or support a small explicit version
  matrix? Check loader, material, shadow and existing export regressions.
- What default world unit/character normalization best fits existing scenes?
  Store that convention; do not silently convert old world-unit values to metres.
- Which two or three reusable pose targets are worthwhile after root manipulation
  works? Do not promise full character animation as a side effect of adding arrows.
