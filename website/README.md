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

That command checks types, bundles the renderers, builds HTML, validates SEO metadata and internal links, and runs a Cloudflare dry run. `npm run deploy` publishes through the new Cloudflare CLI using prebuilt output when the correct account is authorized. `npm run build:cloudflare` packages the static Astro output through Wrangler’s Build Output Specification adapter; `cf deploy --prebuilt` then deploys it. This preserves Astro 7 while the CF beta’s direct Astro builder lacks support. Follow the [Cloudflare setup and handoff guide](../docs/cloudflare-setup.md) first; a successful upload alone does not confirm the custom domain.

## How it works

Astro renders the homepage, twelve genre pages, guide, credits and 404 as HTML. The React island owns the controls. The actual EditableFrames Studio command/history engine and Canvas/Three.js renderers load after the visitor plays, scrubs or edits. The homepage can autoplay its tour on wider screens; narrow screens, reduced-motion settings and data-saving connections start with a lightweight poster and explicit playback. Responsive WebP posters are generated during the static build. Rendering pauses while the page is hidden. Browser edits stay local; PNG stills and validated JSON edit recipes can be saved and imported. Browser MP4 export is not implemented here.

`src/data/studies.json` describes the collection. MIT framework sources are in `vendor/`; `npm run bundle` builds `public/runtime/` and pins hashes in `src/data/runtime.json`. The binding versions the compatible saved-edit contract. Keep source, bundles and identity aligned. New adapters can use the same editing interface without narrowing the drawing code to a fixed graphics grammar.

The product demo uses three credited GLBs and a CC0 studio HDR. Its model, app screen, brand, colors, camera and exposure share undo/redo. Source body colors and material textures are preserved. Asset provenance and licenses are in `public/devices/`.

Its phone and lighting assets download concurrently. The loading bar counts actual
response-body bytes against sizes generated from the shipped assets at build time;
unknown totals stay indeterminate. A completed download is followed by a separate
scene-preparation stage, then requested playback starts automatically. Stalled
downloads time out and offer a retry. Changing scenes prevents a late load from
replacing the current clip. None of this changes the saved-edit binding.

## Search and embedding

Sixteen indexable pages have static content, unique titles, self-referencing canonicals and posters. The 404 is excluded from the sitemap and marked noindex. Social metadata uses the subdomain origin. The main site can embed this playground: `public/_headers` permits the Stitchable origins. Preserve that frame policy when deploying.

Before launch verify the twelve studies, phone swaps, editable geometry, undo/redo, reload persistence, downloads/import, a narrow layout, keyboard controls and the main-site iframe. Site rankings and real-user performance must be measured after launch. Local audit evidence and generated `dist/` stay out of Git.

CI and deployment settings are documented in [the setup guide](../docs/cloudflare-setup.md). GitHub validates this directory separately from the framework; Cloudflare Builds deploys it from root directory `website`.

For brand identity, Search Console setup, indexing checks and search measurement, read [Search visibility](../docs/seo.md). `npm run check:seo` can also validate an existing production build without rebuilding.

## Homepage motion and Stitchable preview

The homepage demonstrates the castle controls after a scroll brings them into
view, including narrow desktop panes. Watch / Replay edit demo offers an explicit
retry and brings the controls into view. Reduced motion disables the animation;
data-saving mode requires an explicit click. Narrow layouts defer the renderer
until the controls enter view or the visitor starts playback.

The first automatic demo in a fresh session leaves three validated, reversible
edits without saving them. Replays and demos with saved sessions use temporary
preview values and preserve the document, undo/redo history and saved bytes.
The cursor changes the palette, raises the towers, then adds more trees. Editing
a control, changing playback or choosing another scene immediately removes the
cursor and cancels all remaining scripted actions. Choosing a scene starts that
clip at the beginning and preserves an active tour; selecting a clip after
pausing the tour plays that clip without restarting the tour.

Changing scene properties keeps the selected clip playing. Scrolling the preview
out of view or hiding the page suspends drawing and retains playback intent, so
it resumes on return. Explicit pause and scrubbing show a large center Play
control; it resumes at the existing source time. Paused clips stay paused while
their properties are edited.

Collection thumbnails reveal as they enter view; they remain visible without
JavaScript and with reduced motion.

The last AI-tool tab contains an authored Studio interface, backed by the actual
MIT-licensed `A small act of care` Canvas study from the Stitchable recipe
collection. `vendor/studio-paper/ATTRIBUTIONS.md` records source provenance and
the website's companion-character adaptation. No desktop application source,
private chat content or screenshot is embedded. Its renderer loads only when
the Stitchable panel enters view; hidden tabs stop drawing and cancel the
walkthrough. Reduced motion and data saving skip the automatic walkthrough.

The guided sequence selects a measured object, changes its color and scale,
then previews the upcoming annotation workflow: a bubble cursor opens a compact
object note, the note joins the main chat composer, and the example request adds
a matching-size blue friend. The cursor then drags a bounding box around both
moving gardeners and attaches a region note asking them to hold hands and
sprinkle water on the flower, adding an eight-second second scene. Visitors can
also draw that selection themselves; its source time and region stay with the note.
The cursor then clicks Restart: source time returns to zero and the full updated
24-second video plays through both scenes. Both annotation turns stay in chat. This is labelled as an upcoming-feature preview. It does not call
an AI service. Real demo controls support selection, independent object colors
and scales, annotation, the example edit, undo/redo, pause and replay. Any manual
input immediately stops the scripted cursor. The download still opens
Stitchable Pro's download page in a new tab.

Hosts can pass a `controlsRef` to the authored Studio component to pause its
walkthrough before navigation and replay it after scrolling settles. These
controls leave the scene's playback controls available to the visitor.

Below 690px of available Studio width, the chat composer floats at the lower
right over the timeline. Recent history opens downward over the inspector in a
210px panel, keeping the video clear. The composer compacts again after sending.
Hover, textarea focus, the history button, and incoming messages reveal recent
chat history for 1.8 seconds. New replies restart that timer. The dock clears the
preview during object and region annotation. Desktop layouts retain the sidebar.
