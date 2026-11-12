<script>
	// Blanxart Origins — Portada
	// Tableta con aura pulsante, título reveal por líneas,
	// wordmark letra a letra y partículas flotantes.

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { gsap } from 'gsap';

	const dispatch = createEventDispatcher();

	export let origin    = null;
	export let visible   = true;
	export let mapLoaded = false;
	export let mapError  = null;

	let isReady = false;
	let phraseEl;
	let phraseTl = null;
	let entryTl  = null;

	const phrases = [
		'Preparando el viaje…',
		'Del Amazonas al Atlántico…',
		'9.012 kilómetros de cacao…',
		'Ya casi llegamos…'
	];

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		isReady = true;

		entryTl = gsap.timeline();

		// 1 — Contenedor general
		entryTl.fromTo('.entry-content',
			{ opacity: 0 },
			{ opacity: 1, duration: 0.7, ease: 'power2.out' }, 0);

		// 2 — Wordmark letra a letra
		const letters = document.querySelectorAll('.cover-wordmark-letter');
		if (letters.length) {
			entryTl.fromTo(letters,
				{ opacity: 0, y: 7 },
				{ opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.055 },
				0.15);
		}

		// 3 — Filete y serie
		entryTl.fromTo('.cover-rule, .cover-series',
			{ opacity: 0 },
			{ opacity: 1, duration: 0.45, ease: 'power2.out' },
			0.55);

		// 4 — Líneas del título (rise desde abajo)
		if (!reduced) {
			const titleInners = document.querySelectorAll('.cover-title-inner');
			if (titleInners.length) {
				entryTl.fromTo(titleInners,
					{ y: '110%' },
					{ y: '0%', duration: 0.88, ease: 'power4.out', stagger: 0.15 },
					0.3);
			}
		} else {
			const titleInners = document.querySelectorAll('.cover-title-inner');
			if (titleInners.length) gsap.set(titleInners, { y: '0%' });
		}

		// 5 — Coordenadas
		entryTl.fromTo('.cover-data',
			{ opacity: 0, y: 5 },
			{ opacity: 0.7, y: 0, duration: 0.5, ease: 'power3.out' },
			0.78);

		if (!reduced) {
			// Frases de carga
			phraseTl = gsap.timeline({ repeat: -1 });
			phrases.forEach(p => {
				phraseTl
					.call(() => { if (phraseEl) phraseEl.textContent = p; })
					.fromTo(phraseEl,
						{ opacity: 0, y: 4 },
						{ opacity: 0.7, y: 0, duration: 0.6, ease: 'power3.out' })
					.to(phraseEl,
						{ opacity: 0, y: -3, duration: 0.6, ease: 'power2.in' }, '+=1.1');
			});
		} else if (phraseEl) {
			phraseEl.textContent = phrases[0];
			phraseEl.style.opacity = '0.7';
		}
	});

	$: if ((mapLoaded || mapError) && phraseTl) {
		phraseTl.kill();
		phraseTl = null;
		if (phraseEl) gsap.to(phraseEl, { opacity: 0, duration: 0.6, ease: 'power2.in' });
	}
	onDestroy(() => {
		if (phraseTl) phraseTl.kill();
		if (entryTl) entryTl.kill();
	});
</script>

<div class="entry-screen" class:visible class:ready={isReady}>

	<!-- Partículas flotantes — ambiente -->
	<div class="entry-particles" aria-hidden="true">
		{#each Array(9) as _, i}
			<span
				class="entry-particle"
				style="
					left: {6 + i * 10}%;
					bottom: {18 + (i % 4) * 4}%;
					width: {1.2 + (i % 3) * 0.6}px;
					height: {1.2 + (i % 3) * 0.6}px;
					animation-delay: {i * 0.52}s;
					animation-duration: {3.4 + i * 0.38}s;
				"
			/>
		{/each}
	</div>

	<div class="entry-content">

		<!-- Cabecera -->
		<header class="cover-masthead">
			<p class="cover-wordmark" aria-label="Blanxart">
				{#each 'Blanxart'.split('') as letter}
					<span class="cover-wordmark-letter">{letter}</span>
				{/each}
			</p>
			<div class="cover-rule" aria-hidden="true" />
			<p class="cover-series">Origins · Nº 01 — Brasil</p>
		</header>

		{#if mapError}
			<div class="cover-error">
				<h1 class="cover-title">
					<span class="cover-title-line"><span class="cover-title-inner">El mapa no ha</span></span>
					<span class="cover-title-line"><span class="cover-title-inner"><em>querido salir</em></span></span>
				</h1>
				<p class="error-text">
					No hemos podido cargar la cartografía del viaje.
					Comprueba tu conexión y vuelve a intentarlo: el cacao sabe esperar.
				</p>
				<button class="cover-btn" on:click={() => window.location.reload()}>
					Reintentar
				</button>
			</div>
		{:else}
			<!-- Fruto de cacao — grabado a línea que se dibuja solo -->
			<div class="pod-stage" aria-hidden="true">
				<div class="pod-aura" />
				<svg class="pod-art" viewBox="0 0 90 124" fill="none">
					<!-- Pedúnculo -->
					<path class="pa pa-stem" d="M45 16 C45 11 47 7 50 4" pathLength="100" />
					<!-- Contorno del fruto -->
					<path class="pa pa-body" d="M45 18 C63 18 74 34 74 62 C74 90 63 106 45 106 C27 106 16 90 16 62 C16 34 27 18 45 18 Z" pathLength="100" />
					<!-- Costillas -->
					<path class="pa pa-rib" d="M34 24 C29 42 29 82 34 100" pathLength="100" />
					<path class="pa pa-rib" d="M56 24 C61 42 61 82 56 100" pathLength="100" />
					<path class="pa pa-rib pa-rib--center" d="M45 18 L45 106" pathLength="100" />
					<!-- Marcas de grabado -->
					<path class="pa pa-tick" d="M25 46 C24 52 24 58 24 62" pathLength="100" />
					<path class="pa pa-tick" d="M65 66 C66 72 66 76 65 80" pathLength="100" />
				</svg>
			</div>

			<!-- Título: dos líneas con reveal independiente -->
			<h1 class="cover-title">
				<span class="cover-title-line">
					<span class="cover-title-inner">Del Amazonas</span>
				</span>
				<span class="cover-title-line">
					<span class="cover-title-inner"><em>a Barcelona</em></span>
				</span>
			</h1>

			<p class="cover-data">03°28′S 60°01′O&thinsp;—&thinsp;41°22′N 02°02′E</p>

			<div class="cover-footer">
				<p class="loading-phrase" bind:this={phraseEl} aria-live="polite"></p>
				{#if mapLoaded}
					<button class="cover-btn" on:click={() => dispatch('start')}>
						Comenzar el viaje
					</button>
				{/if}
			</div>
		{/if}

	</div>
</div>

<style>
	.entry-screen {
		position: fixed;
		inset: 0;
		height: 100vh;
		height: 100svh;
		z-index: var(--z-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background:
			radial-gradient(ellipse 130% 95% at 50% 0%,
				var(--color-cacao) 0%,
				var(--map-background) 58%,
				var(--map-water) 100%);
		opacity: 0;
		pointer-events: none;
	}

	.entry-screen.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.entry-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 var(--container-padding);
		max-width: 420px;
		width: 100%;
		opacity: 0;
	}

	/* ========================================
	   PARTÍCULAS AMBIENTALES
	   ======================================== */

	.entry-particles {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}

	.entry-particle {
		position: absolute;
		border-radius: 50%;
		background: var(--color-oro-viejo);
		opacity: 0;
		animation: particleFloat linear infinite;
	}

	@keyframes particleFloat {
		0%  { opacity: 0;    transform: translateY(0)      translateX(0); }
		12% { opacity: 0.5; }
		88% { opacity: 0.06; }
		100%{ opacity: 0;    transform: translateY(-320px) translateX(10px); }
	}

	/* ========================================
	   CABECERA DE CUBIERTA
	   ======================================== */

	.cover-masthead {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-2xl);
	}

	.cover-wordmark {
		font-family: var(--font-display);
		font-size: clamp(24px, 6.5vw, 32px);
		letter-spacing: 0.24em;
		text-indent: 0.24em;
		text-transform: uppercase;
		color: var(--color-pergamino);
		line-height: 1;
	}

	.cover-wordmark-letter {
		display: inline-block;
	}

	.cover-rule {
		width: 72px;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--color-kraft), transparent);
		opacity: 0.5;
	}

	.cover-series {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-oro-viejo);
	}

	/* ========================================
	   FRUTO DE CACAO CON AURA
	   ======================================== */

	.pod-stage {
		margin-bottom: var(--space-2xl);
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pod-aura {
		position: absolute;
		width: 190px;
		height: 190px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			var(--oro-15) 0%,
			var(--oro-08) 45%,
			transparent 70%
		);
		filter: blur(26px);
		animation: auraPulse 3.6s ease-in-out infinite alternate;
		pointer-events: none;
	}

	@keyframes auraPulse {
		from { transform: scale(0.85); opacity: 0.3; }
		to   { transform: scale(1.15); opacity: 0.6; }
	}

	/* Grabado a línea: trazo oro que se dibuja al abrir
	   y queda meciéndose apenas, como colgado de la rama */
	.pod-art {
		width: 84px;
		height: auto;
		display: block;
		animation: podSway 6.5s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
		transform-origin: 50% 6%;
	}

	@keyframes podSway {
		from { transform: rotate(-2.4deg); }
		to   { transform: rotate(2.4deg); }
	}

	.pa {
		stroke: var(--color-oro-viejo);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 100;
		stroke-dashoffset: 100;
		animation: podDraw 2.2s var(--ease-out) forwards;
	}

	.pa-stem { animation-delay: 0.2s; stroke-width: 1.4; }
	.pa-body { animation-delay: 0.35s; }
	.pa-rib  { animation-delay: 0.9s; stroke-width: 1.1; opacity: 0.75; }
	.pa-rib--center { animation-delay: 1.05s; opacity: 0.45; }
	.pa-tick { animation-delay: 1.3s; stroke-width: 1; opacity: 0.5; stroke: var(--color-kraft); }

	@keyframes podDraw {
		to { stroke-dashoffset: 0; }
	}

	/* ========================================
	   TÍTULO — reveal por líneas
	   ======================================== */

	.cover-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		margin-bottom: var(--space-md);
		text-align: center;
	}

	.cover-title-line {
		display: block;
		overflow: hidden;
		line-height: 1.05;
	}

	.cover-title-inner {
		display: block;
		transform: translateY(110%);
		font-family: var(--font-display);
		font-size: var(--text-display);
		line-height: var(--leading-display);
		letter-spacing: var(--tracking-display);
		color: var(--color-pergamino);
	}

	.cover-title-inner em {
		font-style: italic;
		color: var(--color-kraft);
	}

	/* ========================================
	   DATOS Y PIE
	   ======================================== */

	.cover-data {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		letter-spacing: var(--tracking-data);
		color: var(--color-kraft);
		opacity: 0;
		margin-bottom: var(--space-2xl);
		font-variant-numeric: tabular-nums;
	}

	.cover-footer {
		position: relative;
		height: 64px;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: 100%;
	}

	.loading-phrase {
		position: absolute;
		top: 12px;
		font-family: var(--font-body);
		font-size: var(--text-caption);
		letter-spacing: var(--tracking-caption);
		color: var(--color-kraft);
		opacity: 0;
	}

	.cover-btn {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-oro-viejo);
		border: 1px solid var(--oro-40);
		border-radius: var(--card-border-radius);
		padding: 14px 36px;
		min-height: 44px;
		opacity: 0;
		animation: btnFadeIn var(--duration-normal) var(--ease-out) 200ms forwards;
		transition:
			border-color var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);
	}

	.cover-btn:hover,
	.cover-btn:focus-visible {
		border-color: var(--color-oro-viejo);
		background: var(--oro-08);
		outline: none;
	}

	@keyframes btnFadeIn {
		to { opacity: 1; }
	}

	/* ========================================
	   ESTADO DE ERROR
	   ======================================== */

	.cover-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
	}

	.error-text {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		line-height: var(--leading-narrative);
		text-align: center;
		color: var(--color-kraft);
		max-width: 30ch;
	}

	/* ========================================
	   RESPONSIVE
	   ======================================== */

	@media (max-height: 640px) {
		.pod-stage,
		.cover-masthead { margin-bottom: var(--space-lg); }
		.cover-data     { margin-bottom: var(--space-lg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.cover-btn      { animation: none; opacity: 1; }
		.pod-aura       { animation: none; opacity: 0.5; }
		.pod-art        { animation: none; }
		.pa             { animation: none; stroke-dashoffset: 0; }
		.entry-particle { animation: none; display: none; }
	}
</style>
