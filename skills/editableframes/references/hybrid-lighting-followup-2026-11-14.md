# Moving product lights — resumed study, 2026-11-14

**Verdict: partial improvement in two local examples.** The resumed Opus study delivered eight before/after, hero/diagnostic clips. The coordinator independently reproduced sampled frames, individual control reversions and the principal region measurements. This does not approve either shot as a finished advert or establish a new native lighting feature.

> **Correction and follow-up:** [Independent refinement and corrected measurements](hybrid-lighting-refinement-2026-11-14.md). Diagnostic spheres contaminated three earlier regions; the coordinator reproduced those contaminated pixels too. The corrected figures below use refs-off hero renders. The screen-veil and palm-gradient explanations below are also revised. New path/flag and finite-source results supersede the pending-follow-up status, without establishing general production readiness.

## What changed

The current notebook's direct key light moved, but its environment reflection card stayed fixed. The experiment now couples card direction, colour and intensity to the key controls and captures the lit floor/backdrop into the reflection environment. A product-footprint contact term replaces the earlier ellipse, which faded before the front edge.

The café pastry received no light from the original practical lamp. Isolation renders show it behind the cup's shadow from that lamp. Removing the distance cutoff alone did not solve this. Moving the lamp between/behind the objects and reducing competing fill produces a visible pastry rim light. The revised set therefore differs from the original placement.

These are explicit source changes in retained experimental scenes. They are not automatic scene understanding or a generic learned relighting model. The photographed café backdrop is unchanged.

## Independently recomputed observations

Values are image-code measurements, not perceptual scores or calibrated physical illumination. The notebook rows use projected surface regions and the café rows use the documented object-support masks. Camera and product pose are held fixed while lighting varies; moving-object interaction is not tested by these clips.

| Measurement | Before | After | Interpretation |
|---|---:|---:|---|
| Left palm-rest luma range, refs-off full direction sweep | 1.58 | 20.46 | Corrected product-only response; earlier sphere-contaminated2.28→15.56 withdrawn |
| Right palm-rest luma range | 0.69 | 18.41 | More response to key direction |
| Chrome colour shift relative to wall shift | 0.035 | 0.493 | Reflection now follows changing light colour |
| Screen warm/cool colour shift | 0.19 | 0.23 | Emissive content is not simply tinted with the room |
| Resting screen luma | 46.63 | 60.24 | Unwanted veiling reflection raises the black level |
| Front contact strip / open floor luma, refs off | 0.991 | 0.909 | Corrected heuristic; earlier0.841→0.787 measured sphere/shadow contamination |
| Pastry warm/cool mean absolute RGB change | 0.000 | 3.042 | Mostly a narrow rim/back light |
| Cup warm/cool mean absolute RGB change | 0.873 | 1.150 | Front-face response is still weak |
| Photographed background maximum pixel change | 0 | 0 | No photographic relighting; both full 144-frame diagnostic sequences checked |

The coordinator decoded all eight MP4s: four notebook clips of 168 frames and four café clips of 144 frames, all 1280×720 at 24 fps. Fresh reverse-first samples, including the screen-glare interval, matched all **292** saved sequential hashes. All **26** individual control edits changed pixels and restored exactly immediately after each edit. No page/request errors occurred. These checks use one Mac/browser; no cross-device guarantee follows.

## Failures retained, and limits that remain

- A first notebook export had a reflection step when its moving key card passed behind a fixed emitter card. The first experiment forced the key card to draw over other emitter cards. The follow-up reproduces this with a nearby depth-tested emitter and then aligns its direction to the key. Single-probe parallax and uncalibrated emitter energy remain approximations.
- The display catches a broad glare during frames 28–46. The worker measured a peak mean screen luma around 129; coordinator still inspection confirms the visible contrast loss. Two black-flag placements did not materially reduce it. The completed follow-up avoids the observed glare with an elevated key path and a flag, keeping the display material unchanged. Its floor/reflection tradeoffs remain documented separately.
- **Withdrawn interpretation:** the earlier palm-gradient reduction was the diagnostic sphere. Refs-off gradient increases; the separate left-to-right deck contrast falls, largely due to the rim card according to the refinement study. Resting display veil comes primarily from a fill card, not the lit room.
- Contact darkening is a key-independent approximation. This does not establish area-light shadows, general indirect bounce, or mutual reflections among arbitrary products.
- The first café experiment has zero source size, so its pool and shadows are hard. The completed finite-source follow-up softens distant shadows while preserving tighter contact. The pastry receives a rim light and the cup front remains weak. Several strength/cutoff/placement attempts failed before the isolation diagnosis. The first placement cannot be called repaired merely because a later placement works better.
- The procedural notebook concept, scanned pastry and procedural cup are the only cases covered. Actual product-material fidelity, the desktop and other product classes remain unverified here.

## Current decision after independent refinement

Keep the coupled-light/reflection approach as an explicit authoring option. The [completed follow-up](hybrid-lighting-refinement-2026-11-14.md) tests an unchanged-material glare-avoiding path, labelled finish alternatives, finite-source shadows and a separate front-side lamp placement. Keep LIGHT1 partial: reflective practical lights, floor/display tradeoffs, moving objects, native integration and broader hardware remain open.

The original quota interruption and failed attempts remain retained. No new hosted-model calls or paid assets were used.
