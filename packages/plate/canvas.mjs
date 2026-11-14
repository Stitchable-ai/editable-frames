/** 2D-canvas helpers for layering DOM and Canvas content with a plate. */
/** Draw `plate` keeping only what `matte` marks white, onto `context`'s canvas.
 * Layer the result above anything that should pass BEHIND the plate's subject
 * (a headline behind a presenter). `scratch` is a second canvas this function
 * may resize and overwrite; pass the same one every frame. */
export function drawCutout(context, plate, matte, scratch) {
  const {width, height} = context.canvas;
  if (scratch.width !== width) scratch.width = width;
  if (scratch.height !== height) scratch.height = height;
  const s = scratch.getContext('2d', {willReadFrequently: true});
  s.globalCompositeOperation = 'copy'; s.drawImage(matte, 0, 0, width, height);
  const alpha = s.getImageData(0, 0, width, height), a = alpha.data;
  // Luminance becomes coverage. The matte's own colour is discarded.
  for (let i = 0; i < a.length; i += 4) { a[i + 3] = (a[i] * 54 + a[i + 1] * 183 + a[i + 2] * 19) >> 8; a[i] = a[i + 1] = a[i + 2] = 0; }
  s.putImageData(alpha, 0, 0);
  s.globalCompositeOperation = 'source-in'; s.drawImage(plate, 0, 0, width, height);
  s.globalCompositeOperation = 'source-over';
  context.clearRect(0, 0, width, height); context.drawImage(scratch, 0, 0);
}
/** Deterministic film grain over `context`'s canvas, sized by `sigma` (0..1,
 * for example from `estimateNoise`). */
export function drawGrain(context, grainAt, {sigma, frame, seed = 1}) {
  const {width, height} = context.canvas, image = context.createImageData(width, height), d = image.data, amplitude = Math.min(1, sigma * 3) * 255;
  for (let y = 0, i = 0; y < height; y++) for (let x = 0; x < width; x++, i += 4) {
    const g = grainAt(x, y, frame, seed);
    d[i] = d[i + 1] = d[i + 2] = g > 0 ? 255 : 0; d[i + 3] = Math.abs(g) * amplitude;
  }
  context.putImageData(image, 0, 0);
}
/** Decode plate frames by URL, keeping the most recent few. Await the image
 * inside `render` so the host captures only finished frames. */
export function createFrameLoader({max = 12, document: doc = globalThis.document} = {}) {
  const cache = new Map();
  return {
    load(url) {
      if (!url) return Promise.resolve(null);
      let hit = cache.get(url);
      if (hit) { cache.delete(url); cache.set(url, hit); return hit; }
      hit = (async () => { const image = doc.createElement('img'); image.src = url; await image.decode(); return image; })();
      hit.catch(() => cache.delete(url));
      cache.set(url, hit);
      while (cache.size > max) cache.delete(cache.keys().next().value);
      return hit;
    },
    dispose() { cache.clear(); },
  };
}
