# Search visibility

The canonical site is <https://editableframes.stitchable.ai/>. Its brand is
**EditableFrames**, also written as **Editable Frames**. The spaced phrase is
ambiguous: content and metadata should clearly identify the product as an
open-source framework for code-generated video clips.

## Keep the identity consistent

`website/src/data/site.mjs` holds the canonical origin, brand names, homepage
title and description. The homepage states the product's purpose in ordinary
text. Its `WebSite` and `SoftwareSourceCode` structured data include the spaced
alternative name and link the framework to its official source repository.

The creative headline can stay short. Demo pages use descriptive animation
headings and explain the controls that actually work. Avoid unsupported export
claims, invented reviews, hidden keyword text, repetitive keyword pages and
`VideoObject` markup for a canvas scene without an actual video asset.

## Google Search Console

Use the URL-prefix property `https://editableframes.stitchable.ai/`. Verification
and access belong to the site's owners; do not commit credentials, private
console exports or account screenshots. Keep any existing DNS verification
record in place.

1. Submit `https://editableframes.stitchable.ai/sitemap-index.xml` in **Sitemaps**.
2. Confirm a successful read, then inspect the child sitemap and discovered URLs.
   Submission and discovery do not guarantee indexing or ranking.
3. After deployment, inspect the homepage and important example URLs. Check the
   crawl date, Google-selected canonical, crawl permission and indexing status.
4. Test the live URL before requesting indexing of substantially changed pages.
   Use the normal URL Inspection flow; Google's Indexing API is not a general
   website-submission API.
5. When reporting is available, compare impressions, clicks, CTR and average
   position for `EditableFrames`, `editable frames` and relevant video queries.
   Keep country, device and date ranges consistent. A `site:` query is a useful
   discovery check, not a complete index count or ranking report.

## Validation before deployment

```sh
npm run ci --prefix website
```

Every website build runs `check:seo` against the generated HTML. It checks
unique titles and descriptions, one H1, canonical and social metadata, JSON-LD,
sitemap coverage, internal links, fragments, image assets and alt attributes.
The 404 stays `noindex` and outside the sitemap. Sitemap modification dates
must reflect real page changes; do not replace them with every build's time.

Run Lighthouse against production builds with consistent settings. A high SEO
audit score does not measure search demand, brand recognition, backlinks or
Google rankings. Field Core Web Vitals and lab performance are separate evidence.

On narrow screens, reduced-motion settings and data-saving connections, the
homepage starts with a lightweight poster. Play and Start tour explicitly load
the full editor. Desktop autoplay remains available. Responsive WebP previews
are generated at build time; renderer code, source clocks and saved-edit
bindings remain independent of this image delivery path.

## Discovery beyond this site

Keep descriptive links from the parent Stitchable site and the official GitHub
repository. Publish useful examples and documentation people can cite. Genuine
third-party references take time; automated directory spam or purchased links
are not a substitute for relevant adoption.

Official guidance: [Google's SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide),
[site names and alternate names](https://developers.google.com/search/docs/appearance/site-names),
[sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[requesting a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Q&A that helps people find the product

`website/src/data/faq.ts` supplies both the visible questions and FAQPage data.
Every answer is present in the server HTML inside a native disclosure. Keep
question IDs stable so links to individual answers continue to work. Link to
the relevant example, guide or reference with descriptive anchor text.

Answer specific product questions, such as editing a clip without regeneration,
export limits and existing Remotion/HyperFrames workflows. Start with a direct
answer and demonstrate the behavior. Avoid repeating a target keyword in every
question or producing thin pages for tiny wording variations.

Google retired FAQ rich results on May 7, 2026; FAQPage markup is descriptive
and does not promise a Google enhancement or ranking increase. See
[Google's changelog](https://developers.google.com/search/updates#may-2026).
The SEO gate checks that questions and answers also exist in the generated HTML.

After publication and recrawling, filter Search Console by the homepage and
question-related queries (editing without regeneration, exports, framework
comparisons). Compare impressions, clicks and CTR over consistent 28-day windows
when enough data exists. Use actual queries and support questions to decide
which answers need clearer explanations or a substantial dedicated guide.
