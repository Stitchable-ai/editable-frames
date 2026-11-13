# Human foreground lighting

Status: design and isolated still-image evaluation, not a shipped avatar relighting feature. Existing prepared-media primitives provide source-bound alpha and exact frame sampling; they do not recover a person's geometry or original illumination. Continuous speech, hands, multiple people, temporal stability and native preview/export parity still need video acceptance.

## Route by the foreground's representation

| Foreground | Default | Escalation |
| --- | --- | --- |
| Authored 3D geometry and materials | Editable lights, environment and physically based raster shading | Opt-in higher-quality transport where glass, indirect light or shadows justify it |
| Filmed or generated human RGB + alpha | Preserve source pixels; bounded linear-light exposure/colour harmonisation | Prepared video-aware inverse-rendering passes or a reviewed video relight when light direction must change substantially |
| Truly relightable 3D human asset | Use its authored geometry/material/skin transport model | Validate eyes, hair and subsurface scattering separately; an RGB avatar video is not such an asset |
| Circular presenter inset | Treat as a screen-space UI layer; preserve the intentional frame | Relight only when explicitly intended to occupy the scene |

Transparent output makes composition easier; it does not remove lighting baked into skin and clothing. A Three.js light cannot physically relight an ordinary video texture. A soft mask is not a normal map. Do not use subject depth as a substitute for facial normals or observed alpha.

## Lighting is continuous, not a style enum

Names such as office, daylight and neon are example recipes. The underlying editable description can contain arbitrary supported lights, directions, colours, intensity, source size, fill, environment, exposure and time tracks. A host may propose a new recipe from each background instead of choosing from a finite catalogue. Colour alone cannot identify incident illumination: a warm wall may be painted warm, and the brightest patch may be a surface rather than a light. Record observations, assumptions, confidence and user overrides separately. Keep scene estimates stable across a shot; freeze or interpolate authored tracks rather than re-estimating independently on every export frame.

A common lighting description expresses intent across layers. Each renderer implements the subset its representation supports. RGB harmonisation must report that directional shadows/specular changes are unsupported; it must not silently present a colour ramp as a physical light solve.

## Prepared human data contract (proposed extension)

Retain current source identity, raster, rational rate, PTS, correspondence, validity/review and revision gates. Per subject, additionally identify foreground colour, alpha convention (straight/premultiplied), transfer function/primaries, any shading/gain map, normals/albedo/roughness/depth where actually provided, model/version/licence and source-to-output mapping. Missing passes are absent, never fabricated defaults. Map signed normal vectors and linear data explicitly; do not treat them as sRGB.

Prefer native provider alpha and foreground colour over re-segmenting a flattened scene. Decontaminated edge colour matters when replacing the background. In an already-composited image, a masked colour delta can leave the old background unchanged, but cannot recover uncontaminated hair or unseen background. For multiple people, maintain subject IDs, separate adjustments and explicit overlap ordering; a union person mask cannot support independent lighting or depth relationships.

Run models during preparation, outside the renderer clock. Cache reviewed outputs with hashes. Deterministic rendering samples those frozen artifacts at the exact source frame, including random/reverse seeks. A new background or lighting recipe invalidates lighting-dependent artifacts, not unrelated source audio or alpha. Generated outputs that change timing must be re-aligned or rejected; preserve the original speech track and verify lip sync.

## Isolated evidence and rejected shortcuts

Two high-resolution presenter screenshots and a separate small circular inset were evaluated locally. They are independent stills, not a continuous sequence. RVM MobileNetV3 separated the body but visibly damaged small headphone/cable features and left edge contamination. CPU execution is feasible on the tested Apple machine; that does not establish real-time video quality or cross-device throughput. RVM is GPL-3.0 and was evaluated separately, not bundled or selected for production distribution.

Bounded linear-light gain preserved background pixels outside the supplied mask. It preserved source geometry by construction but did not create geometrically correct directional facial shadows. IC-Light SD1.5 FBC, run locally with the same seed on two stills, produced stronger light while changing facial and accessory detail. Raw generative replacement was rejected for faithful avatar rendering. A blurred, clamped luminance-ratio hint applied back to original pixels avoided substituting generated facial pixels, but remains experimental: incorrect inferred shapes can still imply incorrect shading, and temporal consistency was not tested.

Do not interpret zero background change, equal frame counts or deterministic output as a likeness or photorealism score. Keep numerical integrity, boundary quality, identity/expression, illumination plausibility and temporal quality separate.

## Next video acceptance

Use a short alpha-capable talking clip with head turns, blink, open/closed mouth and a hand near the face. Compare unchanged source, conservative harmonisation and any stronger relighter against a fixed warm/cool background pair. Inspect every transition and alpha edge, speech timing, hair, headphones, teeth, skin texture, hands and clothing. Test a second person with overlaps independently. Export and native preview must agree on source mapping and approved revisions. A slideshow of supplied screenshots cannot pass this gate.

## A presenter who handles a product (proposed)

A generated presenter clip is one flattened picture. Imported as media it takes layer edits only: timing, crop, position, an overall grade, and code drawn over it. Her pose, the product in her hand, the grip, the room's light and the camera cannot be changed separately, because they are not separate in the file. Pilots on 2026-11-12 with hosted avatar and video models confirmed the useful half and the missing half:

- **A model can perform the action.** From a supplied still of the presenter in a room, one take pointed and swept a hand toward the product, and another approached a table, gripped headphones by the headband, lifted them and stepped while holding them.
- **Explicit first-frame composition helped in these takes.** Pose, framing and product orientation followed the supplied image. A take started from an explicitly composed standing frame gave the best result. Text instructions to lock the camera or stand were ignored in other takes.
- **The product does not survive.** The generated headphones drifted toward generic ones. Exact code replacement is one fallback; it needs the additional inputs below. The default experiment now tests a richer reference set first, without claiming exact product preservation.
- **Timing needs its own stage.** Speech meant to announce the lift started after it. Sliding audio against a face that is already speaking does not fix lip sync.

To draw an exact product into such a shot, a scene needs inputs that do not exist yet:

| Input | Why |
|---|---|
| Background, presenter colour + alpha, and hand holdout as separate source-bound layers | A product held in front of the torso but behind the fingers; a room that can change independently |
| Product pose for every frame, with an anchor that changes | A pickup has phases: on the table (anchored to it, with contact shadow), grip, lift (anchor moves from table to hand with no jump), carry (follows the hand through changing light) |
| A 3D or multi-view product asset | A lifted product shows sides a single photograph does not have |
| Narration aligned before generation, or a tested lip-sync stage | Speech that names the action has to happen with it |

Bad anatomy in a grip is repaired by another take or a reference performance, not by compositing. Without these inputs, a generated pickup supports edits to the footage layer and code overlays, not independent edits to the product or grip.

## Provider and research notes

- [HeyGen transparent output](https://developers.heygen.com/transparent-background-videos): the documented avatar route requests WebM using a matting-enabled avatar look. Verify eligibility and actual decoded alpha. This supplies a foreground, not relighting passes. Keep provider-specific requests in the host, outside the rendering library.
- [Google Portrait Light](https://www.research.google/blog/portrait-light-enhancing-portrait-lighting-with-machine-learning/) predicts a low-frequency quotient applied to source pixels. This motivates detail-preserving gain control; it does not validate a handcrafted or diffusion-derived gain map.
- [RVM](https://github.com/PeterL1n/RobustVideoMatting) provides recurrent foreground/matte inference, with GPL-3.0 licensing. Licence review and benchmark evidence are required before distribution.
- [IC-Light](https://github.com/lllyasviel/IC-Light) is an image relighting candidate. Independent image inference is not a temporally validated video relighter.
- [Beeble](https://developer.beeble.ai/) offers hosted transformation; account-gated product passes and a generative output are different contracts. No hosted pass/relight was tested in this evaluation. Assess output fidelity and current access before choosing it.

## Reference-conditioned handling shots (2026-11-13)

The next experiment generates presenter, product, hands and room together from multi-angle references, then prepares subject masks and suitable surface tracks for editable code. The shared visual context may improve contact, lighting and identity; those remain measured acceptance criteria. A whole-shot output is flattened footage. Code can expose timing, crop, transform, grade and overlay controls, but cannot independently change the generated grip, product pose, physical light or camera. Changing a generation reference means a new take and invalidates derived data.

Use separate foreground generation when an exact or code-driven background is required. Compare native alpha where verified, neutral-background matting and suitable chroma-key acquisition; none automatically supplies shadows, uncontaminated hair or relightable geometry. Preserve separate subject IDs and corrections. Segmentation is not fractional alpha or surface depth.

Product fidelity must be checked against references through the entire turn and grip. A tracked label can repair print only on a supported surface with valid visibility; a planar pin is not a solver for arbitrary curved products. Bad anatomy needs another take or reference performance. Audio references may influence speech or rhythm but do not guarantee lip sync, verbatim speech or action timing. Do not slide speech against an already-speaking face as a repair.

Keep model jobs outside the rendering clock and provider-specific APIs outside the framework. Record actual decoded frame correspondence instead of requested duration, and retain the prior reviewed take until its replacement passes acceptance. The optional exact replacement contract above remains necessary when independent product geometry is required. See [video segmentation and tracking findings](hybrid-analysis-study-2026-11-13.md). These experiments are not new renderer APIs or a production approval.

## Interaction routing decision (2026-11-13)

**All intended human–object interactions use reference-conditioned video generation by default.** This includes looking toward, pointing at, presenting, reaching for, touching, picking up, wearing and carrying an object. Generate the human, object, support surface and room together so gaze, gesture, orientation, scale, contact and lighting share one visual context. Treat the result as a candidate requiring review, not a promise that diffusion solves anatomy or preserves product details.

The latest mask-composition exercise improved hair stability and removed measured hand/product overlap, but the presentation still failed: the person did not convincingly look toward the product, the gesture was unrelated to it, and the photographed headphones stood in an implausible pose. **Zero overlap is not a believable interaction. Do not manufacture a demonstration by moving an unrelated product cutout near a prerecorded gesture.** Do not keep iterating masks or placement on that route for this use case.

Keep the existing composition framework around the generated shot: provider calls happen during preparation; retain references, prompts, job IDs, costs and original media; decode and bind masks/tracks to the accepted take; add editable typography, captions, prices, UI and suitable tracked screen content afterward. Screen-space cards stay outside subject holdouts. Independent product/portrait layouts, background swaps and code-rendered packshots remain valid when they do not imply interaction. A fully authored, synchronized 3D character/product scene is a separate explicit workflow, not a fallback inferred from a 2D avatar.

Acceptance must inspect the whole gesture at normal and slow speed: eyes and head attend to the intended object, the open palm/index points toward its actual location, the product rests or is supported naturally, perspective and scale agree, contact does not slide or penetrate, and product identity remains faithful. Reject unnatural gaze, unsupported upright props, a gesture aimed elsewhere or a drifting product even when every frame decodes and every mask passes. Regenerate or change the shot; do not conceal the failure with a code overlay.

Generated interaction is baked into the footage. Expose source selection, timing, crop, overall grade and code-overlay controls honestly. Changing gaze, pose, grip, product orientation or physical lighting requires a new take and invalidates dependent analysis. This is an authoring/host routing decision; it adds no implicit model service to the renderer.

### Single-take result (2026-11-13): partial improvement, rejected for final use

One [Kling 4.0 reference-image job on Replicate](https://replicate.com/kwaivgi/kling-v4.0) used a fictional presenter still, one official headphone view and an empty showroom reference. Requested five seconds at 720p; decoded output was 121 frames at 24 fps (5.0417 seconds), 1280×720. The published image-reference rate implies about $0.79 for the reported output duration; this is an estimate, not a verified billing-ledger charge. No second paid take was submitted.

Sampled frames show her head/eyes attending to the headphones and an open palm presenting toward them before she returns attention to the camera. This is better coordinated than the unrelated-avatar/product composite. However, the model kept the headphones upright, matching the product reference pose, despite explicit instructions to lay them on their side. **The take fails the requested support/orientation criterion and is not approved as a product advert.** The observation is consistent with reference-pose bias; one trial does not prove that cause or that this provider is the best choice. Single-view product identity through a turn, pickup, multi-person interaction and exact brand fidelity remain unproven.

For the next separately authorized take, first obtain or approve a physically plausible scene/pose reference showing the intended product orientation and a coherent presenter eyeline. Prefer an actual product photograph in that resting pose or a reviewed scene keyframe, with detail references alongside it. Do not repeat an upright packshot and assume a negative prompt will fix the support geometry. If a provider accepts both scene keyframes and detail references, verify their combined endpoint contract and numbering. The raw take must pass gaze, gesture, support and product-fidelity review before final overlays are approved.

The trial is also rendered through the existing code renderer with editable screen-space typography. Those controls change only the overlay; the human/product interaction remains the original generated footage. Preparing masks or importing the clip does not turn a failed raw take into an accepted one.
