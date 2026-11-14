# Stage the scene, then generate the interaction

**Latest decisions (2026-11-13):** the user accepts the full-pickup and two-person handoff examples and prefers Fable 5.2’s visual direction for the 48-second code-generated fantasy story. [Results, technical comparison and story track ST1–ST4](code-generated-story-results-2026-11-13.md). The Fable draft is unfinished and fails a random-seek check; cross-style reuse is a planned experiment. Realistic joint generation and explicitly authored stylized animation are separate routes.

**Generated trials completed (2026-11-13):** [staged camera-left pickup and completed two-person handoff](staged-generation-results-2026-11-13.md), both returned to editable finishing. One take per case; exact product fidelity and native integration remain open. Estimated total US$1.90 under the fresh US$2 cap; account ledger unverified.

**Local acceptance follow-up (2026-11-13):** [snapshot preparation, full-clip masks, tracker counterexample and continuous lighting](hybrid-acceptance-round1-2026-11-13.md). That earlier local checkpoint preceded the generated trials now recorded separately; camera solve (feature 6) and generated worlds (feature 13) remain untested.

Decision and evidence checkpoint: 2026-11-13. This is the selected authoring workflow and remaining delivery plan, not a claim of a completed provider integration.

## The boundary

Independent compositing can position layers, preserve exact artwork and resolve reviewed visibility. It does not infer a shared physical performance. Masks and depth alone cannot make a hand grip an object, two people exchange it, an animal respond to a person, or two objects collide convincingly. Good edges and zero overlap do not establish gaze, support, contact, force or coordinated motion.

For **object–object, living thing–object, and living thing–living thing interactions**, default to staging the intended scene in EditableFrames and generating the coupled action together. This includes coordinated attention and gestures as well as contact. The broader categories are a workflow decision inferred from the human/headphone exercise; a two-person transfer now has one local demonstration, while animal and object-collision shots remain untested and broader multi-person reliability remains unvalidated. Fully authored animation, rigging or physics can still solve an interaction when explicitly supplied and reviewed; this is a limitation of assembling independent plates, not a claim that code cannot animate interaction.

## Author and agent workflow

1. **Stage:** place subjects, products, support surfaces and background; set scale, orientation, camera, eyelines and initial lighting. Humans and agents edit the same saved scene. Use plausible resting poses and reachable objects. Blocking proxies describe placement, not final appearance or solved anatomy.
2. **Approve and freeze:** choose the source frame and shot camera, commit the intended scene revision, and capture a clean snapshot without selection outlines, gizmos or editor chrome. Save the editable scene alongside it. Re-check support, reach and framing before spending on generation.
3. **Package the scene set:** include that snapshot plus separate subject identity, product detail/multi-angle and background references as available. Label each reference's purpose and preserve their order. Record scene/source revision, frame/time base, camera, output dimensions, assets and hashes, reference rights/provenance, desired action beats and acceptance criteria. Retain the actual submitted bytes and prompt, not merely expiring URLs.
4. **Generate during preparation:** select a model such as Kling using the chosen endpoint's actual capabilities. Prefer a start-frame/keyframe input for composition and separate reference inputs for appearance when the endpoint supports both together. An ordinary reference image is a softer hint; do not label it a locked first frame. Verify combinations, reference numbering, duration and cost before submitting. If the endpoint cannot accept the scene set, choose a compatible route or disclose the limitation rather than silently dropping a reference. An accepted video can instead be the base for a video-edit request.
5. **Review the whole interaction:** inspect normal/slow playback and every contact transition for gaze, reachable grip, support/release, hand/limb anatomy, collisions, identity, product geometry/branding, shadows and reflections. Judge positional instruction following separately from overall appearance. A snapshot conditions the result; it does not constrain a solver or guarantee exact placement.
6. **Return to composition:** import an accepted take as a versioned footage asset, probe actual decoded frames/timestamps, then derive masks/tracks from those exact bytes where needed. Keep typography, prices, captions and suitable surface inserts independently editable. Screen-space UI does not inherit physical subject holdouts. Keep the staged scene so another layout can produce another snapshot/take.

Generate the interacting subjects and shared support/room as one shot by default: it gives the model a common lighting and contact context. Foreground-only generation is a separately tested option when alpha, edge colors, contact shadows and background correspondence are actually available. It is not a general solution for changing a room after a pickup.

## What exists and what remains

The standalone Scene Studio example already exposes placement, camera/light controls, saved scene state and **Save reference PNG** from a frozen committed shot. It is an opt-in example, not proof of a universal editor/agent capture API or a native host integration. The scene-set manifest, automatic provider packaging, generation handoff, receipt binding and accepted-take import still need host integration and end-to-end tests. No implicit model call belongs in `render(clock)` and no mandatory vendor dependency is added to the core.

Proposed acceptance for that handoff: agent and human paths capture the same committed revision/frame; active gesture drafts and helpers never leak; stale scene edits are detected before submission; submitted reference bytes/order match the receipt; failed/ambiguous jobs never silently duplicate spend or overwrite an accepted take; imported media uses decoded timing rather than provider billing metrics. These are delivery gates, not new CLI flags.

## Earlier experiments and conclusions (before the staged trial)

The mask-based headphone presentation improved hair and measured overlap but still looked awkward: a product placed beside unrelated avatar motion did not establish convincing attention or support.

The first reference-conditioned Kling take used separate presenter, product and room images. Attention improved, but the headphones stayed upright despite a side-resting instruction. The follow-up used **that accepted-looking video as the base plus the official single-view product photo**, not a newly staged scene snapshot. It produced a clearer headband grip, lift and supported two-hand hold; the user preferred it. The requested camera-left shift was not meaningfully achieved, and the weighing motion read mainly as pickup-and-hold. The upright start remained. Thus the pickup result supports joint generation; it does **not** complete the snapshot-plus-references test, establish exact product fidelity or validate other interaction categories.

The follow-up decoded to 1280×720, 121 frames at 24 fps (5.0417 s). Its EditableFrames round trip retained the frame count, repeated a randomly sought frame identically in the tested browser, and preserved source pixels outside the title before encoding. Title/eyebrow/accent/visibility remained editable. Those are renderer-integrity checks, not proof of physical realism. Contact crops covered all frames and full-scene samples were inspected; no fresh independent reviewer approval is claimed.

At the recorded provider rate, the successful video edit was estimated at about $0.95; the account ledger charge was not retrieved. One earlier upload-URL attempt failed validation and is retained separately. A direct original MP4 output URL, verified against the local source hash, resolved the transport issue. The provider returned a 10.084-second duration metric for a 5.0417-second file, consistent with input-plus-output billing; decoded timestamps must own the timeline.

## Editability and evidence retention

After generation, coupled action, pose, physical light and product appearance are baked. Expose only genuine controls: footage selection, timing where appropriate, crop, grade and separate code layers. A new pose, grip, placement or background geometry usually needs a new take. Regeneration invalidates dependent masks, tracks and acceptance; a matte does not recover independently editable 3D objects.

Retain scene JSON/source binding, clean snapshot, all reference bytes/hashes, exact prompt and role mapping, endpoint/schema/pricing snapshot, request/job/terminal receipts, estimate versus actual billing when available, raw download/hash, decoded timing, derived-data revisions, final render and review verdicts including failures. Keep secrets, private paths and signed URLs out of public documentation. Record reused assets honestly. Future tests must cover each untested interaction category, repeat the snapshot handoff and validate native host integration before broad quality claims.
