# Devices

Use `assets list` to inspect 55 device records, creators and source/license links. A source checkout includes five starter models. The full device pack can be installed through `assets install-pack <file-or-https-url>`; all 55 model hashes are checked against the pinned catalog before installing.

The device studio provides real GLBs, named display selection, screen-image swaps, UV calibration, HDR direction/intensity, exposure and camera orbit. Screen bindings depend on a particular model digest, not just its friendly device name. Preserve authored PBR materials. Only reviewed, hash-matched material corrections should override them. The neutral product lighting adapter uses the included CC0 studio HDR and PBR Neutral tone mapping.

Keep creator, title, original source, license URL and modification notices with redistributed models and public renders where the asset license requires it. The framework's MIT license does not replace model licenses. Product names identify fan-made models and imply no manufacturer endorsement.

Use the source checkout's `assets/devices/catalog.json`, `ATTRIBUTIONS.txt`, `bindings/` and `packages/three/studio-lighting.mjs`. Some models have only viewer orientation, not a verified screen binding. Calibrate those explicitly before a screen-replacement export. The device viewer uses a separate look profile/history; the general clip CLI does not yet import that profile automatically.
