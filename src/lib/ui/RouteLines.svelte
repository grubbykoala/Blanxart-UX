<script>
	// ============================================
	// Blanxart Origins — Línea de viaje
	// Trazo discontinuo en oro viejo que se dibuja con
	// el scroll. La cabeza es un punto de 6px con pulso
	// sine — sensación de travesía, no de vuelo comercial.
	// ============================================

	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';

	export let mapInstance      = null;
	export let routeCoordinates = [];
	export let routeId          = 'route-line';
	export let progress         = 0;
	export let visible          = true;

	let isLayerAdded    = false;
	let currentProgress = 0;
	let pulseTween      = null;

	// Espejo de --color-ruta / --color-oro-viejo (Mapbox no lee CSS vars)
	const ORO = '#B8860B';

	const SOURCE_ID         = `${routeId}-source`;
	const PROGRESS_SRC_ID   = `${routeId}-progress-source`;
	const HEAD_SRC_ID       = `${routeId}-head-source`;
	const WAKE_SRC_ID       = `${routeId}-wake-source`;
	const GHOST_LAYER_ID    = `${routeId}-ghost`;
	const PROGRESS_LAYER_ID = `${routeId}-progress`;
	const HEAD_LAYER_ID     = `${routeId}-head`;
	const WAKE_LAYER_ID     = `${routeId}-wake`;

	// Estela: últimas posiciones de la cabeza, se disipan con la edad
	const WAKE_LENGTH = 14;
	let wakeTrail = [];

	function initializeRoute() {
		if (!mapInstance || !routeCoordinates || routeCoordinates.length < 2) return;
		if (isLayerAdded) return;

		if (!mapInstance.isStyleLoaded()) {
			mapInstance.once('styledata', initializeRoute);
			return;
		}

		removeRoute();

		mapInstance.addSource(SOURCE_ID, {
			type: 'geojson',
			data: {
				type: 'Feature', properties: {},
				geometry: { type: 'LineString', coordinates: routeCoordinates }
			}
		});

		mapInstance.addSource(PROGRESS_SRC_ID, {
			type: 'geojson',
			data: {
				type: 'Feature', properties: {},
				geometry: { type: 'LineString', coordinates: [routeCoordinates[0], routeCoordinates[0]] }
			}
		});

		mapInstance.addSource(HEAD_SRC_ID, {
			type: 'geojson',
			data: {
				type: 'Feature', properties: {},
				geometry: { type: 'Point', coordinates: routeCoordinates[0] }
			}
		});

		// Ruta fantasma — el camino completo, apenas insinuado
		mapInstance.addLayer({
			id: GHOST_LAYER_ID, type: 'line', source: SOURCE_ID,
			layout: { 'line-join': 'round', 'line-cap': 'round' },
			paint: {
				'line-color': ORO,
				'line-width': 1,
				'line-opacity': 0.18,
				'line-dasharray': [1, 4]
			}
		});

		// Trazo recorrido — discontinuo 8/6 sobre stroke 1.5
		// (dasharray de Mapbox va en múltiplos del line-width)
		mapInstance.addLayer({
			id: PROGRESS_LAYER_ID, type: 'line', source: PROGRESS_SRC_ID,
			layout: { 'line-join': 'round', 'line-cap': 'round' },
			paint: {
				'line-color': ORO,
				'line-width': 1.5,
				'line-opacity': 0.95,
				'line-dasharray': [5.3, 4]
			}
		});

		mapInstance.addSource(WAKE_SRC_ID, {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] }
		});

		// Estela — partículas que la travesía deja atrás y se disipan
		mapInstance.addLayer({
			id: WAKE_LAYER_ID, type: 'circle', source: WAKE_SRC_ID,
			paint: {
				'circle-color': ORO,
				'circle-radius': ['interpolate', ['linear'], ['get', 'age'], 0, 2.2, WAKE_LENGTH - 1, 0.4],
				'circle-opacity': ['interpolate', ['linear'], ['get', 'age'], 0, 0.4, WAKE_LENGTH - 1, 0],
				'circle-blur': 0.4
			}
		});

		// Cabeza — punto de 6px (radio 3) con halo tenue
		mapInstance.addLayer({
			id: HEAD_LAYER_ID, type: 'circle', source: HEAD_SRC_ID,
			paint: {
				'circle-radius': 3,
				'circle-color': ORO,
				'circle-opacity': 1,
				'circle-stroke-width': 6,
				'circle-stroke-color': ORO,
				'circle-stroke-opacity': 0.18
			}
		});

		isLayerAdded = true;
		startPulse();
		updateProgressInternal(0);
	}

	// Pulso sine.inOut de 1.6s en el halo de la cabeza — GSAP, no timers
	function startPulse() {
		if (pulseTween) pulseTween.kill();
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const state = { halo: 6, opacity: 0.18 };
		pulseTween = gsap.to(state, {
			halo: 11,
			opacity: 0.04,
			duration: 0.8,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			onUpdate: () => {
				if (!mapInstance || !mapInstance.getLayer(HEAD_LAYER_ID)) return;
				mapInstance.setPaintProperty(HEAD_LAYER_ID, 'circle-stroke-width', state.halo);
				mapInstance.setPaintProperty(HEAD_LAYER_ID, 'circle-stroke-opacity', state.opacity);
			}
		});
	}

	function updateProgressInternal(progressValue) {
		if (!mapInstance || !isLayerAdded || !routeCoordinates || routeCoordinates.length < 2) return;

		currentProgress = Math.max(0, Math.min(1, progressValue));

		const totalPoints = routeCoordinates.length;
		const exactIndex  = currentProgress * (totalPoints - 1);
		const floorIndex  = Math.floor(exactIndex);
		const nextIndex   = Math.min(floorIndex + 1, totalPoints - 1);
		const segFrac     = exactIndex - floorIndex;

		const [lng1, lat1] = routeCoordinates[floorIndex];
		const [lng2, lat2] = routeCoordinates[nextIndex];
		const headCoord    = [
			lng1 + (lng2 - lng1) * segFrac,
			lat1 + (lat2 - lat1) * segFrac
		];

		const visibleCoords = routeCoordinates.slice(0, floorIndex + 1);
		if (segFrac > 0) visibleCoords.push(headCoord);
		if (visibleCoords.length < 2) visibleCoords.push(visibleCoords[0]);

		const progressSrc = mapInstance.getSource(PROGRESS_SRC_ID);
		if (progressSrc) {
			progressSrc.setData({
				type: 'Feature', properties: {},
				geometry: { type: 'LineString', coordinates: visibleCoords }
			});
		}

		const headSrc = mapInstance.getSource(HEAD_SRC_ID);
		if (headSrc) {
			headSrc.setData({
				type: 'Feature', properties: {},
				geometry: { type: 'Point', coordinates: headCoord }
			});
		}

		// Estela: registrar la posición y envejecer las anteriores
		const last = wakeTrail[0];
		if (!last || last[0] !== headCoord[0] || last[1] !== headCoord[1]) {
			wakeTrail.unshift(headCoord);
			if (wakeTrail.length > WAKE_LENGTH) wakeTrail.pop();
		}
		const wakeSrc = mapInstance.getSource(WAKE_SRC_ID);
		if (wakeSrc) {
			wakeSrc.setData({
				type: 'FeatureCollection',
				features: wakeTrail.map((c, i) => ({
					type: 'Feature',
					properties: { age: i },
					geometry: { type: 'Point', coordinates: c }
				}))
			});
		}
	}

	export function updateProgress(newProgress) {
		updateProgressInternal(newProgress);
	}

	// Ondas expansivas al tocar puerto: dos anillos que
	// nacen en el destino y se disipan sobre el mapa.
	export function pulseArrival() {
		if (!mapInstance || !isLayerAdded || routeCoordinates.length < 2) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const end = routeCoordinates[routeCoordinates.length - 1];
		const srcId = `${routeId}-arrival-src`;
		if (mapInstance.getSource(srcId)) return; // ya en curso

		mapInstance.addSource(srcId, {
			type: 'geojson',
			data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: end } }
		});

		const rings = [
			{ id: `${routeId}-arrival-1`, delay: 0 },
			{ id: `${routeId}-arrival-2`, delay: 0.4 }
		];

		let pending = rings.length;
		const cleanup = () => {
			pending -= 1;
			if (pending > 0) return;
			rings.forEach(r => { if (mapInstance.getLayer(r.id)) mapInstance.removeLayer(r.id); });
			if (mapInstance.getSource(srcId)) mapInstance.removeSource(srcId);
		};

		rings.forEach(ring => {
			mapInstance.addLayer({
				id: ring.id, type: 'circle', source: srcId,
				paint: {
					'circle-radius': 4,
					'circle-color': 'rgba(0,0,0,0)',
					'circle-stroke-width': 1.5,
					'circle-stroke-color': ORO,
					'circle-stroke-opacity': 0.55
				}
			});

			const state = { r: 4, o: 0.55 };
			gsap.to(state, {
				r: 52, o: 0,
				duration: 1.7,
				delay: ring.delay,
				ease: 'power2.out',
				onUpdate: () => {
					if (!mapInstance.getLayer(ring.id)) return;
					mapInstance.setPaintProperty(ring.id, 'circle-radius', state.r);
					mapInstance.setPaintProperty(ring.id, 'circle-stroke-opacity', state.o);
				},
				onComplete: cleanup
			});
		});
	}

	export function setVisibility(isVisible) {
		if (!mapInstance || !isLayerAdded) return;
		const visibility = isVisible ? 'visible' : 'none';
		[HEAD_LAYER_ID, WAKE_LAYER_ID, PROGRESS_LAYER_ID, GHOST_LAYER_ID].forEach(id => {
			if (mapInstance.getLayer(id)) {
				mapInstance.setLayoutProperty(id, 'visibility', visibility);
			}
		});
		if (!isVisible) {
			wakeTrail = [];
			const wakeSrc = mapInstance.getSource(WAKE_SRC_ID);
			if (wakeSrc) wakeSrc.setData({ type: 'FeatureCollection', features: [] });
		}
	}

	export function removeRoute() {
		if (!mapInstance) return;
		if (pulseTween) { pulseTween.kill(); pulseTween = null; }

		[HEAD_LAYER_ID, WAKE_LAYER_ID, PROGRESS_LAYER_ID, GHOST_LAYER_ID].forEach(id => {
			if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
		});
		[SOURCE_ID, PROGRESS_SRC_ID, HEAD_SRC_ID, WAKE_SRC_ID].forEach(id => {
			if (mapInstance.getSource(id)) mapInstance.removeSource(id);
		});

		wakeTrail = [];
		isLayerAdded = false;
	}

	$: if (mapInstance && routeCoordinates.length > 0) initializeRoute();
	$: if (isLayerAdded) updateProgressInternal(progress);
	$: if (isLayerAdded) setVisibility(visible);

	onMount(() => {
		if (mapInstance && routeCoordinates.length > 0) initializeRoute();
	});

	onDestroy(() => {
		removeRoute();
	});
</script>

<!-- Sin DOM propio — todo vive en capas de Mapbox GL -->
