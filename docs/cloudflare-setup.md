# Cloudflare deployment and CI/CD

The source is [Stitchable-ai/editable-frames](https://github.com/Stitchable-ai/editable-frames). Its self-contained `website/` directory serves **[editableframes.stitchable.ai](https://editableframes.stitchable.ai/)**. The framework and website have separate dependency locks. The main Stitchable website stays in `Stitchable-ai/st-site`.

## Configured deployment

On 2026-10-07 the site was deployed to the account owning the active `stitchable.ai` zone. Cloudflare manages the subdomain DNS and HTTPS certificate through the `editableframes-site` Worker's custom domain. The Cloudflare GitHub connection watches `Stitchable-ai/editable-frames`.

| Setting | Value |
| --- | --- |
| Worker | `editableframes-site` |
| Production branch | `main` |
| Root directory | `website` |
| Build command | `npm ci && npm run ci` |
| Deploy command | `npm run deploy` |
| Preview/non-production builds | Disabled initially |
| Build variable `NODE_VERSION` | `22.22.0` |
| Build variable `SKIP_DEPENDENCY_INSTALL` | `1` |
| Build variable `CF_SEND_TELEMETRY` | `false` |
| Deployment credentials | Cloudflare-managed Workers Builds token |

No token is committed, embedded in browser code or stored in GitHub Actions. Local account access uses an explicitly supplied token or the CLI's normal sign-in. Keep credential files private and pass credentials through process environment variables without logging them.

**No D1, KV, R2, paid AI API or backend service is required.** Curated scenes and edits run in the browser. The full device pack is distributed through GitHub Releases; three credited phone models ship with the website.

## Remaining GitHub permission step

Cloudflare configuration and a manual hosted build are working. Push-triggered builds for this new repository were **not observed** after two verification pushes. The organization's Cloudflare GitHub App uses **selected repositories**, and the CLI request to add this repository returned HTTP 403. Do not treat automatic deployment as verified until the repository grant and a real push build are confirmed.

An organization owner should open [Cloudflare Workers and Pages repository access](https://github.com/organizations/Stitchable-ai/settings/installations/152216409), retain **Only select repositories**, add **Stitchable-ai/editable-frames**, and save. Keep the existing repository selections. This authorizes Cloudflare to receive this repository's push events. The signed-in CLI account has organization-owner membership, but GitHub rejected this installed-app change through its available OAuth authorization; use the normal GitHub settings UI rather than copying credentials or widening token scopes.

After saving, push a normal change to `main` and confirm a new Cloudflare build reports `build_trigger_source: push_event` and the expected commit. All Worker/build/domain settings are already in place. The main Stitchable site's existing push-triggered build was independently verified successfully for its new EditableFrames shortcut.

## Build and deploy with the new CF CLI

Use Node 22.22.0. From `website/`:

```sh
npm ci
npm run ci
npm run deploy
```

`npm run ci` checks Astro, bundles the scene runtime, builds static HTML, packages Cloudflare Build Output and performs a deployment dry run. `npm run deploy` runs **`cf deploy --prebuilt`** using that checked output. A dry run does not require deployment credentials; a real deployment requires access to the configured account.

The pinned CLI is `cf@1.0.0-beta.13`. Astro 6+ is not supported by its direct framework builder during beta. We retain Astro 7 and use `wrangler@4.148.0` solely as the static Build Output adapter:

```sh
npm run build
npx wrangler build --experimental-new-config --experimental-cf-build-output
npx cf deploy --prebuilt
```

`cloudflare.config.ts` declares the account, Worker, custom domain and asset routing. `wrangler.config.ts` points the adapter at `dist/`. Generated `.cloudflare/` output is ignored. This uses Workers static assets, not Pages. Avoid invoking plain `cf build` or plain `cf deploy` until Cloudflare supports this Astro version: those commands autodetect Astro and do not run our adapter. A Docker-daemon diagnostic from the adapter's container detection does not imply this static website requires Docker; the deployment dry run validates the generated output.

## CI/CD behavior

GitHub Actions runs **Framework validation**, **Rendering regression** and **Website validation** on pushes and pull requests. It needs no Cloudflare credentials. Cloudflare Builds is configured to deploy pushes to `main`, repeating the website checks; the repository permission step above remains to verify automatic triggering. Cloudflare does not wait for GitHub Actions; its own command validates the website, while a repository owner can additionally require all three GitHub checks in a main-branch ruleset before merges.

All paths are watched initially to avoid missing a dependency. Keep the main site's build connection separate. The deployment account already had the organization's GitHub app installation. This new repository still needs its repository selection confirmed as described above.

## Launch verification receipt

The first Cloudflare-hosted build completed successfully on **2026-10-07**: build `0deb1482-1159-4267-83ea-ab63dca9468f`, deployment version `8d225e11-ac5d-4ad7-9994-190ae8286d8c`. It installed Node 22.22.0, cloned the repository, passed the website checks and deployed using `cf deploy --prebuilt`. HTTPS, the live GLB phone swaps and undo/redo were exercised after launch. These are historical verification identifiers; later pushes create new versions.

## Verification and recovery

Verify `/`, `/genres/device/`, `/guide/`, `/robots.txt`, `/sitemap-index.xml`, a missing-route 404, playback, phone swaps, edits, undo/redo and the main-site iframe. An upload alone does not confirm a launch: check the production URL over HTTPS. Do not create a conflicting manual DNS record for a Worker custom domain.

Inspect build/deployment status in **Workers & Pages → editableframes-site → Builds / Deployments**. A failed build leaves the previous deployment serving. For recovery, select a known-good version in Deployments, then revert the faulty source through a pull request. To disconnect automatic deployment, disable auto builds in Builds settings; do not delete the production Worker. Preview deployments can be added later with a separate command and `X-Robots-Tag: noindex`.

Official references: [CF CI usage](https://developers.cloudflare.com/cf/ci/), [CF beta framework limitations](https://developers.cloudflare.com/cf/get-started/first-worker/), [Wrangler migration](https://developers.cloudflare.com/cf/wrangler/migrate/), [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Builds API](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/), [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
