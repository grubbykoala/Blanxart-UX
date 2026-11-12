<script>
	// ============================================
	// Blanxart Origins — Página principal (Brasil)
	// ============================================

	import { onDestroy, tick } from 'svelte';
	import Lenis from 'lenis';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	import MapEngine             from '$lib/map/MapEngine.svelte';
	import EntryScreen           from '$lib/ui/EntryScreen.svelte';
	import NarrativeCard         from '$lib/ui/NarrativeCard.svelte';
	import RouteLines            from '$lib/ui/RouteLines.svelte';
	import ProgressDots          from '$lib/ui/ProgressDots.svelte';
	import SensorNotes           from '$lib/ui/SensorNotes.svelte';
	import AtmosphereLayer       from '$lib/ui/AtmosphereLayer.svelte';
	import ChapterNumeral        from '$lib/ui/ChapterNumeral.svelte';
	import TravelHUD             from '$lib/ui/TravelHUD.svelte';
	import GuideLine             from '$lib/ui/GuideLine.svelte';

	import { ORIGINS }          from '$lib/data/origins.js';
	import { BRASIL_SEQUENCE }  from '$lib/map/flyToSequences.js';
	import { initBrasilScene, DOT_SECTIONS } from '$lib/scroll/scenes/brasilScene.js';
	import { initScrollDynamics } from '$lib/scroll/scrollDynamics.js';

	gsap.registerPlugin(ScrollTrigger);

	const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

	// Estado
	let lenis             = null;
	let mapAPI            = null;
	let cleanupScene      = null;
	let destroyDynamics   = null;
	let showEntry         = true;
	let isExperienceReady = false;
	let mapReady          = false;
	let mapError          = null;

	// Referencias a componentes
	let narrativeCardRef;
	let routeLinesRef;
	let progressDotsRef;
	let sensorNotesRef;
	let atmosphereRef;
	let chapterNumeralRef;
	let travelHUDRef;
	let guideLineRef;

	// Sin scroll mientras la portada está activa
	$: if (typeof document !== 'undefined') {
		document.body.classList.toggle('entry-active', showEntry);
	}

	function initLenis() {
		lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			orientation: 'vertical',
			gestureOrientation: 'vertical',
			smoothWheel: true,
			wheelMultiplier: 1
		});

		lenis.on('scroll', ScrollTrigger.update);
		gsap.ticker.add((time) => { lenis.raf(time * 1000); });
		gsap.ticker.lagSmoothing(0);
	}

	function handleMapReady(api) {
		mapAPI   = api;
		mapReady = true;
	}

	function handleMapError(reason) {
		mapError = reason;
	}

	async function startExperience() {
		if (!mapAPI) return;

		// La portada se disuelve con GSAP — sin timers
		await gsap.to('.entry-screen', {
			autoAlpha: 0,
			duration: 1.2,
			ease: 'power2.inOut'
		});
		showEntry = false;

		isExperienceReady = true;
		await tick();

		const components = {
			narrativeCard:  narrativeCardRef,
			routeLines:     routeLinesRef,
			progressDots:   progressDotsRef,
			sensorNotes:    sensorNotesRef,
			atmosphere:     atmosphereRef,
			chapterNumeral: chapterNumeralRef,
			travelHUD:      travelHUDRef,
			guideLine:      guideLineRef
		};

		mapAPI.getMapInstance()?.resize();

		initLenis();
		destroyDynamics = initScrollDynamics(lenis);
		cleanupScene = initBrasilScene(mapAPI, components);
	}

	function handleNavigate(event) {
		const target = DOT_SECTIONS[event.detail.index];
		if (lenis && target) {
			lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 3) });
		}
	}

	onDestroy(() => {
		if (cleanupScene) cleanupScene();
		if (destroyDynamics) destroyDynamics();
		if (lenis) lenis.destroy();
		ScrollTrigger.getAll().forEach(t => t.kill());
	});
</script>

<svelte:head>
	<title>Blanxart Origins — Brasil</title>
	<meta name="description" content="Del Amazonas a Barcelona. El viaje del cacao Trinitario, contado sobre el mapa." />
</svelte:head>

{#if showEntry}
	<EntryScreen
		origin={ORIGINS.brasil}
		mapLoaded={mapReady}
		{mapError}
		on:start={startExperience}
	/>
{/if}

<div class="experience-container">

	<!-- El mapa es el escenario (fixed, bajo todo) -->
	<div id="map-container" class="map-wrapper">
		<MapEngine
			accessToken={MAPBOX_TOKEN}
			initialView={BRASIL_SEQUENCE.initial}
			onMapReady={handleMapReady}
			onMapError={handleMapError}
		/>

		{#if mapAPI && isExperienceReady}
			<RouteLines
				bind:this={routeLinesRef}
				mapInstance={mapAPI.getMapInstance()}
				routeCoordinates={ORIGINS.brasil.ruta_a_barcelona}
				routeId="brasil-route"
				progress={0}
				visible={false}
			/>
		{/if}
	</div>

	<!-- Viñeta: enfoca la lectura, oscurece los bordes -->
	<div class="map-vignette" aria-hidden="true" />

	<!-- Cinemascope: encuadran la travesía atlántica -->
	<div class="letterbox letterbox--top" aria-hidden="true" />
	<div class="letterbox letterbox--bottom" aria-hidden="true" />

	{#if isExperienceReady}
		<!-- Indicio de scroll: se retira con el primer gesto -->
		<div class="scroll-hint" aria-hidden="true">
			<span class="hint-label">Desliza</span>
			<span class="hint-line"><span class="hint-dot" /></span>
		</div>

		<AtmosphereLayer bind:this={atmosphereRef} />
		<ChapterNumeral bind:this={chapterNumeralRef} />
		<GuideLine bind:this={guideLineRef} mapInstance={mapAPI.getMapInstance()} />
		<NarrativeCard bind:this={narrativeCardRef} />
		<TravelHUD
			bind:this={travelHUDRef}
			routeCoordinates={ORIGINS.brasil.ruta_a_barcelona}
		/>
		<ProgressDots
			bind:this={progressDotsRef}
			totalSteps={DOT_SECTIONS.length}
			on:navigate={handleNavigate}
		/>
		<SensorNotes bind:this={sensorNotesRef} notes={ORIGINS.brasil.notas} />
	{/if}

	<!-- Partitura de scroll: cada sección es un tramo del guion -->
	<div class="scroll-sections">
		<section id="section-entrada"     class="scroll-section scroll-section--entrada" />
		<section id="section-plantacion"  class="scroll-section" />
		<section id="section-cooperativa" class="scroll-section" />
		<section id="section-notas"       class="scroll-section" />
		<section id="section-previaje"    class="scroll-section" />
		<section id="section-viaje"       class="scroll-section scroll-section--tall" />
		<section id="section-fabrica"     class="scroll-section" />
		<section id="section-oficio"      class="scroll-section" />
		<section id="section-cierre"      class="scroll-section" />

		<!-- Colofón: el mapa se disuelve y queda la firma -->
		<section id="section-final" class="scroll-section scroll-section--final">
			<div class="final-colophon">
				<p class="colophon-wordmark">Blanxart</p>
				<div class="colophon-rule" aria-hidden="true" />
				<p class="colophon-line">Chocolateros en Barcelona <em>desde 1954</em></p>
				<p class="colophon-data">Bean to bar · cacao de origen · tostado propio</p>
				<a class="colophon-cta" href="https://www.blanxart.com" rel="noopener">
					Descubre las otras tabletas
				</a>
				<p class="colophon-credits">Cartografía © Mapbox · © OpenStreetMap</p>
			</div>
		</section>
	</div>
</div>

<!-- Grano de papel — la capa que abriga toda la composición -->
<div class="grain-overlay" aria-hidden="true" />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		background-color: var(--color-cacao);
	}

	:global(body.entry-active) {
		overflow: hidden;
	}

	:global(html) {
		overflow-x: hidden;
	}

	:global(body)::-webkit-scrollbar { width: 0; background: transparent; }
	:global(body) { -ms-overflow-style: none; scrollbar-width: none; }

	/* ========================================
	   LAYOUT
	   ======================================== */

	.experience-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		min-height: 100svh;
	}

	.map-wrapper {
		position: fixed;
		top: 0; left: 0;
		width: 100%;
		height: 100vh;
		height: 100svh;
		z-index: var(--z-map);
		/* El banking de la travesía rota/escala este contenedor */
		will-change: opacity, transform;
		transform-origin: 50% 50%;
	}

	/* Sin transform aquí: un ancestro transformado rompería
	   cualquier position:fixed/pinning de los hijos */
	.scroll-sections {
		position: relative;
		z-index: var(--z-content);
		pointer-events: none;
	}

	.scroll-section {
		position: relative;
		width: 100%;
		min-height: 160vh;
		min-height: 160svh;
	}

	/* La entrada necesita recorrido: del planeta a Brasil */
	.scroll-section--entrada {
		min-height: 220vh;
		min-height: 220svh;
	}

	/* La travesía atlántica es el tramo largo */
	.scroll-section--tall {
		min-height: 300vh;
		min-height: 300svh;
	}

	@media (max-width: 768px) {
		.scroll-section--tall    { min-height: 260vh; min-height: 260svh; }
		.scroll-section--entrada { min-height: 200vh; min-height: 200svh; }
	}

	/* ========================================
	   COLOFÓN FINAL
	   ======================================== */

	.scroll-section--final {
		min-height: 130vh;
		min-height: 130svh;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 22svh;
	}

	.final-colophon {
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		text-align: center;
		padding: 0 var(--container-padding);
		opacity: 0;
		transform: translateY(24px);
		will-change: transform, opacity;
	}

	.colophon-wordmark {
		font-family: var(--font-display);
		font-size: var(--text-title);
		letter-spacing: 0.24em;
		text-indent: 0.24em;
		text-transform: uppercase;
		color: var(--color-pergamino);
	}

	.colophon-rule {
		width: 56px;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--color-kraft), transparent);
		opacity: 0.5;
	}

	.colophon-line {
		font-family: var(--font-display);
		font-size: var(--text-subtitle);
		color: var(--color-pergamino);
	}

	.colophon-line em {
		font-style: italic;
		color: var(--color-kraft);
	}

	.colophon-data {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-kraft);
		opacity: 0.8;
	}

	.colophon-cta {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-oro-viejo);
		border: 1px solid var(--oro-40);
		border-radius: var(--card-border-radius);
		padding: 14px 32px;
		margin-top: var(--space-lg);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		transition:
			border-color var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);
	}

	.colophon-cta:hover,
	.colophon-cta:focus-visible {
		border-color: var(--color-oro-viejo);
		background: var(--oro-08);
		color: var(--color-oro-viejo);
		outline: none;
	}

	.colophon-credits {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: var(--tracking-caption);
		color: var(--color-kraft);
		opacity: 0.45;
		margin-top: var(--space-xl);
	}

	/* ========================================
	   CINEMASCOPE — barras de encuadre de la
	   travesía (GSAP las mueve; nacen fuera)
	   ======================================== */

	.letterbox {
		position: fixed;
		left: 0;
		right: 0;
		height: 7svh;
		background: var(--map-water);
		z-index: 7; /* sobre atmósfera y viñeta, bajo la UI */
		pointer-events: none;
		transform: translateY(-101%);
		will-change: transform;
	}

	.letterbox--top    { top: 0; border-bottom: 1px solid var(--kraft-15); }
	.letterbox--bottom { bottom: 0; transform: translateY(101%); border-top: 1px solid var(--kraft-15); }

	/* ========================================
	   INDICIO DE SCROLL — se retira al primer gesto
	   ======================================== */

	.scroll-hint {
		position: fixed;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 22px);
		left: 0;
		right: 0;
		z-index: var(--z-ui);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		pointer-events: none;
	}

	.hint-label {
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 500;
		letter-spacing: 0.22em;
		text-indent: 0.22em;
		text-transform: uppercase;
		color: var(--color-kraft);
		opacity: 0.8;
		text-shadow: 0 1px 8px rgba(13, 8, 4, 0.8);
	}

	.hint-line {
		position: relative;
		width: 1px;
		height: 34px;
		background: linear-gradient(180deg, var(--kraft-30), transparent);
		overflow: hidden;
	}

	.hint-dot {
		position: absolute;
		top: -4px;
		left: -1.5px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-oro-viejo);
		animation: hintFall 1.9s cubic-bezier(0.37, 0, 0.63, 1) infinite;
	}

	@keyframes hintFall {
		0%   { transform: translateY(0);    opacity: 0; }
		25%  { opacity: 1; }
		75%  { opacity: 0.6; }
		100% { transform: translateY(34px); opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.hint-dot { animation: none; opacity: 0.7; top: 12px; }
	}

	/* ========================================
	   VIÑETA — profundidad en los bordes
	   ======================================== */

	.map-vignette {
		position: fixed;
		inset: 0;
		z-index: var(--z-vignette);
		pointer-events: none;
		background: radial-gradient(
			ellipse 92% 84% at 50% 50%,
			transparent 45%,
			rgba(13, 8, 4, 0.4) 100%
		);
	}

	/* ========================================
	   GRANO DE PAPEL — multiply al 9%,
	   cubre toda la composición (cards incluidas)
	   ======================================== */

	.grain-overlay {
		position: fixed;
		inset: -2%;
		z-index: var(--z-grain);
		pointer-events: none;
		/* Base 9% + refuerzo con la velocidad del scroll */
		opacity: calc(0.09 + var(--scroll-grain, 0));
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		background-size: 220px 220px;
		animation: grainDrift 8s ease-in-out infinite alternate;
		will-change: transform;
	}

	@keyframes grainDrift {
		from { transform: translate3d(0, 0, 0); }
		to   { transform: translate3d(-0.5%, -0.5%, 0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.grain-overlay { animation: none; }
	}
</style>
