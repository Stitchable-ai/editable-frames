// Rendered product-lighting studies shown as plain video on the homepage.
// Every product and brand here is an invented concept. Asset credits live on /credits/.
export type LightStudy = {
  id: string;
  title: string;
  kind: string;
  light: string;
  duration: number;
  line: string;
  onScreen: string;
};

export const LIGHT_STUDIES: LightStudy[] = [
  {
    id: 'cafe-breakfast',
    title: 'Sunday House breakfast',
    kind: 'Still life',
    light: 'Photographed café light',
    duration: 5,
    line: 'A scanned croissant, a ceramic cup with rising steam and a small lamp on a wood table, lit by a photographed café.',
    onScreen: 'Take the slow morning. Freshly baked. Beautifully brewed.',
  },
  {
    id: 'ginger-ale',
    title: 'Crown & Root ginger ale',
    kind: 'Beverage',
    light: 'Studio light',
    duration: 6,
    line: 'A code-built dry ginger ale can turns slowly as studio light rolls across the metal.',
    onScreen: 'A little bite. A long finish. Rooted in good taste.',
  },
  {
    id: 'lemon-lime',
    title: 'Sprig lemon + lime',
    kind: 'Beverage',
    light: 'Studio light',
    duration: 6,
    line: 'The same can form with a new label and a brighter set. Highlights travel around the curve as it turns.',
    onScreen: 'A brighter kind of chill. Bright by nature.',
  },
  {
    id: 'ai-notebook',
    title: 'Aera AI notebook',
    kind: 'Device',
    light: 'Colored stage light',
    duration: 4,
    line: 'A concept notebook under magenta and blue stage light, with a glowing screen of its own.',
    onScreen: 'Room for your next idea. Create. Organise. Explore.',
  },
  {
    id: 'ai-desktop',
    title: 'Node AI desktop',
    kind: 'Device',
    light: 'Softbox',
    duration: 4,
    line: 'A compact concept desktop under a soft overhead box. Clean edges, a quiet status light.',
    onScreen: 'Small form. Open possibilities.',
  },
];
