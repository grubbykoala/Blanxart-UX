<script>
	import { base } from '$app/paths';

	export let origen;
	export let tx;
	export let visible = false;

	let copiado = false;

	// Cada bloque aparece al entrar en pantalla
	function aparece(node) {
		const io = new IntersectionObserver(
			(entradas) => {
				for (const e of entradas) {
					if (e.isIntersecting) {
						node.classList.add('visto');
						io.disconnect();
					}
				}
			},
			{ rootMargin: '0px 0px -12% 0px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	async function compartir() {
		const url = window.location.href.split('#')[0];
		const datos = { title: `Blanxart Origins · ${tx.portada.nombre}`, text: tx.portada.sobre, url };
		try {
			if (navigator.share) {
				await navigator.share(datos);
				return;
			}
			await navigator.clipboard.writeText(url);
			copiado = true;
			setTimeout(() => (copiado = false), 2400);
		} catch {
			// el usuario canceló o el navegador no lo permite
		}
	}

	function volver() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<section class="final" class:visible style="--papel:{origen.papel}; --panel:{origen.panel}">
	<div class="hoja">
		<header use:aparece class="bloque">
			<div class="sobre">{tx.final.sobre}</div>
			<h2>{tx.final.titulo[0]} <em>{tx.final.titulo[1]}</em></h2>
		</header>

		<div class="cata bloque" use:aparece>
			<img class="tableta" src="{base}{origen.fotos.tableta}" alt="Tableta Blanxart Origins {tx.portada.nombre} {origen.porcentaje} %" width="283" height="576" loading="lazy" />
			<blockquote>{tx.portada.notas}</blockquote>
		</div>

		<ol class="pasos">
			{#each tx.final.pasos as [nombre, texto], i}
				<li class="bloque" use:aparece style="--i:{i}">
					<span class="num">{['I', 'II', 'III'][i]}</span>
					<div>
						<h3>{nombre}</h3>
						<p>{texto}</p>
					</div>
				</li>
			{/each}
		</ol>

		<div class="otros bloque" use:aparece>
			<div class="sobre">{tx.final.otros}</div>
			<div class="tarjetas">
				{#each origen.otros as o}
					<div class="tarjeta" style="--papel-o:{o.papel}; --panel-o:{o.panel}">
						<div class="sello">
							<span class="nombre">{o.nombre}</span>
							<span class="region">{o.region}</span>
							<span class="pct">{o.pct}<sup>%</sup></span>
						</div>
						<span class="pronto">{tx.final.pronto}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="acciones bloque" use:aparece>
			<a class="boton principal" href="https://blanxart.com" target="_blank" rel="noopener">{tx.final.tienda}</a>
			<button class="boton" type="button" on:click={compartir}>{copiado ? tx.final.copiado : tx.final.compartir}</button>
			<button class="enlace" type="button" on:click={volver}>
				<svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 13V1M1.5 5.5 6 1l4.5 4.5" /></svg>
				{tx.final.volver}
			</button>
		</div>

		<footer>
			<img src="{base}/marca/logo-crema.png" alt="Blanxart" width="528" height="77" loading="lazy" />
			<span>{tx.final.pie}</span>
		</footer>
	</div>
</section>

<style>
	.final {
		--crema: #e3c59b;
		--crema-clara: #e9cda4;
		--cuerpo: #ebdcc2;
		--cobre: #e08b63;
		position: relative;
		z-index: 10;
		margin: -16px auto 0;
		max-width: 480px;
		color: var(--crema);
		font-family: var(--sans);
	}
	.hoja {
		background: var(--panel);
		padding: 64px 28px calc(40px + env(safe-area-inset-bottom, 0px));
		-webkit-mask: radial-gradient(circle at 50% 0, transparent 2.6px, #000 3.1px) 0 0 / 9px 100% repeat-x;
		mask: radial-gradient(circle at 50% 0, transparent 2.6px, #000 3.1px) 0 0 / 9px 100% repeat-x;
	}

	.bloque {
		opacity: 0;
		transform: translate3d(0, 22px, 0);
		transition:
			opacity 0.8s ease calc(var(--i, 0) * 0.09s),
			transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i, 0) * 0.09s);
	}
	.bloque:global(.visto) {
		opacity: 1;
		transform: none;
	}

	.sobre {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	h2 {
		margin: 16px 0 0;
		font-family: var(--serif);
		font-weight: 600;
		font-size: 46px;
		line-height: 1.02;
		letter-spacing: -0.01em;
		color: var(--crema-clara);
	}
	h2 em {
		font-style: italic;
		font-weight: 400;
	}

	.cata {
		margin-top: 40px;
		display: flex;
		align-items: center;
		gap: 26px;
	}
	.tableta {
		flex: none;
		width: 118px;
		height: auto;
		transform: rotate(-5deg);
		filter: drop-shadow(0 16px 18px rgba(4, 7, 14, 0.55));
	}
	blockquote {
		margin: 0;
		font-family: var(--serif);
		font-style: italic;
		font-size: 20px;
		line-height: 1.4;
		color: var(--crema-clara);
	}

	.pasos {
		list-style: none;
		margin: 44px 0 0;
		padding: 0;
		border-top: 1px solid rgba(227, 197, 155, 0.28);
	}
	.pasos li {
		display: flex;
		gap: 18px;
		padding: 22px 0;
		border-bottom: 1px solid rgba(227, 197, 155, 0.28);
	}
	.num {
		flex: none;
		width: 30px;
		font-family: var(--serif);
		font-size: 21px;
		line-height: 1.3;
		color: var(--cobre);
	}
	h3 {
		margin: 0;
		font-family: var(--serif);
		font-weight: 600;
		font-size: 25px;
		line-height: 1.1;
		color: var(--crema-clara);
	}
	.pasos p {
		margin: 8px 0 0;
		font-size: 16.5px;
		line-height: 1.5;
		color: var(--cuerpo);
	}

	.otros {
		margin-top: 52px;
	}
	.tarjetas {
		margin-top: 18px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}
	.tarjeta {
		position: relative;
		background: var(--papel-o);
		padding: 20px 14px;
		box-shadow: 0 10px 22px rgba(4, 7, 14, 0.4);
	}
	.tarjeta .sello {
		background: var(--panel-o);
		padding: 22px 8px 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		-webkit-mask:
			radial-gradient(circle at 50% 0, transparent 2.2px, #000 2.7px) 0 0 / 8px 51% repeat-x,
			radial-gradient(circle at 50% 100%, transparent 2.2px, #000 2.7px) 0 100% / 8px 51% repeat-x;
		mask:
			radial-gradient(circle at 50% 0, transparent 2.2px, #000 2.7px) 0 0 / 8px 51% repeat-x,
			radial-gradient(circle at 50% 100%, transparent 2.2px, #000 2.7px) 0 100% / 8px 51% repeat-x;
	}
	.tarjeta .nombre {
		font-family: var(--serif);
		font-weight: 600;
		font-size: 30px;
		line-height: 1;
		color: var(--crema-clara);
	}
	.tarjeta .region {
		margin-top: 8px;
		min-height: 2.6em;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.16em;
		line-height: 1.3;
		text-transform: uppercase;
	}
	.tarjeta .pct {
		margin-top: 6px;
		font-family: var(--serif);
		font-size: 34px;
		line-height: 1;
		color: var(--crema-clara);
	}
	.tarjeta .pct sup {
		font-size: 15px;
		margin-left: 1px;
	}
	.pronto {
		display: block;
		margin-top: 14px;
		text-align: center;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #e89a73;
	}

	.acciones {
		margin-top: 48px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.boton {
		appearance: none;
		display: block;
		box-sizing: border-box;
		width: 100%;
		min-height: 54px;
		padding: 18px 20px;
		border: 1px solid rgba(227, 197, 155, 0.55);
		background: none;
		color: var(--crema-clara);
		font: 700 12.5px / 1.3 var(--sans);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
	}
	.boton.principal {
		background: var(--cobre);
		border-color: var(--cobre);
		color: #1a1410;
	}
	.boton:active {
		background: rgba(227, 197, 155, 0.14);
	}
	.boton.principal:active {
		background: #ef9d77;
	}
	.enlace {
		appearance: none;
		align-self: center;
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
		padding: 14px 10px;
		border: 0;
		background: none;
		color: #b9a27f;
		font: 600 12px / 1 var(--sans);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.boton:focus-visible,
	.enlace:focus-visible {
		outline: 2px solid var(--crema-clara);
		outline-offset: 3px;
	}

	footer {
		margin-top: 44px;
		padding-top: 30px;
		border-top: 1px solid rgba(227, 197, 155, 0.28);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	footer img {
		width: 138px;
		height: auto;
	}
	footer span {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #b9a27f;
		text-align: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.bloque {
			transition-duration: 0.01s;
			transition-delay: 0s;
		}
	}
</style>
