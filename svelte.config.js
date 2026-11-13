import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA: todo se sirve desde index.html
			precompress: false,
			strict: false
		}),
		// En GitHub Pages el sitio cuelga de /<repo>; en Netlify o Vercel, de la raíz.
		paths: { base: process.env.BASE_PATH || '' }
	}
};

export default config;
