import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ pages: 'build', assets: 'build', fallback: undefined, strict: true }),
		// Hash routing: the whole suite is one static index.html that runs anywhere,
		// including from a sub-path. Switch to path routing once it has its own server.
		router: { type: 'hash' },
		paths: { relative: true }
	}
};

export default config;
