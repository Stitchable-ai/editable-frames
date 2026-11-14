# Validated imports and gated exports; crash recovery still open

> Superseded recovery status: numbered locks and bounded CLI job recovery are now adopted after fresh fault tests. The rejected proposal below remains historical evidence. [Current implementation and limits](hybrid-concurrent-recovery-2026-11-14.md).

2026-11-14 · FLOW1 remains partial

The worker reproduced corrupt imports, orphaned render resources, stale edit locks and export races on one Mac. Its full scratch patch is retained as a proposal. Coordinator review adopted only private-copy import validation and expected export identity checks. Automatic job recovery, stale-lock breaking, asset removal, runtime rehashing and the self-SIGKILL test hook are not adopted.

## Implemented subset

`asset-add` now copies into a private staging directory, hashes the copy, validates its declaration and JSON data, strictly decodes media with FFmpeg, and runs the existing preparation checks before publishing the manifest. Prepared-analysis receipts also validate referenced alpha media rather than taking the early data-only return in the worker proposal. A candidate whose source changes during copy is pinned under the copied bytes' hash. Existing immutable content is never overwritten. Normal validation failure cleans the staging directory and leaves project and manifest unchanged.

The final content file is installed before the manifest. A crash between those steps may leave unreferenced bytes. SIGKILL may also leave staging/decode directories and the old edit lock. No automatic sweep or lock breaking is enabled by this change.

`render --expect-revision R --expect-binding B` refuses a mismatched project snapshot before allocating output or launching a browser. Missing flag values are refused. These optional flags bind a caller's gate to the snapshot the renderer reads; they do not freeze arbitrary project files or external network resources. Hosts must compare output receipts with their own accepted take/ledger state before publication.

Imports now pay the validation/decode cost earlier. The worker measured a retained seven-second 720p import at approximately four seconds rather than 61 ms. This is worker evidence on one Mac, not a general performance guarantee.

## New finding: concurrent stale-lock recovery is unsafe

The coordinator reproduced a race in the worker's proposed lock recovery. Two contenders read the same dead owner. The first removes the stale lock and installs its live successor. The second then writes its stale-owner record over that new lock, archives it and acquires another lock. Both calls return success before either releases.

The reproduction deliberately controls filesystem scheduling in a scratch project, using the proposal's actual `acquireLock` function. It is not a timing-only suspicion and signals no processes. This blocks adoption of automatic lock breaking despite the worker's passing sequential recovery tests.

Additional proposal limits remain: process identity uses `ps` with second-resolution start time; imported job records are trusted to name same-user processes; Playwright artifact routing uses an undocumented launch option; Windows identity and preview recovery are untested. These are outside the adopted subset.

## Coordinator verification

Three regression tests cover valid video/audio/image imports, corrupt/truncated media and invalid JSON refusal, immutable IDs, invalid track data, derived frame-count mismatch, missing prepared-alpha references, copied-byte identity during a source change, and stale export rejection before output allocation. The full suite passes 140 tests and the required build passes. The stale-lock race above is retained separately as a failing proposal experiment. A fresh real-CLI smoke run also passed: media init, validated import, explicit rebind, stale-revision refusal, and three PNG frames whose receipt matches the expected revision and binding. This is a short CLI check, not a full native-app export.

The full worker suite reported 12/12 importer cases, 8/8 cancel/kill scenarios and 3/3 removal recoveries in its scratch patch. Those numbers are not tests of the adopted subset and are not carried forward as production coverage. Its partial-checkout regression baseline lacked website files; the coordinator used the full current SDK checkout instead.

## Still open

- Recovering SIGKILL leftovers without competing recoverers breaking a live successor's lock.
- Safe asset removal with useful history recovery and clear missing-asset errors.
- Runtime/source changes during bundling and live static paths outside pinned assets.
- Native desktop import/export integration, provider reconciliation, billing/idempotency and other hardware/platforms.

Existing projects require explicit rebind because the renderer implementation is part of runtime identity. All generated footage remains unchanged; these fixes protect the path that imports and exports it.
