# Portable renderer contract v1

The standalone CLI accepts a default (or named `scene`) export made with
`defineRenderer` from `editableframes/renderer`. `init DIR --renderer` creates a
working Canvas example with optional controls. Existing `template` plus
`createRenderer(canvas, context)` modules still use their original compositor.
No app installation, model vendor, account or cloud service is needed.

## Smallest scene

```js
import {defineRenderer} from 'editableframes/renderer';
export default defineRenderer({
  id: 'moving-card', renderer: 'dom',
  width: 640, height: 360, fps: 30, durationInFrames: 90,
  defaultProps: {color: '#38bdf8'},
  async create({root, props}) {
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;top:100px;width:120px;height:120px';
    root.append(card);
    return {
      render(clock) {
        card.style.left = `${160 + Math.sin(clock.frame / clock.fps) * 80}px`;
        card.style.background = props.color;
      },
      dispose() { card.remove(); }
    };
  }
});
```

`renderer` is an open string. Canvas, DOM, SVG, WebGL and other browser libraries
can create content under `root`; controls do not define drawable primitives.
Metadata inspection evaluates the bundled module in Node: defer browser work
until `create` or `render`. The CLI resolves its public `editableframes/*` exports
from external project folders too. Other dependencies must be locally installed
and resolvable; there is no automatic package download or host-library injection.

## Instance, clock and readiness

Required metadata is `id`, `renderer`, positive integer `width`, `height` and
`durationInFrames`, positive `fps`, and `create(context)`. Optional `frameRate`
contains positive integer `{num, den}` agreeing with `fps`. The CLI initializes
its project rate from this value, or rationalizes `fps`; legacy templates retain
24 fps. Export policy currently allows 1–120 fps. Use even dimensions for the
H.264 export path. A compatible rebind preserves existing project dimensions,
rate and timing; an explicit `--reset` adopts new metadata.

`context.props` is a stable object updated before each render. Read its values
inside `render`, not once during `create`. The supplied root contains a mount-owned
surface. A failed/timed-out frame aborts and detaches that surface; late work
cannot paint over a replacement mount. The failed instance cannot be reused. Unexposed props remain ordinary authored
data. Sparse props merge recursively through plain objects; arrays replace whole
arrays, and clearing a nested override restores its authored defaults. The standalone host keeps one instance per active clip occurrence, disposes
it when that occurrence leaves the composition, and may recreate it when seeking
back. Do not depend on accumulated playback state.

`render(clock)` can be async. Source seconds are `clock.frame / clock.fps`;
`frame` may be fractional under trims or speed changes. The CLI also supplies
`frameRate`, dimensions, `durationInFrames`, `playing` and `capture`. Derive motion
and media sampling from this explicit clock, including repeated/backward seeks.
CSS animations, requestAnimationFrame and unseeded randomness are not export clocks.

`context.readiness.hold(label)` returns an idempotent release function. Release
when a required asset is ready, or call `readiness.fail(error)` on failure. The
host awaits `render`, readiness and document fonts before capture, with a 30-second
per-operation deadline. `context.signal` aborts on disposal. User code must still
clean up listeners, GPU resources and work it starts in `dispose()`.

The CLI captures the scene's DOM root after rendering; this includes its Canvas,
SVG and WebGL descendants. PNG and ProRes preserve alpha; MP4 flattens over the
requested background. `window.editableframes.captureTarget` describes the capture
selector for browser harnesses. `png()` remains the legacy Canvas-only shortcut.
This is trusted local browser execution, not isolation from malicious authored code.
For WebGL, retain the rendered drawing buffer for capture (for example,
`preserveDrawingBuffer: true`) and await required GPU work.
Cross-browser/GPU/font pixel identity is not promised.

## Optional controls v1

```js
controls: {version: 1, fields: [
  {key: 'accent', path: '/color', type: 'color', label: 'Accent'},
  {key: 'radius', anchor: 'orb', property: 'size', path: '/radius',
   type: 'number', min: 8, max: 100, animatable: true, unit: 'px'}
], presets: [{id: 'warm', label: 'Warm', values: {accent: '#ff8866'}}]}
```

Controls are optional, capped at 200 fields. Each has a stable `key`, JSON Pointer
`path` (defaults to the escaped key), optional semantic `anchor` (default `root`)
and `property` (default key). Duplicate identities, overlapping paths and unsafe
prototype paths are refused. Types are `number`, `vec3`, `color`, `string`, `bool`,
`enum` (string `options`), `json`, `media`, `model` and `device`. The last three are
string bindings; they do not automatically install assets or services. Numbers and
vectors accept bounds. A field's optional `default` is panel metadata; actual
renderer defaults belong in `defaultProps` or its source logic.

`animatable` defaults to false. Continuous interpolation is allowed for `number`
and `vec3`; other types use discrete interpolation. Set `interpolation: 'discrete'`
for stepped numeric values. Easing belongs to the outgoing key: omitted/`linear`,
`hold`, `ease`/`ease_in_out`/`smooth` (smoothstep), `ease_in`, `ease_out`, four cubic
Bezier coordinates in `[0,1]`, or legacy `{type:'cubic-bezier', points:[...]}`.

The CLI exposes controls as existing Studio anchors/properties through `inspect`.
Its `set` command records a sparse override; null removes it and restores the current
renderer default. `keyframes` sets a track of `{time,value,easing?}` in source
seconds; an empty array removes that track. Key values cannot be null. A static reset
does not remove animation. Instance props are reflected in the panel. An explicit
reset records the control key in `payload.resetControls`, so that field follows
current authored defaults instead of a hidden instance override; unrelated
instance data survives. Reset and its metadata are one reversible edit. Generated fields/presets, proposals and undo/redo share
the same saved history. There is no generic keyframe timeline widget in this editor.

Compatible restyles retain keys, anchor/property, path, type, unit, animation flag
and interpolation. Changed defaults remain live for unedited values. The current
compatibility check is deliberately conservative: incompatible control signatures
require an explicit reset or an authored migration, even if a control was unedited.
`rebind --reset` archives the prior project and starts from defaults; it does not
migrate manual edits. Source changes are separate from property undo/redo.

## Services and semantic picking

`context.asset(id)` is available only when the CLI has declared local assets; it
returns a URL for a pinned manifest ID. `context.mediaFrame(id, sourceSeconds)` is
available with prepared media and returns a PTS-selected frame URL or undefined.
Load/decode that image before finishing the render; this API does not return a
borrowed Canvas. The CLI supports image/video/audio manifests; its default renderer
path does not mix arbitrary DOM audio automatically. Legacy media-port audio keeps
its existing mixing path. `captureSurface` is absent in this host. Feature-check
optional services; do not invent layer, depth, simulation or screen services.

When exposing controls for separate components, use distinct stable semantic
anchors and matching properties. Connect controlled DOM nodes to those IDs, or
implement Canvas/WebGL picking against the current rendered geometry and props.
A canvas element does not automatically expose its drawn objects. Whole-clip
controls remain valid; object selection and gesture hooks are optional.

A renderer may return sync/async `pick({x,y,clock})` with renderer-local pixel
coordinates, producing `{anchor, property?, bounds?:{x,y,width,height}}` or null.
`selectionResult` validates this semantic result. DOM nodes may use `data-ef-anchor`
and optional `data-ef-property`. The editor records that selection and focuses a
matching declared field when one exists. Seeking or redrawing clears selection;
pending picks from an older render, click or inspector selection are discarded.
Interactive preview keeps one active and one latest pending render; superseded
preview callers settle with the newest pending frame. Capture renders every
requested frame sequentially. Bounds are metadata; no selection overlay
is drawn into exported scene content.

`canvasRenderer` is an optional helper: `createRenderer(canvas, context)` returns
`render(clock, props)`, optional `pick`, optional `dispose`. This differs from the
legacy template API's `render({time,nodes,clip,...})`; old modules remain unchanged.
Other browser harnesses can import `mountRenderer` from `editableframes/renderer-host`
and `normalizeControls` from `editableframes/controls`. The renderer entrypoint
also exports `mergeRendererProps` for the same recursive default semantics. Supply only services the
harness actually implements, await frames, then capture its own root.

`npm run test:renderer` exercises the actual standalone CLI path, DOM/Canvas frames,
reopen/edit history, explicit clocks, rational FPS, transparency and failed exports.
These tests do not establish a native application's integration or agent reliability.

For optional object parents, locked/hidden policy and bounded direct-manipulation
proposals, read [the interaction contract](interaction-contract.md). The renderer
hook returns sparse control values; a host owns one atomic commit and cancellation.
