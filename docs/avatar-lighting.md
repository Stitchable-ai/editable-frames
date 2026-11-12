# Human foreground lighting

Status: design and isolated still-image evaluation, not a shipped avatar relighting feature. Existing prepared-media primitives provide source-bound alpha and exact frame sampling; they do not recover a person's geometry or original illumination. Continuous speech, hands, multiple people, temporal stability and native preview/export parity still need video acceptance.

## Route by the foreground's representation

| Foreground | Default | Escalation |
| --- | --- | --- |
| Authored 3D geometry and materials | Editable lights, environment and physically based raster shading | Opt-in higher-quality transport where glass, indirect light or shadows justify it |
| Filmed or generated human RGB + alpha | Preserve source pixels; bounded linear-light exposure/colour harmonisation | Prepared video-aware inverse-rendering passes or a reviewed video relight when light direction must change substantially |
| Truly relightable 3D human asset | Use its authored geometry/material/skin transport model | Validate eyes, hair and subsurface scattering separately; an RGB avatar video is not such an asset |
| Circular presenter inset | Treat as a screen-space UI layer; preserve the intentional frame | Relight only when explicitly intended to occupy the scene |

Transparent output makes composition easier; it does not remove lighting baked into skin and clothing. A Three.js light cannot physically relight an ordinary video texture. A soft mask is not a normal map. Do not use subject depth as a substitute for facial normals or observed alpha.

## Lighting is continuous, not a style enum

Names such as office, daylight and neon are example recipes. The underlying editable description can contain arbitrary supported lights, directions, colours, intensity, source size, fill, environment, exposure and time tracks. A host may propose a new recipe from each background instead of choosing from a finite catalogue. Colour alone cannot identify incident illumination: a warm wall may be painted warm, and the brightest patch may be a surface rather than a light. Record observations, assumptions, confidence and user overrides separately. Keep scene estimates stable across a shot; freeze or interpolate authored tracks rather than re-estimating independently on every export frame.

A common lighting description expresses intent across layers. Each renderer implements the subset its representation supports. RGB harmonisation must report that directional shadows/specular changes are unsupported; it must not silently present a colour ramp as a physical light solve.

## Prepared human data contract (proposed extension)

Retain current source identity, raster, rational rate, PTS, correspondence, validity/review and revision gates. Per subject, additionally identify foreground colour, alpha convention (straight/premultiplied), transfer function/primaries, any shading/gain map, normals/albedo/roughness/depth where actually provided, model/version/licence and source-to-output mapping. Missing passes are absent, never fabricated defaults. Map signed normal vectors and linear data explicitly; do not treat them as sRGB.

Prefer native provider alpha and foreground colour over re-segmenting a flattened scene. Decontaminated edge colour matters when replacing the background. In an already-composited image, a masked colour delta can leave the old background unchanged, but cannot recover uncontaminated hair or unseen background. For multiple people, maintain subject IDs, separate adjustments and explicit overlap ordering; a union person mask cannot support independent lighting or depth relationships.

Run models during preparation, outside the renderer clock. Cache reviewed outputs with hashes. Deterministic rendering samples those frozen artifacts at the exact source frame, including random/reverse seeks. A new background or lighting recipe invalidates lighting-dependent artifacts, not unrelated source audio or alpha. Generated outputs that change timing must be re-aligned or rejected; preserve the original speech track and verify lip sync.

## Isolated evidence and rejected shortcuts

Two high-resolution presenter screenshots and a separate small circular inset were evaluated locally. They are independent stills, not a continuous sequence. RVM MobileNetV3 separated the body but visibly damaged small headphone/cable features and left edge contamination. CPU execution is feasible on the tested Apple machine; that does not establish real-time video quality or cross-device throughput. RVM is GPL-3.0 and was evaluated separately, not bundled or selected for production distribution.

Bounded linear-light gain preserved background pixels outside the supplied mask. It preserved source geometry by construction but did not create geometrically correct directional facial shadows. IC-Light SD1.5 FBC, run locally with the same seed on two stills, produced stronger light while changing facial and accessory detail. Raw generative replacement was rejected for faithful avatar rendering. A blurred, clamped luminance-ratio hint applied back to original pixels avoided substituting generated facial pixels, but remains experimental: incorrect inferred shapes can still imply incorrect shading, and temporal consistency was not tested.

Do not interpret zero background change, equal frame counts or deterministic output as a likeness or photorealism score. Keep numerical integrity, boundary quality, identity/expression, illumination plausibility and temporal quality separate.

## Next video acceptance

Use a short alpha-capable talking clip with head turns, blink, open/closed mouth and a hand near the face. Compare unchanged source, conservative harmonisation and any stronger relighter against a fixed warm/cool background pair. Inspect every transition and alpha edge, speech timing, hair, headphones, teeth, skin texture, hands and clothing. Test a second person with overlaps independently. Export and native preview must agree on source mapping and approved revisions. A slideshow of supplied screenshots cannot pass this gate.

## Provider and research notes

- [HeyGen transparent output](https://developers.heygen.com/transparent-background-videos): the documented avatar route requests WebM using a matting-enabled avatar look. Verify eligibility and actual decoded alpha. This supplies a foreground, not relighting passes. Keep provider-specific requests in the host, outside the rendering library.
- [Google Portrait Light](https://www.research.google/blog/portrait-light-enhancing-portrait-lighting-with-machine-learning/) predicts a low-frequency quotient applied to source pixels. This motivates detail-preserving gain control; it does not validate a handcrafted or diffusion-derived gain map.
- [RVM](https://github.com/PeterL1n/RobustVideoMatting) provides recurrent foreground/matte inference, with GPL-3.0 licensing. Licence review and benchmark evidence are required before distribution.
- [IC-Light](https://github.com/lllyasviel/IC-Light) is an image relighting candidate. Independent image inference is not a temporally validated video relighter.
- [Beeble](https://developer.beeble.ai/) offers hosted transformation; account-gated product passes and a generative output are different contracts. No hosted pass/relight was tested in this evaluation. Assess output fidelity and current access before choosing it.
