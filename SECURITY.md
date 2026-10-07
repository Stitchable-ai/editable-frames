# Runtime boundary

EditableFrame executes trusted JavaScript locally. Clip metadata inspection evaluates bundled clip source in Node; preview compiles that source. This is not an isolation boundary for untrusted downloaded projects. Agent host permissions still apply.

The preview server binds only to 127.0.0.1, serves files under its root and accepts token/origin/revision-checked edits only to the opened project and refuses hidden paths and escaping symlinks. Do not use the repository development server as a public hosting service.

Asset packs are data-only: recognized paths and pinned model hashes are checked before installation. Unknown archives or source projects should not be treated as trusted simply because they mention EditableFrame.

Media assets are hash-pinned and copied into a frozen render snapshot. A hostile trusted clip can still execute Node code during metadata inspection; HTTP restrictions do not sandbox it. Do not expose this development server to other machines.

There is no public security contact yet. Avoid posting credentials or private data in public issue reports.
