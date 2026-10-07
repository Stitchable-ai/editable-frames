# Authoring contract

Run the skill's `scripts/editableframes.mjs` through Node. Commands: `init DIR`, `inspect DIR`, `apply DIR proposal.json`, `undo DIR`, `redo DIR`, `preview DIR [PORT]`, `render DIR output.mp4 [frame-count]`, `studio`.

`clip.mjs` exports a `template` with id, title, duration in seconds, nodes, and schemas, plus `createRenderer(canvas)`. The renderer supplies `render({time,nodes,clip,template})` and may return a promise. It can draw Canvas, composite SVG or use another rendering library. Copy pixels onto the supplied canvas for the initial PNG/MP4 exporter. A DOM-only renderer needs a separate capture adapter; it is not implicitly supported by this exporter. Keep data assets relative to the project root. The module can load in Node (metadata inspection) and browser (drawing), so defer DOM access until createRenderer/render.

Example proposal (replace IDs and revision with inspect output):

```json
{"baseRevision":"from-inspect","command":{"type":"set","clip":"from-inspect","anchor":"hero","property":"accent","value":"#ff8866","label":"Warm coral palette"}}
```

A batch is one undo step: `{"type":"batch","commands":[...]}`. Keyframe commands use `type: "keyframes"`, clip, anchor, property, and `keys: [{time:0,value:1,easing:"smooth"},{time:4,value:2,easing:"linear"}]`. Key times are source seconds. Timeline positions/durations use 120,000 ticks per second.

Schemas accept number (min/max/integer), color (#rrggbb or #rrggbbaa), text (maxLength), boolean, enum (values), and json. New value types can register validators and interpolation through the core. The browser editor supports direct fields, JSON inputs, conditional fields, presets and numeric macros; other custom widgets are adapter work.

A panel command carries `panel.groups`, each with title and fields. Direct fields contain unique id, label, anchor and property. Panels can only bind to real capabilities. The beta editor implements these validated presets, numeric macros and conditional fields.

Binding hashes protect saved projects from silently running different renderer code. History tracks document edits, not arbitrary JavaScript file changes. Use source control or retain paired source/project snapshots for code changes. `rebind DIR` accepts compatible source changes and retains edit history. `rebind DIR --reset` archives the old project and starts from new defaults for schema changes. `.editableframe/sources` stores authored/bundled source and core snapshots; `.editableframe/revisions` stores previous projects. Media imported through asset-add is retained in content-addressed project storage and pinned in the source snapshot manifest. Preserve the entire project folder. Other external assets still need explicit pinning/retention. Restoring a source revision is currently manual, separate from property undo/redo.
