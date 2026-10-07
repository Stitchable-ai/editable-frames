# Agent integrations

The common interface is a portable SKILL.md plus local CLI, not a model API. The checkout must have `npm ci` completed. A copied skill records the checkout location; moving the checkout requires reinstalling that skill. The commands below are examples for a user to run, not actions performed automatically by the repository.

## Claude Code

The repository is a plugin root with `.claude-plugin/plugin.json` and `skills/editableframe/SKILL.md`:

```sh
claude --plugin-dir /path/to/editableframe
```

The skill is available through the plugin's skill namespace. Alternatively install only the skill:

```sh
node bin/editableframe.mjs install-skill claude ~/.claude/skills/editableframe
```

## Codex

Install the skill into a discovery directory:

```sh
node bin/editableframe.mjs install-skill codex ~/.agents/skills/editableframe
```

Then invoke `$editableframe` in Codex. The skill includes OpenAI UI metadata. This release uses the skill route, not a claimed native Codex marketplace integration.

## Grok Build

```sh
node bin/editableframe.mjs install-skill grok ~/.grok/skills/editableframe
```

Grok documents SKILL.md discovery and Claude plugin compatibility. The portable skill is the direct supported packaging route here. A consumer needs file/command execution tools; simply pasting the skill into a text-only chatbot does not grant execution.

## Other hosts and Stitchable

Install the skill into a host-supported directory, or load it explicitly and expose the CLI as a local tool. The core can be imported from `packages/core/index.mjs` independently of the examples. There are no Stitchable paths, Tauri calls, authentication dependencies or model credentials in the runtime.

The installer refuses to overwrite an existing skill. No hooks or background services are installed. Native host discovery should be checked after installation; packaging compatibility is not a claim that a live task has been run in every vendor's app.

References checked 2026-10-07:
- https://code.claude.com/docs/en/plugins-reference
- https://learn.chatgpt.com/docs/build-skills
- https://docs.x.ai/build/features/skills-plugins-marketplaces
