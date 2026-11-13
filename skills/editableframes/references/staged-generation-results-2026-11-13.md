# Staged generation tests — 2026-11-13

Follow-up to the local acceptance report. The user authorized a fresh US$2 total generation cap. Two sequential tests use the same provider/model and retain all inputs, raw outputs and failed-quality observations. This is a local preparation/finishing workflow, not completed native provider integration or an independent reviewer approval.

## Test A: authored snapshot → pickup

The editable reference scene places the real product photograph on the camera-left table using exposed position, scale, image-plane rotation and approximate foreshortening controls. Its background and fictional presenter come from a retained image. This is a 2D blocking composition: it does not establish physical resting geometry, a camera solve or measured lighting.

The captured 1280×720 snapshot was submitted as `start_image`; separate product-detail and presenter images followed in that order as `@image_2` and `@image_3`. Thus this trial really exercises first-frame plus separate references, unlike the previous video-edit trial. The exact prompt asks for look → grip → lift → supporting palm → gentle heft/hold in five seconds, with a fixed camera and the original starting position.

Prediction `nj6k9wyeenrmt0d1tjwr4cqc8m`, `kwaivgi/kling-v4.0`, image-input route. Processing took 111.34 s. Decoded output: 1280×720, 121 frames, 24 fps, 5.041667 s; audio present. SHA256: `10276551f3efb9d2dfbc4831baf054173475c271ffb575f0d667366ffc056afb`.

**Observed:** the camera-left resting start is retained. A product-and-table image patch matches at zero whole-pixel translation, normalized correlation 0.99398; mean absolute RGB differences are 3.91/255 over the frame and 3.85/255 over the product region. This measures opening-frame placement, not exact product shape or a physically constrained trajectory. The woman looks down, reaches, closes on the headband, rotates/lifts the single pair, brings the other hand below it, then shifts to a supported display. The requested heft reads mainly as pickup and hold. All 121 contact crops and 15 full-scene samples were inspected. No conspicuous duplicate product or gross hand-through-earcup event was found in that inspection; fine anatomy, text fidelity, exact geometry and normal/slow playback acceptance are not certified.

The accepted-for-inspection take was imported into an EditableFrames renderer with separate title/eyebrow/accent/visibility controls. Export retains 121 frames at 24 fps. Repeat frame 48 has zero maximum RGB difference; source pixels outside typography are unchanged before encoding; a title-control edit changes 15,118 pixels; no page errors. Generated hands, product motion, physical light and room pixels remain baked.

**Verdict: works with manual staging for this pickup.** This advances the local snapshot handoff from untested to one demonstrated case. It is not exact-object advertising approval, universal first-frame compliance, multi-angle validation or native host delivery.

## Test B: two-person handoff

The final decoded frame of Test A is the start image; product and presenter references remain separate. The second adult is specified in text, not supplied as an identity reference or pre-staged actor. The seven-second prompt requires entry → receiver grip/support → giver releases both hands → receiver alone holds. This is a living-thing–living-thing–object test, not an object–object collision test.

Prediction `7dz5cxr6mdrmt0d1tjz9eahxg0`, same image-input route. Processing took 100.33 s. Output: 1280×720, 169 frames, 24 fps, 7.041667 s; audio present. SHA256: `99f2bd0be73114fbc4d92d3cbd20b8f2a7533efbbf8c869ab3574fe951c69423`.

**Observed:** the man enters from camera-right and lowers himself beside the woman. She turns toward him and extends the single pair. Their hands share support around 3.5–4.7 s. At about 4.8–5.0 s she releases and withdraws her hands; by about 5.25 s her empty hands are on the table. The receiver alone holds and inspects the headphones through the end. All 169 contact crops and first/middle/last full-scene images were inspected. No gross duplication or disconnected limb was found in that inspection. Fine fingers, exact product surfaces/lettering and photometric consistency are not certified. Recipient identity consistency across other shots is untested.

The opening-frame product-region patch has zero whole-pixel translation and correlation 0.9970; whole-frame RGB difference averages 3.32/255. These are opening-frame comparisons, not interaction fidelity scores. Editable typography is placed over the empty lower-left tabletop to avoid the second actor. Physical interaction remains baked in the generated footage. Export retains all 169 frames at 24 fps; repeat frame 48 and source pixels outside the lower-left typography region have zero maximum RGB difference before encoding. A control edit changes 15,803 pixels; no page errors.

**Verdict: works with manual review for this transfer.** Completed release is now demonstrated once; it is not proof of repeatable multi-person choreography. The seven-second duration and different starting pose prevent treating this as a controlled comparison against the five-second pickup.

## Budget and durable evidence

Published image-input pricing was rechecked at $0.157/s for 720p. Five plus seven requested seconds estimated $1.884. Actual decoded durations total 12.083333 s, estimating **$1.8971** at the published rate (provider-rounded durations estimate $1.8972). Actual account billing was not retrieved. The round is closed to further submissions; the remaining estimate is below the minimum three-second image-input job. Each submission is guarded against retry after an ambiguous POST and linked to ordered input hashes and a job receipt. No third job is permitted in this round. Provider cost estimates are not a verified account ledger charge.

## Plan implications

- Preserve the distinction between `start_image` and an ordinary appearance reference. The observed placement benefit supports using an approved starting frame, without claiming an exact constraint or a controlled A/B model study.
- Freeze source/render binding, scene controls, frame/camera, snapshot and reference bytes/order before submission. Preserve the editable scene for another layout, and regenerate action when that layout changes.
- Acceptance must include the actual action beats. A good-looking pickup without heft, or two people holding without release, is not full instruction compliance.
- Source-bound masks/tracks must be regenerated for new take bytes. Existing masks from the earlier pickup cannot be attached to these new videos.
- Remaining: object–object contact, repeatability across seeds/takes, two identity-referenced subjects, multi-angle product fidelity, full-resolution edge annotations, native receipt/import/failure handling, stronger mixed human/product relighting and actual additional-computer benchmarks.
- Feature item 6 (camera solve) and feature item 13 (generated worlds) remain untested/deferred. Authored cameras, captured stills and generated videos are not evidence for either.

Primary provider reference: [Kling inputs and pricing](https://replicate.com/kwaivgi/kling-v4.0). Visual findings and timings above are local experiment observations.
