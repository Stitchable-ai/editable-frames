# Notebook glare and finite café lighting — corrected evidence, 2026-11-14

**LIGHT1 remains partial.** A second implementation removes the notebook's glare with the display material unchanged, gives the café lamp a finite size, and tests a separate composition that lights the cup front. These are opt-in authored scenes, not automatic lighting or a new framework default. No paid calls were made.

## Correction to the earlier report

The coordinator's earlier independent recomputation used the same diagnostic images as the first worker. Reference spheres and their shadows cover roughly **40% of the left palm region, 48% of the front lip and 49% of the contact strip**. Recomputing those pixels did not independently validate that the regions measured the intended surfaces. Retain the original evidence, but supersede the affected interpretation and values.

With reference spheres hidden, the 0–95-frame direction sweep gives left palm response **1.58 → 20.46** codes, front lip **23.43 → 39.45**, and resting contact/open-floor ratio **0.991 → 0.909**. The prior 2.28 → 15.56 palm result and 0.841 → 0.787 contact result are not valid product-only measurements. The corrected sweep also uses the full declared direction interval rather than sparse still samples. A projected contact-region ratio remains a heuristic, not a physical contact measurement.

The earlier claim that the lit floor reduced the palm's spatial gradient is withdrawn. The reference sphere caused that observation. The second worker finds that the separate left-to-right deck contrast decreases, largely because of the rim card; that limitation remains.

Saved isolation renders also correct the resting screen-veil diagnosis: removing the lit room changes mean screen luma by only **−0.02**, while hiding one static fill card changes it by **−15.12**. The coordinator reproduced those values. The earlier flags were behind the fill card from the reflection probe's viewpoint.

## Notebook: fix the light path before changing the product

The key's reflection card was below the direction of its direct light. The new scene aligns their azimuth and elevation, uses a depth-tested nearby card, raises the key as it crosses the screen's mirror direction, and places a black flag in front of the offending fill card. Camera, product pose and display material remain fixed in the comparison.

| Delivered hero-clip measurement | Previous experiment | Path plus flag |
|---|---:|---:|
| Peak screen luma, all 168 frames | 129.20 | 40.17 |
| Resting screen luma | 59.24 | 39.98 |
| Largest adjacent-frame screen RGB change | 11.76 | 0.037 |
| Left palm direction-sweep range | 20.46 | 19.87 |
| Right palm direction-sweep range | 18.45 | 17.76 |
| Floor direction-sweep range | 3.02 | 19.71 |

These are coordinator recomputations from lossless exports, with reference spheres hidden. Values are 8-bit image codes, not calibrated radiometry or perceptual scores. The emission-only display pixels match exactly, so this result does not recolour the UI artwork.

The improvement has costs: the elevated light brightens the floor, and the very low remaining screen reflection can make the display look pasted on. A path-only alternative retains more glass reflection but also retains the resting veil. The worker also rendered explicitly labelled anti-reflective and matte finish variants: anti-reflective reduces but does not eliminate glare; matte retains glare and takes the key's tint. Neither is evidence about a real manufacturer's coating.

The worker's near-card comparison supports a narrower explanation of the old forced overdraw: it approximates a key emitter nearer than the other cards. That does not make the rig physically complete. Single-probe parallax, independently scaled direct-light/card energy, camera-invisible cards and flags that cast no shadows remain limitations. A convincing view at one fixed pose is not general light transport.

## Café: source size and placement solve different problems

The finite source averages 64 deterministic light-position renders in linear light before tone mapping. Each sample has its own shadow visibility. This produces wider shadows far from the caster while keeping contact tighter; it is not a uniform post-render blur.

| Shadow transition, fixed scanline | Point source | Finite source |
|---|---:|---:|
| Cup shadow on plate | 0.84 px | 23.92 px |
| Cup shadow on cloth | 0.82 px | 27.89 px |
| Pastry contact shadow | 0.86 px | 4.79 px |

Softening the source in the same composition does **not** solve weak front illumination. Moving the lamp to camera-side right is a separate, declared composition change.

| Warm/cool mean absolute RGB response | Previous lamp | Finite source, same position | Finite source, front-right |
|---|---:|---:|---:|
| Cup | 1.15 | 1.46 | 40.72 |
| Pastry | 3.04 | 2.60 | 8.69 |
| Chrome reference | 0.00 | 0.00 | 0.10 |

The chrome result exposes an unresolved problem: the lamp is effectively absent from reflections. The photographed background is unchanged in the checked region across all three full 144-frame clips. It has not been relit. The foreground lamp is visually large, the cup becomes a flat saturated orange under warm light, and the pastry still sits partly in the shade's penumbra.

## Verification and measured limits

The coordinator reproduced **96 fresh frame samples across six refined hero/diagnostic clips**, and **21 individual edits/restorations**, with no page/request errors. Independent recomputation decoded all frames of three notebook and three café lossless clips: **936 frames**. The worker separately reports 1,065 repeat samples, 61 control checks, and successful decoding of all 11 full clips and 14 delivery files. Those wider counts are worker evidence, not a second coordinator rerun.

Worker capture receipts report about 13.3 seconds for a 168-frame notebook hero and 40.9–41.8 seconds for the 144-frame finite-source café heroes on this Mac. These are end-to-end capture observations for these scenes, not interactive frame-rate or ordinary-computer guarantees. The finite-source method performs 64 renders per output frame.

Visual review used before/after images and contact sheets; no normal-speed viewing or listening claim is made. Product fidelity, moving camera/product interaction, other materials and other hardware remain untested here.

## Updated acceptance

Close only these scoped subchecks: avoid the observed notebook glare on this fixed-pose light path without changing its display material; produce source-size-dependent café penumbrae; demonstrate useful cup-front response after an explicit lamp move. Keep overall LIGHT1 partial. Next work must address reflective practical lights, floor/display tradeoffs, moving products and hardware cost before making this a general default.
