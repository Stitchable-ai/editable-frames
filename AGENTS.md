# EditableFrames

Standalone open-source framework for code-generated video clips. No Stitchable runtime, model vendor, account, cloud API or Remotion dependency is required.

Golden rule: new renderers, libraries and arbitrary creative source code must remain possible. Control schemas describe editable handles; they are not the universe of drawable scenes. Add adapters instead of narrowing the core grammar to today's examples.

Read README.md and docs/architecture.md. `npm ci`, `npm run build`, `npm test`, `npm run test:browser`, `npm run test:beta`. Rendering requires Playwright Chromium and FFmpeg. `node bin/editableframes.mjs help` is the agent entrypoint. The shared skill lives in skills/editableframes/SKILL.md.

Keep source clocks explicit and reproducible. Preserve stable anchor IDs, validate edits atomically, reject stale revisions, and keep history reversible. Saved renderer bindings must change with source dependencies. Don't claim cross-GPU pixel identity.

Third-party models, HDRs and research data retain their own licenses. Update assets/devices/catalog.json and ATTRIBUTIONS.txt together. Full device files are delivered as a separate pack; five starters are tracked in Git. Don't commit node_modules, dist or local evidence. No user paths, screenshots of private posts, credentials, or runtime caches belong in public source.

This is a trusted-local-code beta; read docs/beta.md for implemented scope and remaining host-integration gaps. Do not describe planned host services, 306 research mappings, or untested agent host integration as completed implementations.
