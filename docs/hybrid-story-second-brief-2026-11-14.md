# Second action brief: carry and set down — 2026-11-14

**ST2–ST3 remains partial, with a clearer reuse boundary.** Two new 14-second films use the same cast in sci-fi and toy/clay settings. The character lifts a tray with both hands, turns 90 degrees, walks to a table, lowers the tray, releases it and looks toward the other actor. Both films are 1280×720, 24 fps, with 336 frames and local synthesized dialogue. No paid model calls were used.

## What this changes in the plan

The characters, limb solver, restyling, proportions, gaze tools, render pipelines and typography transferred without changes. **The action did not.** The second brief required a new 23.7 KB choreography module, a tray-specific grip and new contact probes; each style also needed roughly 10 KB of prop/set/camera source. A copied walking module needed a change to start from rest.

This supports reusable **cast, rig and look modules**, plus authored per-shot action code. It does not establish a general action library that accepts arbitrary “pick up” or “set down” instructions. Do not report source imports as proof that the first brief's action machinery was reused: the old story module appears in the import graph but does not execute here.

The new clay grip is clearer in close-up, but this is **not a same-prop repair**. The earlier rocket is replaced by a tray with a rim and runners that leave space for the fingers. The new hand clamps the end wall, hooks fingers underneath and puts its thumb over the rim. The tray rests before the thumb lifts and fingers slide out. A plain box flush on a table cannot be released with this geometry.

## Evidence and independent checks

| Check | Sci-fi | Clay | Meaning |
|---|---:|---:|---|
| Coordinator fresh frame samples | 40/40 | 40/40 | Saved sequential hashes reproduced across cuts and contact transitions. |
| Individual controls, changed then restored | 10/10 | 10/10 | Same Mac/browser; visible-frame tests. |
| Fully decoded video | 336 frames / 14 s | 336 frames / 14 s | Stereo audio also spans 14 s; no listening review. |
| Fresh geometry-probe replay | 336 match | 336 match | Node recomputation matches browser probe records; uses the worker's scene/probe implementation. |
| First table contact / last both-hands hold | 215 / 223 | 216 / 224 | The authored release follows measured table contact. |
| Unsupported frames under declared mesh rules | 0 | 0 | Geometric support classification, not forces or balance. |
| Minimum sampled hand/table clearance | 5.34 mm | 6.81 mm | Fingers have room under the tray ends. |

The coordinator also deliberately perturbed the actual settled tray in each scene. Lifting it 20 mm produces a roughly +20 mm runner gap; sinking it 20 mm produces −20 mm; moving it off the table produces zero supporting ray hits. The original poses have full runner-vertex support. These six fault cases and two resting baselines show that the table check can detect these errors; they do not validate all contact configurations.

The worker separately exercised real CLI exposure and contact-zoom edits on four sampled frames per style, stale revision refusal, two undos and two redos. Its receipts report exact pixel restoration. That CLI run was inspected, not rerun by the coordinator. It covers two controls on sampled frames, not full-film/audio export or the native app.

## Better probes, still bounded

The earlier grip check read the solver's own targets. The new contact checks use actual geometry: rays from runner underside vertices to table triangles, and sampled hand surfaces against bounding boxes derived from tray vertices. The coordinator verified that the tray-part transforms in the delivered poses are unit scale, so the reported local-distance units are applicable there.

Sampling can miss crossings between samples. Clay's lumpy meshes lie inside their boxes; its runner surface varies by about 1.83 mm. The tests do not model friction, force, character balance, hand-to-hand contact or hand-to-body contact. The worker's zero target-readback error remains explicitly excluded from contact acceptance.

The retained failed pass matters: the first clay stand was too narrow, leaving runner vertices unsupported by about 4.7 mm at each end, despite passing seek tests. A separate geometry check caught it. Another correction raised the tray about 1.3 mm to avoid sinking into the lumpy table. Failed output and records remain retained.

## Visual decision

Close inspection shows a thumb over the rim and fingers under the edge, with no workbench visually behind the airborne tray. Those contact-zoom views are new camera renders of the same state, **not frames from the delivered film**. In the film each hand is only about 40–50 pixels high, so finger contact is harder to judge. Wrist bends, uniformly hooked fingers, rigid limbs, painted faces and limited downward gaze remain visible limitations.

The coordinator inspected comparison sheets and source, not normal-speed motion or audio. The new action is more explicit, but keep natural performance and film-scale grip readability partial. The second actor does not share the load; two-person contact is not tested by this brief. Village, sitting, arbitrary props and additional hardware remain untested.

## Next engineering boundary

Separate reusable cast/rig/look from per-shot choreography, grip-specific geometry and validation. Require both a geometric contact check that responds to deliberately bad placements and an actual-film visual check. Avoid making props convenient for the solver without disclosing that constraint. Keep realistic interaction generation and authored stylized animation as separate production routes; this study does not replace either with a universal interaction solver.
