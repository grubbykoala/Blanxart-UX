import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			output: {
				// Función (no objeto): Rollup solo la llama para módulos que SÍ se bundlean.
				// Los módulos marcados como "external" en el server build (ej. mapbox-gl)
				// nunca llegan aquí, evitando el error de "cannot be in manualChunks".
				manualChunks(id) {
					if (id.includes('/node_modules/mapbox-gl/')) return 'mapbox-gl';
					if (id.includes('/node_modules/gsap/'))       return 'gsap';
					if (id.includes('/node_modules/lenis/'))      return 'lenis';
				}
			}
		},
		chunkSizeWarningLimit: 600
	}
});
