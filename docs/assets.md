# Device assets and public distribution

The catalog has **55 device models**: phones, laptops, desktops/monitors, tablets and TVs. Its recorded licenses are **44 CC BY 4.0, 7 MIT, 4 CC0**. Original sources and license evidence are attached per model. The framework license does not replace these licenses.

A normal Git checkout includes five prepared starter GLBs (about 16 MB): iPhone 17 Pro Max, MacBook Pro M3 16 inch, iMac 2021, modern TV and iPad Air. The remaining prepared GLBs are ignored by Git and belong in the separate device pack. The complete local collection is approximately 275 MB before packing. Previews, attribution, hashes, bindings, provenance and the CC0 HDR are in the source repository.

## Use the full pack

```sh
node bin/editableframes.mjs assets install-pack /path/to/editable-framess-devices-v1.zip
node bin/editableframes.mjs assets verify
```

`install-pack` also accepts an HTTPS URL. It accepts only the 55 known model paths and verifies every model's bytes against the pinned catalog before writing. Downloaded source code is never executed. Original upstream download links are included for provenance, but original compressed GLBs may differ from our prepared GLBs and are not interchangeable by hash.

## Prepare a public release

The local founding checkout already contains all 55 prepared GLBs. Run:

```sh
npm run check:assets
npm run pack:assets
```

This creates `dist/editableframes-devices-v1.zip`, its JSON receipt and `dist/SHA256SUMS`. The pack contains models, credits, source/license evidence, display bindings and environment files. Keep it as a GitHub Release attachment rather than adding all binary history to the main source tree.

When the owner has created the public GitHub repository and a release, upload those three files through the release UI or `gh release upload`. No repository name, remote or public download URL has been invented, and no upload is performed by this scaffold. **Pushing source alone publishes the five starters and manifest; the complete pack becomes publicly downloadable only after attaching it to a release.**

## Credits and modifications

Use `assets/devices/ATTRIBUTIONS.txt` and each catalog entry's author, title, source, license and modification notes. CC BY attribution should accompany renders where required; MIT notices must accompany redistribution of MIT assets. Prepared files were repacked and geometry compression decoded where necessary; orientation, material corrections and screen calibration are separate metadata.

Source evidence includes asset-embedded metadata, creator/distributor credits and recorded Sketchfab API license information. These are provenance records, not a legal certification. No noncommercial-only or unknown-license models are included. Product names are descriptive; the models are not official manufacturer assets or endorsements.

- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- CC0: https://creativecommons.org/publicdomain/zero/1.0/
- Poly Haven: https://polyhaven.com/license
