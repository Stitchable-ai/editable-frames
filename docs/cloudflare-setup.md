# Cloudflare setup and handoff

The source repository is [Stitchable-ai/editable-frames](https://github.com/Stitchable-ai/editable-frames). Its self-contained `website/` directory builds the interactive site at **editableframes.stitchable.ai**. The framework and website have separate dependency locks. The main Stitchable website stays in `Stitchable-ai/st-site`.

## What you need to create or connect

1. Sign into the **Cloudflare account containing the active `stitchable.ai` DNS zone**. Confirm that zone shows Active. You do not need to create another zone for the subdomain. If another account owns the zone, use that account or grant the appropriate access before deploying.
2. Under **Workers & Pages**, create a Worker named **`editableframes-site`**, or reuse that exact Worker if it already exists in this account. Connect its Builds settings to **`Stitchable-ai/editable-frames`**. Authorize the Cloudflare GitHub app for this organization/repository; an organization owner may need to approve it.
3. Enter the settings below. Use Cloudflare's managed build token when offered. No Cloudflare secret needs to be pasted into chat or stored in GitHub Actions for this setup.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | **`website`** |
| Build command | `npm ci && npm run ci` |
| Deploy command | `npm run deploy` |
| Preview/non-production builds | Disabled initially |
| Build variable `NODE_VERSION` | `22.22.0` |
| Build variable `SKIP_DEPENDENCY_INSTALL` | `1` |

These variables configure the build, not the running site. Explicit installation uses `website/package-lock.json`. `npm run ci` checks Astro, bundles the scene runtime, builds static HTML and performs a Wrangler deployment dry run. The deploy command reads **`website/wrangler.jsonc`**, uploads `website/dist`, and attaches the declared custom domain. This is a Workers static-assets deployment, not a Pages output-directory configuration.

**No D1, KV, R2, database, paid AI API or backend service is required for this website.** Curated scenes and edits run in the browser. The full device pack is distributed through GitHub Releases; three phone models used by the playground ship with the website.

## Then let the assistant take over

After the Worker and GitHub connection exist, tell the assistant the account name and that the connection is ready. Keep that account open in your browser. If deploying locally, sign in through the normal `npx wrangler login` flow in `website/`; do not share or extract saved credentials.

The remaining work is to verify the configured build, trigger deployment, check the deployed commit, confirm the custom domain and HTTPS, exercise playback/phone swaps/undo/redo, verify SEO files and the main-site embedded playground, and publish the already-prepared Stitchable shortcut when its own site is ready. Access to the relevant Cloudflare dashboard or authorized Wrangler session is necessary for those actions.

The earlier upload reached a Worker but custom-domain attachment failed because the login could not access the `stitchable.ai` zone. An upload alone is not a live launch. The requested production URL should be treated as pending until DNS and HTTPS are verified.

## CI/CD behavior

GitHub Actions runs **Framework validation**, **Rendering regression** and **Website validation** on pushes and pull requests. It needs no Cloudflare credentials. Cloudflare Builds deploys pushes to `main`, repeating the website checks before deployment. Once all three GitHub checks have run successfully, a repository owner can enable a main-branch ruleset requiring pull requests and all three checks. Cloudflare does not wait for GitHub Actions; branch rules prevent ordinary unvalidated merges, and its own build command checks the website again.

Initially watch all changes to avoid missing a dependency. Later you may narrow the Worker's build watch paths to `website/*`; all its runtime sources and package files are inside that folder. Keep the main site's build connection separate.

Verify `/`, `/genres/device/`, `/guide/`, `/robots.txt`, `/sitemap-index.xml`, a missing-route 404, and the app embedded at `stitchable.ai`. Confirm the custom-domain Worker matches `editableframes-site`. Do not add a conflicting manual DNS record when using a Worker custom domain; Cloudflare manages its DNS/certificate. If a record already exists, resolve that conflict in the owning account first.

For recovery, select a known-good version in the Worker's Deployments view, then revert the faulty source through a pull request. Preview deployments can be added later with a separate deploy command and `X-Robots-Tag: noindex`; the initial setup deliberately documents production only.

Official references, checked 2026-10-07: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [build image variables](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [Worker custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
