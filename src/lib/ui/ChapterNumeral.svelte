<script>
	// ============================================
	// Blanxart Origins — Numeral de capítulo
	// Rótulo romano de medio viewport, en trazo
	// hueco, que rueda en paralaje detrás de la
	// narrativa en cada apertura de capítulo.
	// ============================================

	import { onMount } from 'svelte';

	let text = '';
	let visible = false;
	let el;
	let reduced = false;

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	function lerp(a, b, t) { return a + (b - a) * t; }

	function smoothstep(e0, e1, x) {
		const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
		return t * t * (3 - 2 * t);
	}

	// — API pública (idempotente: la escena puede llamarla en cada frame) —

	export function show(t) {
		if (visible && text === t) return;
		text = t;
		visible = true;
	}

	export function hide() {
		visible = false;
		if (el) el.style.opacity = '0';
	}

	export function setProgress(p) {
		if (!el || !visible) return;
		const o = smoothstep(0.04, 0.18, p) * (1 - smoothstep(0.62, 0.86, p));
		el.style.opacity = String(o * 0.6);
		if (!reduced) {
			el.style.transform = `translate3d(0, ${lerp(14, -58, p).toFixed(2)}vh, 0)`;
		}
	}
</script>

<div class="numeral-wrap" class:visible bind:this={el} aria-hidden="true">
	<span class="numeral">{text}</span>
</div>

<style>
	.numeral-wrap {
		position: fixed;
		top: 30vh;
		left: 4vw;
		z-index: 8; /* sobre la atmósfera, bajo las cards */
		pointer-events: none;
		opacity: 0;
		will-change: transform, opacity;
		display: none;
	}

	.numeral-wrap.visible {
		display: block;
	}

	.numeral {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 26vh;
		line-height: 0.8;
		color: rgba(200, 169, 122, 0.05);
		-webkit-text-stroke: 1px var(--kraft-30);
		letter-spacing: -0.02em;
		user-select: none;
	}
</style>
