// Native vector source for the social card. Update the canonical brand SVG to update the mark.
// Run `node scripts/social-card.mjs --png` with rsvg-convert installed to publish social.png.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const publicDir=new URL('../public/',import.meta.url);
const logo=await fs.readFile(new URL('../../assets/brand/editableframes-mark.svg',import.meta.url),'utf8');
const mark=logo.slice(logo.indexOf('<path'),logo.lastIndexOf('</svg>'));
const pictures=await Promise.all(['castle','unet','storybook'].map(async name=>'data:image/jpeg;base64,'+(await fs.readFile(new URL('demos/'+name+'.jpg',publicDir))).toString('base64')));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<title>EditableFrames — Code the motion. Keep the control.</title>
<defs>${pictures.map((_,i)=>`<clipPath id="tile-${i}"><rect x="${60+i*268}" y="413" width="252" height="142" rx="8"/></clipPath>`).join('')}</defs>
<rect width="1200" height="630" fill="#f5f3ea"/>
<g font-family="Arial,sans-serif" fill="#192f2a">
<g transform="translate(60 54) scale(1.09375)" color="#192f2a">${mark}</g>
<text x="107" y="80" font-size="25" font-weight="700">EditableFrames</text>
<text x="60" y="176" font-size="69" font-weight="700" letter-spacing="-4">Code the motion.</text>
<text x="60" y="246" font-size="69" font-weight="700" letter-spacing="-4" fill="#284cd7">Keep the control.</text>
<text x="60" y="296" font-family="monospace" font-size="11" letter-spacing="2" fill="#59685c">EDITABLE CODE-GENERATED VIDEO · BY STITCHABLE</text>
<g transform="rotate(10 1043 230)"><circle cx="1043" cy="230" r="95" fill="#def68c"/><g text-anchor="middle" font-family="monospace" font-size="17"><text x="1043" y="213">12 WORLDS.</text><text x="1043" y="235">YOUR ART</text><text x="1043" y="257">DIRECTION. ↙</text></g></g>
${pictures.map((src,i)=>`<image x="${60+i*268}" y="413" width="252" height="142" preserveAspectRatio="xMidYMid slice" clip-path="url(#tile-${i})" xlink:href="${src}"/><text x="${60+i*268}" y="575" font-family="monospace" font-size="11">${['3D WORLDS','EXPLAINERS','ILLUSTRATION'][i]}</text>`).join('')}
<g font-family="monospace" font-size="12"><text x="1025" y="548">editableframes</text><text x="1025" y="565">.stitchable.ai ↗</text></g></g></svg>`;
const source=new URL('social.svg',publicDir);await fs.writeFile(source,svg);
if(process.argv.includes('--png'))execFileSync('rsvg-convert',['-o',fileURLToPath(new URL('social.png',publicDir)),fileURLToPath(source)],{stdio:'inherit'});
console.log('Generated social.svg'+(process.argv.includes('--png')?' and social.png':''));
