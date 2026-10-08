export const REPOSITORY = 'https://github.com/Stitchable-ai/editable-frames';
const checkout = `git clone ${REPOSITORY}.git
cd editable-frames
npm ci`;

export const DEFAULT_BRIEF = 'Create a 12-second launch film for a fictional product called Orbit. Use an elegant isometric world, a satisfying reveal, and editable brand colors, headline, camera angle, and animation speed.';

export const AGENT_GUIDES = [
  {
    id: 'claude', name: 'Claude', logo: 'claude', context: 'Claude Code · or a tool-capable Claude workspace',
    title: 'Give Claude a creative brief.',
    description: 'Paste the prompt into Claude Code with a folder open. It can read the skill, build the clip, and start a local preview. In a chat without local tools, ask for the source and setup steps.',
    steps: ['Copy the prompt below, with your own creative brief.', 'Paste it into Claude Code, or a Claude workspace with file and command tools.', 'Open the preview, refine the controls, then ask for a supported export.'],
    setup: `${checkout}\nnode bin/editableframes.mjs install-skill claude ~/.claude/skills/editableframes`,
    setupNote: 'Optional, once per machine. In Claude Code, invoke /editableframes after installing the skill. The installer keeps existing skill folders intact.',
    url: 'https://claude.ai/', action: 'Open Claude', docs: 'https://code.claude.com/docs/en/skills',
    intro: 'Use the EditableFrames skill to build a code-generated video clip. If the skill is not installed, read it from the source checkout before you start.',
  },
  {
    id: 'chatgpt', name: 'ChatGPT', logo: 'openai', context: 'ChatGPT · use a workspace with file and command tools to render',
    title: 'Turn a conversation into a clip.',
    description: 'Use this brief in ChatGPT. A workspace with file and command tools can run the SDK. A regular chat can help write the source; use Codex or your local machine for execution when those tools are unavailable.',
    steps: ['Copy the prompt and paste it into a new ChatGPT conversation.', 'Use a workspace with file and command tools, or request source files and local instructions.', 'Review the preview where execution is available, and keep the source with your exports.'],
    setup: `${checkout}\nnode bin/editableframes.mjs help`,
    setupNote: 'Local SDK setup for running the generated files. This is a source checkout, not a one-click ChatGPT plugin installation. Read or attach the shared SKILL.md to give the agent the workflow.',
    url: 'https://chatgpt.com/', action: 'Open ChatGPT', docs: 'https://learn.chatgpt.com/docs/build-skills',
    intro: 'Help me create a code-generated video using EditableFrames. First check whether this workspace has file and shell tools. If it does, follow the shared skill and run the SDK. If it does not, provide the complete source files and the local commands I need; do not claim to have rendered a video.',
  },
  {
    id: 'grok', name: 'Grok', logo: 'grok', context: 'Grok Build · or source generation in Grok chat',
    title: 'Make something unexpected with Grok.',
    description: 'Grok Build can discover the portable skill and use the CLI in a local workspace. In Grok chat, use the same creative brief to request code, then run it with the local SDK.',
    steps: ['Copy the prompt with your scene idea.', 'Paste it into Grok Build for local execution, or Grok chat for source generation.', 'Use the scene’s controls to iterate, and inspect meaningful frames before export.'],
    setup: `${checkout}\nnode bin/editableframes.mjs install-skill grok ~/.grok/skills/editableframes`,
    setupNote: 'Optional Grok Build setup. Invoke /editableframes after discovery. A chat’s code-generation features do not by themselves provide a local video renderer.',
    url: 'https://grok.com/', action: 'Open Grok', docs: 'https://docs.x.ai/build/features/skills-plugins-marketplaces',
    intro: 'Use EditableFrames to create a video clip. In Grok Build, use the editableframes skill and local CLI. In a chat without local file and shell tools, produce source files and setup instructions instead of claiming a completed export.',
  },
  {
    id: 'codex', name: 'Codex', logo: 'codex', context: 'Codex · local app, CLI, or a configured coding workspace',
    title: 'Let Codex build, then fine-tune.',
    description: 'Open a working folder in Codex and paste this prompt. The shared skill connects source authoring, stable controls, preview, and revision-checked edits through the same CLI.',
    steps: ['Open a folder in Codex, then copy and paste the prompt.', 'Let Codex read the skill and create a new clip project.', 'Ask for a targeted edit, preview it, and use undo or redo to try another direction.'],
    setup: `${checkout}\nnode bin/editableframes.mjs install-skill codex ~/.agents/skills/editableframes`,
    setupNote: 'Optional, once per machine. Mention $editableframes in Codex after installation. If the skill is not visible, refresh the skill list or restart the host.',
    url: 'https://chatgpt.com/codex', action: 'Open Codex', docs: 'https://learn.chatgpt.com/docs/build-skills',
    intro: 'Use $editableframes if it is installed; otherwise read skills/editableframes/SKILL.md from the source checkout. Build a real EditableFrames project in a new folder.',
  },
] as const;

export function buildAgentPrompt(id: string, brief = DEFAULT_BRIEF) {
  const guide = AGENT_GUIDES.find(g => g.id === id) ?? AGENT_GUIDES[0];
  return `${guide.intro}\n\nCreative brief:\n${brief.trim() || DEFAULT_BRIEF}\n\nSource: ${REPOSITORY}\nSkill: ${REPOSITORY}/blob/main/skills/editableframes/SKILL.md\nAuthoring contract: ${REPOSITORY}/blob/main/skills/editableframes/references/authoring.md\n\nWhen execution tools are available:\n1. Reuse an existing EditableFrames checkout, or clone it into a new folder and run npm ci. Read AGENTS.md, the shared skill, and its authoring contract.\n2. Run node bin/editableframes.mjs init ./orbit-clip using a fresh output folder. Adapt its clip.mjs starter rather than inventing SDK APIs. Keep unrelated files intact.\n3. Make a polished scene with intentional composition, timing, and lighting. Use any suitable creative library. Expose useful typed controls with stable anchor IDs; controls must not restrict the rendering code. Drive animation with explicit time and seeded randomness.\n4. Rebind after changing source. Start a preview with the CLI and inspect several meaningful frames. For property edits, inspect the current revision and apply validated commands so undo/redo remains available.\n5. Export an MP4 only if Chromium and FFmpeg are available. Otherwise give precise setup steps and a working preview. Keep the project, credits, and export receipt. Clearly report what actually ran.\n\nIf repository access or execution is unavailable, tell me what is missing and provide the code or instructions you can support. Never present a still or untested code as a finished video.`;
}
