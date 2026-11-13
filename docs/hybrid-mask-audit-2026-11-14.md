# Hair-mask audit across replacement backgrounds

Status: **partial**. Coordinator audit; the requested Fable review hit its provider rate limit before producing an artifact. No Fable approval is claimed. No paid calls.

## Controlled evidence

96 retained frames at 25 fps, cropped to the same head region, are composited over pale yellow, white, dark brown, magenta and a checker. Four columns compare old support alpha, full-resolution/context alpha, repaired alpha and a half-strength repair. All columns use **identical raw RVM foreground RGB** and linear-light straight-alpha composition. This isolates the mask; it deliberately does not reproduce the earlier full repair's RGB averaging.

PNG inputs and stills add no intermediate loss. The underlying inference used retained JPEG source frames; this audit does not undo that compression or rerun inference. Backgrounds are diagnostic swatches, not new realistic room scenes. All five MP4s decode successfully (96 frames each, 3.84 seconds; no audio). The saved contact sheet shows frame 47 on every background; selected frames were visually inspected, not every frame in real-time playback.

| Mask | Adjacent motion-compensated alpha residual |
|---|---:|
| Old support | 0.03500 |
| Full-resolution/context | 0.02198 |
| Temporal repair | 0.01372 |
| Half repair trial | 0.01720 |

The same shared nine-pixel boundary band and forward/backward flow check are used for all methods. The full repair reduces this residual by 37.6% against raw; half repair by 21.8%. **These are temporal stability measurements, not annotated hair accuracy.** Small differences from the earlier 0.01366 follow recomputation from quantized saved masks rather than pre-save float arrays.

With foreground RGB held fixed, repair-versus-raw boundary RGB differences average 1.55 codes on white versus 0.20 on dark brown (7.7×), 1.15 on yellow, 0.73 on magenta and 0.78 on checker. This measures sensitivity to the same alpha edit, not error against ground truth. Dark backgrounds conceal much of the difference. At frame 47 the old support produces conspicuous missing/contaminated curl regions; all newer masks improve that still, but faint edge haze remains visible on white.

## The remaining risk

The full repair changes alpha by up to 0.145 after quantization; half repair caps this at about 0.073. Both preserve the raw alpha of pixels >=0.99 exactly. Boundary opacity can be added or removed: the full repair changes net alpha mass by up to about 117 pixel equivalents in either direction. That is not a count of correctly recovered hairs.

An analytic counterexample tests the exact temporal correction formula with perfect correspondence: a true one-frame disappearance (center alpha 0; four neighbors 0.55) becomes alpha 0.144 with full repair and 0.072 with half repair. This is a synthetic test of the correction stage, **not an observed 0.144 ghost in the real clip**; optical-flow validity may reject such samples. It establishes why improving stability alone cannot approve the filter. The half-strength trial trades less change for less smoothing; it is not selected as a superior default.

## Decision and next gate

Keep soft mattes independent of hard SAM support at fine hair. Validate each replacement on light and dark backgrounds. Keep repair strength editable and retain the unfiltered matte. Do not silently choose aggressive temporal smoothing from its own stability score. Before closing MASK1, use annotated fast curls/disocclusions and compare detail, lag and false opacity separately; isolate inference context/resolution/source preparation, and review normal-speed clips. No new general grasp/pointing claim follows from this work.

The glass worker also reached its rate limit. Its raster and Cycles stills and diagnostic sources were retained, but it stopped while diagnosing dark submerged ice. There is no completed calibrated comparison, motion clip acceptance or approved transparency route from that interrupted study.
