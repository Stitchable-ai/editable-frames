# Authoring contract

Run the skill's `scripts/editableframes.mjs` through Node. Commands: `init DIR`, `inspect DIR`, `apply DIR proposal.json`, `undo DIR`, `redo DIR`, `preview DIR [PORT]`, `render DIR output.mp4 [frame-count]`, `studio`.

For arbitrary new source, use `init DIR --renderer` and the [portable descriptor contract](renderer.md). Its default `defineRenderer` export supports DOM-root capture and optional controls. Renderer modules load during Node metadata inspection and browser rendering, so defer DOM access to `create`/`render`. Bare `editableframes/*` public imports resolve in external project folders; other dependencies must already be resolvable locally.

Legacy `init DIR` modules still export `template` and `createRenderer(canvas)`. Their renderer supplies `render({time,nodes,clip,template})`, may return a promise, and draws or supplies an image surface for the legacy compositor. Keep these two renderer signatures distinct. `init DIR --media` includes the working legacy media/audio example.

Example proposal (replace IDs and revision with inspect output):

```json
{"baseRevision":"from-inspect","command":{"type":"set","clip":"from-inspect","anchor":"hero","property":"accent","value":"#ff8866","label":"Warm coral palette"}}
```

A batch is one undo step: `{"type":"batch","commands":[...]}`. Keyframe commands use `type: "keyframes"`, clip, anchor, property, and `keys: [{time:0,value:1,easing:"smooth"},{time:4,value:2,easing:"linear"}]`. Key times are source seconds. Timeline positions/durations use 120,000 ticks per second.

Legacy schemas accept number (min/max/integer), vec3, color (#rrggbb or #rrggbbaa), text (maxLength), boolean, enum (values), and json. New value types can register validators and interpolation through the core. The browser editor supports direct fields, JSON inputs, conditional fields, presets and numeric macros; other custom widgets are adapter work.

A panel command carries `panel.groups`, each with title and fields. Direct fields contain unique id, label, anchor and property. Panels can only bind to real capabilities. The beta editor implements these validated presets, numeric macros and conditional fields.

Binding hashes protect saved projects from silently running different renderer code. History tracks document edits, not arbitrary JavaScript file changes. Use source control or retain paired source/project snapshots for code changes. `rebind DIR` accepts compatible source changes and retains edit history. `rebind DIR --reset` archives the old project and starts from new defaults for schema changes. `.editableframe/sources` stores authored/bundled source and core snapshots; `.editableframe/revisions` stores previous projects. Media imported through asset-add is retained in content-addressed project storage and pinned in the source snapshot manifest. Preserve the entire project folder. Other external assets still need explicit pinning/retention. Restoring a source revision is currently manual, separate from property undo/redo.

Portable controls have explicit `animatable` flags and support sparse resets: a `set` value of null restores the renderer default; remove a track with `keyframes` and `keys: []`. Panel values use defaults without freezing them into saved edits. Arbitrary unexposed props remain source-owned. The editor exposes direct fields and presets; keyframe commands are supported through proposals/CLI.
