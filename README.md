# EditableFrames

**Code the motion. Keep the control.**

Create videos with code. Give every clip its own editing panel. Change a detail without starting over.

EditableFrames is an open-source framework for human and AI video creators. Your code defines the scene; optional, typed controls expose the details worth editing—colors, shapes, cameras, timing, media and more. People and agents use the same reversible edit history.

**Beta 0.1 · MIT framework · Runs locally · Model-neutral**

Built by parent company [Stitchable](https://stitchable.ai). For a complete video editing application, explore **[Stitchable Pro Studio →](https://stitchable.ai)**.

[Get started](#try-it) · [Agent setup](docs/agents.md) · [Architecture](docs/architecture.md) · [Beta scope](docs/beta.md) · [Website & Cloudflare setup](docs/cloudflare-setup.md)

## Change the scene. Keep the code.

![A real EditableFrames editing session: tower height and tree count change beside the animated castle, followed by undo and redo.](docs/media/edit-in-motion.gif)

**Watch:** grow the towers → remove the trees → undo twice → redo. The controls beside the scene are generated from that clip’s schema. This is the working film-study editor, captured at explicit source times; its edits can be downloaded. Project previews also save edits to disk.

[Still image](docs/media/editor-still.png) · [How this demo was captured](docs/media/README.md)

## One framework, many visual styles

Actual output from the included studies, effects and device viewer. Click any image to see it larger. Run the local studio to play and edit the examples.

<table>
  <tr>
    <td align="center" width="33%"><strong>3D castle</strong><br><a href="apps/films/previews/castle.jpg"><img src="apps/films/previews/castle.jpg" width="280" alt="3D castle — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Skeletal dragon</strong><br><a href="apps/films/previews/dragon.jpg"><img src="apps/films/previews/dragon.jpg" width="280" alt="Skeletal dragon — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Underwater railway</strong><br><a href="apps/films/previews/underwater.jpg"><img src="apps/films/previews/underwater.jpg" width="280" alt="Underwater railway — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>Scientific explainer</strong><br><a href="apps/films/previews/unet.jpg"><img src="apps/films/previews/unet.jpg" width="280" alt="Scientific explainer — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Grain &amp; sunset</strong><br><a href="apps/films/previews/grain.jpg"><img src="apps/films/previews/grain.jpg" width="280" alt="Grain &amp; sunset — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Isometric logistics</strong><br><a href="apps/films/previews/warehouse.jpg"><img src="apps/films/previews/warehouse.jpg" width="280" alt="Isometric logistics — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>Paper stop motion</strong><br><a href="apps/films/previews/paper.jpg"><img src="apps/films/previews/paper.jpg" width="280" alt="Paper stop motion — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Storybook collage</strong><br><a href="apps/films/previews/storybook.jpg"><img src="apps/films/previews/storybook.jpg" width="280" alt="Storybook collage — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Ink animation</strong><br><a href="apps/films/previews/ink.jpg"><img src="apps/films/previews/ink.jpg" width="280" alt="Ink animation — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>Kinetic showreel</strong><br><a href="apps/films/previews/showreel.jpg"><img src="apps/films/previews/showreel.jpg" width="280" alt="Kinetic showreel — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Product evolution</strong><br><a href="apps/films/previews/evolution.jpg"><img src="apps/films/previews/evolution.jpg" width="280" alt="Product evolution — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Aurora glow</strong><br><a href="apps/effects/previews/look.aurora.jpg"><img src="apps/effects/previews/look.aurora.jpg" width="280" alt="Aurora glow — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>Motion echo</strong><br><a href="apps/effects/previews/look.echo.jpg"><img src="apps/effects/previews/look.echo.jpg" width="280" alt="Motion echo — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Print texture</strong><br><a href="apps/effects/previews/look.print.jpg"><img src="apps/effects/previews/look.print.jpg" width="280" alt="Print texture — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Graphic reveal</strong><br><a href="apps/effects/previews/look.reveal.jpg"><img src="apps/effects/previews/look.reveal.jpg" width="280" alt="Graphic reveal — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>iPhone product shot</strong><br><a href="assets/devices/previews/craft-iphone-17-pro-max.jpg"><img src="assets/devices/previews/craft-iphone-17-pro-max.jpg" width="280" alt="iPhone product shot — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>MacBook product shot</strong><br><a href="assets/devices/previews/craft-macbook-pro-16.jpg"><img src="assets/devices/previews/craft-macbook-pro-16.jpg" width="280" alt="MacBook product shot — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>iMac product shot</strong><br><a href="assets/devices/previews/datsketch-imac-2021.jpg"><img src="assets/devices/previews/datsketch-imac-2021.jpg" width="280" alt="iMac product shot — rendered EditableFrames demo"></a></td>
  </tr>
  <tr>
    <td align="center" width="33%"><strong>TV product shot</strong><br><a href="assets/devices/previews/animimo-modern-tv.jpg"><img src="assets/devices/previews/animimo-modern-tv.jpg" width="280" alt="TV product shot — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>iPad product shot</strong><br><a href="assets/devices/previews/cody-ipad-air.jpg"><img src="assets/devices/previews/cody-ipad-air.jpg" width="280" alt="iPad product shot — rendered EditableFrames demo"></a></td>
    <td align="center" width="33%"><strong>Ink effect</strong><br><a href="apps/effects/previews/look.ink.jpg"><img src="apps/effects/previews/look.ink.jpg" width="280" alt="Ink effect — rendered EditableFrames demo"></a></td>
  </tr>
</table>

These are original code-built studies and previews, not copies of other creators’ videos. Device models retain their creators’ licenses and [credits](assets/devices/ATTRIBUTIONS.txt). The scientific scene is a teaching schematic, not a running neural network. Studies demonstrate creative range; they are not all packaged as interchangeable CLI export templates yet.

## Why EditableFrames?

- **Keep creative freedom.** Use Canvas, SVG, Three.js, shaders or future libraries. Controls describe what can be edited; they do not restrict what code can draw.
- **Give each clip the right controls.** Expose a camera for a 3D scene, colors for a title, or media timing for an embedded speaker. Panels support conditional fields, presets and numeric macros.
- **Let people and agents refine the same work.** Stable anchors, validated changes, saved history and undo/redo make targeted edits practical.
- **Bring video into the scene.** Import an MP4 as an editable media port, with timing, playback speed and audio controls. Export an opaque video or a transparent overlay.
- **Choose your model and host.** No Stitchable account, Remotion dependency or model API key is required by the framework. The shared skill and CLI are available for Claude Code, Codex and other tool-capable agents, including Grok; host-specific setup is documented separately.

## Try it

Clone the MIT source, with Node 22 or later:

```sh
git clone https://github.com/Stitchable-ai/editable-frames.git
cd editable-frames
npm ci
npm run dev
```

Open the local URL printed by the command (default `http://127.0.0.1:8790`). The studio includes:

- **24 scoped browser effects** and six composed looks: glow, distortion, grading, wipes, mattes and source-time effects.
- **11 creative studies**: scientific U-Net schematic, grain film, paper animation, ink, isometric logistics, castle, skeletal dragon, underwater train and kinetic promos.
- **55-device catalog** with five included GLBs, HDR product lighting, camera controls and screen calibration. Install the separate complete pack to load all 55.

## Interactive website

The included [website](website/) offers **12 editable studies**, including a real iPhone product demo with phone swaps, app screens and camera controls. It uses Astro for searchable pages and the framework’s command/history engine for edits. Run it locally with `npm ci --prefix website` followed by `npm run dev --prefix website`.

![Real-device product demo with editable camera, app screen and phone model](website/public/demos/device.jpg)

Production deployment to **editableframes.stitchable.ai** is configured; domain activation awaits Cloudflare account setup. See the [setup guide](docs/cloudflare-setup.md). The browser playground exports frames and edit recipes; the local SDK provides supported video exports.

The canonical package, CLI and agent skill use `editableframes`. The original `editableframe` CLI entry point and saved-project identifiers remain compatible.

## Make your own clip

```sh
node bin/editableframes.mjs init /path/to/my-clip
node bin/editableframes.mjs inspect /path/to/my-clip
node bin/editableframes.mjs preview /path/to/my-clip
```

Edit `clip.mjs` to define the visual. `template.nodes` and `template.schemas` expose optional editable anchors. The initial starter exports a Canvas renderer. After editing source, run `node bin/editableframes.mjs rebind /path/to/my-clip`; add `--reset` when adopting a changed schema. Prior project and source snapshots are retained under `.editableframe/`. Other libraries can draw or composite into that canvas; new host adapters can support other output surfaces.

Use the exact IDs and revision from `inspect` in a proposal:

```json
{
  "baseRevision": "revision-from-inspect",
  "command": {
    "type": "set",
    "clip": "clip-id-from-inspect",
    "anchor": "hero",
    "property": "accent",
    "value": "#ff8866",
    "label": "Warm coral palette"
  }
}
```

```sh
node bin/editableframes.mjs apply /path/to/my-clip proposal.json
node bin/editableframes.mjs undo /path/to/my-clip
node bin/editableframes.mjs redo /path/to/my-clip
```

The CLI and project preview share atomic disk writes, stale-revision checks and saved history. Preview edits persist immediately; **Download snapshot** makes a portable copy. Standalone film studies without a project server still download their edits.

## Render an MP4

Install FFmpeg on your system, then:

```sh
npx playwright install chromium
node bin/editableframes.mjs render /path/to/my-clip output.mp4
```

The beta exporter produces H.264 MP4 with embedded-port audio, transparent ProRes 4444 MOV, or RGBA PNG sequences with WAV audio. It records the source binding, project revision, asset hashes and rational frame clock. Existing outputs are never overwritten. This is a trusted local-code runtime, not an untrusted-code sandbox. See [the beta contract](docs/beta.md) for media imports, transparency, validation and limits.

```sh
node bin/editableframes.mjs init ./media-study --media
node bin/editableframes.mjs preview ./media-study
node bin/editableframes.mjs render ./media-study ./overlay.mov
```

## Use from an agent

Read [agent installation](docs/agents.md). The canonical [SKILL.md](skills/editableframes/SKILL.md) works through the model-neutral CLI. A Claude plugin manifest is included; Codex and Grok can install the same skill into their discovery folders. Nothing is automatically added to your global agent configuration.

## Open devices

Download the complete **55-model device pack** from the [beta 1 release](https://github.com/Stitchable-ai/editable-frames/releases/tag/v0.1.0-beta.1), with its receipt and SHA-256 checksum. The source checkout includes five starters. See [assets and licensing](docs/assets.md) for sources, starter models, attribution, integrity checks and release instructions. Models retain their own CC BY, CC0 or MIT licenses; they are not relicensed under the framework's license.

## What is implemented

Renderer-independent authoring, stable anchors, typed validation, keyframes, transactional commands, undo/redo, saved history, optional generated panels, source bindings, a CLI, browser examples, shader effects and a reusable Three.js lighting adapter.

The device viewer currently has its own look history/profile. It is not yet unified with the generic clip CLI. General layer/depth host services, production streaming decode, audio automation, optical flow, distributed rendering and an EffectCraft WASM adapter remain future work. Local PTS-indexed MP4 decoding and static-port audio mixing are implemented in beta 1. See [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

**Golden rule:** new libraries and more sophisticated generated code must remain possible. The control schema is an editing interface, not a fixed visual language.

## Develop

```sh
npm run build
npm test
npm run test:beta
npm run test:browser
npm run test:render
npm run check:assets
npm run check:public
```

Tests require the prerequisites described above. See [CONTRIBUTING.md](CONTRIBUTING.md). The 0.1 beta is for trusted local code; APIs remain provisional and source changes invalidate bindings until you explicitly rebind. Rich schema migrations remain future work.

Maintainers: [publish under the Stitchable organization](docs/publishing.md).

Original code: MIT. Third-party resources: [NOTICE.md](NOTICE.md).
