import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const originals = import.meta.glob<{ default: ImageMetadata }>('../../public/demos/*.jpg', { eager: true });
export type StudyPosters = Record<string, { src: string; srcSet: string }>;

// Astro emits and caches these static assets; swapping scenes needs no image service.
export async function getStudyPosters(): Promise<StudyPosters> {
  const entries = await Promise.all(Object.entries(originals).map(async ([path, image]) => {
    const widths = [480, 960, 1280];
    const variants = await Promise.all(widths.map(width => getImage({ src: image.default, width, format: 'webp', quality: 80 })));
    const scene = path.split('/').at(-1)!.replace(/\.jpg$/, '');
    return [scene, { src: variants.at(-1)!.src, srcSet: variants.map((image, i) => `${image.src} ${widths[i]}w`).join(', ') }] as const;
  }));
  return Object.fromEntries(entries);
}
