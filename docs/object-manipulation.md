# Spatial manipulation

For spatial objects use one `role:"position"` animatable vec3 (2D X/Y, Z=0),
with `coordinateSpace:"canvas"|"local"|"world"` and `unit:"px"|"world-unit"`,
and one `role:"scale"` positive animatable number. Only one of each role per
anchor. A gesture clamps to explicit bounds; omit position min/max for off-screen
entrances. The 200-field ceiling is an exposed-control budget, not a scene limit.
Optional `objects[].pivot:[x,y,z]` (object-local units; default visual center) is
where the object's scale must be rendered about. Declare the scene's exact reduced
`frameRate:{num,den}`; a new track adopts it (a host may fall back to its own
clock) and then keeps the rate recorded on its keys, so a later change of either
cannot strand existing keys. `keyAtSeconds` answers "would this write update a
key?" on that same grid.

`createSpatialAdapter` from `editableframes/manipulation` takes `{controls,props,
objects:{anchor:{bounds(clock),freeze?(clock,pivot)}}}`. A custom freeze supplies
`toLocal(point)` and optional projected `pivot:{x,y}`. It returns `pick`,
`getObjectBounds`, `manipulationCapabilities` and `gesture`. Render your objects
using those same position/scale props. Canvas nested transforms must supply a
frozen inverse mapping. DOM can use `domSpatialObject(element,root)`. Three uses
`threeSpatialObject` from `editableframes/three-manipulation` with supplied THREE,
rig root, camera and authored viewport. No subject-specific generator is required.

Gesture events include phase begin/update/commit/cancel, id, anchor, optional
property, operation move/resize, start/point, and a frozen source clock. Results
are sparse absolute `{values:{controlKey:value}}`. A custom adapter must declare
working per-object `manipulationCapabilities({anchor}):{move,resize}`; mere roles
or a gesture function do not enable affordances. An object that cannot be moved
this way stays selectable through its other controls; say so rather than faking
it. DOM anchors expose selection; Canvas/Three need pick and measurement. Never write a project from scene code.
The host freezes a child-confirmed painted frame after drag threshold; selection
alone keeps playing. It validates the nonce/revision, renews the pointer lease,
previews without history, and commits one batch on release. Resize is uniform
around the pivot; Three edits parent-local positions at that frame with a frozen
camera-facing plane. Camera animation can change the later screen position.

Unanimated + Auto-key off changes the base value. Animated or Auto-key on
updates/inserts only the playhead key, preserving that key's easing. The first
key holds its value before/after it; no hidden seed is inserted. Dragging a diamond
uses move_control_keyframe with source-second from/to and rejects occupied ticks.
Control tracks store timingVersion:2, reduced frameRate and integer tick
(1,000,000 per authored frame); time is derived compatibility seconds. Legacy
tracks are untouched on open and converted only when edited. Collisions refuse
that track edit with migration guidance. Never convert edited X/Y controls into
vectors implicitly, or write object motion into clip transform/param tracks.

## Proposed 3D extension

For requirements covering XYZ arrows, rotation, cameras, lights and safe host
integration, see [Editable 3D scenes](3d-scene-adjustment-requirements.md). This is
a design proposal; the current screen-plane movement contract above is unchanged.
