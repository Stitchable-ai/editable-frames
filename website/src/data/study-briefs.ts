import studies from './studies.json';

const sourceFiles: Record<string,string> = {
 castle:'three-scenes.mjs', dragon:'three-scenes.mjs', underwater:'three-scenes.mjs',
 device:'device-scene.mjs', showreel:'canvas-scenes.mjs', unet:'canvas-scenes.mjs',
 paper:'canvas-scenes.mjs', grain:'canvas-scenes.mjs', warehouse:'canvas-scenes.mjs',
 storybook:'canvas-scenes.mjs', ink:'canvas-scenes.mjs', evolution:'canvas-scenes.mjs',
};

// Source references and defaults keep these prompts tied to the demonstrated scenes.
export function buildStudyBrief(scene: string): string | null {
 const study=studies.find(s=>s.scene===scene);
 if(!study)return null;
 const fields=Object.values(study.schemas)[0] as Record<string,{label:string}>;
 const controls=Object.entries(fields).map(([key,field])=>`${field.label} (${key})`).join(', ');
 return `Recreate the EditableFrames collection study “${study.title}” as a ${study.duration}-second, 16:9 code-generated video clip.\n\nVisual direction: ${study.detail}\n\nUse the existing scene implementation as the starting point for fidelity, then adapt it into a standalone EditableFrames clip project. In the source checkout, read website/src/data/studies.json and locate scene "${scene}" (template "${study.id}"). Read website/vendor/films/${sourceFiles[scene]} and its dependencies for the actual composition, animation and rendering; do not substitute an unrelated generic scene.\n\nStarting scene values: ${JSON.stringify(study.nodes[0].props)}\n\nExpose these controls with stable anchor IDs: ${controls}. Keep edits reversible through the SDK history. Use explicit time and seeded randomness so seeking works. Keep the same visual character, pacing and scene structure; inspect the beginning, middle and end against https://editableframes.stitchable.ai/genres/${scene}/. Preserve model and HDR credits where used. New libraries are welcome when useful.\n\nKeep creative code editable, show a working preview, and export only when the required tools are available.`;
}
