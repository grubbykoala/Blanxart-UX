<script>
	// Blanxart Origins — Notas de cata cinemáticas
	// Sin caja: los ítems flotan sobre el mapa.
	// Cada nota entra con stagger desde abajo,
	// igual que NarrativeCard pero con layout de lista.

	import { onDestroy } from 'svelte';
	import { gsap } from 'gsap';

	export let notes = [];
	let eyebrow = '';
	let title   = '';
	let dato    = '';
	let visible = false;

	let containerEl;
	let eyebrowEl;
	let titleLineEl;
	let datoEl;

	let revealTl   = null;
	let _pending   = false;
	let _hasPlayed = false;

	export function show(config = {}) {
		if (config.notes)   notes   = config.notes;
		if (config.eyebrow) eyebrow = config.eyebrow;
		if (config.title)   title   = config.title;
		if (config.dato)    dato    = config.dato;
		visible    = true;
		_pending   = true;
		_hasPlayed = false;
		if (revealTl) { revealTl.kill(); revealTl = null; }
		requestAnimationFrame(_resetElements);
	}

	export function hide() {
		visible    = false;
		_pending   = false;
		_hasPlayed = false;
		if (revealTl) { revealTl.kill(); revealTl = null; }
		if (containerEl) containerEl.style.setProperty('--card-opacity', '0');
		requestAnimationFrame(_resetElements);
	}

	export function setCardTransform(_offsetY, opacity) {
		if (!containerEl) return;
		const op = Math.max(0, Math.min(1, opacity));
		containerEl.style.setProperty('--card-opacity', String(op));

		if (op > 0.08 && _pending && !_hasPlayed) {
			_hasPlayed = true;
			_pending   = false;
			_playReveal();
		}
		if (op < 0.02 && _hasPlayed) {
			_hasPlayed = false;
			requestAnimationFrame(_resetElements);
		}
	}

	function _resetElements() {
		if (!containerEl) return;
		if (eyebrowEl)   gsap.set(eyebrowEl,  { opacity: 0, y: 8 });
		if (titleLineEl) gsap.set(titleLineEl, { y: '108%' });
		const items = containerEl.querySelectorAll('.note-row');
		if (items.length) gsap.set(items, { opacity: 0, y: 28 });
		if (datoEl) gsap.set(datoEl, { opacity: 0 });
	}

	function _playReveal() {
		if (!containerEl) return;
		if (revealTl) revealTl.kill();
		const items = containerEl.querySelectorAll('.note-row');
		revealTl = gsap.timeline();

		if (eyebrowEl) {
			revealTl.to(eyebrowEl, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0);
		}
		if (titleLineEl) {
			revealTl.to(titleLineEl, { y: '0%', duration: 0.85, ease: 'power4.out' }, 0.06);
		}
		if (items.length) {
			revealTl.to(items, {
				opacity: 1, y: 0,
				duration: 0.55, ease: 'power3.out',
				stagger: 0.1
			}, 0.28);
		}
		if (datoEl) {
			revealTl.to(datoEl, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.7);
		}
	}

	onDestroy(() => {
		if (revealTl) revealTl.kill();
	});
</script>

<div
	class="sensor-overlay"
	class:visible
	bind:this={containerEl}
	aria-live="polite"
>
	<div class="sensor-scrim" aria-hidden="true" />

	<div class="sensor-content">
		{#if eyebrow}
			<p class="sensor-eyebrow" bind:this={eyebrowEl}>{eyebrow}</p>
		{/if}

		{#if title}
			<div class="sensor-title-wrap">
				<span class="sensor-title-inner" bind:this={titleLineEl}>{@html title}</span>
			</div>
		{/if}

		<ol class="notes-list" aria-label="Perfil sensorial">
			{#each notes as note, i}
				<li class="note-row">
					<span class="note-index">{String(i + 1).padStart(2, '0')}</span>
					<div class="note-body">
						<h4 class="note-name">{note.nombre}</h4>
						<p class="note-desc">{note.descripcion}</p>
					</div>
				</li>
			{/each}
		</ol>

		{#if dato}
			<footer class="sensor-dato" bind:this={datoEl}>{dato}</footer>
		{/if}
	</div>
</div>

<style>
	.sensor-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-ui);
		pointer-events: none;
		opacity: var(--card-opacity, 0);
		will-change: opacity;
	}

	.sensor-overlay.visible {
		pointer-events: auto;
	}

	/* ========================================
	   SCRIM
	   ======================================== */

	.sensor-scrim {
		position: absolute;
		left: 0; right: 0; bottom: 0;
		height: 72vh;
		background: linear-gradient(
			to top,
			rgba(13, 8, 4, 0.88) 0%,
			rgba(13, 8, 4, 0.50) 42%,
			rgba(13, 8, 4, 0.12) 72%,
			transparent 100%
		);
		pointer-events: none;
	}

	/* ========================================
	   CONTENIDO
	   ======================================== */

	.sensor-content {
		position: absolute;
		bottom: 8%;
		left: var(--container-padding);
		max-width: min(94vw, 680px);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		/* Física de scroll: la velocidad del pulgar inclina el bloque */
		transform: skewY(var(--scroll-skew, 0deg));
		will-change: transform;
	}

	.sensor-eyebrow {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		font-weight: var(--font-weight-medium);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-oro-viejo);
		opacity: 0;
		margin-bottom: var(--space-xs);
	}

	/* ========================================
	   TÍTULO — mismo reveal que NarrativeCard
	   ======================================== */

	.sensor-title-wrap {
		overflow: hidden;
		margin-bottom: var(--space-lg);
	}

	.sensor-title-inner {
		display: block;
		transform: translateY(108%);
		font-family: var(--font-display);
		font-size: clamp(32px, 8vw, 64px);
		line-height: 1.03;
		letter-spacing: -0.02em;
		color: var(--color-pergamino);
		text-shadow: 0 2px 16px rgba(13, 8, 4, 0.95);
	}

	.sensor-title-inner :global(em) {
		font-style: italic;
		color: var(--color-kraft);
	}

	/* ========================================
	   LISTA DE NOTAS
	   ======================================== */

	.notes-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.note-row {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		padding: clamp(10px, 2vh, 16px) 0;
		opacity: 0;
	}

	.note-row + .note-row {
		border-top: 1px solid var(--kraft-15);
	}

	.note-index {
		font-family: var(--font-mono);
		font-size: clamp(28px, 5vw, 44px);
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-oro-viejo);
		opacity: 0.55;
		font-variant-numeric: tabular-nums;
		min-width: 2ch;
		flex-shrink: 0;
	}

	.note-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.note-name {
		font-family: var(--font-display);
		font-size: clamp(18px, 4.5vw, 26px);
		line-height: 1.15;
		color: var(--color-pergamino);
		text-shadow: 0 1px 8px rgba(13, 8, 4, 0.8);
	}

	.note-desc {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		line-height: var(--leading-normal);
		color: var(--color-kraft);
		opacity: 0.85;
		margin: 0;
	}

	/* ========================================
	   DATO
	   ======================================== */

	.sensor-dato {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		letter-spacing: var(--tracking-data);
		text-transform: uppercase;
		color: var(--color-kraft);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--kraft-20);
		margin-top: var(--space-xs);
		font-variant-numeric: tabular-nums;
		opacity: 0;
	}

	/* ========================================
	   RESPONSIVE
	   ======================================== */

	@media (max-width: 768px) {
		.sensor-content  { bottom: 10%; }
		.note-index      { font-size: clamp(22px, 5vw, 32px); }
		.note-name       { font-size: clamp(16px, 4vw, 22px); }
	}

	@media (max-height: 640px) {
		.sensor-scrim    { height: 58vh; }
		.sensor-content  { bottom: 6%; }
		.note-desc       { display: none; }
		.note-row        { padding: 8px 0; }
	}
</style>
