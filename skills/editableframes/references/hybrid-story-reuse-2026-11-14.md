# Reusable cast across three styles — 2026-11-14

> **Second-brief follow-up:** [Carry, turn, set down and release](hybrid-story-second-brief-2026-11-14.md) now tests the cast in two styles on a different action. Cast/rig/look transfer; action, grip and probes needed new code. This first-brief report is retained as the earlier result.

ST2–ST3 advances from quota-blocked to **partial, with rendered evidence**. Three 12.5-second films reuse the original fantasy cast in a sci-fi repair bay, a cel-shaded village and a toy/clay workshop. Each is 1280×720 at 24 fps, with 300 frames, captions and local synthesized voices. No hosted-model calls were made.

## What actually transfers

The baseline character modules are imported by reference. New shared modules provide limb inverse kinematics, foot-planted walking, restyling and an explicit action clock. Each style supplies its own set, camera direction, materials, proportions, prop, light and motion treatment. These are authored source modules, not a new SDK style-generation feature.

The important contact decision is **prop first, hands second**: author one world-space prop trajectory, then solve both characters' hands onto its grip sites. This avoids independent hand/prop animations disagreeing about where the object is. It does not infer arbitrary interactions from a prompt or guarantee collision-free bodies.

| Film | Distinct treatment | Visual limit seen in contact sheets |
|---|---|---|
| Sci-fi | Reflective suits, emissive trim, repair bay, smooth motion, side grip on a power cell | Wrist bend and rigid fingers remain obvious; heads tilt steeply toward the prop. |
| Village | Banded toon shading, ink contours, outdoor sun, stepped poses, overhand basket grip | Table overlaps the exchange in projection; faces are cropped during the contact close-up. |
| Toy/clay | Shorter legs, larger heads/hands, textured matte surfaces, poses on threes, depth of field, underhand toy cradle | Flat hands read as paddles; workbench overlaps the prop; release is low in frame. **Not accepted as a convincing grasp.** |

The coordinator agrees that sci-fi and village communicate the handoff more clearly. This is contact-sheet inspection, not a normal-speed playback or soundtrack listening review. The three films demonstrate a range of looks on **one action brief**, not general character portability or a production-ready animation system.

## Independently checked delivery

| Check | Coordinator result | Scope |
|---|---|---|
| Fresh frame reproduction | 102/102 sampled hashes match the saved sequential renders | Reverse-first and scattered samples, including both cuts and contact transitions; same Mac/browser. |
| Individual controls | 27/27 declared controls visibly change and restore the sampled frame | One caption test initially selected a speech pause at frame 150. That observation is retained; the corrected sci-fi test at frame 120 passes during visible speech. |
| Media decode | All 900 frames decode without errors | Three 12.5-second 1280×720/24 fps files; stereo audio duration also 12.5 seconds. No listening claim. |
| Actual CLI edits | All three style specimens pass | Source frames 30, 120 and 244 per style; exposure edit changes all nine samples, stale proposals are refused, undo restores exact PNG bytes. |

The CLI result extends the worker's renderer-host-only evidence. It does not cover full-film audio export, every control through the CLI, revision migration after source changes, native desktop delivery or another GPU.

## Contact evidence: useful but not independent ground truth

The worker reports no unsupported prop frames, no unreachable limb targets and minimum sampled digit clearances of +0.01, +0.03 and +0.02 mm for sci-fi, village and clay. Reported shared holds last roughly 0.75–0.79 seconds. Earlier retained attempts reported thumb penetration of 21 mm, finger penetration of 19 mm and unreachable walking legs by 24 mm; revised approach paths, closure and pelvis motion remove those reported failures.

These values come from the authored scene and simplified probes. Digit spheres are checked against approximate prop capsules; palms, body intersections and prop-to-set contact are not tested. Zero grip error reads back the solver's own target, so it is not independent proof of contact. The coordinator verified pixels, controls and delivery, not a separate mesh-collision simulation.

The clay film passes the automated checks and still looks wrong. Keep numerical integrity, visible grasp quality and reuse breadth as separate acceptance gates.

## Next decision

Keep ST2–ST3 partial. Before moving these modules into a supported library, exercise a second brief that changes the action structure: turn, carry with two hands, set down, release and look toward the recipient. Require object-to-set and palm contact checks, dedicated grip shapes and wider framing. Preserve failed trials. Continue to treat realistic human/product interactions as a jointly generated shot where appropriate; authored stylized contact is a distinct route with different quality limits.

Audio listening, facial performance, skinning, cloth, large turns, sitting, third actors, broader hardware and full native integration remain open. Camera solve and reconstructed worlds are unchanged by this study.
