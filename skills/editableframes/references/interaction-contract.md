# Optional objects and gestures v1

These are editing interfaces over arbitrary code. Neither a hierarchy nor controls
are required to render a scene. Import helpers from `editableframes/interaction`.
They have no application bridge, model service or filesystem dependency.

## Semantic objects

A controls-v1 declaration may add:

```js
objects: [
  {id:'phone', label:'Phone'},
  {id:'screen', label:'Screen', parentId:'phone'},
  {id:'camera', label:'Camera'},
  {id:'reference', label:'Reference', locked:true},
  {id:'draft', label:'Draft', hidden:true}
]
```

IDs use letters, digits, `_`, `.` and `-`, up to 128 characters. Labels are at
most 100 UTF-8 bytes and cannot be blank. Parents must be explicitly declared;
missing parents, duplicates and cycles fail. There are at most 500 combined
objects and inferred anchors. Field anchors absent from `objects` become flat
root objects for compatibility. An explicit object may have zero fields.

`normalizeObjectHierarchy(objects=[], anchors=[])` returns a frozen, stable preorder
array of `{id,label,parentId?,hidden,locked,disabledReason,depth}`. The flags are
effective through ancestors; `disabledReason` is `hidden`, `locked` or null. Inputs
are not mutated. Keep original declarations when editing flags; normalized rows
are a derived view, not a replacement for source metadata.

Hidden/locked objects remain discoverable as disabled entries. They cannot be
actively selected or begin gestures. `selectableObject(rows,id)` returns an eligible
row or null. `parentObjectId(rows,id)` returns the nearest selectable ancestor or
null for clip scope. `resolveObjectSelection(controls,selection)` validates a
renderer result against those policies: a declared object with no fields may be
selected without a property, but a supplied property must match an exact declared
anchor/property binding. Unknown anchors are not fabricated into editable objects.

The portable editor uses this object list, filters fields for the selected object,
and supports Parent, Whole clip, Escape and Alt+Up. Selection does not write history
or pause playback. Changing frames clears stale selection bounds. Hidden/locked
metadata does not hide drawn pixels automatically or create a security boundary;
the scene still owns rendering, and explicit property edits use normal validation.

## Renderer proposal hook

A custom instance may add this optional method; `canvasRenderer` forwards it:

```js
let startValue;
return {
  render(clock) { /* draw from explicit time and current props */ },
  gesture(event) {
    if (event.phase === 'begin') {
      startValue = {x: props.position.x, y: props.position.y};
      return null;
    }
    if (event.phase === 'cancel') { startValue = null; return null; }
    return {values: {
      x: startValue.x + event.point.x - event.start.x,
      y: startValue.y + event.point.y - event.start.y
    }};
  },
  dispose() { /* release resources */ }
};
```

The exact event is `{phase,id,anchor,property?,start:{x,y},point:{x,y},clock}`.
Phases are `begin`, `update`, `commit`, `cancel`. Coordinates use renderer-local
pixels after the host removes stage/clip transforms. The host freezes the source
clock at gesture start and holds the identity outside authored code. Hooks can be
async; they return `{values:{controlKey:absoluteJSONValue}}` or null. Values are
sparse **absolute replacements**, not numerical increments. Two-axis movement can
return both keys. Do not mutate props, the project, or durable history in the hook.
Cancellation discards its output and any transient visual draft.

`gestureEvent` validates/freezes event data. `gestureResult` strips unrelated
fields and validates at most 200 keys, 32 KiB, JSON depth 16 and 10,000 values.
`invokeRendererGesture(instance,event,{timeoutMs=5000})` awaits the optional hook,
with a maximum configurable deadline of 30 seconds. Timeout does not terminate
arbitrary JavaScript; a host must discard late responses and dispose failed work.
The gesture session also validates control types, bindings and object policies.

## Host session and atomic commit

```js
const session = createGestureSession({controls, readIdentity});
const identity = readIdentity();
const begun = session.begin({identity, anchor:'phone'});
const preview = session.update({id:begun.id, identity, values:{x:40, y:70}});
// preview.values may feed an ephemeral renderer input, never project history.
const proposal = session.commit({id:begun.id, identity});
// Publish proposal.values in ONE revision-checked host transaction.
// Or session.cancel({id:begun.id}) to discard the draft.
```

A host integrating authored code must admit a gesture through its own UI and
retain that admission outside the renderer. Capture the target and revision at
pointer start, require a matching user release before publishing, and consume
that admission once. A renderer message, transport token or session ID is only a
proposal/correlation value; it must not create write authority. An unsupported
hook should cancel without saving a partial edit. The portable helpers validate
proposals and identity; they cannot establish trusted user input for a host.

`readIdentity()` returns `{clipId,sourceRevision,revision,seekGeneration}`. Both
revisions accept an opaque nonempty string or `{instance:string,seq:number}`;
`seekGeneration` is a nonnegative integer. Keep source and target identity captured
at begin. Deletion, duplication, another writer, source rewrite, or a different
frame invalidates the draft. The host must update these identities accordingly.
Every update/commit compares them with the live callback; mismatch cancels the
draft. Gesture IDs are unique across sessions; late responses cannot match a new
session merely because no project edit occurred.

`update` coalesces only the same key within this gesture, retaining other pending
keys. Invalid keys/types leave the previous draft intact. Identity mismatch,
expiry or a session-budget breach clears it. Defaults are 240 updates, 64 keys,
32 KiB and 30 seconds; the `limits` object uses `updates`, `keys`, `bytes`,
`durationMs`. `now` can be injected for deterministic tests. `state` returns a
frozen snapshot or null. One session allows only one active gesture.

A commit returns `{identity,anchor,values}` and closes the draft. The helper does
not perform I/O. An asynchronous consumer must check the observed revision again
at publication and treat an empty values object as a no-op. Serialize adapter
calls or number their responses: arrival order is not pointer order. Cancel on
pointer cancellation, Escape, unmount, source change or a rejected publication;
restore the current authoritative props instead of an old whole-props snapshot.

`createStudioGestureSession(studio,clipId,{seekGeneration?,now?,limits?})` is a
working synchronous consumer for portable renderer projects. It exposes `identity`,
`begin`, `update`, `commit`, `cancel` and `state`. Updates write nothing; commit
translates declared control keys into one Studio batch and returns
`{proposal,receipt}`. The existing Studio validator and undo/redo own durability.
Disk-backed/browser hosts still use their existing file-revision gate when saving.

The portable editor currently exposes hierarchy selection, not a universal drag
widget. These hooks and tested helpers let a renderer/host implement manipulation;
there is no claim that every adapter or native editor has a completed consumer.
Property auto-keying, playback pause/resume, handles and pointer capture are host
choices that need their own tests. No keyframe is created merely by selection.
