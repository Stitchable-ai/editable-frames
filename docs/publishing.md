# Publishing EditableFrames

The public MIT repository is **[Stitchable-ai/editable-frames](https://github.com/Stitchable-ai/editable-frames)**. Its initial GitHub license commit is retained; the framework and self-contained `website/` are added on top of it. The package remains `private: true` to prevent accidental npm publication.

## Validate a release

From a checkout with Node 22 and FFmpeg installed:

```sh
npm ci
npm run build
npm test
npm run check:assets
npm run check:public
npx playwright install chromium
npm run test:beta
npm run test:browser
npm ci --prefix website
npm run ci --prefix website
```

Linux browser tests may need `npx playwright install --with-deps chromium`. The public-source check is a limited pattern check; also review the staged file list and asset licenses. Keep dependencies, caches, local render evidence and generated builds out of Git. Five starter device GLBs are tracked. Do not force-add the rest of the collection.

## Push source updates

Use repository-local identity settings:

```sh
git config user.name lxspectechular
git config user.email xdl_line@hotmail.com
git remote -v
git status --short
git add .
git diff --cached --stat
git commit -m "Update EditableFrames"
git push origin main
```

Verify `origin` points to `Stitchable-ai/editable-frames` before pushing. On an established protected repository, publish through a pull request instead. GitHub Actions validates the framework and website; inspect the hosted results rather than assuming local success guarantees remote success.

## Publish the complete device pack

The founding asset checkout contains all 55 prepared GLBs. A normal Git clone contains five. In the complete checkout, run `npm run check:assets` and `npm run pack:assets`; retain the ZIP, JSON receipt and SHA256SUMS together. Upload them as release attachments, not Git history:

```sh
git tag -a v0.1.0-beta.1 -m "EditableFrames 0.1.0-beta.1"
git push origin v0.1.0-beta.1
gh release create v0.1.0-beta.1   --repo Stitchable-ai/editable-frames --verify-tag --prerelease   --title "EditableFrames 0.1.0-beta.1"   --notes-file docs/release-beta.1.md   /path/to/editable-framess-devices-v1.zip   /path/to/editable-framess-devices-v1.zip.json   /path/to/SHA256SUMS
```

These founding-release commands are not repeatable update commands. Check whether the tag/release already exists first; later releases need new version names. Verify the source checks before publishing. The approximately 156 MiB ZIP carries attribution and provenance; the models retain their own licenses. After attachment verification, the public installation URL is:

```sh
node bin/editableframes.mjs assets install-pack   https://github.com/Stitchable-ai/editable-frames/releases/download/v0.1.0-beta.1/editableframes-devices-v1.zip
node bin/editableframes.mjs assets verify
```

## Website and repository settings

Follow [Cloudflare setup](cloudflare-setup.md) to connect `website/` to the new Worker's CI/CD. Keep the main Stitchable site in its own repository. After the first hosted checks pass, enable a main-branch ruleset requiring Framework validation and Website validation. Check the README images/GIF and the release attachments on GitHub. A clean clone should build and load the five starters before installing the full pack.

Reference: [GitHub release CLI](https://cli.github.com/manual/gh_release_create).
