# Scene staging → generated interaction → editable final composition

2026-11-14 · FLOW1 remains partial · local replay, no new provider request

The local round trip now has a concrete example: an editable staging scene produces a frozen reference packet, two retained interaction takes return as baked media, and live code overlays remain editable in the final film. This is a useful interoperability slice, not an integrated provider or native-app workflow.

## Ownership determines what an edit can do

| Requested edit | Local operation | Consequence |
|---|---|---|
| Headline, caption, accent, CTA or cue timing | Edit live overlay controls and export | Generated takes and their input packets stay unchanged. |
| Crop or trim the shot | Resample/cut the whole baked frame | Cannot reveal hidden content or independently move the product. |
| Change staged product position, grip or contact | Freeze a revised scene packet | Existing take becomes stale; a dependent handoff becomes stale too. Keep old accepted output available. |
| Change only the handoff action prompt | Freeze a new handoff packet | Pickup can stay fresh; handoff needs replacement and review. |
| Change a filmed face, light direction or physical interaction | New capture/generation or separately validated VFX work | The current importer has no recovered geometry or independent controls for these baked pixels. |

The tested preference is joint generation for difficult photorealistic interaction, not a claim that code or traditional animation cannot ever produce it. Exact text/UI remain code-controlled. Opaque products with usable geometry can remain rendered. Nested transparent materials may need an offline renderer. A generated shot can be combined with these routes while retaining an explicit record of which layers are editable and which are baked.

## Replay provenance and timing

Both takes are retained outputs from the earlier successful pickup and handoff tests. The replay importer verifies original request/receipt/status/download records, model, prompt, ordered references, job identity and downloaded bytes. It labels each import `retained-replay`, `newlyGenerated: false`, with no transport. It handles the observed status output field as either a string or list.

The staging CLI reproduces the submitted start-image bytes. The handoff start image derives from pickup frame 120, creating an explicit dependency. The resulting film has 121 + 169 = 290 frames at 24 fps, or 12.0833 seconds. A half-second trim at each end produces 266 frames. Requested generation duration is not substituted for actual decoded timing.

Packet identity covers provider inputs, while source revision and binding remain provenance. An undo that restores the exact start-image pixels can restore freshness despite a changed editor revision. This is intentional; a renderer revision alone does not imply the provider saw different pixels.

## Exporter fixes found by the exercise

1. The portable renderer adapter dropped `scene.media`. Audio ports therefore never reached the existing scheduler, producing silent exports. The adapter now preserves explicit media declarations.
2. Unity-speed audio passed through `atempo=1`. That unnecessary time-stretch shifted the retained soundtrack locally. Unity rate now uses `anull`; non-unity rates retain the existing tempo chain.

Regression coverage schedules portable-renderer audio through offsets, trim, mute and speed, and runs real PCM through the mixer to check sample alignment after trim and delay. Explicit static media declarations are supported; arbitrary DOM audio, animated audio automation and automatic renderer-prop-to-audio binding are not implied. Existing projects need an explicit rebind after this runtime change.

## Evidence and limits

The worker reports full CLI render/edit/undo/redo checks, 290 exact source-frame comparisons with overlays disabled, overlay edits confined to their masks, 96 seek comparisons, and 19 fault/interoperability tests. These worker results remain distinguishable from the coordinator's new checks listed below. Original failed exports and proposed patches are retained.

Coordinator source review found and reproduced an additional packet bug: deleting or reordering reference descriptors, changing their role, or substituting both hash and storage path could pass `load_packet`. It checked each descriptor against itself but not against the identity-hashed ordered list. The coordinator copy now compares the entire ordered descriptor list (excluding storage paths) with packet identity; all four mutations are rejected. The original worker result is therefore not general tamper coverage. This patch is research-only, pending native integration.

The coordinator also reran five retained-record/restart/crash checks successfully. The public library passes all 137 unit tests and its required build. A new real-PCM mixer regression compares 36,000 sample frames with zero code error after trim and delay. The fresh preview path matches 48 shuffled/reverse frames to retained hashes and restores all three control changes exactly.

Coordinator verification is recorded beside the research artifacts. Its corrected example holds the CTA through the final frame and uses a smaller, top-preserving crop to avoid the original headroom error. Both changes are local edits to the composition, not new generation.

Neither reviewer listened to audio or watched normal-speed playback. Audio alignment is statistical; decoded frames and deterministic seeks do not certify perceptual acting or product fidelity. The take-to-take texture change still needs playback review. The full-film audio has zero measured lag in every audible one-second window (minimum correlation 0.999), including across the cut. AAC decoding includes a small padded tail; its decoded sample count is not treated as a changed picture duration.

## Remaining gaps

- The wrapper is research code: provider reconciliation, billing/idempotency, native UI/import and atomic managed-asset ownership are not implemented by this study.
- CLI `asset-add` can accept undecodable media. This wrapper probes first, but it does not repair the general importer. Removal/recovery still needs a supported transaction.
- A SIGKILL can leave decoded frames and orphan browsers. No partially published movie was observed; crash cleanup remains open. Graceful cancellation and uncatchable process death are separate cases.
- Frozen local references do not constitute a complete host authorization system; races and multi-owner durable import need separate work.
- The wrapper checks freshness before acquiring the render lock; it is not an atomic staging/ledger/export snapshot across concurrent editors. The recorded gate must not be presented as such.
- No additional hardware was exercised. No proof that a new provider request would reproduce these retained outputs follows from a successful replay.

## Coordinator failure retained

The first coordinator crop test assumed 60,000 timeline ticks per second rather than reading the actual exported `HZ = 120000`. It produced 133 frames and failed audio alignment against the intended trim. The failed file and script are retained. The corrective script reads the library constant and asserts the requested 266-frame result before accepting it. This was a harness error, not a media-timing defect in the library.

## Final coordinator acceptance in this scope

Both full public-CLI exports passed: 290-frame full film and corrected 266-frame crop/trim, each with two audio tracks mixed. Both have zero measured audio lag; the full film has 0.99938 overall waveform correlation and 0.99985 around the cut. The corrected crop has correlation above 0.99. A fresh product move marks both pickup and dependent handoff stale; undo restores freshness. All four reference-descriptor adversarial cases are rejected after the research-copy fix. The unity-speed PCM regression also fails against the old filter chain, so it detects the original defect.
