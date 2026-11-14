# Concurrent crash recovery: adopted with a bounded platform scope

2026-11-14 · FLOW1 remains partial · three additional scoped checks resolved

The SDK now uses numbered lock generations for edits/imports and a private job registry for CLI render recovery. This replaces the rejected stale-file deletion proposal. The coordinator applied Fable's replacement to the current SDK, fixed a mutating dry run, added cancellation regressions, and reran real-process fault tests before adoption. This does not close native-app or provider integration.

## What changes for the user

- Interrupting `asset-add` with Ctrl-C cancels its decoder, removes its staging files and leaves the project editable. SIGTERM and SIGHUP follow the same cleanup path.
- After a killed edit/import, the next edit can take over a provably dead owner's numbered lock without deleting a successor's lock. An orphaned decoder is not signalled; its files remain until it exits and a later edit cleans them.
- Each CLI render records its owned temporary locations before allocating them. The next render attempts recovery for that project. `recover DIR` performs the same recovery explicitly.
- Automatic recovery sends no signals. A dead job with running children is left intact and reported. `recover DIR --stop-browsers` explicitly requests SIGTERM for that job's verified orphan browser; it never uses SIGKILL.
- `recover DIR --dry-run` only reports. The coordinator found that the proposed version created registry/lock files; the adopted version does not create, acquire, reclaim or release anything.
- Published output is preserved. A dead reservation is removed only when its receipt identifies that job and no output was published. Unknown owners and records are left alone.

The job registry defaults to a private per-user run directory and can be isolated with `EDITABLEFRAMES_STATE_DIR`. Recovery instructions never come from a downloaded project's job file. This is still trusted local code, not protection against hostile code running as the same user.

## Why the lock changed

The rejected proposal read a dead lock, removed it, and created its replacement. A second contender could remove the first contender's live replacement. Fable reproduced simultaneous holders and also found false death detection across time zones/process renaming and receipt deletion by concurrent recoverers.

The new protocol publishes a complete next-generation owner record using exclusive creation. Contenders never remove the current owner's record to acquire. A contender that resumes behind a newer generation withdraws. Owner identity uses host, PID namespace, PID and UTC start time; an inconclusive process query refuses takeover. Recovery of shared output reservations is serialized separately.

This passed the recorded schedules and real processes; it is not a universal proof for every filesystem or operating system.

## Verification on the adopted source

| Fresh coordinator check | Result |
|---|---|
| SDK unit tests | 147 passed, zero failed |
| Build | Passed |
| Browser and beta integration | Passed using installed Chromium; no new browser download |
| Real stale-lock contention | 30 rounds, six contenders, exactly one winner per round, zero overlapping holders |
| Real CLI edit/import faults | 19/19 passed |
| Real browser-render crash/recovery faults | 21/21 passed |
| Sentinels | Files, unrelated browser and unrelated process survived |
| Dry-run and graceful import cancellation regressions | Included in the 147 tests; SIGINT/SIGTERM/SIGHUP and no filesystem writes |

The coordinator reran the worker's integration harness against the actual SDK checkout in separate disposable projects. These are independent executions of the same harness, not an independently designed fault model. Browser tests were serialized with other rendering work. No paid call, credential read, model download or native-app launch was needed.

Fable's larger retained study additionally reports 30,650 exhaustive two-contender schedules, 80,000 sampled schedules with injected deaths, and 400 actual killed-holder rounds. Those are worker results, separate from the fresh coordinator runs. Four failed designs remain retained, including a recovery guard that wedged when its own recoverer died.

## Still open

- Evidence is one Mac on APFS. Linux was not run. Windows cannot verify owner identity and does not automatically take over or recover dead owners.
- Caching/network filesystems and same-named machines sharing a project are unsupported by this evidence. Power-loss durability was not tested; lock records are not an fsync protocol.
- PID/start-time rechecks narrow process-reuse risk but are not an atomic OS process handle. Explicit browser termination remains opt-in.
- Old bare lock files from earlier SDK versions cannot be safely attributed and need deliberate manual recovery after confirming no owner is running.
- Library `render()` callers and preview processes do not automatically gain the CLI's job ownership contract. Native app integration remains separate.
- Asset removal, arbitrary live resources outside pinned assets, provider billing/reconciliation and audiovisual playback review remain open.

Existing projects require explicit `rebind` after the runtime change. Code-generated scenes and accepted generated footage are unchanged: this work makes interruption/restart safer, not the picture more realistic. LIGHT1, MASK1, HUMAN1 and the story/interaction quality boundaries retain their previous limits.
