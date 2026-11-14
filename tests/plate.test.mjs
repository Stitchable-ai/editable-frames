import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as plate from '../packages/plate/index.mjs';
import {defineRenderer} from '../packages/core/renderer.mjs';
import {mountRenderer} from '../packages/runtime/renderer-host.mjs';

const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);
const image = (width, height, paint) => { const data = new Uint8ClampedArray(width * height * 4); for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const [r, g, b] = paint(x, y); data.set([r, g, b, 255], (y * width + x) * 4); } return data; };

test('a corner pin carries every corner onto its target and inverts', () => {
  const quad = [[10, 12], [130, 24], [118, 96], [4, 70]], h = plate.solveHomography(plate.rectQuad(160, 90), quad);
  plate.rectQuad(160, 90).forEach((corner, i) => plate.applyHomography(h, corner).forEach((v, axis) => near(v, quad[i][axis], 1e-9)));
  plate.applyHomography(plate.invertHomography(h), quad[2]).forEach((v, axis) => near(v, [160, 90][axis], 1e-8));
  const identity = plate.multiplyHomography(h, plate.invertHomography(h));
  [1, 0, 0, 0, 1, 0, 0, 0, 1].forEach((v, i) => near(identity[i], v, 1e-9));
  // A pure translation is the simplest case to read off the CSS matrix.
  assert.equal(plate.cornerPinTransform(10, 10, [[5, 7], [15, 7], [15, 17], [5, 17]]), 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,5,7,0,1)');
  assert.throws(() => plate.solveHomography(plate.rectQuad(10, 10), [[0, 0], [5, 5], [10, 10], [20, 20]]), /Degenerate/);
  assert.throws(() => plate.cornerPinTransform(0, 10, quad), /positive/);
  assert.ok(plate.quadArea(quad) > 0); assert.ok(plate.quadArea([...quad].reverse()) < 0);
});

test('tracks interpolate between frames, hold outside them and refuse bad data', () => {
  const track = {version: 1, kind: 'planar', width: 640, height: 360, frameRate: {num: 24, den: 1}, frames: [
    {frame: 2, quad: [[0, 0], [10, 0], [10, 10], [0, 10]], confidence: 1},
    {frame: 6, quad: [[40, 0], [50, 0], [50, 10], [40, 10]], confidence: .5},
  ]};
  plate.validateTrack(track);
  const mid = plate.sampleTrack(track, 4 / 24);
  assert.deepEqual(mid.quad[0], [20, 0]); assert.equal(mid.confidence, .5); assert.equal(mid.held, false);
  // The last good frame before a weaker one is still fully trusted.
  assert.equal(plate.sampleTrack(track, 2 / 24).confidence, 1); assert.equal(plate.sampleTrack(track, 6 / 24).confidence, .5);
  // Sub-frame times are what a motion-blur sample asks for.
  near(plate.sampleTrack(track, 2.5 / 24).quad[0][0], 5);
  assert.deepEqual(plate.sampleTrack(track, 0).quad[0], [0, 0]); assert.equal(plate.sampleTrack(track, 0).held, true);
  assert.deepEqual(plate.sampleTrack(track, 9).quad[0], [40, 0]); assert.equal(plate.sampleTrack(track, 9).held, true);
  assert.deepEqual(plate.scalePoints([[320, 180]], track, 1280, 720), [[640, 360]]);
  const point = {...track, kind: 'point', frames: [{frame: 0, point: [0, 0]}, {frame: 10, point: [10, 20]}]};
  assert.deepEqual(plate.sampleTrack(plate.validateTrack(point), 5 / 24).point, [5, 10]);
  assert.throws(() => plate.validateTrack({...track, frames: [track.frames[1], track.frames[0]]}), /increasing/);
  assert.throws(() => plate.validateTrack({...track, frames: [{frame: 0, quad: [[0, 0]]}]}), /four finite/);
  assert.throws(() => plate.validateTrack({...track, frameRate: {num: 24, den: 0}}), /frameRate/);
});

test('camera paths slerp rotation and hold their ends', () => {
  const half = Math.SQRT1_2, path = plate.validateCameraPath({version: 1, frameRate: {num: 24, den: 1}, frames: [
    {frame: 0, position: [0, 0, 0], quaternion: [0, 0, 0, 1], fovY: 30},
    {frame: 24, position: [2, 0, -4], quaternion: [0, half, 0, half], fovY: 50},
  ]});
  const mid = plate.sampleCameraPath(path, .5);
  assert.deepEqual(mid.position, [1, 0, -2]); near(mid.fovY, 40);
  // Halfway to a 90-degree yaw is a 45-degree yaw, still a unit quaternion.
  near(mid.quaternion[1], Math.sin(Math.PI / 8)); near(mid.quaternion[3], Math.cos(Math.PI / 8)); near(Math.hypot(...mid.quaternion), 1);
  assert.deepEqual(plate.sampleCameraPath(path, 99).position, [2, 0, -4]);
  // q and -q are the same rotation; the short way round is taken.
  near(plate.slerp([0, 0, 0, 1], [0, 0, 0, -1], .5)[3], 1);
  assert.throws(() => plate.validateCameraPath({...path, frames: [{...path.frames[0], quaternion: [0, 0, 0, 2]}]}), /unit quaternion/);
});

test('conform snaps code to the plate frame grid and names uneven cadence', () => {
  const film = {num: 24, den: 1};
  assert.equal(plate.plateFrameIndex(.5, film), 12); assert.equal(plate.plateFrameIndex(1 / 24, film), 1);
  near(plate.conformSeconds(.51, film), .5); near(plate.conformSeconds(1, {num: 30000, den: 1001}), 29 * 1001 / 30000);
  assert.deepEqual(plate.cadence(film, {num: 30, den: 1}).pattern, [2, 1, 1, 1]); assert.equal(plate.cadence(film, {num: 30, den: 1}).even, false);
  assert.deepEqual(plate.cadence(film, {num: 60, den: 1}).pattern, [3, 2]);
  assert.equal(plate.cadence(film, film).even, true); assert.equal(plate.cadence({num: 30, den: 1}, {num: 60, den: 1}).even, true);
  assert.equal(plate.cadence({num: 30, den: 1}, film).dropsFrames, true);
  assert.throws(() => plate.plateFrameIndex(-1, film));
});

test('shutter samples stay inside the open interval', () => {
  assert.deepEqual(plate.shutterSamples(10, {samples: 4, angle: 180}), [9.8125, 9.9375, 10.0625, 10.1875]);
  assert.deepEqual(plate.shutterSamples(0, {samples: 2, angle: 360, phase: 'forward'}), [.25, .75]);
  assert.ok(plate.shutterSamples(0, {samples: 8, angle: 360}).every(t => t >= 0));
  for (const bad of [{samples: 1}, {samples: 65}, {angle: 0}, {angle: 361}, {phase: 'late'}]) assert.throws(() => plate.validateShutter(bad));
});

test('depth encodings round-trip, white is near, and the shader carries the same constants', () => {
  for (const kind of ['inverse', 'linear']) {
    const encoding = plate.validateDepthEncoding({kind, near: 1.2, far: 12});
    near(plate.decodeDepth(1, encoding), 1.2); near(plate.decodeDepth(0, encoding), 12);
    for (const distance of [1.2, 2, 3.3, 7, 12]) near(plate.decodeDepth(plate.encodeDepth(distance, encoding), encoding), distance, 1e-9);
    assert.ok(plate.encodeDepth(2, encoding) > plate.encodeDepth(5, encoding));
  }
  const [high, low] = plate.packDepth(.123456, 'rg16'); near(plate.unpackDepth(high, low, 'rg16'), .123456, 1 / 65535);
  assert.deepEqual(plate.packDepth(1), [255, 255, 255]);
  assert.match(plate.depthGlsl({kind: 'linear', near: 1, far: 9, packing: 'rg16'}), /texel\.r \* 65280\.0.*9\.00000000 - v \* 8\.00000000/);
  assert.throws(() => plate.validateDepthEncoding({kind: 'inverse', near: 0, far: 5})); assert.throws(() => plate.validateDepthEncoding({kind: 'metric', near: 1, far: 5}));
  assert.deepEqual(plate.unprojectDepth(.5, .5, 3, 35, 16 / 9), [0, 0, -3]);
  // A floor one unit below the camera, sampled at four depths.
  const floor = plate.fitGroundPlane([[0, -1, -2], [1, -1, -3], [-1, -1, -5], [2, -1, -4]]);
  near(floor.normal[1], 1); near(floor.point[1], -1); near(floor.rms, 0);
  assert.throws(() => plate.fitGroundPlane([[0, 0, 0], [1, 1, 0], [2, 2, 0]]), /ground plane/);
});

test('plate measurements: levels, light direction, noise and grain', () => {
  const stats = plate.plateStats(image(40, 20, x => x < 20 ? [30, 30, 30] : [220, 200, 180]), 40, 20);
  near(stats.black[0], plate.srgbToLinear(30 / 255)); near(stats.white[2], plate.srgbToLinear(180 / 255));
  const levels = plate.matchLevels(stats);
  // A full-range render lands exactly on the plate's own black and white.
  plate.applyLevels([0, 0, 0], levels).forEach((v, c) => near(v, stats.black[c]));
  plate.applyLevels([1, 1, 1], levels).forEach((v, c) => near(v, stats.white[c]));

  const window = (x0, y0) => image(64, 36, (x, y) => x >= x0 && x < x0 + 8 && y >= y0 && y < y0 + 6 ? [255, 240, 200] : [90, 60, 40]);
  const left = plate.estimateKeyLight(window(4, 3), 64, 36), right = plate.estimateKeyLight(window(52, 26), 64, 36);
  assert.ok(left.toward[0] < -.4 && left.toward[1] > .3, 'a bright patch upper-left lights from upper-left');
  assert.ok(right.toward[0] > .4 && right.toward[1] < -.2, 'a bright patch lower-right lights from lower-right');
  near(Math.hypot(...left.toward), 1); assert.ok(left.concentration > .7); assert.ok(left.color[0] >= left.color[2]);
  assert.ok(left.ambient[0] > left.ambient[2], 'the fill keeps the wall colour');
  assert.equal(plate.estimateKeyLight(image(64, 36, () => [128, 128, 128]), 64, 36).concentration, 0);

  assert.equal(plate.estimateNoise(image(64, 64, () => [128, 128, 128]), 64, 64), 0);
  // Known Gaussian noise (seeded Box-Muller), sigma 8/255.
  let seed = 7; const random = () => (seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296;
  const noisy = image(128, 128, () => { const g = Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random()), v = Math.round(128 + 8 * g); return [v, v, v]; });
  near(plate.estimateNoise(noisy, 128, 128), 8 / 255, 4 / 255 / 4);

  assert.equal(plate.grainAt(3, 9, 12, 5), plate.grainAt(3, 9, 12, 5)); assert.notEqual(plate.grainAt(3, 9, 12, 5), plate.grainAt(3, 9, 13, 5));
  let sum = 0; for (let i = 0; i < 4000; i++) { const g = plate.grainAt(i % 80, i >> 4, 1); assert.ok(g >= -1 && g <= 1); sum += g; }
  assert.ok(Math.abs(sum / 4000) < .08, 'grain is centred on zero');

  const expanded = plate.expandHighlights(new Uint8ClampedArray([255, 255, 255, 255, 100, 100, 100, 255]));
  assert.ok(expanded[0] > 6, 'a clipped white is pushed well above 1'); near(expanded[4], plate.srgbToLinear(100 / 255), 1e-6);
  assert.throws(() => plate.plateStats(new Uint8ClampedArray(8), 4, 4));
});

test('object ids survive a round trip through colour', () => {
  const seen = new Set();
  for (const index of [0, 1, 2, 3, 255, 256, 65535, 1_000_000, 16_777_213]) { const color = plate.idColor(index); assert.equal(plate.idFromColor(color), index); seen.add(color.join()); }
  assert.equal(seen.size, 9); assert.equal(plate.idFromColor([0, 0, 0]), -1);
  // Neighbouring ids are far apart, so two adjacent objects stay distinguishable by eye.
  const [a, b] = [plate.idColor(0), plate.idColor(1)]; assert.ok(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 100);
  assert.throws(() => plate.idColor(-1));
  assert.deepEqual(plate.validatePasses(['beauty', 'clay', 'id']), ['clay', 'id']);
  assert.throws(() => plate.validatePasses(['clay', 'clay'])); assert.throws(() => plate.validatePasses(['Depth']));
});

test('a scene declares its passes; invalid declarations are refused', () => {
  const base = {id: 'x', renderer: 'any', width: 16, height: 16, fps: 24, durationInFrames: 1, create: async () => ({render() {}, dispose() {}})};
  assert.deepEqual(defineRenderer({...base, passes: ['clay', 'depth']}).passes, ['clay', 'depth']);
  assert.equal(defineRenderer(base).passes, undefined);
  for (const passes of [['beauty'], ['clay', 'clay'], ['Bad Name'], 'clay']) assert.throws(() => defineRenderer({...base, passes}), /passes/);
});

test('derived assets are pinned to the take they were made from', () => {
  const sha = c => c.repeat(64), ok = () => ({
    plate: {type: 'video', sha256: sha('a')},
    matte: {type: 'video', sha256: sha('b'), derived: {of: 'plate', role: 'matte', sourceSha256: sha('a')}},
    depth: {type: 'video', sha256: sha('c'), derived: {of: 'plate', role: 'depth', sourceSha256: sha('a'), encoding: {kind: 'inverse', near: 1, far: 10}}},
    track: {type: 'data', sha256: sha('d'), derived: {of: 'plate', role: 'track', sourceSha256: sha('a')}},
  });
  assert.deepEqual(plate.validateDerived(ok()), {plate: {matte: 'matte', depth: 'depth', track: 'track'}});
  const broken = edit => { const assets = ok(); edit(assets); return () => plate.validateDerived(assets); };
  // The plate was regenerated: its matte now describes a different picture.
  assert.throws(broken(a => { a.plate.sha256 = sha('e'); }), /regenerate the matte/);
  assert.throws(broken(a => { a.matte.derived.of = 'missing'; }), /another declared asset/);
  assert.throws(broken(a => { a.matte.derived.of = 'matte'; }), /another declared asset/);
  assert.throws(broken(a => { a.track.type = 'video'; }), /A track must be data/);
  assert.throws(broken(a => { delete a.depth.derived.encoding; }), /encoding/);
  assert.throws(broken(a => { a.matte.derived.encoding = {kind: 'inverse', near: 1, far: 2}; }), /Only depth/);
  assert.throws(broken(a => { a.matte.derived.role = 'roto'; }), /unknown role/);
  assert.throws(broken(a => { a.second = structuredClone(a.matte); }), /two matte/);
  assert.throws(broken(a => { a.chain = {type: 'video', sha256: sha('f'), derived: {of: 'matte', role: 'matte', sourceSha256: sha('b')}}; }), /itself derived/);
});

test('the host hands plate services to a scene and nothing it was not given', async () => {
  const element = () => ({style: {}, append() {}, remove() {}});
  const root = {ownerDocument: {createElement: element, fonts: {ready: Promise.resolve()}}, append() {}};
  let context;
  const scene = defineRenderer({id: 'x', renderer: 'any', width: 16, height: 16, fps: 24, durationInFrames: 1, create: async c => { context = c; return {render() {}, dispose() {}}; }});
  const instance = await mountRenderer(scene, {root, services: {mediaInfo: id => ({id}), derived: (id, role) => `${id}-${role}`}});
  assert.deepEqual(context.mediaInfo('plate'), {id: 'plate'}); assert.equal(context.derived('plate', 'matte'), 'plate-matte');
  assert.equal(context.mediaFrame, undefined); assert.equal(context.asset, undefined);
  await instance.dispose();
  await assert.rejects(mountRenderer(scene, {root, services: {derived: 'nope'}}), /Invalid derived service/);
});

test('the plate panorama fills both halves: as shot in front, mirrored behind', async () => {
  const {paintPlatePanorama} = await import('../packages/three/plate.mjs');
  const draws = [];let m = [1, 0, 0, 1, 0, 0];
  const context = {setTransform: (...a) => {m = a;}, drawImage: (_s, x, y, w) => {const xs = [x, x + w].map(v => m[0] * v + m[4]);draws.push([Math.min(...xs), Math.max(...xs), m[0]]);}};
  paintPlatePanorama(context, {}, 256);
  assert.deepEqual(draws, [[0, 128, 1], [128, 256, -1]]);
});

test('control passes restore visibility and override materials, even when rendering throws', async () => {
  const T = await import('three');
  const {renderPass} = await import('../packages/three/plate.mjs');
  for (const fail of [false, true]) for (const pass of ['id', 'matte', 'depth', 'normal', 'clay']) {
    const scene = new T.Scene(), camera = new T.PerspectiveCamera();
    const original = new T.MeshBasicMaterial(), override = new T.MeshBasicMaterial({color: 0xff0000});
    scene.overrideMaterial = override;
    const visible = new T.Mesh(new T.BoxGeometry(), original); visible.name = 'included';
    const hidden = new T.Mesh(new T.BoxGeometry(), original); hidden.visible = false;
    const excluded = new T.Mesh(new T.BoxGeometry(), original);
    scene.add(visible, hidden, excluded);
    let calls = 0;
    const renderer = {toneMapping: T.NeutralToneMapping, getClearColor: c => c.set(0x123456), getClearAlpha: () => .5, setClearColor() {},
      render(s) {
        calls++;
        assert.equal(s.overrideMaterial, null, 'the pass material must reach Three.js');
        assert.notEqual(visible.material, original);
        assert.equal(hidden.visible, false);
        if (pass === 'id') assert.equal(excluded.visible, false);
        if (fail) throw Error('GPU failure');
      }};
    const draw = () => renderPass(renderer, scene, camera, pass, {ids: ['included']});
    if (fail) assert.throws(draw, /GPU failure/); else draw();
    assert.equal(calls, 1);
    assert.equal(hidden.visible, false, 'an invisible mesh stays invisible after the pass');
    assert.equal(excluded.visible, true);
    assert.equal(scene.overrideMaterial, override);
    assert.equal(visible.material, original);
    assert.equal(renderer.toneMapping, T.NeutralToneMapping);
    for (const mesh of [visible, hidden, excluded]) mesh.geometry.dispose();
    original.dispose(); override.dispose();
  }
});
