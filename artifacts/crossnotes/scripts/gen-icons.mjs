// One-off icon rasterizer. Turns the committed brand SVGs into the PNG sizes
// that Android + iOS actually require (iOS ignores SVG icons entirely, so the
// Apple touch icon MUST be a PNG). Icons are committed to public/icons/, so the
// production build never depends on this script — re-run it only when the Mew
// artwork in icon.svg / icon-maskable.svg changes.
//
//   node scripts/gen-icons.mjs
//
// Uses @resvg/resvg-js (native, no headless browser) so it works in CI/Docker
// with zero system image tooling installed.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
const iconsDir = resolve(publicDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

/** @type {{ src: string; out: string; size: number }[]} */
const TARGETS = [
  { src: 'icon.svg', out: 'icons/icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icons/icon-512.png', size: 512 },
  { src: 'icon.svg', out: 'icons/apple-touch-icon.png', size: 180 },
  { src: 'icon-maskable.svg', out: 'icons/icon-maskable-512.png', size: 512 },
];

for (const { src, out, size } of TARGETS) {
  const svg = readFileSync(resolve(publicDir, src), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(publicDir, out), png);
  console.log(`✓ ${out} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KiB)`);
}

console.log('\nDone. Icons written to public/icons/.');
