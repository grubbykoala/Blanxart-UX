<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { base } from '$app/paths';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { interpolateZoom } from 'd3-interpolate';
	import laminas from '$lib/mapa/laminas.json';
	import { mundo, construirRuta, clamp, lerp, suave } from '$lib/mapa/geo.js';
	import { idioma, IDIOMAS, miles } from './idioma.js';
	import Final from './Final.svelte';

	export let origen;

	// ── Guion: tiempos en "pantallas de scroll" ────────────────────────────────
	// Regla del guion: en cada tramo algo tiene que moverse con el dedo. Cuando el
	// texto descansa, se mueve la cámara; cuando la cámara descansa, pasa el texto.
	const FIN = 6.8;
	const ABRE = 0.95; // la portada termina de desplegarse
	const T_B = 1.85; // la cámara llega a la costa
	const T_C = 2.3; // …y a la finca; desde aquí se aleja
	const T_G = 3.1; // vista general del Atlántico
	const ZARPA = 3.3;
	const ATRACA = 5.0;
	const LLEGA = 5.05;
	const CAPITULOS = [[0.5, 2.28], [2.28, 5.32], [5.32, FIN]];
	// La cinta de textos: en el tiempo t descansa el bloque n
	const CINTA = [[ABRE, 1], [1.85, 2], [2.7, 3], [3.35, 4], [ATRACA, 4], [5.65, 5], [6.45, 6]];

	$: tx = origen.textos[$idioma];

	// ── Geografía ──────────────────────────────────────────────────────────────
	const cam = Object.fromEntries(
		Object.entries(origen.camara)
			.filter(([, v]) => Array.isArray(v))
			.map(([k, [lon, lat, s]]) => [k, { ...mundo(lon, lat), s }])
	);
	const lugar = Object.fromEntries(Object.entries(origen.lugares).map(([k, [lon, lat]]) => [k, mundo(lon, lat)]));
	const ruta = construirRuta(origen.ruta);
	const totalKm = Math.round(ruta.totalKm / 5) * 5;
	cam.llegada = { ...ruta.en(1), s: origen.camara.llegada };
	const grados = (r) => (r * 180) / Math.PI;
	const latDe = (y) => grados(2 * Math.atan(Math.exp(-y)) - Math.PI / 2);
	const uEstrecho = ruta.uDonde((x, y) => grados(x) > -6.3 && latDe(y) > 35);

	// ── Estado ─────────────────────────────────────────────────────────────────
	let paso = 0;
	let hito = 'salida';
	let enKraft = false;
	let lista = false;
	let finalVisible = false;
	let capitulo = 0;
	let W = 390;
	let H = 844;
	let P = 396;
	let k = 1;
	let paso_px = 360; // distancia entre bloques de la cinta
	let objetivo = 0; // donde está el dedo
	let tCam = 0; // reloj de la cámara: sigue al dedo con algo de peso
	let tTxt = 0; // reloj del texto y las fotos: casi pegado al dedo
	let sucio = true;
	let zDespliegue;
	let zGeneral;
	let dpr = 1;
	let ctx;

	// ── Elementos ──────────────────────────────────────────────────────────────
	let elPista, elEscenario, elPanel, elPanelFondo, elCanvas;
	let elA, elB, elC, elKraft, elKraftDentro, elCostura, elVelo;
	let elLogo, elIdiomas, elPortada, gSup, gPanel, gInf, gSello;
	let mFinca, mRotulo, mDestino, mBarcelona;
	let elKm, elDia, elAvance, elBarco, elBarras = [];
	let elVentana, elBloques = [], elFoto1, elFoto2, elTableta;

	const seno = (v) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(v));
	// Suaviza sin llegar a pararse en los extremos
	const fluye = (v) => 0.3 * clamp(v) + 0.7 * seno(v);
	const abre = (t) => 1 - Math.pow(1 - clamp(t / ABRE), 1.6);
	// Avance de la cinta entre dos bloques: más lento al llegar, nunca quieto
	const paseo = (v) => v - (0.7 * Math.sin(2 * Math.PI * v)) / (2 * Math.PI);
	function qDe(t) {
		if (t <= CINTA[0][0]) return CINTA[0][1];
		for (let i = 0; i < CINTA.length - 1; i++) {
			const [t0, q0] = CINTA[i];
			const [t1, q1] = CINTA[i + 1];
			if (t <= t1) return q1 === q0 ? q0 : q0 + paseo((t - t0) / (t1 - t0)) * (q1 - q0);
		}
		return CINTA[CINTA.length - 1][1];
	}
	const mezcla = (a, b, v) => ({ x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), v)) });
	const zoomEn = (z, v) => {
		const [x, y, w] = z(v);
		return { x, y, s: W / w };
	};

	function uDe(t) {
		const v = clamp((t - ZARPA) / (ATRACA - ZARPA));
		return 0.35 * v + 0.65 * v * v * (3 - 2 * v);
	}

	// Zoom durante la travesía: vista general → seguimiento → entrada al Mediterráneo
	let ZT = [];
	function zTravesia(t) {
		for (let i = 0; i < ZT.length - 1; i++) {
			if (t <= ZT[i + 1][0]) return Math.exp(lerp(ZT[i][1], ZT[i + 1][1], suave(ZT[i][0], ZT[i + 1][0], t)));
		}
		return Math.exp(ZT[ZT.length - 1][1]);
	}

	function camara(t) {
		if (t < ABRE) {
			const v = clamp(t / ABRE);
			return zoomEn(zDespliegue, 0.3 * v + 0.7 * (1 - Math.pow(1 - v, 1.8)));
		}
		if (t < T_B) return mezcla(cam.origenA, cam.origenB, (t - ABRE) / (T_B - ABRE));
		if (t < T_C) return mezcla(cam.origenB, cam.origenC, (t - T_B) / (T_C - T_B));
		if (t < T_G) return zoomEn(zGeneral, fluye((t - T_C) / (T_G - T_C)));
		if (t < LLEGA) {
			const p = ruta.en(uDe(t));
			const sigue = suave(T_G, T_G + 0.5, t);
			const s = zTravesia(t);
			const mira = sigue * (1 - suave(4.5, LLEGA, t));
			return {
				x: lerp(cam.general.x, p.x, sigue) + (26 / s) * mira,
				y: lerp(cam.general.y, p.y, sigue) - (34 / s) * mira,
				s
			};
		}
		return mezcla(cam.llegada, cam.final, clamp((t - LLEGA) / (FIN - LLEGA)));
	}

	function ponLamina(el, L, c, fx, fy, op) {
		if (!el) return;
		if (op <= 0.004) {
			el.style.visibility = 'hidden';
			return;
		}
		el.style.visibility = 'visible';
		el.style.opacity = op;
		el.style.transform = `translate3d(${fx - (c.x - L.x0) * c.s}px,${fy - (c.y - L.y0) * c.s}px,0) scale(${c.s / L.d})`;
	}

	function ponMarca(el, p, c, fx, fy, op) {
		if (!el) return;
		if (op <= 0.004) {
			el.style.visibility = 'hidden';
			return;
		}
		el.style.visibility = 'visible';
		el.style.opacity = op;
		el.style.transform = `translate3d(${fx + (p.x - c.x) * c.s}px,${fy + (p.y - c.y) * c.s}px,0)`;
	}

	function pintarRuta(t, c, fx, fy, u, borde) {
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		const a = suave(2.5, 2.95, t);
		const verBarco = suave(ZARPA - 0.25, ZARPA - 0.05, t) * (1 - suave(LLEGA - 0.03, LLEGA + 0.07, t));
		if (a <= 0) return;
		const X = (p) => fx + (p.x - c.x) * c.s;
		const Y = (p) => fy + (p.y - c.y) * c.s;
		const pts = ruta.pts;
		const barco = ruta.en(u);

		const trazar = (hasta, fin) => {
			ctx.beginPath();
			ctx.moveTo(X(pts[0]), Y(pts[0]));
			for (let i = 1; i <= hasta; i++) ctx.lineTo(X(pts[i]), Y(pts[i]));
			if (fin) ctx.lineTo(X(fin), Y(fin));
		};
		const zona = (y0, y1, tinta, cobre) => {
			if (y1 <= y0) return;
			ctx.save();
			ctx.beginPath();
			ctx.rect(0, y0, W, y1 - y0);
			ctx.clip();
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			// ruta prevista, punteada
			trazar(pts.length - 1);
			ctx.setLineDash([0.1, 6.5]);
			ctx.lineWidth = 1.9;
			ctx.strokeStyle = tinta;
			ctx.globalAlpha = 0.75 * a;
			ctx.stroke();
			// tramo recorrido
			if (u > 0) {
				trazar(barco.i, barco);
				ctx.setLineDash([]);
				ctx.lineWidth = 2.4;
				ctx.strokeStyle = cobre;
				ctx.globalAlpha = a;
				ctx.stroke();
			}
			// puerto de salida
			ctx.globalAlpha = a;
			ctx.beginPath();
			ctx.arc(X(pts[0]), Y(pts[0]), 3.2, 0, 6.2832);
			ctx.fillStyle = cobre;
			ctx.fill();
			// barco
			if (verBarco > 0) {
				const bx = X(barco);
				const by = Y(barco);
				ctx.beginPath();
				ctx.arc(bx, by, 10, 0, 6.2832);
				ctx.lineWidth = 1;
				ctx.strokeStyle = cobre;
				ctx.globalAlpha = 0.7 * a * verBarco;
				ctx.stroke();
				ctx.globalAlpha = a * verBarco;
				ctx.beginPath();
				ctx.arc(bx, by, 4.6, 0, 6.2832);
				ctx.fillStyle = '#F3E3C6';
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.stroke();
			}
			ctx.restore();
		};
		zona(0, borde, '#2A1E16', '#A9502B');
		zona(borde, H, '#E3C59B', '#E08B63');
	}

	function ponFoto(el, d, sube, giro, gira) {
		if (!el) return;
		const op = 1 - suave(0.25, 0.62, Math.abs(d));
		if (op <= 0.004) {
			el.style.visibility = 'hidden';
			return;
		}
		el.style.visibility = 'visible';
		el.style.opacity = op;
		el.style.transform = `translate3d(0,${d * sube}px,0) rotate(${giro + d * gira}deg)`;
	}

	/** t: reloj de la cámara · tt: reloj del texto, las fotos y el panel */
	function pintar(t, tt) {
		const mMapa = abre(t);
		const m = abre(tt);
		const c = camara(t);
		const fx = W / 2;
		const fyMapa = (H - P) / 2 + 26;
		const fy = lerp(H * 0.47, fyMapa, mMapa);
		const u = uDe(t);

		// Láminas del mapa
		ponLamina(elA, laminas.atlantico, c, fx, fy, lerp(0.34, 0.92, mMapa) * (1 - suave(950, 1350, c.s)));
		ponLamina(elB, laminas.bahia, c, fx, fy, t < T_G + 0.05 ? 0.95 * suave(950, 1350, c.s) : 0);

		// Papel kraft: entra desde el norte al cruzar el Estrecho
		const w = t >= ATRACA ? 1 : suave(uEstrecho - 0.17, uEstrecho + 0.05, u);
		const borde = w * (H - P + 18);
		if (w <= 0) {
			elKraft.style.visibility = 'hidden';
			elCostura.style.visibility = 'hidden';
		} else {
			elKraft.style.visibility = 'visible';
			elKraft.style.transform = `translate3d(0,${borde - H}px,0)`;
			elKraftDentro.style.transform = `translate3d(0,${H - borde}px,0)`;
			ponLamina(elC, laminas.mediterraneo, c, fx, fy, 0.92);
			elCostura.style.visibility = w < 1 ? 'visible' : 'hidden';
			elCostura.style.transform = `translate3d(0,${borde}px,0)`;
		}
		const kraftArriba = borde > 64;
		if (kraftArriba !== enKraft) enKraft = kraftArriba;

		pintarRuta(t, c, fx, fy, u, borde);

		// Marcas ancladas al mapa
		const enOrigen = suave(0.6, 0.9, t) * (1 - suave(2.35, 2.6, t));
		ponMarca(mFinca, lugar.finca, c, fx, fy, enOrigen);
		ponMarca(mRotulo, lugar.rotulo, c, fx, fy, enOrigen * (1 - suave(1.9, 2.2, t)));
		ponMarca(mDestino, lugar.destino, c, fx, fy, suave(2.7, 3.05, t));
		ponMarca(mBarcelona, lugar.destino, c, fx, fy, suave(4.8, LLEGA, t));

		// Portada → panel: el sello se despliega y baja a su sitio
		const x0 = W / 2 - 153 * k;
		const y0 = H / 2 - 271 * k;
		const px = lerp(x0, 0, m);
		const py = lerp(y0, H - P, m);
		const pw = lerp(306 * k, W, m);
		const ph = lerp(353 * k, P + 24, m);
		const encaje = `translate3d(${px}px,${py - (H - P)}px,0) scale(${pw / W},${ph / (P + 24)})`;
		elPanelFondo.style.transform = encaje;
		elPanel.style.transform = m < 1 ? encaje : '';
		const verPanel = suave(0.2, 0.4, tt);
		elPanel.style.opacity = verPanel;
		elPanel.style.visibility = verPanel > 0.004 ? 'visible' : 'hidden';

		const fuera = 1 - suave(0.1, 0.45, m);
		if (fuera <= 0.004) {
			elPortada.style.visibility = 'hidden';
		} else {
			elPortada.style.visibility = 'visible';
			const baja = (py - y0) / k;
			gPanel.style.opacity = fuera;
			gPanel.style.transform = `translate3d(0,${baja}px,0)`;
			gSello.style.opacity = fuera;
			gSello.style.transform = `translate3d(0,${baja}px,0) rotate(${14 + 70 * m}deg)`;
			gSup.style.opacity = fuera;
			gSup.style.transform = `translate3d(0,${-60 * m}px,0)`;
			gInf.style.opacity = 1 - suave(0, 0.22, m);
			gInf.style.transform = `translate3d(0,${-90 * m}px,0)`;
		}

		// Logo: de la portada a la cabecera
		const ls = lerp((176 * k) / 112, 1, m);
		const lx = lerp(W / 2 - 88 * k, 24, m) - 24;
		const ly = lerp(H / 2 - 368 * k, 26, m) - 26;
		elLogo.style.transform = `translate3d(${lx}px,${ly}px,0) scale(${ls})`;
		elVelo.style.opacity = mMapa;
		const verIdiomas = suave(0.7, 1, m);
		elIdiomas.style.opacity = verIdiomas;
		elIdiomas.style.pointerEvents = verIdiomas > 0.5 ? 'auto' : 'none';

		// La cinta de textos se desliza con el dedo
		const q = qDe(tt);
		for (let i = 1; i <= 6; i++) {
			const el = elBloques[i];
			if (!el) continue;
			const d = i - q;
			if (Math.abs(d) >= 1.02) {
				el.style.visibility = 'hidden';
				continue;
			}
			el.style.visibility = 'visible';
			el.style.transform = `translate3d(0,${d * paso_px + (i === 1 ? (1 - m) * 46 : 0)}px,0)`;
		}
		// El primer bloque nace dentro del sello mientras se despliega
		if (elBloques[1]) elBloques[1].style.opacity = m < 1 ? suave(0.32, 0.7, m) : 1;
		const n = Math.round(q);
		if (n !== paso) paso = n;
		const cap = tt < CAPITULOS[1][0] ? 0 : tt < CAPITULOS[2][0] ? 1 : 2;
		if (cap !== capitulo) capitulo = cap;

		// Fotos y tableta: suben con su texto desde detrás del panel
		ponFoto(elFoto1, tt < ABRE ? 0.62 * (1 - suave(0.5, ABRE, tt)) : 1 - q, 150, -5, 7);
		ponFoto(elFoto2, 2 - q, 150, 4, -7);
		if (elTableta) {
			const d = 6 - q;
			const op = 1 - suave(0.35, 0.8, d);
			if (op <= 0.004) {
				elTableta.style.visibility = 'hidden';
			} else {
				const flota = clamp((tt - 6.45) / (FIN - 6.45));
				elTableta.style.visibility = 'visible';
				elTableta.style.opacity = op;
				elTableta.style.transform = `translate3d(0,${d * 170 - flota * 22}px,0) rotate(${-7 + d * 16 + flota * 2.5}deg)`;
			}
		}

		// Progreso por capítulo
		for (let i = 0; i < 3; i++) {
			if (elBarras[i]) elBarras[i].style.transform = `scaleX(${clamp((tt - CAPITULOS[i][0]) / (CAPITULOS[i][1] - CAPITULOS[i][0]))})`;
		}

		// Cuaderno de travesía
		if (Math.abs(4 - q) < 1.02) {
			const b = ruta.en(u);
			const lon = grados(b.x);
			const lat = latDe(b.y);
			const h = origen.hitos.find((q) => q.hasta(lon, lat)).id;
			if (h !== hito) hito = h;
			if (elKm) elKm.textContent = miles(u >= 1 ? totalKm : Math.min(totalKm, b.km), $idioma);
			if (elDia) elDia.textContent = tx.travesia.dia.replace('{d}', Math.max(1, Math.ceil(u * origen.diasDeMar))).replace('{n}', origen.diasDeMar);
			if (elAvance) elAvance.style.transform = `scaleX(${u})`;
			if (elBarco) elBarco.style.left = `${u * 100}%`;
		}
	}

	function medir() {
		if (!elEscenario) return;
		W = elEscenario.clientWidth;
		H = elEscenario.clientHeight;
		P = elPanel.offsetHeight;
		k = Math.min(W / 390, H / 800, 1.12);
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		elCanvas.width = Math.round(W * dpr);
		elCanvas.height = Math.round(H * dpr);
		// La vista general encaja la ruta entera entre la cabecera y el panel
		const y0 = ruta.pts[0].y;
		const y1 = ruta.pts[ruta.pts.length - 1].y;
		cam.general.s = Math.min(origen.camara.general[2], (H - P - 124) / Math.abs(y0 - y1));
		cam.general.y = (y0 + y1) / 2 + 14 / cam.general.s;
		ZT = [[T_G, Math.log(cam.general.s)], [T_G + 0.5, Math.log(origen.camara.travesia)], [4.2, Math.log(origen.camara.travesia)], [4.65, Math.log(1100)], [LLEGA, Math.log(origen.camara.llegada)]];
		paso_px = elVentana.clientHeight + 28;
		zDespliegue = interpolateZoom([cam.portada.x, cam.portada.y, W / cam.portada.s], [cam.origenA.x, cam.origenA.y, W / cam.origenA.s]);
		zGeneral = interpolateZoom([cam.origenC.x, cam.origenC.y, W / cam.origenC.s], [cam.general.x, cam.general.y, W / cam.general.s]);
		pintar(tCam, tTxt);
	}

	// Solo el rótulo del hito cambia de golpe; todo lo demás va atado al dedo
	function sube(node, { delay = 0 }) {
		return { delay, duration: 420, easing: cubicOut, css: (v) => `opacity:${v};transform:translate3d(0,${(1 - v) * 12}px,0)` };
	}

	// Al cambiar de idioma hay que repintar los textos que se escriben a mano
	$: if ($idioma) sucio = true;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);
		ScrollTrigger.config({ ignoreMobileResize: true });
		ctx = elCanvas.getContext('2d');
		medir();
		const ro = new ResizeObserver(medir);
		ro.observe(elEscenario);

		const calma = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Dos relojes persiguen al dedo: el texto casi al instante, la cámara con algo de peso.
		// Así cada gesto mueve algo enseguida y el mapa no da tirones.
		let primero = true;
		const st = ScrollTrigger.create({
			trigger: elPista,
			start: 'top top',
			end: 'bottom bottom',
			onUpdate: (self) => (objetivo = self.progress * FIN)
		});
		const tic = (_, ms) => {
			const dc = objetivo - tCam;
			const dx = objetivo - tTxt;
			if (!sucio && dc === 0 && dx === 0) return;
			const dt = Math.min(ms || 16.7, 64) / 1000;
			const directo = calma || primero;
			tCam = directo || Math.abs(dc) < 0.0005 ? objetivo : tCam + dc * (1 - Math.exp(-dt / 0.15));
			tTxt = directo || Math.abs(dx) < 0.0005 ? objetivo : tTxt + dx * (1 - Math.exp(-dt / 0.04));
			primero = false;
			sucio = false;
			pintar(tCam, tTxt);
		};
		objetivo = st.progress * FIN;
		gsap.ticker.add(tic);
		const stFinal = ScrollTrigger.create({
			trigger: elPista,
			start: 'bottom top',
			end: 'max',
			onToggle: (self) => {
				elEscenario.style.visibility = self.isActive ? 'hidden' : 'visible';
			}
		});
		const stVer = ScrollTrigger.create({ trigger: elPista, start: 'bottom bottom+=200', onEnter: () => (finalVisible = true) });

		// Entrada: en cuanto el mapa de la portada está listo (o pasa un segundo)
		const entrar = () => (lista = true);
		const img = new Image();
		img.src = `${base}/mapa/atlantico.webp`;
		(img.decode ? img.decode() : Promise.resolve()).then(entrar, entrar);
		const reserva = setTimeout(entrar, 1400);

		return () => {
			clearTimeout(reserva);
			ro.disconnect();
			st.kill();
			stFinal.kill();
			stVer.kill();
			gsap.ticker.remove(tic);
		};
	});

	$: romano = ['I', 'II', 'III'][capitulo];
</script>

<svelte:head>
	<meta name="theme-color" content={enKraft ? '#C9AE8B' : origen.papel} />
</svelte:head>

<div class="pista" bind:this={elPista} style="height: calc({FIN + 1} * 100svh)"></div>

<div class="escenario" class:lista class:kraft={enKraft} bind:this={elEscenario} style="--papel:{origen.papel}; --panel:{origen.panel}; --grano:url({base}/marca/grano.png)">
	<div class="papel"></div>
	<div class="laminas">
		<img class="lamina" bind:this={elA} src="{base}/mapa/atlantico.webp" width={laminas.atlantico.w} height={laminas.atlantico.h} alt="" decoding="async" />
		<img class="lamina" bind:this={elB} src="{base}/mapa/bahia.webp" width={laminas.bahia.w} height={laminas.bahia.h} alt="" decoding="async" />
	</div>
	<div class="velo" bind:this={elVelo}></div>

	<div class="kraft-hoja" bind:this={elKraft}>
		<div class="kraft-dentro" bind:this={elKraftDentro}>
			<div class="papel papel-kraft"></div>
			<img class="lamina" bind:this={elC} src="{base}/mapa/mediterraneo.webp" width={laminas.mediterraneo.w} height={laminas.mediterraneo.h} alt="" decoding="async" />
			<div class="velo velo-kraft"></div>
		</div>
	</div>
	<div class="costura" bind:this={elCostura}></div>

	<canvas class="ruta" bind:this={elCanvas} style="width:{W}px;height:{H}px" aria-hidden="true"></canvas>

	<div class="marca" bind:this={mFinca}><span class="finca"><i></i></span></div>
	<div class="marca" bind:this={mRotulo}>
		<span class="rotulo">{#each tx.rotulo as linea}{linea}<br />{/each}</span>
	</div>
	<div class="marca" bind:this={mDestino}><span class="destino" class:llegado={paso >= 5}><i></i></span></div>
	<div class="marca" bind:this={mBarcelona}><span class="ciudad">Barcelona</span></div>

	<!-- Fotos: suben con su texto, atadas al dedo -->
	<img class="foto foto-izq" bind:this={elFoto1} src="{base}{origen.fotos.mazorcas}" alt="Mazorcas de cacao en el árbol" />
	<img class="foto foto-der" bind:this={elFoto2} src="{base}{origen.fotos.granos}" alt="Granos de cacao secos" />
	<img class="tableta" bind:this={elTableta} src="{base}{origen.fotos.tableta}" alt="Tableta Blanxart Origins {tx.portada.nombre} {origen.porcentaje} %" />

	<!-- Panel: el sello del envoltorio. En la portada va centrado; al deslizar baja y se abre. -->
	<div class="panel-fondo" bind:this={elPanelFondo}></div>

	<section class="panel" bind:this={elPanel}>
		<div class="panel-cabeza">
			<div class="capitulo">
				{#key capitulo}
					<span in:fade|global={{ duration: 300, delay: 120 }} out:fade|global={{ duration: 120 }}>{romano} · {tx.capitulos[capitulo]}</span>
				{/key}
			</div>
			<div class="barras" role="img" aria-label="Capítulo {capitulo + 1} de 3">
				{#each [0, 1, 2] as i}<span><i bind:this={elBarras[i]}></i></span>{/each}
			</div>
		</div>

		<!-- La cinta: los seis bloques están siempre montados y se deslizan con el dedo -->
		<div class="panel-cuerpo" bind:this={elVentana}>
			{#each [1, 2, 3, 4, 5, 6] as i}
				{#if i === 4}
					<div class="paso travesia" bind:this={elBloques[i]}>
						<div class="cuenta">
							<span class="km" bind:this={elKm}>0</span>
							<span class="km-unidad">{tx.travesia.recorridos}</span>
						</div>
						<div class="hito">
							{#key `${hito}-${$idioma}`}
								<span in:sube|global={{ delay: 60 }} out:fade|global={{ duration: 120 }}>{tx.travesia.hitos[hito]}</span>
							{/key}
						</div>
						<div class="derrota" aria-hidden="true">
							<span>{tx.pasos[3].datos[0][1]}</span>
							<span class="linea"><i bind:this={elAvance}></i><b bind:this={elBarco}></b></span>
							<span>{tx.pasos[3].datos[1][1]}</span>
						</div>
						<dl>
							<div><dt>{tx.pasos[3].datos[2][0]}</dt><dd>{miles(totalKm, $idioma)} km</dd></div>
							<div><dt>{tx.travesia.diaEtq}</dt><dd bind:this={elDia}>&nbsp;</dd></div>
						</dl>
					</div>
				{:else}
					<div class="paso" bind:this={elBloques[i]}>
						<h2>{tx.pasos[i].titulo[0]} <em>{tx.pasos[i].titulo[1]}</em></h2>
						<p>{tx.pasos[i].cuerpo}</p>
						<dl>
							{#each tx.pasos[i].datos as [nombre, valor]}
								<div><dt>{nombre}</dt><dd>{valor.replace('{km}', miles(totalKm, $idioma))}</dd></div>
							{/each}
						</dl>
					</div>
				{/if}
			{/each}
		</div>
	</section>

	<!-- Portada -->
	<div class="portada" bind:this={elPortada} style="transform: translate(-50%, -50%) scale({k})">
		<div class="g-sup" bind:this={gSup}><div class="origins entra" style="--i:1">Origins</div></div>
		<div class="g-panel" bind:this={gPanel}>
			<div class="sobre entra" style="--i:2">{tx.portada.sobre}</div>
			<h1 class="entra" style="--i:3">{tx.portada.nombre}</h1>
			<div class="region entra" style="--i:4">{tx.portada.region}</div>
			<div class="filete entra" style="--i:5"></div>
			<div class="pct entra" style="--i:5"><span>{origen.porcentaje}</span><sup>%</sup></div>
			<div class="sub entra" style="--i:6">{tx.portada.sub}</div>
		</div>
		<div class="g-sello" bind:this={gSello}>
			<svg class="sello entra" style="--i:8" width="92" height="92" viewBox="0 0 92 92" role="img" aria-label="Bean to bar, Barcelona, 1954">
				<defs><path id="selloArco" d="M46,46 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" /></defs>
				<circle cx="46" cy="46" r="44" fill="var(--papel)" />
				<circle cx="46" cy="46" r="43" fill="none" stroke="var(--cobre)" stroke-width="1" />
				<circle cx="46" cy="46" r="24" fill="none" stroke="var(--cobre)" stroke-width="1" />
				<text font-weight="700" font-size="8" fill="var(--cobre)"><textPath href="#selloArco" textLength="204" lengthAdjust="spacing">BEAN TO BAR · BARCELONA, 1954 ·</textPath></text>
				<g fill="none" stroke="var(--cobre)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
					<path d="M46 31c7 0 11 6.5 11 15s-4 15-11 15-11-6.5-11-15 4-15 11-15z" />
					<path d="M46 31v30M40.5 34c-2 7-2 17 0 24M51.5 34c2 7 2 17 0 24" />
				</g>
			</svg>
		</div>
		<div class="g-inf" bind:this={gInf}>
			<p class="notas entra" style="--i:7">{tx.portada.notas}</p>
			<div class="pista-scroll entra" style="--i:9">
				<span>{tx.portada.pista}</span>
				<svg width="14" height="30" viewBox="0 0 14 30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1v27M2 23l5 5 5-5" /></svg>
			</div>
		</div>
	</div>

	<!-- Cabecera -->
	<div class="logo" bind:this={elLogo}>
		<img class="logo-crema" src="{base}/marca/logo-crema.png" alt="Blanxart" width="112" height="16" />
		<img class="logo-tinta" src="{base}/marca/logo-tinta.png" alt="" width="112" height="16" />
	</div>
	<nav class="idiomas" bind:this={elIdiomas} aria-label="Idioma">
		{#each IDIOMAS as l}
			<button type="button" class:actual={$idioma === l} aria-pressed={$idioma === l} on:click={() => idioma.set(l)}>{l.toUpperCase()}</button>
		{/each}
	</nav>
</div>

<Final {origen} {tx} visible={finalVisible} />

<style>
	.pista {
		width: 100%;
		pointer-events: none;
	}

	.escenario {
		--crema: #e3c59b;
		--crema-clara: #e9cda4;
		--cuerpo: #ebdcc2;
		--cobre: #e08b63;
		--kraft: #c9ae8b;
		--tinta: #2a1e16;
		--P: clamp(336px, 47svh, 404px);
		position: fixed;
		inset: 0;
		margin: 0 auto;
		max-width: 480px;
		overflow: hidden;
		background: var(--papel);
		color: var(--crema);
		font-family: var(--sans);
		contain: layout paint;
		-webkit-user-select: none;
		user-select: none;
	}

	.papel {
		position: absolute;
		inset: 0;
		background: var(--papel) var(--grano) 0 0 / 220px 220px;
	}
	.papel-kraft {
		background-color: var(--kraft);
	}

	.laminas {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 1.4s ease;
	}
	.lista .laminas {
		opacity: 1;
	}
	.lamina {
		position: absolute;
		left: 0;
		top: 0;
		max-width: none;
		transform-origin: 0 0;
		will-change: transform, opacity;
		pointer-events: none;
	}

	.velo {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 124px;
		background: linear-gradient(var(--papel) 12%, transparent);
		opacity: 0;
		pointer-events: none;
	}
	.velo-kraft {
		background: linear-gradient(var(--kraft) 12%, rgba(201, 174, 139, 0));
		opacity: 1;
	}

	.kraft-hoja,
	.kraft-dentro {
		position: absolute;
		inset: 0;
		overflow: hidden;
		will-change: transform;
	}
	.kraft-hoja {
		visibility: hidden;
	}
	.kraft-dentro {
		overflow: visible;
	}

	/* Borde festoneado del papel kraft, con su sombra sobre el papel azul */
	.costura {
		position: absolute;
		left: 0;
		top: -1px;
		width: 100%;
		height: 22px;
		visibility: hidden;
		pointer-events: none;
		will-change: transform;
		background:
			radial-gradient(circle at 50% 0, var(--kraft) 3.4px, transparent 3.9px) 0 0 / 9px 6px repeat-x,
			linear-gradient(rgba(6, 10, 20, 0.42), rgba(6, 10, 20, 0)) 0 0 / 100% 20px no-repeat;
	}

	.ruta {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;
	}

	/* Marcas ancladas al mapa */
	.marca {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;
		visibility: hidden;
		will-change: transform, opacity;
		pointer-events: none;
	}
	.finca,
	.destino {
		position: absolute;
		left: -13px;
		top: -13px;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--cobre);
	}
	.finca i,
	.destino i {
		position: absolute;
		inset: 5px;
		border-radius: 50%;
		background: var(--panel);
		border: 1.2px solid var(--crema);
		box-shadow: inset 0 0 0 3.4px var(--panel), inset 0 0 0 8px var(--crema);
	}
	.finca::after,
	.destino.llegado::after {
		content: '';
		position: absolute;
		inset: -1px;
		border-radius: 50%;
		border: 1px solid var(--cobre);
		animation: onda 2.6s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
	}
	.destino {
		left: -15px;
		top: -15px;
		width: 30px;
		height: 30px;
		border-color: #a9502b;
	}
	.destino i {
		inset: 6px;
		background: #c9764f;
		border: 0;
		box-shadow: inset 0 0 0 5.6px #c9764f, inset 0 0 0 9px #f0dcba;
	}
	.destino.llegado::after {
		border-color: #a9502b;
	}
	@keyframes onda {
		from {
			transform: scale(1);
			opacity: 0.9;
		}
		to {
			transform: scale(2.5);
			opacity: 0;
		}
	}
	.rotulo {
		position: absolute;
		right: 0;
		top: 0;
		transform: translateY(-50%);
		width: 130px;
		text-align: right;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.2em;
		line-height: 1.5;
		text-transform: uppercase;
		color: var(--cobre);
	}
	.ciudad {
		position: absolute;
		left: 24px;
		top: -14px;
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
		font-size: 25px;
		line-height: 1;
		color: var(--tinta);
		white-space: nowrap;
	}

	/* Fotos */
	.foto,
	.tableta {
		position: absolute;
		z-index: 2;
		visibility: hidden;
		will-change: transform, opacity;
	}
	.foto {
		--alto: min(124px, calc((100svh - var(--P)) * 0.33));
		width: calc(var(--alto) * 0.84);
		height: var(--alto);
		object-fit: cover;
		border: 5px solid #e9d9bd;
		box-shadow: 0 12px 26px rgba(6, 10, 20, 0.5);
		bottom: calc(var(--P) + 20px);
	}
	.foto-izq {
		left: 24px;
	}
	.foto-der {
		right: 24px;
	}
	.tableta {
		left: 26px;
		bottom: calc(var(--P) + 4px);
		width: min(104px, calc((100svh - var(--P)) * 0.29));
		height: auto;
		z-index: 3;
		filter: drop-shadow(0 14px 16px rgba(42, 30, 22, 0.45));
	}

	/* Panel */
	.panel-fondo {
		position: absolute;
		z-index: 4;
		left: 0;
		bottom: -24px;
		width: 100%;
		height: calc(var(--P) + 24px);
		background: var(--panel);
		transform-origin: 0 0;
		will-change: transform;
		opacity: 0;
		transition: opacity 0.9s ease 0.15s;
		-webkit-mask:
			radial-gradient(circle at 50% 0, transparent 2.6px, #000 3.1px) 0 0 / 9px 51% repeat-x,
			radial-gradient(circle at 50% 100%, transparent 2.6px, #000 3.1px) 0 100% / 9px 51% repeat-x;
		mask:
			radial-gradient(circle at 50% 0, transparent 2.6px, #000 3.1px) 0 0 / 9px 51% repeat-x,
			radial-gradient(circle at 50% 100%, transparent 2.6px, #000 3.1px) 0 100% / 9px 51% repeat-x;
	}
	.lista .panel-fondo {
		opacity: 1;
	}

	.panel {
		position: absolute;
		z-index: 5;
		left: 0;
		bottom: 0;
		width: 100%;
		height: var(--P);
		box-sizing: border-box;
		padding: 32px 28px calc(24px + env(safe-area-inset-bottom, 0px));
		transform-origin: 0 0;
		display: flex;
		flex-direction: column;
		opacity: 0;
		visibility: hidden;
	}
	.panel-cabeza {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 18px;
	}
	.capitulo {
		display: grid;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	.capitulo > span {
		grid-area: 1 / 1;
	}
	.barras {
		display: flex;
		gap: 6px;
	}
	.barras span {
		position: relative;
		width: 26px;
		height: 3px;
		background: rgba(227, 197, 155, 0.28);
		overflow: hidden;
	}
	.barras i {
		position: absolute;
		inset: 0;
		background: var(--cobre);
		transform: scaleX(0);
		transform-origin: 0 50%;
	}

	/* Ventana de la cinta: sangra 20 px por abajo y funde los bordes */
	.panel-cuerpo {
		position: relative;
		flex: 1;
		min-height: 0;
		margin: 0 -28px -20px;
		overflow: hidden;
		-webkit-mask: linear-gradient(180deg, transparent 0, #000 16px, #000 calc(100% - 18px), transparent 100%);
		mask: linear-gradient(180deg, transparent 0, #000 16px, #000 calc(100% - 18px), transparent 100%);
	}
	.paso {
		position: absolute;
		left: 28px;
		right: 28px;
		top: 0;
		height: calc(100% - 20px);
		display: flex;
		flex-direction: column;
		visibility: hidden;
		will-change: transform;
	}
	h2 {
		margin: clamp(12px, 2svh, 18px) 0 0;
		font-family: var(--serif);
		font-weight: 600;
		font-size: clamp(31px, 4.5svh, 38px);
		line-height: 1.04;
		letter-spacing: -0.01em;
		color: var(--crema-clara);
		text-wrap: balance;
	}
	h2 em {
		font-style: italic;
		font-weight: 400;
	}
	p {
		margin: clamp(10px, 1.8svh, 16px) 0 0;
		font-size: clamp(15.5px, 2.05svh, 17px);
		line-height: 1.5;
		color: var(--cuerpo);
		text-wrap: pretty;
	}
	dl {
		margin: auto 0 0;
		padding-top: clamp(12px, 2svh, 18px);
		border-top: 1px solid rgba(227, 197, 155, 0.28);
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	dt {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	dd {
		margin: 6px 0 0;
		font-family: var(--serif);
		font-size: clamp(18px, 2.6svh, 22px);
		line-height: 1.1;
		color: var(--crema-clara);
	}

	/* Cuaderno de travesía */
	.cuenta {
		margin-top: clamp(10px, 1.8svh, 16px);
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.km {
		font-family: var(--serif);
		font-weight: 400;
		font-size: clamp(60px, 9.4svh, 80px);
		line-height: 0.95;
		letter-spacing: -0.02em;
		color: var(--crema-clara);
		font-variant-numeric: tabular-nums lining-nums;
		min-width: 3.1ch;
	}
	.km-unidad {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	.hito {
		display: grid;
		margin-top: clamp(8px, 1.6svh, 14px);
		font-family: var(--serif);
		font-style: italic;
		font-size: clamp(21px, 3svh, 25px);
		line-height: 1.15;
		color: var(--cuerpo);
	}
	.hito > span {
		grid-area: 1 / 1;
	}
	.travesia dl {
		margin-top: clamp(12px, 2svh, 18px);
		grid-template-columns: 1fr 1fr;
	}
	.travesia dd {
		white-space: nowrap;
	}
	.derrota {
		margin-top: auto;
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--crema);
	}
	.linea {
		position: relative;
		flex: 1;
		height: 1px;
		background: repeating-linear-gradient(90deg, rgba(227, 197, 155, 0.6) 0 2px, transparent 2px 7px);
	}
	.linea i {
		position: absolute;
		left: 0;
		top: -0.5px;
		width: 100%;
		height: 2px;
		background: var(--cobre);
		transform: scaleX(0);
		transform-origin: 0 50%;
	}
	.linea b {
		position: absolute;
		left: 0;
		top: -4.5px;
		width: 9px;
		height: 9px;
		margin-left: -4.5px;
		border-radius: 50%;
		background: #f3e3c6;
		box-shadow: 0 0 0 2px var(--cobre);
	}

	/* Portada: caja de diseño de 390 × 844 que se escala al dispositivo */
	.portada {
		position: absolute;
		z-index: 6;
		left: 50%;
		top: 50%;
		width: 390px;
		height: 844px;
		pointer-events: none;
	}
	.g-sup,
	.g-panel,
	.g-inf,
	.g-sello {
		position: absolute;
		will-change: transform, opacity;
	}
	.g-sup {
		left: 0;
		top: 94px;
		width: 100%;
		text-align: center;
	}
	.origins {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.46em;
		text-indent: 0.46em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	.g-panel {
		left: 42px;
		top: 151px;
		width: 306px;
		height: 353px;
		box-sizing: border-box;
		padding: 0 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.sobre {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.24em;
		text-indent: 0.24em;
		text-transform: uppercase;
		color: var(--cobre);
	}
	h1 {
		margin: 18px 0 0;
		font-family: var(--serif);
		font-weight: 600;
		font-size: 68px;
		line-height: 1;
		letter-spacing: -0.01em;
		color: var(--crema-clara);
	}
	.region {
		margin-top: 12px;
		font-size: 13px;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-indent: 0.2em;
		text-transform: uppercase;
	}
	.filete {
		margin-top: 26px;
		width: 44px;
		height: 1px;
		background: var(--crema);
		opacity: 0.5;
	}
	.pct {
		margin-top: 20px;
		display: flex;
		align-items: flex-start;
		font-family: var(--serif);
		font-weight: 400;
		color: var(--crema-clara);
	}
	.pct span {
		font-size: 76px;
		line-height: 0.9;
	}
	.pct sup {
		font-size: 30px;
		line-height: 1;
		margin-left: 2px;
	}
	.sub {
		margin-top: 10px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-indent: 0.22em;
		text-transform: uppercase;
	}
	.g-sello {
		left: 286px;
		top: 452px;
		width: 92px;
		height: 92px;
		transform: rotate(14deg);
	}
	.sello {
		display: block;
		font-family: var(--sans);
	}
	.g-inf {
		left: 0;
		top: 556px;
		width: 100%;
		height: 254px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.notas {
		margin: 0;
		max-width: 300px;
		text-align: center;
		font-family: var(--serif);
		font-style: italic;
		font-size: 18px;
		line-height: 1.45;
		color: var(--crema-clara);
	}
	.pista-scroll {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.24em;
		text-indent: 0.24em;
		text-transform: uppercase;
		color: var(--crema);
	}
	.pista-scroll svg {
		color: var(--cobre);
		animation: baja 2.2s ease-in-out infinite;
	}
	@keyframes baja {
		0%,
		100% {
			transform: translateY(-3px);
		}
		50% {
			transform: translateY(5px);
		}
	}

	/* Entrada escalonada de la portada */
	.entra {
		opacity: 0;
		translate: 0 14px;
		transition:
			opacity 0.9s ease calc(0.25s + var(--i) * 0.09s),
			translate 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(0.25s + var(--i) * 0.09s);
	}
	.lista .entra {
		opacity: 1;
		translate: 0 0;
	}
	.sello.entra {
		translate: 0 0;
		scale: 1.25;
		rotate: -30deg;
		transition:
			opacity 0.5s ease 1.05s,
			scale 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) 1.05s,
			rotate 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 1.05s;
	}
	.lista .sello.entra {
		scale: 1;
		rotate: 0deg;
	}

	/* Cabecera */
	.logo {
		position: absolute;
		z-index: 7;
		left: 24px;
		top: 26px;
		width: 112px;
		height: 16.4px;
		transform-origin: 0 0;
		will-change: transform;
		opacity: 0;
		transition: opacity 1s ease 0.2s;
	}
	.lista .logo {
		opacity: 1;
	}
	.logo img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: auto;
		transition: opacity 0.35s ease;
	}
	.logo-tinta,
	.kraft .logo-crema {
		opacity: 0;
	}
	.kraft .logo-tinta {
		opacity: 1;
	}
	.idiomas {
		position: absolute;
		z-index: 7;
		right: 17px;
		top: 12px;
		display: flex;
		opacity: 0;
	}
	.idiomas button {
		appearance: none;
		border: 0;
		background: none;
		padding: 15px 7px;
		font: 600 12px / 1 var(--sans);
		letter-spacing: 0.12em;
		color: #b9a27f;
		cursor: pointer;
		transition: color 0.35s ease;
	}
	.idiomas button.actual {
		color: var(--crema-clara);
	}
	.kraft .idiomas button {
		color: #6b5846;
	}
	.kraft .idiomas button.actual {
		color: var(--tinta);
	}
	.idiomas button:focus-visible {
		outline: 2px solid var(--cobre);
		outline-offset: -4px;
	}

	@media (prefers-reduced-motion: reduce) {
		.entra,
		.sello.entra,
		.laminas,
		.panel-fondo,
		.logo {
			transition-duration: 0.01s;
			transition-delay: 0s;
		}
		.pista-scroll svg,
		.finca::after,
		.destino.llegado::after {
			animation: none;
		}
	}
</style>
