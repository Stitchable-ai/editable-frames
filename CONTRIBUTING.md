# Contributing

Use Node 22+. Install with npm ci, then run build and tests. Browser tests need Playwright Chromium; MP4 tests need FFmpeg. Original contributions use MIT unless an explicit third-party notice applies.

Keep changes independent of a host app. New render libraries are welcome. Expose meaningful controls with stable anchors where useful; do not require every scene to adopt a fixed primitive vocabulary. Document required host services, clock behavior, alpha/color semantics and limitations.

For assets, include source, creator, license evidence, digest and changes. Do not commit arbitrary downloads, user screenshots or credentials. The full device pack is a release artifact; only the five starter GLBs live in Git. Update tests for real behavioral changes, especially transactional edits, source clocks and saved history.

Before a public release, run npm run check:public and inspect the actual Git diff. API and format stability are not promised for this beta.
