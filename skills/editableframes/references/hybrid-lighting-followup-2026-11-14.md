# Moving product lights — resumed study, 2026-11-14

**Verdict: partial improvement in two local examples.** The resumed Opus study delivered eight before/after, hero/diagnostic clips. The coordinator independently reproduced sampled frames, individual control reversions and the principal region measurements. This does not approve either shot as a finished advert or establish a new native lighting feature.

## What changed

The current notebook's direct key light moved, but its environment reflection card stayed fixed. The experiment now couples card direction, colour and intensity to the key controls and captures the lit floor/backdrop into the reflection environment. A product-footprint contact term replaces the earlier ellipse, which faded before the front edge.

The café pastry received no light from the original practical lamp. Isolation renders show it behind the cup's shadow from that lamp. Removing the distance cutoff alone did not solve this. Moving the lamp between/behind the objects and reducing competing fill produces a visible pastry rim light. The revised set therefore differs from the original placement.

These are explicit source changes in retained experimental scenes. They are not automatic scene understanding or a generic learned relighting model. The photographed café backdrop is unchanged.

## Independently recomputed observations

Values are image-code measurements, not perceptual scores or calibrated physical illumination. The notebook rows use projected surface regions and the café rows use the documented object-support masks. Camera and product pose are held fixed while lighting varies; moving-object interaction is not tested by these clips.

| Measurement | Before | After | Interpretation |
|---|---:|---:|---|
| Left palm-rest luma range across sampled key directions | 2.28 | 15.56 | More response to key direction |
| Right palm-rest luma range | 0.69 | 18.41 | More response to key direction |
| Chrome colour shift relative to wall shift | 0.035 | 0.493 | Reflection now follows changing light colour |
| Screen warm/cool colour shift | 0.19 | 0.23 | Emissive content is not simply tinted with the room |
| Resting screen luma | 46.63 | 60.24 | Unwanted veiling reflection raises the black level |
| Front contact strip / open floor luma | 0.841 | 0.787 | Darker grounding, from an approximate contact term |
| Pastry warm/cool mean absolute RGB change | 0.000 | 3.042 | Mostly a narrow rim/back light |
| Cup warm/cool mean absolute RGB change | 0.873 | 1.150 | Front-face response is still weak |
| Photographed background maximum pixel change | 0 | 0 | No photographic relighting; both full 144-frame diagnostic sequences checked |

The coordinator decoded all eight MP4s: four notebook clips of 168 frames and four café clips of 144 frames, all 1280×720 at 24 fps. Fresh reverse-first samples, including the screen-glare interval, matched all **292** saved sequential hashes. All **26** individual control edits changed pixels and restored exactly immediately after each edit. No page/request errors occurred. These checks use one Mac/browser; no cross-device guarantee follows.

## Failures retained, and limits that remain

- A first notebook export had a reflection step when its moving key card passed behind a fixed emitter card. The final experiment forces the key card to draw over other emitter cards. That removes the observed step but remains a rendering approximation, not physically correct general emitter visibility.
- The display catches a broad glare during frames 28–46. The worker measured a peak mean screen luma around 129; coordinator still inspection confirms the visible contrast loss. Two black-flag placements did not materially reduce it. A different light path or an explicitly chosen display coating needs a matched follow-up.
- The lit floor fills the left palm-rest reflection, reducing its resting spatial gradient even while directional response improves. Greater response is not automatically a better hero image.
- Contact darkening is a key-independent approximation. This does not establish area-light shadows, general indirect bounce, or mutual reflections among arbitrary products.
- The café lamp has zero source size, so its pool and shadows are hard. The pastry receives a rim light and the cup front remains weak. Several strength/cutoff/placement attempts failed before the isolation diagnosis. The first placement cannot be called repaired merely because a later placement works better.
- The procedural notebook concept, scanned pastry and procedural cup are the only cases covered. Actual product-material fidelity, the desktop and other product classes remain unverified here.

## Next decisions

Keep the coupled-light/reflection approach as an explicit authoring option, with the current limitations exposed. Do not promote it to a universal default from these two cases. Review the environment-card approximation and screen tradeoff independently, then test either a glare-avoiding key path with unchanged material or a clearly labelled anti-glare material variant. A finite café light source and front-side composition need a separate test.

The worker's original quota interruption remains in the attempt history. This resumed delivery supersedes the “baseline only” status. No new hosted-model calls or paid assets were used. Independent Fable review of this delivery is still pending.
