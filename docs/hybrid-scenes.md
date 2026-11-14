# Hybrid scenes: code inside footage

> Import/export reliability: private-copy validation and expected-revision export gates are implemented in the library. Automatic crash recovery remains proposed after a reproduced stale-lock race. [Evidence and remaining work](hybrid-import-recovery-2026-11-14.md).


> Shared human/product light: one continuous track works, but footage correction is experimental. Half-house light plus front direction is not a sufficient acceptance rule. [Evidence and routing boundaries](hybrid-shared-human-light-2026-11-14.md).


> Moving-reflection checkpoint: camera/product motion improves screen and emitter placement, but self-reflection and café brightness remain open. [Evidence and limits](hybrid-moving-reflections-2026-11-14.md).


## Start here: what we tried, and which tool fits the shot

[![Eight areas of video experiments: tracking, layers, masks, lighting, products, actors, stories and workflow. Build with code, make actions together, or combine pieces.](media/hybrid-experiment-map.svg)](hybrid-experiment-map.html)

**[Open the interactive HTML map](hybrid-experiment-map.html)** · **[Read the full inventory and debate](hybrid-experiment-map.md)**. The HTML file opens locally in a browser; GitHub shows this static infographic and the Markdown evidence. No server or model call is needed.

The map records **41 grouped trial entries in eight areas**, including failed attempts and later repairs. “Worked” means only the stated check or user judgment succeeded. It is not a production-readiness score. Ten remaining research/integration areas are listed separately.

**Current position:** code-authored game-like storytelling is a promising, expandable route. Future LLM capability is a forecast; the preferred Fable fantasy draft is evidence of one short style, not every genre or a general provider ranking. Choose by the shot’s required accuracy, editability and shared action—not simply cartoon versus realistic. Exact graphics and authored worlds favour code; realistic handling trials favour staged joint generation; genuine testimony requires recorded evidence. Independent masks cannot create a shared performance.

The HTML includes simple route illustrations, searchable trial cards, the strongest arguments on both sides, a category map and an illustrative mixed-route advert. This synthesis draws on existing Fable reviews; no fresh Fable endorsement was obtained during its recorded provider-limit window.

---

**Glass follow-up (2026-11-14):** [Verified nested-transparency limits](hybrid-glass-study-2026-11-14.md). The resumed study supports an experimental cylinder-only raster route and a slower Cycles quality candidate for this drink. Submerged ice, general shapes, moving-light response and native integration remain open.

**CLI round trip (2026-11-14):** [Verified replay composition and audio fixes](hybrid-roundtrip-workflow-2026-11-14.md). Live overlays remain editable over retained generated interaction; staging/action changes invalidate dependent takes. Local CLI slice works, native/provider integration remains open.

**Stronger-model follow-up (2026-11-14):** [Matched local model comparison](hybrid-stronger-matting-2026-11-14.md). Neither ResNet50 nor ViTMatte earns hair adoption. Body cleanup is a separate fixed-region experiment; independent alpha and motion acceptance remain open.

**Mask isolation follow-up (2026-11-14):** [Completed independent study and coordinator verification](hybrid-mask-followup-2026-11-14.md). Lossless preparation matters; smoothing is not accurate extraction. A conservative room-aware repair helps this locked shot, but model limits and hand smears remain.

**Mask audit (2026-11-14):** [Same foreground on five backgrounds](hybrid-mask-audit-2026-11-14.md). Dark backgrounds conceal alpha errors; temporal repair trades stability against real edge changes. Keep raw mattes and adjustable repair strength. Both studies subsequently resumed; see the follow-ups above. Neither is production-approved.

**Gap closure checkpoint (2026-11-14):** [Verified subchecks, retained failures and remaining gates](hybrid-gap-closure-2026-11-14.md). The completed Fable film now passes independent seeking/control checks and a three-frame CLI edit/undo specimen. Target-texture warnings and a local recovery prototype add safeguards; tracking geometry, native integration and visual acting remain open.

**Lighting correction (2026-11-14):** [Verified glare/shadow refinement and corrected measurement regions](hybrid-lighting-refinement-2026-11-14.md). Fixed-pose improvements are real; whole-scene realism and moving-product acceptance remain open.

**Cross-style follow-up (2026-11-14):** [Three rendered styles and independent checks](hybrid-story-reuse-2026-11-14.md). The same cast now performs one shared-prop brief in sci-fi, cel-shaded village and toy/clay settings. A [second carry/set-down brief](hybrid-story-second-brief-2026-11-14.md) now demonstrates cast/rig/look reuse in two styles, but requires new choreography and a tray-specific grip. General action reuse remains partial.

**Latest decisions (2026-11-13):** the user accepts the full-pickup and two-person handoff examples and prefers Fable 5.2’s visual direction for the 48-second code-generated fantasy story. [Results, technical comparison and story track ST1–ST4](code-generated-story-results-2026-11-13.md). At that checkpoint the Fable draft was unfinished and failed a random-seek check. The resumed film now passes the scoped runtime checks above; cross-style cast reuse now spans two action briefs, while action generalization and natural contact remain partial. Realistic joint generation and explicitly authored stylized animation are separate routes.

**Generated trials completed (2026-11-13):** [staged camera-left pickup and completed two-person handoff](staged-generation-results-2026-11-13.md), both returned to editable finishing. One take per case; exact product fidelity and native integration remain open. Estimated total US$1.90 under the fresh US$2 cap; account ledger unverified.

**Local acceptance follow-up (2026-11-13):** [snapshot preparation, full-clip masks, tracker counterexample and continuous lighting](hybrid-acceptance-round1-2026-11-13.md). That earlier local checkpoint preceded the generated trials now recorded separately; camera solve (feature 6) and generated worlds (feature 13) remain untested.

**Scene staging decision (2026-11-13):** object–object, living thing–object and living thing–living thing interactions default to **stage → approved snapshot + reference images → joint video generation → editable finishing**. Independent masks do not create a coupled performance. See [workflow, evidence and remaining integration](interaction-staging-workflow.md). A staged-snapshot pickup and a two-person handoff now have local evidence; native integration, broader interactions and exact product fidelity remain open.

**Interaction policy (2026-11-13):** realistic avatar/product looking, pointing and physical handling use a reference-conditioned whole-shot generation route. Explicitly authored stylized rigs are a separate route, with their own contact and seek acceptance. See [the interaction decision](avatar-lighting.md#interaction-routing-decision-2026-11-13). Independent masks are not a substitute for coherent gaze, gesture, product support or contact.

Research update (2026-11-13): [video segmentation and tracking findings](hybrid-analysis-study-2026-11-13.md) and [reference-conditioned handling shots](avatar-lighting.md#reference-conditioned-handling-shots-2026-11-13) define the next experiments and the editability boundary of flattened footage. These do not claim new implemented renderer services.

**Quality correction, 2026-11-11:** later review found erased fingers/heads, incorrect can placement and mismatched generated geometry in the example videos. Successful rendering and tracking do not establish whole-shot quality. See the [revised compositing and motion-design plan](hybrid-compositing-plan.md) for diagnoses, model/runtime research and proposed release gates. Those new features are planned, not implemented.

A hybrid scene combines two kinds of picture in one shot:

- **Footage** (a "plate"): filmed, or made by a video model. It supplies what only has to look real: people, places, weather, light.
- **Code**: it supplies what has to be exactly right: the product's shape and label, a price, an interface, a chart, a logo, a caption.

Stacking one on top of the other is easy and already worked. This document covers the harder case, where the two must agree with each other: a hand passes in front of a code-rendered product, a headline sits behind a presenter, a price stays stuck to a moving sign, the product is lit by the room it stands in.

![Two frames of the hybrid starter: a code-rendered can inside a synthetic plate. On the right, the plate's foreground bar passes in front of the can and the headline, while the price stays pinned to the moving board.](media/hybrid-starter.png)

*The hybrid starter, frames 7 and 34. The plate is a synthetic diagnostic pattern, not footage. The can, its label, the price screen and the headline are code.*

See [prepared foreground and surface artwork](prepared-plates.md) for the implemented receipt, correction, holdout and motion APIs, and their verification limits.

## Goal

Make a code-rendered element belong to the footage it is placed in, while keeping what EditableFrames is for: the code part stays an editable document. Changing the label, the price or the language re-renders the same frames with only that change. Nothing is regenerated and the footage is not touched.

EditableFrames does not run any model. Mattes, depth maps, tracks and camera paths are **inputs**. You make them with whatever tool you trust and license, and EditableFrames pins them, checks them and draws with them. This keeps the framework model-neutral and keeps export deterministic: the same inputs give the same frames.

## Video creation journeys

Each journey says what the author does, what EditableFrames does, and how far it is proven.

| # | Journey | The author supplies | EditableFrames does | Proven by |
|---|---|---|---|---|
| 1 | **A product in a generated place.** A hard-surface product sits in a scene made by a video model and takes on its light. | The plate. | Wraps the plate into an environment, estimates which side the light is on, and lights the product with both. Lighting from the plate is an editable, undoable control. | Integration test: the lit side follows the bright area, the colour follows the plate, toggling it changes only the product. |
| 2 | **Something in the footage passes in front of the product.** A hand, a person, a pillar. | The plate and a depth map of it. | Writes the plate's depth into the depth buffer, so every mesh is hidden exactly where the footage is nearer. | Integration test: the product is covered by the plate foreground and visible beside it. |
| 3 | **A headline behind the presenter.** Text or graphics sit between the subject and the background. | The plate and a matte of the subject. | Redraws the matted subject over the DOM layers. | Integration test: no headline pixel survives in front of the subject, and the text continues on both sides. |
| 4 | **Screen or label replacement.** An exact interface, price or label sits on a surface that moves in the footage. | The plate and a planar track of the surface. | Pins a DOM element to the tracked quad on every frame, including between frames. | Integration test: the element covers the tracked surface edge to edge as it moves. |
| 5 | **Code first, footage second.** The code scene sets the camera and blocking; a video model paints a world around it; the exact product goes back on top. | A scene that declares control passes. | Exports the scene as clay, depth, normal, object-id and matte passes from the same camera and timing. | Integration test for the passes. Sending them to a video model and compositing the result is outside this repository and unproven here. |
| 6 | **Many versions from one take.** The same shot in twenty prices, five languages, three label colours. | One plate and its data, then control edits. | Re-renders each version from the same pinned inputs. If the plate is replaced, its old matte, depth and track are refused instead of being composited slightly wrong. | Integration test for the refusals; edits use the existing revision-checked history. |
| 7 | **Fast motion.** Code elements that move quickly should smear like the footage does. | A shutter angle. | Renders several sub-frame samples per output frame and averages them. | Integration test: smear width and edge colour. |
| 8 | **A moving camera.** The product stays put in a shot whose camera travels. | A camera path solved elsewhere. | Replays the path on a Three.js camera, with rotation interpolated correctly. | Unit tests only. Not yet tried on a real solve; solves of generated footage are approximate. |
| 9 | **An authored stylized story.** Characters move and speak in a code-built world. | Character/set assets or procedural source, rigs, shot/action/light tracks and prepared speech. | Renders authored geometry and sampled animation with exposed controls; no implicit model call. | Two 48-second local SDK films; Fable visual direction user-preferred; resumed film passes same-machine sequential/seek/control checks and a three-frame CLI specimen. [Story findings and next tests](code-generated-story-results-2026-11-13.md). No native story editor or cross-style portability claim. |

The integration tests use a synthetic plate. [On generated footage](#on-generated-footage) says what a trial on plates from video models found.

## Try it

```sh
node bin/editableframes.mjs init ./my-hybrid --hybrid
node bin/editableframes.mjs preview ./my-hybrid
node bin/editableframes.mjs render ./my-hybrid ./hybrid.mp4
node bin/editableframes.mjs render ./my-hybrid ./hybrid-blur.mp4 --motion-blur 180
node bin/editableframes.mjs render ./my-hybrid ./clay --format png --pass clay
```

The starter generates its own plate, matte, depth map and track with FFmpeg from one set of formulas, so tests can state where every pixel must land. Replace them with your own:

```sh
node bin/editableframes.mjs asset-add ./my-hybrid shot ./shot.mp4
node bin/editableframes.mjs asset-add ./my-hybrid shot-matte ./shot-matte.mp4 --role matte --of shot
node bin/editableframes.mjs asset-add ./my-hybrid shot-depth ./shot-depth.mp4 --role depth --of shot --depth inverse --near 1 --far 20
node bin/editableframes.mjs asset-add ./my-hybrid shot-track ./shot-track.json --role track --of shot
node bin/editableframes.mjs rebind ./my-hybrid
```

## Layers

Back to front, this order is right for most shots:

1. **Plate.**
2. **Far DOM**: screens pinned to surfaces in the background; text that passes behind the subject.
3. **Cut-out**: the plate's subject again (plate × matte), which restores it over layer 2.
4. **3D canvas**, depth-tested against the plate's depth. Depth decides per pixel whether the subject or the object is in front, so the canvas can sit above the cut-out.
5. **Near DOM**: captions, calls to action, logos.

A scene can draw all five itself, as the starter does. That keeps one clock and one set of inputs. Depth ordering between separate clips is not available: clips stack with a transform and opacity only.

## Plate data

Data computed from a plate is declared in `assets.json` as a **derived** asset. It records the hash of the plate it was computed from:

```json
"shot-matte": {"src": "assets/…mp4", "type": "video", "sha256": "…",
  "derived": {"of": "shot", "role": "matte", "sourceSha256": "<shot's sha256>"}}
```

`asset-add --role … --of …` writes this for you.

| Role | Type | Meaning |
|---|---|---|
| `matte` | video or image | White keeps the subject, black drops it. Luminance is coverage. |
| `depth` | video or image | Distance from the camera. White is near. Needs an `encoding` (below). |
| `normals` | video or image | Camera-space normals, `(n + 1) / 2` in RGB. Accepted and pinned; no helper consumes it yet. |
| `track` | data (JSON) | A planar or point track. See `packages/plate/track.mjs`. |
| `camera` | data (JSON) | A camera path. See `packages/plate/camera.mjs`. |
| `environment` | image | An equirectangular picture of the plate's surroundings. Accepted and pinned; the starter does not use one. |

Rules, each refused with a message that says what to do:

- The plate's hash must equal `sourceSha256`. A regenerated take invalidates its derived data.
- A plate has at most one asset per role.
- A derived asset cannot derive from another derived asset.
- A derived video must have exactly as many frames as its plate.
- A depth asset must carry an encoding. Tracks and camera paths are validated when loaded.

**Conforming data from other tools.** A derived video is read by frame number: frame 40 of a matte describes frame 40 of the plate. Tools do not always return that.

- *Fewer frames at the plate's own rate* means correspondence is incomplete; do not assume the missing frames are all at the end. Verify which source frame each output describes, then recompute/correct missing data or trim the shot to a verified range. Do not hold the tail of a moving matte/depth map to satisfy the frame-count check. Stretching the video over the plate's length moves every frame in time; a depth map stretched from 112 to 121 frames ran up to five frames early.
- *Another frame rate* has to be resampled onto the plate's frame times.
- *A depth video must be grey.* Several hosted depth models return a false-colour picture. Ask for grayscale output, or map the colours back to values before importing.
- Check the result against moving edges throughout each crossing. Inspect every decoded frame of short final clips, including full-resolution crossing crops and normal/slow playback. A few matching frames are only a smoke test.

**Depth encoding** is `{kind, near, far, packing}`. `kind` is `inverse` (what monocular depth models emit; precision is spent close to the camera) or `linear`. `near` and `far` are the distances white and black stand for, in scene units. `packing` is `gray8`, or `rg16` for 16 bits across red and green. Relative depth has no true scale: tuning `near` and `far` can create a plausible ordering in some frames, but does not establish shared geometry or correct hand/face edges. They are not measurements. Prefer an explicit subject holdout for a known foreground crossing.

**Track** files are `{version: 1, kind: "planar" | "point", width, height, frameRate: {num, den}, frames: [{frame, quad | point, confidence?}]}`. Coordinates are plate pixels from the top-left. Quads are ordered top-left, top-right, bottom-right, bottom-left. Frames may be sparse; samples between them are interpolated, and samples outside them hold the nearest frame and say so.

**Camera path** files are `{version: 1, frameRate, frames: [{frame, position, quaternion, fovY}]}`: camera-to-world, +Y up, looking down −Z, `fovY` in degrees.

## Renderer contract additions

Two optional services join `asset` and `mediaFrame`. Check that they exist before using them.

- `context.mediaInfo(id)` returns `{type, width, height, duration, frames, frameRate, derived}` for a declared asset.
- `context.derived(id, role)` returns the id of the asset derived from `id` with that role, or `undefined`.

`mediaFrame(id, seconds)` serves matte and depth frames like any other video. `asset(id)` returns a URL for a data asset; fetch it and parse the JSON.

A scene may declare **control passes**:

```js
defineRenderer({ …, passes: ['clay', 'depth', 'normal', 'id', 'matte'], … })
```

![The starter's can drawn four ways: clay, depth, normals and object ids.](media/hybrid-passes.png)

*Clay, depth, normal and object-id passes of the starter, exported with `render --pass`.*

The host then supplies `clock.pass` (`'beauty'` unless a pass was requested). A host never asks for a pass the scene did not declare, and the CLI refuses one. Pass names are open, like renderer names. `beauty` is implied and cannot be declared.

## Helpers

`editableframes/plate` is pure and renderer-independent:

| Area | Functions |
|---|---|
| Corner pin | `solveHomography`, `applyHomography`, `invertHomography`, `cornerPinTransform`, `cssMatrix3d`, `quadArea` |
| Tracks | `validateTrack`, `sampleTrack`, `sampleTrackFrame`, `scalePoints` |
| Camera | `validateCameraPath`, `sampleCameraPath`, `slerp` |
| Frame rate | `plateFrameIndex`, `conformSeconds`, `cadence` |
| Depth | `validateDepthEncoding`, `decodeDepth`, `encodeDepth`, `packDepth`, `unpackDepth`, `depthGlsl`, `unprojectDepth`, `fitGroundPlane` |
| Measuring a plate | `plateStats`, `matchLevels`, `applyLevels`, `estimateKeyLight`, `estimateNoise`, `grainAt`, `expandHighlights` |
| Passes | `idColor`, `idFromColor`, `validatePasses` |
| Canvas | `drawCutout`, `drawGrain`, `createFrameLoader` |
| Shutter | `shutterSamples`, `validateShutter` |

`editableframes/three-plate` is an optional Three.js adapter:

| Function | Purpose |
|---|---|
| `createDepthOccluder(encoding)` | Lets the plate's own geometry hide the scene. Needs WebGL2, a perspective camera and the standard depth buffer. |
| `createMatteHoldout()` | Punches the matted subject out of the canvas. The cheap alternative when there is no depth; it is all-or-nothing per pixel. |
| `createPlateEnvironment(renderer)` | Lights the scene with the plate. |
| `paintPlatePanorama(context, source, width)` | The panorama `createPlateEnvironment` builds: the plate in front of the camera, mirrored behind it. |
| `applyKeyLight(light, estimate)` | Aims a directional light from `estimateKeyLight`. |
| `applyCameraSample(camera, sample)` | Replays a camera path. |
| `createShadowCatcher(plane)` | An invisible plane that shows only shadows, laid on a plane from `fitGroundPlane`. |
| `renderPass(renderer, scene, camera, pass, options)` | Draws the scene as clay, depth, normal, id or matte. |
| `dataTexture(image)` | A texture for plate data with no colour management. |

None of this narrows what a renderer may draw. A scene that uses other libraries can read the same assets and implement its own passes.

## What is estimated, and how far to trust it

Three helpers guess from a single view. Expose their results as controls.

- **`estimateKeyLight`** reads which side the light is on from the brightest 5% of the frame. A picture cannot say how far in front of or behind the subject the light is, so that part is a stated assumption: a small source is placed level with the subject, a broad one in front of it. The brightest area is not always the light: a white desk under a window reads as light from below, and a low sun behind the subject reads as light from the front. A shadow cast from the estimate then falls the wrong way, so let the author set the direction. Its colour is the brightest area's colour, which can be an object's (blue components read as a blue light) rather than the light's.
- **`createPlateEnvironment`** has only what the camera saw. It puts the plate in front and a mirrored copy behind the camera, and pushes clipped highlights above 1 so they can act as light sources. The result is plausible. It is not a measurement of the real surroundings, and the highlight boost is not recovered data. Use a real `environment` asset when you have one. Keep `scene.environmentIntensity` at 1, as the starter does: the light is then the plate's own pixel values with no gain, and a material should have its real reflectance (aluminium is about 0.91, `#f5f6f6`).
- **Depth `near` and `far`** are yours to tune, as above.

## Frame rate

Video models emit a fixed rate: commonly 24 fps, sometimes 16 or 30. Two things follow.

- Anything locked to the footage should move on the footage's frame grid. Use `seconds = clock.mediaTime ?? clock.frame / clock.fps` for footage and its derived data: this clock stays at the output frame during shutter sampling. `conformSeconds(seconds, plate.frameRate)` gives the time of the plate frame on screen; sample tracks, mattes and depth at that time. Otherwise a pinned element slides against the picture between plate frames.
- A plate inside a timeline of another rate repeats frames unevenly. `cadence({num: 24, den: 1}, {num: 30, den: 1})` reports the pattern `2,1,1,1`, which is visible as judder on any move. Render the project at the plate's rate, or interpolate the plate before importing it.

## Export

- `render DIR OUT --pass NAME` renders a declared pass. The receipt records it.
- `render DIR OUT --motion-blur ANGLE [--samples N]` opens a shutter of `ANGLE` degrees (0–360, default samples 8, range 2–64) centred on each frame. Samples are averaged as premultiplied colour, so a half-covered pixel keeps its hue. The mean is taken on encoded values, not linear light. Preview shows no motion blur.
- MP4 and MOV keep the values the browser drew: BT.709 matrix, limited range, transfer tagged as sRGB. Footage in a hybrid shot comes out at the levels it went in.
- An export re-encodes its inputs. Content credentials or other provenance metadata carried by a generated plate are not copied to the output. If a law or a platform requires you to disclose AI-generated content, that remains your responsibility.

## Compared with a full compositing checklist

Professional compositing uses more steps than this. Stated plainly:

| Step | Status |
|---|---|
| Occlusion by plate geometry | Done, from a depth map. |
| Subject in front of graphics | Done, from a matte. |
| Planar tracking and corner pin | Drawing done, for flat surfaces. The track comes from another tool. A surface that bends (curled paper, cloth) needs a mesh warp, which is not provided. |
| Edge clean-up of the cut-out | Not provided. A matte edge keeps some of the plate's background colour, which shows as a thin fringe over contrasting graphics. |
| Reflections of the plate in the object | Approximated by `createPlateEnvironment`. |
| Light direction | Estimated; editable. |
| Black and white point match | Measured by `plateStats` / `matchLevels`. Applying it is left to the scene. |
| Grain match | Measured by `estimateNoise`; `drawGrain` adds seeded grain. Not applied by the starter. |
| Motion blur | Done at export, for code layers. |
| Shadow of the object on the plate | `fitGroundPlane` and `createShadowCatcher` exist. Not exercised by the starter or the integration test. The catcher is a plane with no depth: a shadow it catches is also drawn over a real object standing on that plane. |
| Camera match | Replay only. No solver. |
| Depth of field, lens distortion, chromatic aberration, light wrap, atmospheric haze | Not provided. |
| Reflection or shadow of the object in the plate's own surfaces | Not provided. It needs the plate's normals and roughness. |
| Linear-light compositing | Not provided. Layers are composited by the browser on encoded values. |

## On generated footage

The helpers were tried on twelve 5–6 second plates from four video models (Seedance 1 Pro Fast, Kling 2.5 Turbo Pro, Veo 3.1 Fast, Wan 2.2), with mattes and depth maps from hosted models and tracks from a classical planar tracker. Each scene was a renderer scene of the kind the starter shows. This is one trial, not a benchmark.

![Historical sampled frames from the phone and inserted-can experiments; later full-shot review found foreground and placement failures.](media/hybrid-generated-plates.jpg)

*Historical samples, not passing clips. The phone matte collapses during the tap/lift, and the added can has inconsistent hand ordering and does not reskin the original can. Retained to document the experiment; see the corrected verdicts below.*

| Journey | What was found |
|---|---|
| Screen or label on a surface | Tracking held the phone within 3 px at 1088 × 1920 while it moved 24 px, but the composite fails: its thumb matte collapses at frames 60–70 of 121. The café menu also fails because no foreground matte protects the person and the footer overflows. A curled sheet missed the planar pin by up to 15 px. |
| Headline behind a subject | Sampled frames demonstrate the layer effect, with a 1–2 px light fringe at hair. Whole-shot acceptance was not established by those samples. |
| Footage in front of a 3D object | Fails final quality in the can example: the hand is split across the inserted object. Hand-tuned relative depth does not share its scale/camera, and no mask resolves a hand moving through the volume chosen for the new object. |
| Lit by the footage | The plate's colour carries over. Under strongly coloured light a bare metal object takes too much of it (aluminium read as brass in a warm kitchen). At environment intensity 1, a plain aluminium can was 5–6% brighter over its body than a real can standing beside it, on the two plates lit from the front. On a plate lit from behind (a low sun in the shot) it was 1.6 times too bright, because the mirrored half puts that sun in front of the object too. `estimateKeyLight` chose the wrong side on two of three plates, as described above. |
| Placing a 3D object without a camera solve | A tracked stand-in provides an approximate screen anchor, not a metric camera/pose solve. The example adds a second can; it fails the intended original-can reskin. A separate code-first take also exposes a larger generated can beneath the code object: one conditioning still did not preserve geometry. |

Two things made pinned graphics read as part of the surface: a `mix-blend-mode` chosen for the material (`screen` for chalk on a dark board, `multiply` for print on paper), and the plate's own frame rate for the whole project.

## On filmed footage

Three clips from a real camera (1920 × 1080, 25 fps; two on a slow motion-control dolly, one on a tripod) were tried the same way, with a hosted matte and depth map for the third. It is a smaller trial than the one on generated plates.

| Journey | What was found |
|---|---|
| Screen or label on a surface | A card pinned to the blank side panel of a box held within 2 px of the panel for 30 frames. Then the dolly's orbit brought the box's next face into view, and the track slid onto it. The tracking tool reported confidence of 0.70–0.85 and no lost frames. A blank surface is tracked by the detail around its edges, and on a solid object an orbit changes what is there. Check the pinned element at several frames, not only the first. |
| Lit by the footage | `estimateKeyLight` chose the side that the real shadow shows (front-left) but placed the light too low, so a cast shadow came out too long. Its colour came from bright blue components, not from the light. A light set by hand from the real shadow matched its direction. The shadow catcher drew the can's shadow across a real object standing on the table. Beside real metal, the plain aluminium can read as dull grey. |
| Headline behind a subject | Fails whole-shot acceptance: while a fast arm enters (up to 460 px per frame), the matte lags by 1–2 frames and the headline shows through it. Its forearm edge is about 10 px wide from 10% to 90%. Other frames demonstrate the layer effect. |
| Footage in front of a 3D object | Failed with the hosted depth map as delivered: the model normalised each frame separately, so the board read as near until the arm came in and as far after it, and hid the object until then. Rescaled per frame against parts of the shot that do not move (the wall and the board), the arm hid the object with an edge 3–4 px wide and nothing leaked onto the arm. |

The same trial found three export defects, all fixed:

- MP4 and MOV exports came out 10–13 levels darker than the frames drawn (128 became 115), footage included.
- A scene with no transparency could not be exported to MOV.
- Footage tagged with BT.709 primaries and transfer, as most camera footage is, was drawn darker than its values before it ever reached the encoder. A board pixel stored as (142, 117, 73) drew as (136, 109, 63).

## Limits

- The plate, matte and depth are decoded to PNG frames before preview and export, within the existing 8 GiB budget. Three videos per shot use it three times as fast.
- A renderer scene has no audio port. Sound from footage inside a scene is not mixed; keep speech on a media-port clip.
- `createDepthOccluder` assumes the plate and the scene share one camera. A depth map from a monocular model is consistent with itself, not with your scene units.
- Antialiased edges mix values, so `id` and `depth` passes are exact only away from silhouettes. `renderPass` does not handle skinned or instanced meshes.
- Results differ slightly across GPUs and browsers, as elsewhere in this framework.
- The tests use a synthetic plate. They prove that pixels land where the inputs say. They do not prove that a particular matting, depth or tracking tool gives good inputs on real footage. The trials and subsequent failure audit above establish current limitations; all-frame quality gates remain proposed work.
