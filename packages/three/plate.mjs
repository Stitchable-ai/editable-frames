/** Optional Three.js adapter for hybrid scenes: a code-rendered 3D object that
 * has to sit INSIDE footage (a "plate") instead of on top of it.
 *
 * Not a restriction on renderers. Nothing here runs a model; mattes, depth,
 * tracks and camera paths are inputs the host or the author supplies.
 * See docs/hybrid-scenes.md. */
import * as T from 'three';
import {depthGlsl, validateDepthEncoding} from '../plate/depth.mjs';
import {expandHighlights} from '../plate/color.mjs';
import {idColor} from '../plate/passes.mjs';
export const revision = 'editableframes.three-plate/1';
const QUAD_VERTEX = 'varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.0,1.0);}';
function fullscreen(material, renderOrder) {
  const mesh = new T.Mesh(new T.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false; mesh.renderOrder = renderOrder; mesh.userData.plateHelper = true;
  return mesh;
}
/** A texture for plate data (matte, depth, normals): no colour management, no
 * mipmaps. `image` is anything WebGL can upload. */
export function dataTexture(image, {filter = T.LinearFilter} = {}) {
  const texture = new T.Texture(image);
  texture.colorSpace = T.NoColorSpace; texture.minFilter = texture.magFilter = filter; texture.generateMipmaps = false; texture.needsUpdate = true;
  return texture;
}
/** Let the plate's own geometry hide the scene. Draws nothing visible; it
 * writes the plate's depth into the depth buffer first, so every mesh is then
 * depth-tested against the footage: a hand in front of the product covers it,
 * a wall behind it does not.
 *
 * Needs WebGL2 and a perspective camera with the standard depth buffer (not
 * logarithmic or reversed). Add the returned `mesh` to the scene; call
 * `update(texture, camera)` whenever the plate frame or the camera changes. */
export function createDepthOccluder(encoding) {
  const material = new T.ShaderMaterial({
    colorWrite: false, depthWrite: true, depthTest: true, depthFunc: T.AlwaysDepth,
    uniforms: {map: {value: null}, near: {value: 0.1}, far: {value: 100}},
    vertexShader: QUAD_VERTEX,
    fragmentShader: `uniform sampler2D map;uniform float near;uniform float far;varying vec2 vUv;${depthGlsl(encoding)}
void main(){float d=clamp(plateDistance(texture2D(map,vUv)),near,far);float ndc=(far+near)/(far-near)-(2.0*far*near)/((far-near)*d);gl_FragDepth=ndc*0.5+0.5;gl_FragColor=vec4(0.0);}`,
  });
  const mesh = fullscreen(material, -1e9);
  return {
    mesh,
    update(texture, camera) {
      if (!camera?.isPerspectiveCamera) throw Error('Depth occlusion needs a perspective camera');
      material.uniforms.map.value = texture; material.uniforms.near.value = camera.near; material.uniforms.far.value = camera.far;
    },
    dispose() { mesh.geometry.dispose(); material.dispose(); },
  };
}
/** Punch the plate's subject out of everything drawn so far. Where the matte
 * is white the canvas becomes transparent, so the footage underneath shows
 * through: the cheap way to put a 3D object BEHIND a matted subject when no
 * depth is available. Coverage is all-or-nothing per pixel; it cannot place
 * the object in front of one part of the subject and behind another. */
export function createMatteHoldout() {
  const material = new T.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: T.CustomBlending, blendEquation: T.AddEquation,
    blendSrc: T.ZeroFactor, blendDst: T.OneMinusSrcAlphaFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneMinusSrcAlphaFactor,
    uniforms: {map: {value: null}},
    vertexShader: QUAD_VERTEX,
    fragmentShader: 'uniform sampler2D map;varying vec2 vUv;void main(){vec3 m=texture2D(map,vUv).rgb;gl_FragColor=vec4(0.0,0.0,0.0,dot(m,vec3(0.2126,0.7152,0.0722)));}',
  });
  const mesh = fullscreen(material, 1e9);
  return {mesh, update(texture) { material.uniforms.map.value = texture; }, dispose() { mesh.geometry.dispose(); material.dispose(); }};
}
/** Paint `source` into an equirectangular canvas `width` wide and `width / 2`
 * high: as shot in front of the camera (u 0 to 0.5; Three's lookup puts -Z, into
 * the picture, at u = 0.25) and mirrored behind it (u 0.5 to 1, centred on +Z).
 * The mirror maps x to width - x, so the copy lands on the back half. A surface
 * facing the camera reflects that back half, so leaving it empty turns a
 * mirror-like product black. */
export function paintPlatePanorama(context, source, width) {
  const half = width / 2, height = width / 2;
  context.setTransform(1, 0, 0, 1, 0, 0); context.drawImage(source, 0, 0, half, height);
  context.setTransform(-1, 0, 0, 1, width, 0); context.drawImage(source, 0, 0, half, height);
  context.setTransform(1, 0, 0, 1, 0, 0);
}
/** Light the scene with the plate itself. The frame is wrapped into a
 * panorama (in front of the camera as shot, mirrored behind it), its clipped
 * highlights are pushed above 1, and the result is prefiltered for physically
 * based reflections. A metal object then reflects the footage it stands in.
 *
 * This is the standard stand-in when no real environment capture exists. It is
 * plausible, not measured: what is behind the camera is invented by mirroring.
 * Prefer a real `environment` asset for the plate when one exists.
 *
 * `update(source)` accepts anything a 2D canvas can draw and returns the
 * environment texture; assign it to `scene.environment`. */
export function createPlateEnvironment(renderer, {width = 256, knee = 0.8, boost = 6, document: doc = globalThis.document} = {}) {
  const height = width / 2, canvas = doc.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true}), generator = new T.PMREMGenerator(renderer);
  generator.compileEquirectangularShader();
  let target;
  return {
    update(source) {
      paintPlatePanorama(context, source, width);
      const linear = expandHighlights(context.getImageData(0, 0, width, height).data, {knee, boost}), pixels = new Uint16Array(linear.length);
      for (let i = 0; i < linear.length; i++) pixels[i] = T.DataUtils.toHalfFloat(Math.min(65000, linear[i]));
      const texture = new T.DataTexture(pixels, width, height, T.RGBAFormat, T.HalfFloatType);
      texture.flipY = true; texture.minFilter = texture.magFilter = T.LinearFilter; texture.generateMipmaps = false;
      texture.colorSpace = T.LinearSRGBColorSpace; texture.mapping = T.EquirectangularReflectionMapping; texture.needsUpdate = true;
      const next = generator.fromEquirectangular(texture); texture.dispose(); target?.dispose(); target = next;
      return target.texture;
    },
    dispose() { target?.dispose(); generator.dispose(); },
  };
}
/** Aim a directional light using `estimateKeyLight`'s result. `target` is the
 * point the light should fall on; `strength` scales the final intensity. */
export function applyKeyLight(light, estimate, {target = new T.Vector3(), distance = 6, strength = 2} = {}) {
  light.position.set(...estimate.toward).multiplyScalar(distance).add(target);
  light.target.position.copy(target); light.target.updateMatrixWorld();
  light.color.setRGB(...estimate.color, T.LinearSRGBColorSpace);
  // A flat, overcast plate has no key to speak of; a single hot source has a strong one.
  light.intensity = strength * (0.25 + 0.75 * estimate.concentration);
  return light;
}
/** Replay a sampled camera path (`sampleCameraPath`) on a perspective camera. */
export function applyCameraSample(camera, sample) {
  camera.position.set(...sample.position); camera.quaternion.set(...sample.quaternion);
  if (camera.fov !== sample.fovY) { camera.fov = sample.fovY; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();
}
/** An invisible plane that only shows the shadows cast onto it, laid on a
 * floor or table found in the plate (`fitGroundPlane`), in camera space. */
export function createShadowCatcher(plane, {size = 40, opacity = 0.35} = {}) {
  const mesh = new T.Mesh(new T.PlaneGeometry(size, size), new T.ShadowMaterial({opacity}));
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(...plane.normal).normalize());
  mesh.position.set(...plane.point); mesh.receiveShadow = true; mesh.userData.plateHelper = true;
  return mesh;
}
const RAW_VERTEX = 'varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vView=mv.xyz;gl_Position=projectionMatrix*mv;}';
// ShaderMaterial bypasses tone mapping and output colour conversion, so these
// passes write the exact bytes a decoder expects.
const rawColor = rgb => new T.ShaderMaterial({uniforms: {color: {value: new T.Vector3(...rgb)}}, vertexShader: RAW_VERTEX, fragmentShader: 'uniform vec3 color;void main(){gl_FragColor=vec4(color,1.0);}'});
/** Draw the scene as one control pass instead of as a picture.
 *
 *   clay    matte grey under the scene's own lights: shape, camera and shading
 *   depth   distance as grey, white = near, in `encoding` (default inverse)
 *   normal  camera-space normals
 *   id      one flat colour per object in `ids` (decode with `idFromColor`)
 *   matte   white silhouette on a transparent background
 *
 * Objects are named by `userData.passId` on a mesh or the nearest ancestor, else
 * the mesh's own `name`. Helper meshes this module creates, and anything with
 * `userData.passExclude`, are left out. Edges are antialiased, so id and depth
 * values are exact only away from silhouettes. Scene state is restored. */
export function renderPass(renderer, scene, camera, pass, {ids = [], encoding} = {}) {
  if (pass === 'beauty') { renderer.render(scene, camera); return; }
  if (!['clay', 'depth', 'normal', 'id', 'matte'].includes(pass)) throw Error('Unknown pass: ' + pass);
  const depth = validateDepthEncoding(encoding ?? {kind: 'inverse', near: camera.near, far: camera.far});
  const saved = {background: scene.background, override: scene.overrideMaterial, clear: renderer.getClearColor(new T.Color()), alpha: renderer.getClearAlpha(), tone: renderer.toneMapping}, swapped = [], hidden = [], made = [];
  const passId = object => { for (let o = object; o; o = o.parent) if (typeof o.userData?.passId === 'string') return o.userData.passId; return object.name; };
  const use = (mesh, material) => { swapped.push([mesh, mesh.material]); mesh.material = material; };
  try {
    scene.background = null; scene.overrideMaterial = null; renderer.setClearColor(0x000000, 0);
    const shared = pass === 'clay' ? new T.MeshStandardMaterial({color: 0xb8b8b8, roughness: 0.85, metalness: 0})
      : pass === 'normal' ? new T.MeshNormalMaterial()
      : pass === 'matte' ? rawColor([1, 1, 1])
      : pass === 'depth' ? new T.ShaderMaterial({vertexShader: RAW_VERTEX, fragmentShader: `varying vec3 vView;${depthEncodeGlsl(depth)}void main(){gl_FragColor=vec4(vec3(plateCode(-vView.z)),1.0);}`})
      : null;
    if (shared) made.push(shared);
    if (pass !== 'clay') renderer.toneMapping = T.NoToneMapping;
    const byId = new Map();
    scene.traverse(object => {
      if (!object.isMesh && !object.isLine && !object.isPoints && !object.isSprite) return;
      if (object.userData.plateHelper || object.userData.passExclude || !object.isMesh) { if (object.visible) { hidden.push(object); object.visible = false; } return; }
      if (shared) { use(object, shared); return; }
      const index = ids.indexOf(passId(object));
      if (index < 0) { if (object.visible) { hidden.push(object); object.visible = false; } return; }
      if (!byId.has(index)) { const material = rawColor(idColor(index).map(v => v / 255)); byId.set(index, material); made.push(material); }
      use(object, byId.get(index));
    });
    renderer.render(scene, camera);
  } finally {
    for (const [mesh, material] of swapped) mesh.material = material;
    for (const object of hidden) object.visible = true;
    for (const material of made) material.dispose();
    scene.background = saved.background; scene.overrideMaterial = saved.override; renderer.setClearColor(saved.clear, saved.alpha); renderer.toneMapping = saved.tone;
  }
}
function depthEncodeGlsl(encoding) {
  // Mirrors encodeDepth() in ../plate/depth.mjs, so a depth pass and a depth plate share one convention.
  const {kind, near, far} = encoding, f = v => Number(v).toPrecision(9).replace(/^(-?\d+)$/, '$1.0');
  return kind === 'inverse'
    ? `float plateCode(float d){d=clamp(d,${f(near)},${f(far)});return (1.0/d-${f(1 / far)})/${f(1 / near - 1 / far)};}`
    : `float plateCode(float d){d=clamp(d,${f(near)},${f(far)});return (${f(far)}-d)/${f(far - near)};}`;
}
