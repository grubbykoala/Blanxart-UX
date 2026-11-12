<script>
	// ============================================
	// Blanxart Origins — Indicador de progreso
	// Raíl lateral mínimo: un punto de 6px por etapa,
	// kraft al 30%, la activa en oro viejo. El tap
	// navega a la sección correspondiente.
	// ============================================

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let totalSteps = 8;
	let currentStep = 0;
	let visible = true;

	export function setActive(step) {
		currentStep = step;
	}

	export function show() {
		visible = true;
	}

	export function hide() {
		visible = false;
	}

	export function reset() {
		currentStep = 0;
	}
</script>

<nav class="progress-rail" class:visible aria-label="Progreso del viaje">
	{#each Array(totalSteps) as _, i}
		<button
			class="rail-dot"
			class:active={i === currentStep}
			class:passed={i < currentStep}
			aria-label="Ir a la etapa {i + 1}"
			aria-current={i === currentStep ? 'step' : undefined}
			on:click={() => dispatch('navigate', { index: i })}
		/>
	{/each}
</nav>

<style>
	.progress-rail {
		position: fixed;
		right: calc(var(--container-padding) * 0.75);
		top: 50%;
		transform: translateY(-50%);
		z-index: var(--z-ui);
		display: flex;
		flex-direction: column;
		gap: 14px;
		opacity: 0;
		transition: opacity var(--duration-normal) var(--ease-out);
	}

	.progress-rail.visible {
		opacity: 1;
	}

	.rail-dot {
		/* punto visual de 6px con zona táctil de 24px */
		position: relative;
		width: 24px;
		height: 24px;
		margin: -9px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rail-dot::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--kraft-30);
		transition:
			background var(--duration-fast) var(--ease-in-out),
			transform var(--duration-fast) var(--ease-in-out);
	}

	.rail-dot.passed::before {
		background: var(--color-kraft);
		opacity: 0.5;
	}

	.rail-dot.active::before {
		background: var(--color-oro-viejo);
		transform: scale(1.34);
	}

	.rail-dot:focus-visible {
		outline: none;
	}

	.rail-dot:focus-visible::before {
		box-shadow: 0 0 0 3px var(--oro-40);
	}
</style>
