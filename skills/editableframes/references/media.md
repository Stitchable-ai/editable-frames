# Media and transparent clips

Use `init DIR --media` for a working local-media example. It generates a synthetic test MP4 and tone; do not call it a human avatar. For user footage, `asset-add DIR ID FILE` copies and hashes the source. Run `rebind DIR`, then change the port anchor asset ID to the imported ID. Existing IDs are immutable so older edits retain their source.

Declare `template.media` ports using `{anchor,bindings:{asset:"asset",sourceIn:"in",offset:"delay",rate:"speed",gain:"gain",muted:"mute",end:"end"}}`, or literal values. The renderer receives resolved `ports` and `host`. Await `host.portFrame(ports.presenter,time)` and draw its returned image if non-null. Templates can use any compatible drawing library; the media port does not dictate layout. Audio is mixed once per audible port, automatically. Mark audio-control properties `keyframe:false`; beta 1 explicitly refuses animated audio-port controls.

Clear the rendering surface to retain alpha; do not paint a background unless requested. `render DIR overlay.mov` uses transparent ProRes 4444. `render DIR frames --format png` preserves RGBA and writes audio.wav if needed. MP4 flattens onto `--background #101922`. Inspect decoded output, not only preview checkerboards. Use `--fps 30000/1001` for rational rates.

Project browser edits persist to disk using the same revision checks as CLI proposals. Reload disk after a conflicting writer. Source changes require explicit rebind; preserve the archived old project before choosing --reset for an incompatible schema. Beta runtime executes trusted local source; no untrusted-code sandbox is implied.
