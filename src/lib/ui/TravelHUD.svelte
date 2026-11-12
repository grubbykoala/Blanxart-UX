<script>
	// ============================================
	// Blanxart Origins — HUD de expedición
	// Latitud, kilómetros y día de travesía contando
	// en vivo mientras el usuario cruza el Atlántico.
	// DM Mono, tabular, discreto: instrumento, no adorno.
	// ============================================

	import { gsap } from 'gsap';

	export let routeCoordinates = [];
	export let totalKm = 9012;
	export let totalDias = 30;

	let el;
	let latEl, kmEl, diaEl;

	// — API pública —

	export function show() {
		if (!el) return;
		gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' });
	}

	export function hide() {
		if (!el) return;
		gsap.to(el, { autoAlpha: 0, y: -8, duration: 0.6, ease: 'power2.in' });
	}

	export function setProgress(p) {
		if (!latEl || !kmEl || !diaEl || routeCoordinates.length < 2) return;

		// Posición actual interpolada sobre la ruta real
		const exact = Math.max(0, Math.min(1, p)) * (routeCoordinates.length - 1);
		const i = Math.floor(exact);
		const j = Math.min(i + 1, routeCoordinates.length - 1);
		const t = exact - i;
		const lat = routeCoordinates[i][1] + (routeCoordinates[j][1] - routeCoordinates[i][1]) * t;

		latEl.textContent = `${Math.abs(lat).toFixed(1).padStart(4, '0')}°${lat < 0 ? 'S' : 'N'}`;
		kmEl.textContent  = Math.round(p * totalKm).toLocaleString('es-ES');
		diaEl.textContent = String(1 + Math.floor(p * (totalDias - 1))).padStart(2, '0');
	}
</script>

<div class="travel-hud" bind:this={el} aria-live="off">
	<span class="hud-item">LAT <b bind:this={latEl}>03.5°S</b></span>
	<span class="hud-sep" aria-hidden="true">·</span>
	<span class="hud-item"><b bind:this={kmEl}>0</b> KM</span>
	<span class="hud-sep" aria-hidden="true">·</span>
	<span class="hud-item">DÍA <b bind:this={diaEl}>01</b></span>
</div>

<style>
	.travel-hud {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 20px);
		left: 0;
		right: 0;
		z-index: var(--z-ui);
		display: flex;
		justify-content: center;
		gap: 10px;
		pointer-events: none;

		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-kraft);
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 8px rgba(13, 8, 4, 0.9), 0 1px 2px rgba(13, 8, 4, 0.9);

		opacity: 0;
		visibility: hidden;
		transform: translateY(-8px);
		will-change: transform, opacity;
	}

	.travel-hud b {
		font-weight: 500;
		color: var(--color-oro-viejo);
	}

	.hud-sep {
		opacity: 0.5;
	}
</style>
