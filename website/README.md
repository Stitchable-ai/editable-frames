# EditableFrames website

Astro static pages and a React playground for **editableframes.stitchable.ai**. This directory is self-contained inside [Stitchable-ai/editable-frames](https://github.com/Stitchable-ai/editable-frames). The main Stitchable site is maintained separately.

## Run locally

Use Node 22.22.0. From this directory:

```sh
npm ci
npm run dev
```

The default preview is http://127.0.0.1:8794. To validate a production build:

```sh
npm run ci
```

That command checks types, bundles the renderers, builds HTML and runs a Cloudflare dry run. `npm run deploy` publishes through the new Cloudflare CLI using prebuilt output when the correct account is authorized. `npm run build:cloudflare` packages the static Astro output through Wrangler’s Build Output Specification adapter; `cf deploy --prebuilt` then deploys it. This preserves Astro 7 while the CF beta’s direct Astro builder lacks support. Follow the [Cloudflare setup and handoff guide](../docs/cloudflare-setup.md) first; a successful upload alone does not confirm the custom domain.

## How it works

Astro renders the homepage, twelve genre pages, guide, credits and 404 as HTML. The React island owns the controls. The actual EditableFrames Studio command/history engine and Canvas/Three.js renderers load after the visitor plays, scrubs or edits. Rendering pauses while the page is hidden. Browser edits stay local; PNG stills and validated JSON edit recipes can be saved and imported. Browser MP4 export is not implemented here.

`src/data/studies.json` describes the collection. MIT framework sources are in `vendor/`; `npm run bundle` builds `public/runtime/` and pins hashes in `src/data/runtime.json`. The binding versions the compatible saved-edit contract. Keep source, bundles and identity aligned. New adapters can use the same editing interface without narrowing the drawing code to a fixed graphics grammar.

The product demo uses three credited GLBs and a CC0 studio HDR. Its model, app screen, brand, colors, camera and exposure share undo/redo. Source body colors and material textures are preserved. Asset provenance and licenses are in `public/devices/`.

## Search and embedding

Fifteen indexable pages have static content, unique titles, self-referencing canonicals and posters. The 404 is excluded from the sitemap and marked noindex. Social metadata uses the subdomain origin. The main site can embed this playground: `public/_headers` permits the Stitchable origins. Preserve that frame policy when deploying.

Before launch verify the twelve studies, phone swaps, editable geometry, undo/redo, reload persistence, downloads/import, a narrow layout, keyboard controls and the main-site iframe. Site rankings and real-user performance must be measured after launch. Local audit evidence and generated `dist/` stay out of Git.

CI and deployment settings are documented in [the setup guide](../docs/cloudflare-setup.md). GitHub validates this directory separately from the framework; Cloudflare Builds deploys it from root directory `website`.
