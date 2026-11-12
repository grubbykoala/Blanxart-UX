<script>
	// ============================================
	// Blanxart Origins — Motor del Mapa
	// Mapbox GL se importa de forma diferida para no
	// bloquear el primer paint (presupuesto: el bundle
	// inicial no carga los ~250 KB del motor WebGL).
	// ============================================

	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { MAP_STYLE_CONFIG, FOG_CONFIG, CAMERA_CONFIG, MAP_BOUNDS, MARKER_STYLES, MAP_GRADES, TERRAIN_CONFIG } from './mapConfig.js';

	export let accessToken = '';
	export let initialView = { center: [0, 20], zoom: 1.8, bearing: 0, pitch: 0 };
	export let onMapReady = null;
	export let onMapError = null;

	let mapContainer;
	let map = null;
	let mapboxgl = null;
	let markers = new Map();
	let stamps = new Map();
	let isMapLoaded = false;
	let failed = false;
	let loadTimeout = null;

	// Estado vivo del color grading (lo interpola GSAP)
	let gradeState = { ...MAP_GRADES.base };
	let gradeTween = null;

	function fail(reason) {
		if (failed || isMapLoaded) return;
		failed = true;
		if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }
		if (onMapError) onMapError(reason);
	}

	onMount(async () => {
		if (!accessToken) {
			fail('missing-token');
			return;
		}

		try {
			// Import diferido: el usuario ya está viendo la portada
			// tipográfica mientras esto descarga.
			const [{ default: gl }] = await Promise.all([
				import('mapbox-gl'),
				import('mapbox-gl/dist/mapbox-gl.css')
			]);
			mapboxgl = gl;
		} catch {
			fail('load-failed');
			return;
		}

		mapboxgl.accessToken = accessToken;

		// Si en 15s no ha cargado (red lenta extrema, token roto
		// sin error claro), pasamos al estado de error diseñado.
		loadTimeout = setTimeout(() => fail('timeout'), 15000);

		try {
			map = new mapboxgl.Map({
				container: mapContainer,
				style: MAP_STYLE_CONFIG,
				center: initialView.center,
				zoom: initialView.zoom,
				bearing: initialView.bearing,
				pitch: initialView.pitch,
				maxZoom: MAP_BOUNDS.maxZoom,
				minZoom: MAP_BOUNDS.minZoom,
				attributionControl: false,
				logoPosition: 'bottom-left',
				interactive: false,        // el scroll dirige la cámara
				fadeDuration: 600
			});
		} catch {
			fail('webgl-unsupported');
			return;
		}

		map.on('style.load', () => {
			map.setFog(FOG_CONFIG);
		});

		map.on('load', () => {
			if (failed) return;
			isMapLoaded = true;
			if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }

			// Relieve real: el Amazonas ondula, el litoral se levanta.
			// Si el DEM falla, el mapa sigue funcionando en plano.
			try {
				if (!map.getSource(TERRAIN_CONFIG.source)) {
					map.addSource(TERRAIN_CONFIG.source, {
						type: 'raster-dem',
						url: TERRAIN_CONFIG.url,
						tileSize: TERRAIN_CONFIG.tileSize,
						maxzoom: TERRAIN_CONFIG.maxzoom
					});
				}
				map.setTerrain({ source: TERRAIN_CONFIG.source, exaggeration: TERRAIN_CONFIG.exaggeration });
			} catch { /* terreno opcional */ }

			if (onMapReady) onMapReady(getPublicAPI());
		});

		// Solo errores fatales de autenticación tumban la experiencia;
		// un glyph o tile suelto que falle no debe romper nada.
		map.on('error', (e) => {
			const msg = e?.error?.message || '';
			const status = e?.error?.status;
			if (!isMapLoaded && (status === 401 || status === 403 || /token/i.test(msg))) {
				fail('auth');
			}
		});
	});

	onDestroy(() => {
		if (loadTimeout) clearTimeout(loadTimeout);
		if (gradeTween) gradeTween.kill();
		if (map) {
			markers.forEach((m) => m.remove());
			markers.clear();
			stamps.forEach((s) => s.remove());
			stamps.clear();
			map.remove();
			map = null;
		}
	});

	// ============================================
	// COLOR GRADING — el mapa cambia de piel
	// ============================================

	function applyGrade(g) {
		if (!map || !isMapLoaded) return;
		map.setPaintProperty('background', 'background-color', g.land);
		map.setPaintProperty('water', 'fill-color', g.water);
		map.setPaintProperty('waterway', 'line-color', g.water);
		map.setPaintProperty('landcover', 'fill-color', g.landcover);
		map.setPaintProperty('landcover', 'fill-opacity', g.landcoverOpacity);
		map.setFog({
			...FOG_CONFIG,
			'color': g.fogColor,
			'high-color': g.fogHigh,
			'horizon-blend': g.horizonBlend
		});
	}

	function setGrade(name, duration = 2.2) {
		const target = MAP_GRADES[name];
		if (!target || !map || !isMapLoaded) return;
		if (gradeTween) gradeTween.kill();

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced || duration <= 0) {
			gradeState = { ...target };
			applyGrade(gradeState);
			return;
		}

		gradeTween = gsap.to(gradeState, {
			...target,
			duration,
			ease: 'sine.inOut',
			onUpdate: () => applyGrade(gradeState)
		});
	}

	// ============================================
	// SELLOS DE PUERTO — se estampan sobre el mapa
	// ============================================

	function addStamp(config) {
		if (!map || !isMapLoaded || !mapboxgl) return;
		const { id, coords, label } = config;
		if (stamps.has(id)) return;

		const el = document.createElement('div');
		el.className = 'blx-port-stamp';
		el.innerHTML = `<span>${label}</span>`;

		const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
			.setLngLat(coords)
			.addTo(map);

		stamps.set(id, marker);
	}

	function removeStamp(id) {
		if (stamps.has(id)) {
			stamps.get(id).remove();
			stamps.delete(id);
		}
	}

	function clearStamps() {
		stamps.forEach((s) => s.remove());
		stamps.clear();
	}

	function flyTo(options) {
		if (!map || !isMapLoaded) return Promise.resolve();
		return new Promise((resolve) => {
			map.stop();
			map.flyTo({
				center: options.center,
				zoom: options.zoom,
				bearing: options.bearing ?? 0,
				pitch: options.pitch ?? 0,
				duration: options.duration ?? CAMERA_CONFIG.defaultDuration,
				essential: CAMERA_CONFIG.essential
			});
			map.once('moveend', resolve);
		});
	}

	function jumpTo(options) {
		if (!map || !isMapLoaded) return;
		map.jumpTo({
			center: options.center,
			zoom: options.zoom,
			bearing: options.bearing ?? 0,
			pitch: options.pitch ?? 0
		});
	}

	/**
	 * Marcador editorial: punto mínimo + rótulo en mono versal.
	 * El elemento queda anclado por el centro del punto; el rótulo
	 * cuelga en absoluto para no desplazar el anclaje.
	 */
	function addMarker(config) {
		if (!map || !isMapLoaded) return null;
		const { id, coords, label, style = 'default' } = config;

		if (markers.has(id)) markers.get(id).remove();

		const el = document.createElement('div');
		el.className = `blx-marker blx-marker--${style}`;
		el.innerHTML = `
			<span class="blx-marker__ring" aria-hidden="true"></span>
			<span class="blx-marker__dot" style="background:${MARKER_STYLES[style].color}"></span>
			${label ? `<span class="blx-marker__label">${label}</span>` : ''}
		`;

		const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
			.setLngLat(coords)
			.addTo(map);

		markers.set(id, marker);
		return marker;
	}

	function removeMarker(id) {
		if (markers.has(id)) {
			markers.get(id).remove();
			markers.delete(id);
		}
	}

	function updateMarkerStyle(id, style) {
		if (!markers.has(id)) return;
		const el = markers.get(id).getElement();
		el.className = `blx-marker blx-marker--${style}`;
		const dot = el.querySelector('.blx-marker__dot');
		if (dot) dot.style.background = MARKER_STYLES[style].color;
	}

	function clearMarkers() {
		markers.forEach((m) => m.remove());
		markers.clear();
	}

	function getMapInstance() {
		return map;
	}

	function isReady() {
		return isMapLoaded && map !== null;
	}

	function getPublicAPI() {
		return {
			flyTo, jumpTo,
			addMarker, removeMarker, updateMarkerStyle, clearMarkers,
			setGrade, addStamp, removeStamp, clearStamps,
			getMapInstance, isReady
		};
	}

	export { getPublicAPI };
</script>

<div class="map-engine">
	<div bind:this={mapContainer} class="map-container" />
</div>

<style>
	.map-engine {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
		/* Reserva el espacio en color de mapa antes de cargar — CLS 0 */
		background-color: var(--map-background);
	}

	.map-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		will-change: transform;
	}

	/* ========================================
	   MARCADORES — globales porque Mapbox los
	   monta fuera del árbol del componente
	   ======================================== */

	:global(.blx-marker) {
		position: relative;
		width: 14px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.blx-marker__dot) {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgba(13, 8, 4, 0.6);
	}

	:global(.blx-marker__ring) {
		position: absolute;
		inset: 0;
		border: 1px solid var(--color-pergamino);
		border-radius: 50%;
		opacity: 0;
	}

	:global(.blx-marker--active .blx-marker__ring) {
		opacity: 0.7;
		animation: blx-ring 1.6s cubic-bezier(0.37, 0, 0.63, 1) infinite;
	}

	:global(.blx-marker--fabrica .blx-marker__ring) {
		border-color: var(--color-oro-viejo);
		opacity: 0.7;
		animation: blx-ring 1.6s cubic-bezier(0.37, 0, 0.63, 1) infinite;
	}

	@keyframes blx-ring {
		0%   { transform: scale(1);    opacity: 0.7; }
		100% { transform: scale(2.6);  opacity: 0;   }
	}

	:global(.blx-marker--default) {
		opacity: 0.55;
	}

	/* Los marcadores en reposo callan: solo el activo habla.
	   Evita colisiones de rótulos al alejar la cámara. */
	:global(.blx-marker--default .blx-marker__label) {
		opacity: 0;
		transition: opacity var(--duration-normal) var(--ease-out);
	}

	:global(.blx-marker__label) {
		position: absolute;
		top: 18px;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--color-kraft);
		text-shadow:
			0 0 6px rgba(13, 8, 4, 0.9),
			0 1px 2px rgba(13, 8, 4, 0.9);
		pointer-events: none;
	}

	:global(.blx-marker--active .blx-marker__label) {
		color: var(--color-pergamino);
	}

	/* ========================================
	   SELLOS DE PUERTO — tinta de tampón sobre
	   el atlas, con golpe de estampado al entrar
	   ======================================== */

	:global(.blx-port-stamp) {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		border: 1.5px solid var(--color-oro-viejo);
		border-radius: 50%;
		box-shadow: inset 0 0 0 3px transparent, inset 0 0 0 4px var(--oro-15);
		background: rgba(13, 8, 4, 0.35);
		font-family: var(--font-mono);
		font-size: 8px;
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1.4;
		text-transform: uppercase;
		color: var(--color-oro-viejo);
		transform: rotate(-8deg);
		animation: blx-stamp-in 700ms var(--ease-out) forwards;
		opacity: 0;
	}

	:global(.blx-port-stamp span) {
		max-width: 52px;
	}

	@keyframes blx-stamp-in {
		0%   { opacity: 0;    transform: scale(1.7) rotate(-2deg); }
		55%  { opacity: 0.92; transform: scale(0.96) rotate(-9deg); }
		100% { opacity: 0.88; transform: scale(1) rotate(-8deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.blx-marker__ring) { animation: none !important; }
		:global(.blx-port-stamp) { animation: none; opacity: 0.88; }
	}

	/* Mapbox: logo discreto, sin attribution flotante
	   (crédito Mapbox/OSM va en el cierre de la experiencia) */
	:global(.mapboxgl-ctrl-logo) {
		opacity: 0.25;
		transform: scale(0.8);
		transform-origin: bottom left;
	}

	:global(.mapboxgl-ctrl-attrib) {
		display: none;
	}
</style>
