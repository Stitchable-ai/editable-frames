# Beta 1 contract and release gates

`0.1.0-beta.1` is a **trusted local-code SDK beta**, not a claim that the complete Stitchable replacement is ready. The authoring format remains `scene-studio` version 1. Adapters, media-port schema and CLI are provisional through 0.1; incompatible changes require a documented migration. No account, Remotion runtime or particular LLM is required.

## What moves beyond alpha

- The editor saves each validated edit atomically to `project.json`. Its file revision is shared with the CLI; stale browser/agent proposals fail. Reload, undo and redo retain history. Download snapshot remains available.
- A media manifest pins source bytes with SHA-256. Preview/export copy and verify inputs into an immutable render snapshot. Decoded PNG frames are indexed by source PTS, including variable frame durations. Frame caches are bounded and disposed.
- Video/image/audio ports expose asset, in point, delay, speed, volume, mute and end policy through ordinary clip anchors. Shapes and presentation remain arbitrary source code.
- A shared compositor evaluates source time, clip layering, transforms and opacity for selected-clip or whole-project preview and export. A `capture()` adapter can supply an image surface from another renderer. The default starter remains Canvas; this beta does not implement general HTML-to-pixel capture.
- Offline audio mixing uses source offsets, clip trims/splits, combined rates, volume and 48 kHz sample delays. A media port contributes audio once. Preview audio follows the same track planner and uses decoded PCM, avoiding a browser AAC-codec dependency.
- H.264 MP4 flattens over an explicit background. MOV uses ProRes 4444 with alpha. PNG sequences preserve RGBA and include `audio.wav` when there is audio. Rational output rates such as `30000/1001` are retained.
- Exports use a frozen source/project/media snapshot, progress/cancellation, temporary output, no-overwrite publication and an integrity receipt.
- Generated panels support direct controls, conditional visibility, numeric macros and presets. Clip controls are optional and do not constrain new renderer code.

## Try media, audio and alpha

```sh
node bin/editableframes.mjs init ./my-film --media
node bin/editableframes.mjs preview ./my-film
node bin/editableframes.mjs render ./my-film ./film.mp4
node bin/editableframes.mjs render ./my-film ./overlay.mov
node bin/editableframes.mjs render ./my-film ./frames --format png --fps 30000/1001
```

The media starter generates an original MP4 test pattern with a tone using FFmpeg. It is a diagnostic/example, not stock footage or a human avatar. Import your own authorized talking-person video:

```sh
node bin/editableframes.mjs asset-add ./my-film presenter ./presenter.mp4
node bin/editableframes.mjs rebind ./my-film
```

Then set the presenter's **Asset ID** control to `presenter`. Source bytes are copied to content-addressed project storage. IDs are immutable: a replacement uses a new ID and a reversible property edit. Rebind archives the previous project/source binding. Copy the complete project directory to move it between machines.

## Media contract

`assets.json` is `{version:1, assets:{id:{src,type,sha256}}}`. Types are `video`, `audio`, `image`; paths are project-relative, must remain inside the project after canonicalization and may not escape through symlinks. Importing a new asset requires explicit rebind. Do not modify hashed bytes in place.

`template.media` maps port IDs to `{asset,sourceIn,offset,rate,gain,muted,end}`. Defaults are sourceIn/offset 0, rate/gain 1, muted false, end `transparent`. Optional `{anchor,bindings:{asset:'property',gain:'property',...}}` connects properties to anchors. `hold` holds the final picture but audio ends; `loop` repeats source media; `transparent` produces no picture after the end. Before the port's offset, output is empty/silent.

The renderer receives `host`, `ports`, explicit source `time`, `projectTime`, sampled `nodes` and `clip`. `await host.portFrame(ports.presenter,time)` returns a decoded image surface or null. `await host.frameAt(assetId,sourceSeconds)` enables direct media sampling. These are read-only borrowed cache surfaces: draw them during the awaited frame and do not close or retain them beyond cache eviction. `capture()` may return an alternative image surface. `dispose()` releases renderer-specific resources.

Audio planning uses static media-port controls. Keyframed parameters on an audible port are explicitly refused for export until an audio automation adapter is provided; mark those controls `keyframe:false`. Source-independent visual properties can be keyframed normally. Repeated/held video does not synthesize additional audio. Gain above unity can clip; the beta does not implement mastering/loudness normalization.

## Resource and trust boundary

Projects are executable trusted JavaScript. Metadata inspection evaluates the bundled module in Node. This beta is **not an untrusted-code execution sandbox**. Loopback access controls protect accidental HTTP access and writes, not against malicious clip code running with the user's permission. Untrusted-code Tauri hosting requires an additional isolated renderer/compiler and asset grants.

Preparation decodes local sources to temporary PNGs. Defaults limit sources to 4,096 pixels per dimension, 18,000 frames each and an aggregate eight GiB raw-pixel equivalent. Browser cache is 96 MiB. This favors reproducible short clips over long-form decode throughput; it is not evidence of production 4K/long-timeline performance. Resource limits are host policy, not the scene vocabulary. General demux/decode streaming, hardware acceleration and production DOM capture remain extensible follow-ups.

Native webview parity, all 55 screen calibrations, automatic arbitrary-source migration, full EffectCraft services, global source-version rollback, animated audio automation and the complete Stitchable export matrix are not beta-1 claims. Standalone asset lighting and film/effect studies remain available; not every study is a reusable generic clip package yet.

## Validation

```sh
npm run build
npm test
npm run test:beta
npm run test:browser
npm run check:assets
npm run check:public
```

`test:beta` generates temporary source media, tests reverse seek, persisted UI/CLI history, conflicting writers, media integrity, range serving, actual MP4 audio, decoded MOV alpha, PNG+WAV output, rational clocks and no-overwrite/cancellation. Results and sample exports go to ignored `artifacts/beta/`. CI runs on Linux; local test results identify their actual OS. Configuring CI is not proof it has passed on GitHub or on Windows. No remote release or npm publication is implied by this local beta version.

## Opening an alpha project

Keep a copy of the complete project folder. Beta changes the runtime binding, so an alpha project can initially report an incompatible binding. Run `rebind DIR` to validate its existing schema/history against beta and record the new runtime. A compatible rebind preserves edits and archives the prior project. Do not use `--reset` just to dismiss an error: it deliberately starts from defaults and belongs only to an intentional incompatible schema replacement. Historic arbitrary-source restoration remains manual; property undo/redo is the supported persisted history contract.
