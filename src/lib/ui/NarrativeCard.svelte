<script>
	// Blanxart Origins — Overlay cinemático
	// Sin caja: el texto flota sobre el mapa.
	// Reveal: cada línea del título sube desde abajo
	// (overflow:hidden + translateY 108% → 0%) con GSAP.
	// El scroll controla la opacidad del contenedor;
	// el reveal se dispara la primera vez que opacity > 0.08.

	import { onDestroy } from 'svelte';
	import { gsap } from 'gsap';

	let variant = 'milestone';
	let eyebrow = '';
	let title   = '';
	let content = '';
	let dato    = '';
	let visible = false;
	let align   = 'left';

	let containerEl;
	let eyebrowEl;
	let ruleEl;
	let contentEl;
	let datoEl;

	let revealTl   = null;
	let _pending   = false;
	let _hasPlayed = false;

	export function show(config) {
		variant = config.variant || 'milestone';
		eyebrow = config.eyebrow || config.subtitle || '';
		title   = config.title   || '';
		content = config.content || '';
		dato    = config.dato    || '';
		align   = config.align   || 'left';
		visible = true;
		_pending   = true;
		_hasPlayed = false;
		if (revealTl) { revealTl.kill(); revealTl = null; }
		// Deja que Svelte actualice el DOM antes de resetear
		requestAnimationFrame(_resetElements);
	}

	export function hide() {
		visible = false;
		_pending   = false;
		_hasPlayed = false;
		if (revealTl) { revealTl.kill(); revealTl = null; }
		if (containerEl) containerEl.style.setProperty('--card-opacity', '0');
		requestAnimationFrame(_resetElements);
	}

	export function update(config) {
		if (config.eyebrow !== undefined) eyebrow = config.eyebrow;
		if (config.title   !== undefined) title   = config.title;
		if (config.content !== undefined) content = config.content;
		if (config.dato    !== undefined) dato    = config.dato;
	}

	// Punto donde la línea guía del mapa «toca» el texto:
	// el arranque del eyebrow del bloque de contenido
	// (no el overlay, que ocupa todo el viewport).
	export function getAnchor() {
		if (!containerEl) return null;
		const content = containerEl.querySelector('.cinematic-content');
		if (!content) return null;
		const r = content.getBoundingClientRect();
		if (r.width === 0) return null;
		return align === 'right'
			? { x: r.right - 16, y: r.top - 10 }
			: { x: r.left + 16, y: r.top - 10 };
	}

	// El scroll solo controla opacidad; el movimiento lo hace el reveal.
	export function setCardTransform(_offsetY, opacity) {
		if (!containerEl) return;
		const op = Math.max(0, Math.min(1, opacity));
		containerEl.style.setProperty('--card-opacity', String(op));

		if (op > 0.08 && _pending && !_hasPlayed) {
			_hasPlayed = true;
			_pending   = false;
			_playReveal();
		}
		// Reset al desaparecer para que la próxima vez vuelva a animar
		if (op < 0.02 && _hasPlayed) {
			_hasPlayed = false;
			requestAnimationFrame(_resetElements);
		}
	}

	function _resetElements() {
		if (!containerEl) return;
		const lines = containerEl.querySelectorAll('.title-line-inner');
		if (lines.length) gsap.set(lines, { y: '108%' });
		if (eyebrowEl) gsap.set(eyebrowEl, { opacity: 0, y: 10 });
		if (ruleEl)    gsap.set(ruleEl,    { scaleX: 0, opacity: 0 });
		if (contentEl) gsap.set(contentEl, { opacity: 0, y: 16 });
		if (datoEl)    gsap.set(datoEl,    { opacity: 0 });
	}

	function _playReveal() {
		if (!containerEl) return;
		if (revealTl) revealTl.kill();
		const lines = containerEl.querySelectorAll('.title-line-inner');
		revealTl = gsap.timeline();

		if (eyebrowEl) {
			revealTl.to(eyebrowEl,
				{ opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0);
		}
		if (ruleEl) {
			revealTl.to(ruleEl,
				{ scaleX: 1, opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.08);
		}
		if (lines.length) {
			revealTl.to(lines,
				{ y: '0%', duration: 0.92, ease: 'power4.out', stagger: 0.14 },
				0.1);
		}
		if (contentEl) {
			revealTl.to(contentEl,
				{ opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.38);
		}
		if (datoEl) {
			revealTl.to(datoEl,
				{ opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.62);
		}
	}

	// Divide el título por <br> para animar línea a línea
	$: titleLines = title ? title.split(/<br\s*\/?>/i) : [];

	onDestroy(() => {
		if (revealTl) revealTl.kill();
	});
</script>

<div
	class="cinematic-overlay cinematic--{variant} cinematic--align-{align}"
	class:visible
	bind:this={containerEl}
	aria-live="polite"
>
	<!-- Degradado de lectura: oscurece la mitad inferior del mapa -->
	<div class="cinematic-scrim" aria-hidden="true" />

	<div class="cinematic-content">
		{#if eyebrow}
			<p class="cinematic-eyebrow" bind:this={eyebrowEl}>{eyebrow}</p>
		{/if}

		<!-- Filete que se dibuja antes del título -->
		{#if title}
			<span class="cinematic-rule" bind:this={ruleEl} aria-hidden="true" />
		{/if}

		{#if title}
			<div
				class="cinematic-title"
				class:cinematic-title--display={variant === 'entry'}
			>
				{#each titleLines as line}
					<span class="title-line">
						<span class="title-line-inner">{@html line}</span>
					</span>
				{/each}
			</div>
		{/if}

		{#if content}
			<p class="cinematic-body" bind:this={contentEl}>{content}</p>
		{/if}

		{#if dato}
			<footer class="cinematic-dato" bind:this={datoEl}>{dato}</footer>
		{/if}
	</div>
</div>

<style>
	.cinematic-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-ui);
		pointer-events: none;
		opacity: var(--card-opacity, 0);
		will-change: opacity;
	}

	.cinematic-overlay.visible {
		pointer-events: auto;
	}

	/* ========================================
	   SCRIM — stage de lectura en la mitad baja
	   ======================================== */

	.cinematic-scrim {
		position: absolute;
		left: 0; right: 0; bottom: 0;
		height: 65vh;
		background: linear-gradient(
			to top,
			rgba(13, 8, 4, 0.82) 0%,
			rgba(13, 8, 4, 0.44) 38%,
			rgba(13, 8, 4, 0.10) 70%,
			transparent 100%
		);
		pointer-events: none;
	}

	/* ========================================
	   CONTENIDO
	   ======================================== */

	.cinematic-content {
		position: absolute;
		bottom: 9%;
		left: var(--container-padding);
		max-width: min(92vw, 680px);
		display: flex;
		flex-direction: column;
		gap: 0;
		/* Física de scroll: la velocidad del pulgar inclina el bloque */
		transform: skewY(var(--scroll-skew, 0deg));
		will-change: transform;
	}

	.cinematic--align-right .cinematic-content {
		left: auto;
		right: var(--container-padding);
		text-align: right;
	}

	/* ========================================
	   EYEBROW — aparece antes del título
	   ======================================== */

	.cinematic-eyebrow {
		font-family: var(--font-mono);
		font-size: var(--text-data);
		font-weight: var(--font-weight-medium);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-oro-viejo);
		margin-bottom: var(--space-sm);
		opacity: 0;
	}

	/* ========================================
	   FILETE — se dibuja de izquierda a derecha
	   ======================================== */

	.cinematic-rule {
		display: block;
		height: 1px;
		width: 52px;
		background: linear-gradient(90deg, var(--color-oro-viejo), transparent);
		transform-origin: left center;
		transform: scaleX(0);
		opacity: 0;
		margin-bottom: var(--space-md);
	}

	.cinematic--align-right .cinematic-rule {
		margin-left: auto;
		transform-origin: right center;
		background: linear-gradient(270deg, var(--color-oro-viejo), transparent);
	}

	/* ========================================
	   TÍTULO — reveal línea a línea
	   ======================================== */

	.cinematic-title {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-bottom: var(--space-md);
	}

	.title-line {
		display: block;
		overflow: hidden;
		/* La altura se adapta al contenido: 1 o 2 líneas naturales */
	}

	.title-line-inner {
		display: block;
		transform: translateY(108%);
		font-family: var(--font-display);
		font-size: clamp(38px, 9.5vw, 76px);
		line-height: 1.02;
		letter-spacing: -0.025em;
		color: var(--color-pergamino);
		text-shadow:
			0 0 80px rgba(184, 134, 11, 0.10),
			0 2px 16px rgba(13, 8, 4, 0.95);
	}

	.title-line-inner :global(em) {
		font-style: italic;
		color: var(--color-kraft);
	}

	.cinematic-title--display .title-line-inner {
		font-size: clamp(44px, 11vw, 96px);
	}

	/* ========================================
	   CUERPO — fade in tras el título
	   ======================================== */

	.cinematic-body {
		font-family: var(--font-body);
		font-size: clamp(15px, 3.5vw, 18px);
		line-height: 1.65;
		color: rgba(245, 237, 214, 0.88);
		max-width: 52ch;
		text-shadow: 0 1px 12px rgba(13, 8, 4, 0.75);
		opacity: 0;
		margin-bottom: var(--space-sm);
	}

	/* Drop cap en escenas de apertura */
	.cinematic--entry .cinematic-body::first-letter {
		font-family: var(--font-display);
		font-size: 3.2em;
		line-height: 0.78;
		float: left;
		padding-right: 0.12em;
		padding-top: 0.06em;
		color: var(--color-oro-viejo);
	}

	/* ========================================
	   DATO TÉCNICO — filete superior
	   ======================================== */

	.cinematic-dato {
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
		.cinematic-content { bottom: 12%; }
		.title-line-inner  { font-size: clamp(30px, 8.5vw, 52px); }
		.cinematic-title--display .title-line-inner { font-size: clamp(34px, 9.5vw, 62px); }
	}

	@media (max-height: 600px) {
		.cinematic-scrim   { height: 52vh; }
		.cinematic-content { bottom: 8%; }
		.title-line-inner  { font-size: clamp(26px, 7vw, 44px); }
	}
</style>
