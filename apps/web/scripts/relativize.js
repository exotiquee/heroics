// SvelteKit writes the SPA shell with root-absolute asset paths even when
// `paths.relative` is on. Rewrite them so the static build runs from any sub-path.
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../build/index.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const out = html
	.replaceAll('"/_app/', '"./_app/')
	.replaceAll('href="/favicon.svg"', 'href="./favicon.svg"');
if (out.includes('"/_app/')) throw new Error('relativize: absolute asset paths remain');
writeFileSync(file, out);
console.log('relativize: build/index.html now uses relative asset paths');
