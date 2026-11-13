# What we tried, and where code-generated video fits

> **2026-11-14 follow-up:** the original Fable worker resumed, repaired camera/gaze state dependence and completed the film. Independent checks reproduce 1,152 frames, 228 new seek samples and all 12 controls; a three-frame CLI edit/undo specimen also passes. Earlier unfinished-draft failures below are historical. Acting/contact, native integration and style reuse remain open. See [current evidence](hybrid-gap-closure-2026-11-14.md).

Checkpoint: 2026-11-13. [Interactive experiment map](hybrid-experiment-map.html) · [Static infographic](media/hybrid-experiment-map.svg).

**41 grouped trial entries across 8 areas.** These are an inventory of related attempts, not 41 independent jobs, equal-sized experiments or a success-rate benchmark. They include the local browser/HTML scene studies and the model/preparation steps used by those compositions. Superseded failures stay visible beside later repairs. This is not a claim to enumerate every frame or revision.

**Legend:** “Worked in this test” means the specifically stated check or user judgment succeeded; it does not mean production-ready. “Needs more work” has a useful partial result. “Missed the goal” records a failed use case, not a universal ban on a technology. Proposed work appears separately.

## The debate: a strong direction, not an unlimited promise

**The user’s forecast:** future LLMs may eventually author almost any game-look or fantasy video. We adopt this as a direction to explore, not a verified promise about Fable 5.5, Fable 6, release dates or permanent vendor leadership. One preferred film does not rank providers in general.

**The strongest case for it.** Code can retain the world, cast, actions, cameras and lights as a reusable recipe. Once a rig or set works, the next scene can reuse it. Stylized art often tolerates simplified surfaces, and a game aesthetic fits real-time renderers naturally. Better authoring, better assets and better rendering tools can compound. Our two complete 48-second exports establish that this route already makes coherent short, voiced scenes; Fable’s richer assets and direction were preferred.

**The strongest objection.** Writing valid code is not the same as directing believable acting. Anatomy, facial performance, contact, eyelines, cloth, sound, camera cuts, continuity and taste need work even when the program runs. Rendering time, memory and source-asset quality do not disappear with a smarter LLM. Fable’s unfinished draft still fails one random-seek check. We have neither a multi-episode test nor a benchmark on ordinary laptops. Cross-style portability is a hypothesis awaiting ST3, not a result.

**The line is not cartoon versus real.** Code can render a realistic product if it has faithful geometry and materials. A fantasy battle can still be cheaper or better as a simulated or generated shot. The useful question is: *what must remain changeable or exact, and do we own the representation needed to change it?*

## Choose a route for each shot—and sometimes each layer

1. **Build with code** when we can author the shapes, rigs and motion and need repeatable edits: price, UI, product layout, a known camera, stylized characters, diagrams or an approved CAD model. Geometry being editable does not make an invented mesh accurate. Exact labels require correct artwork and a validated render.
2. **Make the action together** when independently composited people/objects cannot convincingly share gaze, grip, weight or support. Use a single choreographed rig/simulation, filmed performance, or jointly generated shot. Our chosen realistic-avatar route is approved staging → snapshot + references → joint generation → review. This is a workflow default from our trials, not a claim that realistic CG interaction is impossible.
3. **Combine independent pieces** when their relationship is mostly placement, visibility and colour: captions, titles, background swaps, a presenter beside a diagram, a pinned screen. Masks solve who hides whom; they do not create acting, contact, reflections or lighting geometry.
4. **Use genuine footage** when the shot claims a real event, testimony, actual gameplay or measured product behaviour. Code can clarify and annotate it. Synthetic footage may be a labelled illustration, not proof.

An interaction group should share one performance. For example, the two people, their hands and the transferred product belong together. A separate price card can remain code outside that group. A generated clip is editable as a clip—trim, crop, grade, replace—but its internal fingers, product motion and room lighting are baked. Moving a product afterward without its hand requires regeneration or a separately validated reconstruction/rig.

### Example: one 60-second advert can use several routes

Illustrative edit, **not a tested deliverable**:

| Time | Section | Route | Why |
|---|---|---|---|
| 0–5 s | Animated headline | Code | Exact words and motion. |
| 5–15 s | Product turns with specifications | Code + approved 3D asset | Repeatable angle and exact information; asset fidelity gate. |
| 15–30 s | Seller picks up and hands over product | Filmed or jointly generated action | Shared support, gaze and contact. Generated product accuracy must be reviewed. |
| 30–40 s | Interface / feature explanation | Code, with captured UI where necessary | Changeable callouts and correct screen content. |
| 40–55 s | Customer testimonial | Genuine authorised recording | Real testimony must remain real. |
| 55–60 s | Price and call to action | Code | Versions without regenerating the performance. |

A fantasy episode can likewise mix authored dialogue with a difficult simulated/generated insert. That mixed story round trip has not been tested here.

## What “unlimited lighting options” means

The warm/cool/office labels are starting settings, not a closed menu. Direction, position, size, colour, intensity, environment, material and time can vary continuously. But a control only changes representations it reaches: a 3D light can light a mesh; it cannot recover the back of a photograph or remove baked shadows from footage. A new visible lamp needs illumination on nearby surfaces, appropriate shadows/reflections and consistent changes over time. Our lamp sweep exposed weak pastry response and an unchanged photographed background. Mixed human/product relighting is still an open gate.

## Decisions and next experiments

- Keep code-authored storytelling as a first-class, open authoring route. Build optional rig/action/set/look modules rather than a mandatory dungeon template or fixed genre list.
- Finish **ST1** before calling the Fable draft dependable: fix seek state, inspect acting/contact/cut boundaries, check audio and exposed controls in preview/export. Then extract reusable parts (**ST2**).
- For **ST3**, use the same walk → dialogue → shared-prop brief in a sci-fi workshop, cel-shaded village and toy/clay scene. Change shapes, faces, motion, sets and lighting as well as palette. A style counts only after whole-shot review and seek checks.
- For **ST4**, keep the same actor through scene/light/dialogue edits, test save/reload and host export, and measure additional real computers. Do not extrapolate one Mac into a minimum supported laptop specification.
- Keep the accepted realistic pickup/handoff route; implement durable scene-set capture, ordered references, job recovery and accepted-take import. Repeat with both people identity-referenced and difficult contact before claiming reliability.
- Keep feature **6 (camera solve)** and **13 (world reconstruction)** explicitly untested. Authored fantasy worlds establish neither.

**Evidence and review status:** this synthesis uses retained renders, source inspection, measurements, user judgments and earlier Fable reviews. Those are different kinds of evidence. No new render, paid model call or fresh Fable review was performed for this map. Fable’s recorded provider limit prevented a new consultation at this checkpoint. Its earlier findings challenge rendering/material/interaction claims; they are not approval of this new debate or the unfinished story draft.

## Video categories and the present evidence

| Category | Likely route | What we know | Boundary |
|---|---|---|---|
| Fantasy / RPG / game-like stories | Build with code | Two 48-second fantasy drafts; user prefers Fable. | New styles, longer acting and reliable seeking remain unproven. |
| Sci-fi, cartoons, toy/clay and mascot stories | Build with code | Plausible next studies, not demonstrated styles. | Need new silhouettes, rigs, sets and movement—not only new colours. |
| Lessons, diagrams and animated explainers | Build + combine | Exact text, graphics and moving cards exercised. | A complete educational film and factual review are separate tests. |
| Product ads, assembly and digital showrooms | Build + combine | Product rendering, moving copies and layouts exercised. | Faithful CAD/materials and approved artwork matter; a photo has no hidden back. |
| Game trailers / architectural walkthroughs | Build or use captured footage | The scene/camera machinery is relevant; no dedicated acceptance. | A generated reenactment is not evidence of real gameplay or a real building. |
| People talking, demonstrating or handing over | Make the action together | Pickup and handoff accepted; standalone avatar tests have limits. | Film it or jointly generate it. Do not glue an unrelated gesture onto a product. |
| Hair, cloth, fluids, crowds and destruction | Choose per shot | Hair cut-out and simple glass/liquid studies only. | May need authored simulation, specialist assets or generated footage; cost matters. |
| News, interviews, testimonials and real events | Use genuine footage + code | This is an authenticity requirement, not an experiment result. | Preserve recorded evidence; a convincing synthetic performance cannot replace it. |

## Inventory of studies already tried

### Keep pictures in the right place

A sticker must stay on its sign.

- **Clean synthetic tracker — Worked in this test.** A clean moving test card tracked very accurately. **Limit:** Known-answer synthetic proof; not real-scene reliability. Evidence: [hybrid-scenes.md](hybrid-scenes.md).
- **Generated café, poster and phone — Needs more work.** Cards followed short moving clips, with manual corners and some drift. **Limit:** Up to about 8 px café error despite high confidence; curved paper is not planar. Evidence: [hybrid-scenes.md](hybrid-scenes.md). Context summary; the detailed trial remains in the retained study records.
- **Real filmed box orbit — Missed the goal.** The sticker slid onto the next face of the box. **Limit:** Blank surfaces and changing faces defeat this tracker. Evidence: [hybrid-scenes.md](hybrid-scenes.md). Context summary; the detailed trial remains in the retained study records.
- **Tracker confidence + reverse check — Missed the goal.** Forward and backward trackers agreed on the same wrong answer. **Limit:** 6.861 px error with zero forward/backward disagreement; score correctness bug separately fixed. Evidence: [hybrid-analysis-study-2026-11-13.md](hybrid-analysis-study-2026-11-13.md).
- **Frame timing and colour export — Worked in this test.** Fixed repeated source frames and unwanted darkening. **Limit:** Integer timestamp and colour-tag corrections; retained export checks. Evidence: [hybrid-scenes.md](hybrid-scenes.md). Context summary; the detailed trial remains in the retained study records.

### Put people in front of the right things

A hand should hide what is behind it.

- **Original phone thumb + café head — Missed the goal.** Old overlays erased a thumb and covered hair. **Limit:** Original outputs failed even when the rest of the video looked fine. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.
- **Repaired phone + café + native card — Worked in this test.** Reviewed masks kept the thumb, head and hair visible. **Limit:** Works with manual tuning on retained shots; native café preview/export exercised. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.
- **Depth map with an added can — Missed the goal.** A hand cut through the extra can. **Limit:** Depth tuning did not establish common scene geometry. Evidence: [hybrid-scenes.md](hybrid-scenes.md). Context summary; the detailed trial remains in the retained study records.
- **Wrap the original left can — Worked in this test.** Put the artwork on the existing can instead of adding another one. **Limit:** Manual rigid-cylinder fit; the hand did not cross that original can. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.
- **Kinetic words and exact screen cards — Worked in this test.** Words enter, move and stay on their intended surface. **Limit:** Retained titles/rows/wipes/spring/orbit/extrusion examples; broader style library not certified. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.

### Cut out hair, hands and products

A cut-out edge needs more than scissors.

- **Avatar stills + bounded light matching — Needs more work.** Small colour changes preserve the original face. **Limit:** Separate screenshots, not continuous speech; cannot create correct new directional shadows. Evidence: [avatar-lighting.md](avatar-lighting.md).
- **Local SAM 2 video + CPU fallback — Needs more work.** Followed people, hands and products through short clips. **Limit:** Binary masks; preparation on one Mac, not live 24 fps or fine hair alpha. Evidence: [hybrid-analysis-study-2026-11-13.md](hybrid-analysis-study-2026-11-13.md).
- **Full pickup: SAM / RVM / guided alpha — Needs more work.** Processed the whole pickup and reduced some background spill. **Limit:** 121 frames at 640×360; hair/edge errors remain, no annotated full-resolution pass. Evidence: [hybrid-acceptance-round1-2026-11-13.md](hybrid-acceptance-round1-2026-11-13.md).
- **Yellow-wall hair swap and repair — Needs more work.** Hair stopped disappearing as much after better preparation. **Limit:** Improved source quality, prior-frame context and boundary repair; not all faults isolated. Evidence: Retained local study: `mask-composition/retry/README.md` (not bundled here).
- **Cut-out avatar pointing at headphones — Missed the goal.** The edges improved, but the person still did not convincingly present the object. **Limit:** User rejected this route for interaction; zero overlap is not coherent gaze or contact. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.

### Make things belong in the light

A lamp must light the object, not just glow.

- **Plate-based light guesses — Needs more work.** Sometimes found the useful side of the light; manual overrides mattered. **Limit:** A bright surface or backlight can mislead the estimate. Evidence: [hybrid-scenes.md](hybrid-scenes.md). Context summary; the detailed trial remains in the retained study records.
- **Exact can on an empty generated stage — Needs more work.** Kept the product shape in code with an authored shadow. **Limit:** Rendering worked; pasted-on lighting prompted the later lighting studies. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.
- **Local raster / WebGPU / Cycles — Needs more work.** All ran locally; corrected render tests were retained. **Limit:** One Mac, unequal looks/tone maps and limited path-traced sequences; no best-computer claim. Evidence: Retained local study: `review-resolution.txt` (not bundled here).
- **DiffusionLight environment estimate — Missed the goal.** Invented lighting that did not fit the authored room. **Limit:** Negative result for this scene, not a universal rejection of estimation. Evidence: Retained local study: `fable-review.txt` (not bundled here).
- **IC-Light on exact artwork — Missed the goal.** Changed lettering and object detail. **Limit:** Rejected for exact branded-object finishing; tests were stills, not a full relit video. Evidence: Retained local study: `fable-review.txt` (not bundled here).
- **IC-Light on avatar stills / ratio hint — Needs more work.** A bounded hint kept original pixels; raw replacement changed facial detail. **Limit:** Experimental still-image result; no temporal identity or light-direction acceptance. Evidence: [avatar-lighting.md](avatar-lighting.md).
- **One lamp changes warm → cool — Needs more work.** The cup and table responded, but the pastry barely did. **Limit:** Baked photographed background stayed unchanged; per-object response must be checked. Evidence: [hybrid-acceptance-round1-2026-11-13.md](hybrid-acceptance-round1-2026-11-13.md).

### Try real and designed products

Correct shape matters as much as pretty light.

- **LUMA, SPRIG, CROWN & ROOT cans — Needs more work.** More detailed packaging helped; red design was preferred. **Limit:** Lids, reflections, droplets, label seams and motion still needed refinement. Evidence: Retained local study: `beverage-design/fable-design-review.txt` (not bundled here).
- **12 products × 6 lighting setups — Needs more work.** Expanded to PCs, phones, watches, cameras and lifestyle products. **Limit:** 72 cases / 22 sequences; Fable found flat faces, decal shadows, weak metals and glass faults. Evidence: Retained local study: `product-lab/fable-expanded-review.txt` (not bundled here).
- **Oura / Garmin / Nothing photographs — Needs more work.** Recognisable products work as cut-outs and layouts. **Limit:** Colour matching only: baked highlights and unseen sides cannot be relit or spun out. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **Framework photo + grille repair — Worked in this test.** Improved small-detail downsampling for the layout. **Limit:** Context photo only, not a relighting test or full temporal aliasing certification. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **iPhone / Galaxy / MacBook 3D assets — Needs more work.** MacBook responded to moving lights after fixes. **Limit:** iPhone/Galaxy assets rejected for hero shots; MacBook remains a limited screen carrier. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **Two copies: spin, orbit and overlap — Worked in this test.** The nearer object drew in front in the tested crossing poses. **Limit:** 35 poses; photo copies still have no real turn; mutual reflections/bounce untested. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **Photos-to-3D product attempt — Missed the goal.** The generated model did not preserve the needed materials. **Limit:** An importable mesh is not yet a faithful commercial product. Evidence: [hybrid-compositing-plan.md](hybrid-compositing-plan.md). Context summary; the detailed trial remains in the retained study records.
- **Glass, liquid and ice scenes — Needs more work.** Rendered scenes, but nested transparent parts could vanish. **Limit:** Raster limitations; limited Cycles trials were not a matched-quality comparison. Evidence: Retained local study: `scene-lab/README.txt` (not bundled here).
- **Pastry, ceramic, plants, furniture, jewelry — Needs more work.** Broadened the material and scene tests. **Limit:** Grounding, fabrics, jewelry detail and simple billboard steam remained weak. Evidence: Retained local study: `scene-lab/README.txt` (not bundled here).

### Make people show and hand over a product

Bodies must agree about the same action.

- **HeyGen Avatar IV + Atmee pointing — Needs more work.** Both made a presenter talk and gesture in a detailed room. **Limit:** Requested gesture timing was not followed; these outputs were flattened video. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **HeyGen walk, pickup and carry — Needs more work.** An explicit standing start gave the best framing. **Limit:** Product detail drift and late speech remained. Evidence: [avatar-lighting.md](avatar-lighting.md). Context summary; the detailed trial remains in the retained study records.
- **Kling references + video-edit pickup — Needs more work.** Joint generation improved looking, gripping and holding. **Limit:** The early upright position and camera-left instruction were not fully corrected. Evidence: [interaction-staging-workflow.md](interaction-staging-workflow.md).
- **Approved snapshot → full pickup — Worked in this test.** Camera-left placement and pickup looked good to the user. **Limit:** One accepted example; heft is weak, exact geometry and lettering unproven. Evidence: [staged-generation-results-2026-11-13.md](staged-generation-results-2026-11-13.md).
- **Two-person handoff — Worked in this test.** Receiver supports it; giver lets go. The user likes the result. **Limit:** One accepted example; second person lacked an identity reference. Evidence: [staged-generation-results-2026-11-13.md](staged-generation-results-2026-11-13.md).

### Build an animated story with code

Build the stage, actors and their moves.

- **Astra fantasy RPG film — Needs more work.** 48 seconds of voiced, subtitled, editable 3D storytelling. **Limit:** Three repeat seeks passed; faces and hands look more puppet-like than references. Evidence: [code-generated-story-results-2026-11-13.md](code-generated-story-results-2026-11-13.md).
- **Fable 5.2 fantasy RPG film — Needs more work.** User prefers its richer sets, proportions and cinematic direction. **Limit:** 48-second recovered draft; usage limit interrupted refinement; one seek test fails. Evidence: [code-generated-story-results-2026-11-13.md](code-generated-story-results-2026-11-13.md).

### Keep the work editable and safe to repeat

Save the recipe, not only the movie.

- **Clean staging snapshot + reference packet — Worked in this test.** Kept the chosen layout and reference order in a saved packet. **Limit:** Local Scene Studio/packet checks; full native provider workflow still pending. Evidence: [hybrid-acceptance-round1-2026-11-13.md](hybrid-acceptance-round1-2026-11-13.md).
- **Generated clips → editable finishing — Worked in this test.** Titles, prices and other code layers remain changeable after generation. **Limit:** Hands, product motion and room light inside the footage remain baked. Evidence: [staged-generation-results-2026-11-13.md](staged-generation-results-2026-11-13.md).
- **Clay/depth/normal/object-ID control passes — Worked in this test.** The authored scene can emit these inputs for another tool. **Limit:** No successful hosted control-video restyling round trip established. Evidence: [hybrid-scenes.md](hybrid-scenes.md).

## Not yet established

- **SAM 3 video:** Access/runtime gate; no accuracy comparison with SAM 2.
- **Camera solve · feature 6:** No accepted real 3D camera reconstruction.
- **Reconstructed worlds · feature 13:** No splat/mesh reconstruction test; a code-authored world is different.
- **Cloth/skin reskin + automatic contact:** No general deforming-surface or physical interaction solver.
- **More story styles:** Sci-fi, cel village and clay/toy styles are proposed, not tested.
- **Longer episodes and persistent cast:** No multi-episode identity/performance acceptance.
- **Ordinary-computer coverage:** No robust Windows/Linux/modest-laptop benchmark.
- **Native generation handoff:** Local packets exist; full capture/job/recovery/import flow remains to be delivered.
- **Complex interaction breadth:** Object collisions, animals, crowds and repeated two-person identity tests remain open.
- **Stronger human video relighting:** No complete mixed human/product emitter and temporal-identity pass.

For the source-level Fable/Astra comparison and ST1–ST4 acceptance, see [the story report](code-generated-story-results-2026-11-13.md). For the accepted interaction takes and costs, see [the staged-generation report](staged-generation-results-2026-11-13.md).
