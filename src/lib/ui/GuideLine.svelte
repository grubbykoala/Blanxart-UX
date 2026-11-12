<script>
	// ============================================
	// Blanxart Origins — Línea guía
	// Hilo punteado en oro que nace en el marcador
	// del mapa y «alcanza» la card narrativa, como
	// las llamadas de un atlas. Se proyecta en cada
	// frame para seguir a la cámara.
	// ============================================

	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';

	export let mapInstance = null;

	let gEl, lineEl, dotEl;
	let coords = null;
	let getAnchor = null;
	let extOpacity = 0;
	let reach = { v: 0 };
	let reachTween = null;
	let reduced = false;

	function lerp(a, b, t) { return a + (b - a) * t; }

	// — API pública —

	export function show(c, anchorFn) {
		coords = c;
		getAnchor = anchorFn;
		if (reachTween) reachTween.kill();
		if (reduced) {
			reach.v = 1;
		} else {
			reach.v = 0;
			reachTween = gsap.to(reach, { v: 1, duration: 1.1, delay: 0.15, ease: 'power3.out' });
		}
	}

	export function hide() {
		coords = null;
		getAnchor = null;
		extOpacity = 0;
		if (reachTween) { reachTween.kill(); reachTween = null; }
		if (gEl) gEl.style.opacity = '0';
	}

	export function setOpacity(o) {
		extOpacity = Math.max(0, Math.min(1, o));
	}

	// Reproyección por frame: el hilo sigue a la cámara
	function update() {
		if (!gEl) return;
		if (!coords || !getAnchor || !mapInstance || extOpacity <= 0.02) {
			gEl.style.opacity = '0';
			return;
		}

		const from = mapInstance.project(coords);
		const to = getAnchor();
		if (!to) { gEl.style.opacity = '0'; return; }

		const ex = lerp(from.x, to.x, reach.v);
		const ey = lerp(from.y, to.y, reach.v);

		lineEl.setAttribute('x1', from.x.toFixed(1));
		lineEl.setAttribute('y1', from.y.toFixed(1));
		lineEl.setAttribute('x2', ex.toFixed(1));
		lineEl.setAttribute('y2', ey.toFixed(1));
		dotEl.setAttribute('cx', ex.toFixed(1));
		dotEl.setAttribute('cy', ey.toFixed(1));

		gEl.style.opacity = String(extOpacity * 0.85);
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		gsap.ticker.add(update);
	});

	onDestroy(() => {
		gsap.ticker.remove(update);
		if (reachTween) reachTween.kill();
	});
</script>

<svg class="guide-line" aria-hidden="true">
	<g bind:this={gEl} style="opacity: 0;">
		<line bind:this={lineEl} />
		<circle bind:this={dotEl} r="2" />
	</g>
</svg>

<style>
	.guide-line {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 15; /* bajo las cards: el hilo asoma por detrás */
		pointer-events: none;
	}

	.guide-line line {
		stroke: var(--color-oro-viejo);
		stroke-width: 1;
		stroke-dasharray: 1 4;
		stroke-linecap: round;
	}

	.guide-line circle {
		fill: var(--color-oro-viejo);
	}

	.guide-line g {
		will-change: opacity;
		transition: none;
	}
</style>
