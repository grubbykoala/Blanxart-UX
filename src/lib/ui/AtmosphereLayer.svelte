<script>
	// ============================================
	// Blanxart Origins — Capa atmosférica
	// Lluvia amazónica y nubes en paralaje durante
	// la travesía. Todo procedural: cero imágenes.
	// La escena la dirige con setRain() y
	// setTravelProgress().
	// ============================================

	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	let rainEl;
	let cloudsEl;
	let cloudA, cloudB, cloudC;
	let reduced = false;

	// Gotas deterministas: posición, retardo y duración fijos
	// para que el render sea estable entre visitas.
	const drops = Array.from({ length: 16 }, (_, i) => ({
		left: (i * 6.3 + 2) % 100,
		delay: (i * 0.17) % 1.1,
		duration: 0.85 + (i % 5) * 0.13,
		height: 13 + (i % 4) * 3
	}));

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	function lerp(a, b, t) { return a + (b - a) * t; }

	function smoothstep(e0, e1, x) {
		const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
		return t * t * (3 - 2 * t);
	}

	// — API pública —

	export function setRain(on) {
		if (!rainEl || reduced) return;
		gsap.to(rainEl, { autoAlpha: on ? 1 : 0, duration: 1.4, ease: 'sine.inOut' });
	}

	export function setTravelProgress(p) {
		if (!cloudsEl || reduced) return;
		// Las nubes entran tras zarpar y se retiran al avistar costa
		const o = smoothstep(0.06, 0.2, p) * (1 - smoothstep(0.8, 0.94, p));
		cloudsEl.style.opacity = String(o);
		if (o <= 0) return;
		if (cloudA) cloudA.style.transform = `translate3d(${lerp(70, -150, p)}vw, 0, 0)`;
		if (cloudB) cloudB.style.transform = `translate3d(${lerp(120, -100, p)}vw, 0, 0)`;
		if (cloudC) cloudC.style.transform = `translate3d(${lerp(90, -190, p)}vw, 0, 0)`;
	}

	export function reset() {
		if (rainEl) gsap.set(rainEl, { autoAlpha: 0 });
		if (cloudsEl) cloudsEl.style.opacity = '0';
	}
</script>

<div class="atmosphere" aria-hidden="true">

	<!-- Lluvia — inclinada por el viento, solo en la selva -->
	<div class="atmo-rain" bind:this={rainEl}>
		{#each drops as d}
			<span
				style="left: {d.left}%; height: {d.height}px; animation-delay: {d.delay}s; animation-duration: {d.duration}s;"
			/>
		{/each}
	</div>

	<!-- Nubes — tres profundidades cruzando el Atlántico -->
	<div class="atmo-clouds" bind:this={cloudsEl}>
		<div class="cloud cloud--far"  bind:this={cloudB} />
		<div class="cloud cloud--mid"  bind:this={cloudA} />
		<div class="cloud cloud--near" bind:this={cloudC} />
	</div>
</div>

<style>
	.atmosphere {
		position: fixed;
		inset: 0;
		z-index: 5; /* sobre la viñeta, bajo las cards */
		pointer-events: none;
		overflow: hidden;
	}

	/* ========================================
	   LLUVIA
	   ======================================== */

	.atmo-rain {
		position: absolute;
		inset: -12%;
		/* El viento base + la deriva que aporta la velocidad del scroll */
		transform: rotate(calc(8deg + var(--scroll-tilt, 0deg)));
		opacity: 0;
		visibility: hidden;
		will-change: transform;
	}

	.atmo-rain span {
		position: absolute;
		top: -24px;
		width: 1px;
		background: linear-gradient(180deg, transparent, rgba(245, 237, 214, 0.4));
		animation-name: atmo-fall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		will-change: transform;
	}

	@keyframes atmo-fall {
		to { transform: translateY(130vh); }
	}

	/* ========================================
	   NUBES — gradientes radiales, sin filtros
	   caros; el blur va «horneado» en el degradado
	   ======================================== */

	.atmo-clouds {
		position: absolute;
		inset: 0;
		opacity: 0;
	}

	.cloud {
		position: absolute;
		border-radius: 50%;
		will-change: transform;
	}

	.cloud--far {
		top: 14%;
		width: 120vw;
		height: 14vh;
		background:
			radial-gradient(ellipse 60% 100% at 35% 55%, rgba(245, 237, 214, 0.1), transparent 70%),
			radial-gradient(ellipse 45% 80% at 70% 45%, rgba(245, 237, 214, 0.07), transparent 70%);
	}

	.cloud--mid {
		top: 36%;
		width: 140vw;
		height: 20vh;
		background:
			radial-gradient(ellipse 55% 100% at 42% 50%, rgba(245, 237, 214, 0.14), transparent 68%),
			radial-gradient(ellipse 38% 75% at 72% 58%, rgba(245, 237, 214, 0.09), transparent 70%);
	}

	.cloud--near {
		top: 62%;
		width: 160vw;
		height: 28vh;
		background:
			radial-gradient(ellipse 58% 100% at 38% 48%, rgba(245, 237, 214, 0.18), transparent 66%),
			radial-gradient(ellipse 42% 80% at 68% 55%, rgba(245, 237, 214, 0.12), transparent 70%);
	}

	@media (prefers-reduced-motion: reduce) {
		.atmo-rain span { animation: none; }
	}
</style>
