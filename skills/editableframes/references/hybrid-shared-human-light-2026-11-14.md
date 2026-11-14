# One light track, different kinds of foreground

2026-11-14 · HUMAN1 remains partial · research renderer, no native relighter

A continuous editable light track can coordinate a rendered product, a footage presenter, and an authored counter plane. That does not give these layers equal relighting capability. The 3D product uses geometry and materials; the presenter receives a bounded image correction using estimated depth; the photographed room retains its baked illumination.

## What was actually tested

One retained generated presenter, one 96-frame excerpt at 25 fps, one laptop GLB, and one photographed room on one Mac. No new media generation, downloads or paid calls. The presenter matte is reused unchanged. DPT depth supplies approximate normals; camera, subject depth, ambient share and white balance are authored assumptions. The baked-light fit uses face rows, despite its metadata saying face/neck.

The worker compares untouched footage, a prior colour/exposure match, and a bounded additive correction using the depth proxy. A synthetic bust with known normals supplies a reference for the algorithm. It is not a human-face reference.

| Synthetic bust, front hemisphere | Prior match error | Depth-proxy error |
|---|---:|---:|
| Lamp at half house light | 12.9 codes | 6.5 codes |
| Lamp equal to house light | 24.9 codes | 11.0 codes |
| Lamp becomes key, house at 30% | 53.1 codes | 20.3 codes |

These worker-reported averages are 8-bit image-code errors on the synthetic control. The reported “share” is error reduction relative to leaving the source unchanged, not the fraction of physically correct illumination or a human realism score. Estimated normals are roughly 19–23 degrees off on synthetic skin and 40 degrees off on curls.

## The operating range is not validated

The worker proposes half-house light in the front hemisphere as a starting range. Coordinator inspection of the saved nonideal-bust grid finds only **3 of 7 front directions** pass the worker's combined criterion (error at most 8 codes and error reduction at least 0.6). Passing angles are -60, +60 and +90 degrees in that experiment. They must not become a universal whitelist.

The human clip named “supported” peaks at approximately 0.78 times the dimmed house light, above the proposed 0.5 starting bound. It is an edge-case demonstration. It is not a validated safe preset. A native guard cannot approve arbitrary footage solely from lamp ratio and direction.

## Visible gains and failures

The milder example warms the lamp-side cheek, neck and hand while dimming the far side. The coordinator inspected the comparison at frame 62. The stronger example at frame 95 has a hard lit patch and an unnatural grey region beside the nose; its baked key remains visible. The worker reports about 9% loss of fine facial contrast in the milder example.

The first track lacked highlight headroom and pushed about 51% of measured head/neck skin pixels above 250. Dimming the room in the final track is an art-direction change, not recovered source detail. No algorithm here restores clipped source information. Hair response remains inadequate; small proxy improvements in some numeric cells do not establish useful hair relighting.

No new presenter shadows, product-to-presenter shadows, hair transmission, or relocated highlights are created. The lamp globe itself is absent from product reflections; only its analytic highlight is present. The counter is a proxy-plane correction over baked pixels. The room photograph responds only to uniform house exposure unless an explicitly authored wash is enabled.

## Verification

The worker reports 284 repeat-seek comparisons, 78 edit/restores, five fresh mounts and a four-frame real CLI history test. A first fresh-mount failure caused by GLB draw order was fixed and retained. The coordinator independently decoded all 13 preview files (96 frames, 25 fps, silent), audited the saved operating-range grid, and checked the CLI success receipt. The coordinator has not rerendered the shader or independently measured the human accuracy. Neither review watched normal-speed playback; there is no target-light reference for this presenter.

## Routing rule for the plan

- Geometry with materials: use an editable renderer and shared light track; validate reflections, shadows and exposure for the shot.
- Footage with mild lighting changes: retain bounded correction as experimental, with source/proxy provenance, explicit limitations and visual review. Do not advertise general relighting.
- New key direction, cast shadows, hair glow, moving highlights or lost headroom: use a suitably captured/relightable asset, validated VFX, or a regenerated take. Merely having normals would not solve every material and visibility problem.
- Performance involving mutual contact or shadows: joint generation is a candidate from the earlier interaction tests, not a result tested in this light experiment. Preserve identity/product review and keep typography/UI live afterward.

The light controls are continuous values, not a finite list of presets. The limitation is how much information each layer contains. Code is not inherently unable to depict the effect; ordinary RGB footage does not identify the geometry, material and lighting uniquely.

## Next resources and work

A real paired-light capture or a relightable subject with independently known passes is needed to score human accuracy. Another presenter and exposure range would test generality. A prepared-pass contract should record pixel ownership, source hashes, frame clock, proxy confidence and baked-light assumptions. Its acceptance policy must distinguish unsupported from unmeasured; a deterministic render is not a quality certificate.
