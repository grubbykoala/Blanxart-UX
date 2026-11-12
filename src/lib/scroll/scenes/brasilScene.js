// ============================================
// Blanxart Origins — Escena Brasil · Atlas vivo
// ============================================
// Arquitectura de cámara: el scroll escribe una POSE
// (centro/zoom/bearing/pitch) y un ticker la aplica en
// cada frame sumándole tres capas de vida:
//   · respiración — bearing/pitch oscilan como cámara al hombro
//   · obertura    — el globo gira solo hasta el primer scroll
//   · reveal      — zoom de asentamiento al arrancar
// Así el mapa nunca está congelado, ni siquiera parado.
//
// Sobre la cámara, el mundo: color grading por capítulo,
// lluvia y nubes, sellos con golpe, cinemascope en la
// travesía, ondas al llegar, y snap editorial que asienta
// el scroll en los momentos de lectura.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRASIL_SEQUENCE } from '$lib/map/flyToSequences.js';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// Poses de cámara — cada una encadena con la siguiente
// ============================================================
const CAM = {
	initial:     { center: [0, 20],         zoom: 1.8,  bearing: 0,   pitch: 0  },
	brasil:      { center: [-60.0, -3.5],   zoom: 4.5,  bearing: -15, pitch: 35 },
	plantacion:  { center: [-60.0, -3.5],   zoom: 9,    bearing: -20, pitch: 48 },
	cooperativa: { center: [-59.0, -3.1],   zoom: 9,    bearing: 10,  pitch: 48 },
	previaje:    { center: [-60.0, -3.5],   zoom: 3.5,  bearing: 45,  pitch: 35 }, // = waypoint 0 del viaje
	viaje_end:   { center: [2.046, 41.369], zoom: 8,    bearing: 15,  pitch: 35 },
	fabrica:     { center: [2.046, 41.369], zoom: 15,   bearing: 20,  pitch: 55 },
	oficio:      { center: [2.046, 41.369], zoom: 16.3, bearing: 85,  pitch: 58 },
	cierre:      { center: [-28.0, 18.0],   zoom: 2.2,  bearing: 0,   pitch: 0  },
};

// Sellos de puerto que se estampan durante la travesía
const PORT_STAMPS = [
	{ id: 'stamp-belem',    progress: 0.1,  coords: [-48.3, -1.3],  label: 'Belém' },
	{ id: 'stamp-canarias', progress: 0.55, coords: [-15.8, 27.6],  label: 'Canarias' },
	{ id: 'stamp-bcn',      progress: 0.96, coords: [2.15, 41.38],  label: 'Barcelona' },
];

// Etapas del raíl de progreso → sección navegable
export const DOT_SECTIONS = [
	'#section-plantacion',
	'#section-cooperativa',
	'#section-notas',
	'#section-previaje',
	'#section-viaje',
	'#section-fabrica',
	'#section-oficio',
	'#section-cierre',
];

// ============================================================
// Helpers puros
// ============================================================
function lerp(a, b, t) { return a + (b - a) * t; }

function smoothstep(edge0, edge1, x) {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Umbrales de coreografía: la cámara llega antes de que hable el texto
const P = {
	CAM_DONE:  0.40,
	CARD_IN:   0.56,
	CARD_OUT:  0.80,
	CARD_GONE: 0.96,
};

function cardState(p) {
	if (p <= P.CAM_DONE) return { offsetY: 40, opacity: 0 };
	if (p <= P.CARD_IN) {
		const t = smoothstep(P.CAM_DONE, P.CARD_IN, p);
		return { offsetY: lerp(40, 0, t), opacity: t };
	}
	if (p <= P.CARD_OUT) return { offsetY: 0, opacity: 1 };
	if (p <= P.CARD_GONE) {
		const t = smoothstep(P.CARD_OUT, P.CARD_GONE, p);
		return { offsetY: lerp(0, -20, t), opacity: 1 - t };
	}
	return { offsetY: -20, opacity: 0 };
}

// ============================================================
export function initBrasilScene(mapAPI, components) {
	if (!mapAPI || !mapAPI.isReady()) return null;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const map      = mapAPI.getMapInstance();
	const triggers = [];
	const seq      = BRASIL_SEQUENCE.phases;
	const mapEl    = document.getElementById('map-container');
	const boxTop    = document.querySelector('.letterbox--top');
	const boxBottom = document.querySelector('.letterbox--bottom');
	const scrollHint = document.querySelector('.scroll-hint');

	let travelComplete = false;
	let arrivalFired = false;
	let bankAngle = 0;
	const shownStamps = new Set();

	// ============================================================
	// CÁMARA VIVA — pose + respiración + obertura
	// ============================================================
	const pose = {
		lng: CAM.initial.center[0], lat: CAM.initial.center[1],
		zoom: CAM.initial.zoom, bearing: CAM.initial.bearing, pitch: CAM.initial.pitch
	};
	const breath     = { bearing: 0, pitch: 0 };  // cámara al hombro
	const introDrift = { lng: 0 };                // el globo gira solo
	const reveal     = { zoom: -0.5 };            // asentamiento inicial
	const liveTweens = [];
	let introTween = null;
	let introDone = false;

	const setPose = (center, zoom, bearing, pitch) => {
		pose.lng = center[0]; pose.lat = center[1];
		pose.zoom = zoom; pose.bearing = bearing; pose.pitch = pitch;
		if (reducedMotion) {
			map.jumpTo({ center: [pose.lng, pose.lat], zoom, bearing, pitch });
		}
	};

	const applyPose = () => {
		map.jumpTo({
			center: [pose.lng + introDrift.lng, pose.lat],
			zoom: Math.max(1, pose.zoom + reveal.zoom),
			bearing: pose.bearing + breath.bearing,
			pitch: clamp(pose.pitch + breath.pitch, 0, 85)
		});
	};

	if (!reducedMotion) {
		gsap.ticker.add(applyPose);

		// Respiración: dos senos desfasados, imperceptibles pero vivos
		liveTweens.push(gsap.fromTo(breath,
			{ bearing: -0.5 },
			{ bearing: 0.5, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
		liveTweens.push(gsap.fromTo(breath,
			{ pitch: -0.35 },
			{ pitch: 0.35, duration: 9.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.3 }));

		// Obertura: zoom de asentamiento + el planeta gira despacio
		liveTweens.push(gsap.to(reveal, { zoom: 0, duration: 3, ease: 'expo.out', delay: 0.15 }));
		introTween = gsap.to(introDrift, { lng: -30, duration: 75, ease: 'none' });
	} else {
		reveal.zoom = 0;
	}

	// El primer gesto del usuario recoge la obertura
	const dismissIntro = () => {
		if (introDone) return;
		introDone = true;
		if (introTween) { introTween.kill(); introTween = null; }
		if (!reducedMotion) {
			gsap.to(introDrift, { lng: 0, duration: 1.8, ease: 'power2.out' });
		} else {
			introDrift.lng = 0;
		}
		if (scrollHint) gsap.to(scrollHint, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' });
	};

	// Interpolación con easing dentro de cada tramo
	const cam = (from, to, p) => {
		const t = reducedMotion ? 1 : smoothstep(0, 1, p);
		setPose(
			[lerp(from.center[0], to.center[0], t), lerp(from.center[1], to.center[1], t)],
			lerp(from.zoom, to.zoom, t),
			lerp(from.bearing, to.bearing, t),
			lerp(from.pitch, to.pitch, t)
		);
	};

	// ============================================================
	// Cards, línea guía, sellos, banking, cinemascope
	// ============================================================
	const card = (p, c) => {
		if (!c) return 0;
		if (reducedMotion) {
			if (typeof c.setCardTransform === 'function') c.setCardTransform(0, 1);
			return 1;
		}
		const st = cardState(p);
		if (typeof c.setCardTransform === 'function') c.setCardTransform(st.offsetY, st.opacity);
		return st.opacity;
	};

	const narrate = (p) => {
		const op = card(p, components.narrativeCard);
		components.guideLine?.setOpacity(op);
		return op;
	};

	const showCard = (ph) => {
		if (components.narrativeCard && ph?.narrative) {
			components.narrativeCard.show({ ...ph.narrative });
		}
		if (ph?.marker && components.guideLine && components.narrativeCard?.getAnchor) {
			components.guideLine.show(ph.marker.coords, () => components.narrativeCard.getAnchor());
		} else {
			components.guideLine?.hide();
		}
	};

	const hideCard = () => {
		components.narrativeCard?.hide();
		components.guideLine?.hide();
	};

	// Sellos: aparecen con golpe de tampón y micro-sacudida del atlas
	const updateStamps = (p) => {
		for (const s of PORT_STAMPS) {
			if (p >= s.progress && !shownStamps.has(s.id)) {
				mapAPI.addStamp(s);
				shownStamps.add(s.id);
				if (!reducedMotion && mapEl) {
					gsap.timeline()
						.to(mapEl, { x: -2.2, duration: 0.05, ease: 'power2.out' })
						.to(mapEl, { x: 1.6,  duration: 0.08 })
						.to(mapEl, { x: 0,    duration: 0.14, ease: 'power3.out' });
				}
			} else if (p < s.progress && shownStamps.has(s.id)) {
				mapAPI.removeStamp(s.id);
				shownStamps.delete(s.id);
			}
		}
	};

	// Banking: la cámara se inclina con el viraje del rumbo
	const bank = (targetDeg) => {
		if (reducedMotion || !mapEl) return;
		bankAngle += (targetDeg - bankAngle) * 0.06;
		gsap.set(mapEl, { rotate: bankAngle, scale: 1.05 });
	};

	const bankReset = () => {
		bankAngle = 0;
		if (mapEl) gsap.to(mapEl, { rotate: 0, scale: 1, duration: 0.9, ease: 'sine.inOut' });
	};

	// Cinemascope: barras que encuadran la travesía
	const letterbox = (on) => {
		if (reducedMotion || !boxTop || !boxBottom) return;
		gsap.to(boxTop, {
			yPercent: on ? 0 : -101,
			duration: on ? 1.2 : 0.8,
			ease: on ? 'power3.out' : 'power2.in'
		});
		gsap.to(boxBottom, {
			yPercent: on ? 0 : 101,
			duration: on ? 1.2 : 0.8,
			ease: on ? 'power3.out' : 'power2.in'
		});
	};

	if (boxTop && boxBottom) {
		gsap.set(boxTop, { yPercent: -101 });
		gsap.set(boxBottom, { yPercent: 101 });
	}

	// Snap editorial: el scroll se asienta en el momento de lectura
	const SNAP = reducedMotion ? undefined : {
		snapTo: [0, 0.66, 1],
		duration: { min: 0.4, max: 1.1 },
		delay: 0.3,
		ease: 'power2.inOut'
	};

	// ============================================
	// 1 — Entrada: el mundo → Brasil · Capítulo I
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-entrada',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		onUpdate: (self) => {
			if (self.progress > 0.004) dismissIntro();
			cam(CAM.initial, CAM.brasil, self.progress);
			narrate(self.progress);
			components.chapterNumeral?.show('I');
			components.chapterNumeral?.setProgress(self.progress);
		},
		onLeave: () => { hideCard(); components.chapterNumeral?.hide(); },
		onLeaveBack: () => { hideCard(); components.chapterNumeral?.hide(); }
	}));

	// ============================================
	// 2 — Plantación · empieza a llover en la selva
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-plantacion',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			cam(CAM.brasil, CAM.plantacion, self.progress);
			narrate(self.progress);
		},
		onEnter: () => {
			dismissIntro();
			const ph = seq[1];
			if (ph.marker) mapAPI.addMarker({ ...ph.marker, style: 'active' });
			showCard(ph);
			mapAPI.setGrade('selva');
			components.atmosphere?.setRain(true);
			components.progressDots?.setActive(0);
		},
		onLeave: () => hideCard(),
		onLeaveBack: () => {
			mapAPI.clearMarkers();
			mapAPI.setGrade('base');
			components.atmosphere?.setRain(false);
			showCard(seq[0]);
			components.progressDots?.setActive(0);
		}
	}));

	// ============================================
	// 3 — Cooperativa
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-cooperativa',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			cam(CAM.plantacion, CAM.cooperativa, self.progress);
			narrate(self.progress);
		},
		onEnter: () => {
			const ph = seq[2];
			mapAPI.updateMarkerStyle('selva', 'default');
			if (ph.marker) mapAPI.addMarker({ ...ph.marker, style: 'active' });
			showCard(ph);
			components.progressDots?.setActive(1);
		},
		onLeave: () => hideCard(),
		onLeaveBack: () => {
			mapAPI.clearMarkers();
			const ph = seq[1];
			if (ph.marker) mapAPI.addMarker({ ...ph.marker, style: 'active' });
			showCard(ph);
			components.progressDots?.setActive(0);
		}
	}));

	// ============================================
	// 4 — Notas de cata (cámara en reposo, sigue lloviendo)
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-notas',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			card(self.progress, components.sensorNotes);
		},
		onEnter: () => {
			hideCard();
			components.sensorNotes?.show({ ...seq[3].sensorial });
			components.progressDots?.setActive(2);
		},
		onLeave: () => components.sensorNotes?.hide(),
		onLeaveBack: () => {
			components.sensorNotes?.hide();
			showCard(seq[2]);
			components.progressDots?.setActive(1);
		}
	}));

	// ============================================
	// 5 — Pre-viaje: escampa, zarpamos · Capítulo II
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-previaje',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			cam(CAM.cooperativa, CAM.previaje, self.progress);
			narrate(self.progress);
			components.chapterNumeral?.show('II');
			components.chapterNumeral?.setProgress(self.progress);
		},
		onEnter: () => {
			components.sensorNotes?.hide();
			components.atmosphere?.setRain(false);
			mapAPI.updateMarkerStyle('cooperativa', 'default');
			showCard(seq[4]);
			components.progressDots?.setActive(3);
		},
		onLeave: () => { hideCard(); components.chapterNumeral?.hide(); },
		onLeaveBack: () => {
			hideCard();
			components.chapterNumeral?.hide();
			components.atmosphere?.setRain(true);
			components.sensorNotes?.show({ ...seq[3].sensorial });
			components.progressDots?.setActive(2);
		}
	}));

	// ============================================
	// 6 — La travesía: cinemascope, nubes, HUD, sellos
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-viaje',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		onEnter: () => {
			travelComplete = false;
			arrivalFired = false;
			hideCard();
			components.routeLines?.setVisibility(true);
			components.travelHUD?.show();
			mapAPI.setGrade('atlantico', 3);
			letterbox(true);
			if (!reducedMotion && mapEl) gsap.to(mapEl, { scale: 1.05, duration: 1, ease: 'sine.out' });
			components.progressDots?.setActive(4);
		},
		onEnterBack: () => {
			travelComplete = false;
			components.travelHUD?.show();
			letterbox(true);
			if (!reducedMotion && mapEl) gsap.to(mapEl, { scale: 1.05, duration: 1, ease: 'sine.out' });
		},
		onLeave: () => {
			travelComplete = true;
			components.travelHUD?.hide();
			letterbox(false);
			bankReset();
		},
		onLeaveBack: () => {
			travelComplete = false;
			arrivalFired = false;
			components.routeLines?.setVisibility(false);
			components.travelHUD?.hide();
			components.atmosphere?.setTravelProgress(0);
			mapAPI.setGrade('selva');
			mapAPI.clearStamps();
			shownStamps.clear();
			letterbox(false);
			bankReset();
			showCard(seq[4]);
			components.progressDots?.setActive(3);
		},
		onUpdate: (self) => {
			if (travelComplete) return;

			const progress  = Math.max(0, Math.min(0.9999, self.progress));
			const waypoints = seq[5].waypoints;

			components.routeLines?.updateProgress(progress);
			components.travelHUD?.setProgress(progress);
			components.atmosphere?.setTravelProgress(progress);
			updateStamps(progress);

			// Ondas al avistar Barcelona
			if (progress >= 0.985 && !arrivalFired) {
				arrivalFired = true;
				components.routeLines?.pulseArrival();
			}

			let idx = waypoints.length - 2;
			for (let i = 0; i < waypoints.length - 1; i++) {
				if (progress >= waypoints[i].progress && progress < waypoints[i + 1].progress) {
					idx = i; break;
				}
			}

			const wp1   = waypoints[idx];
			const wp2   = waypoints[idx + 1];
			const range = wp2.progress - wp1.progress;
			const t     = range > 0 ? (progress - wp1.progress) / range : 0;

			// La cámara se inclina proporcionalmente al viraje del tramo
			bank(clamp((wp2.camera.bearing - wp1.camera.bearing) * 0.12, -2.5, 2.5));

			if (!reducedMotion) {
				setPose(
					[
						lerp(wp1.camera.center[0], wp2.camera.center[0], t),
						lerp(wp1.camera.center[1], wp2.camera.center[1], t),
					],
					lerp(wp1.camera.zoom,    wp2.camera.zoom,    t),
					lerp(wp1.camera.bearing, wp2.camera.bearing, t),
					lerp(wp1.camera.pitch,   wp2.camera.pitch,   t)
				);
			} else {
				setPose(CAM.viaje_end.center, CAM.viaje_end.zoom, CAM.viaje_end.bearing, CAM.viaje_end.pitch);
			}
		}
	}));

	// ============================================
	// 7 — El obrador · Capítulo III · oro de llegada
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-fabrica',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			if (!travelComplete) travelComplete = true;
			cam(CAM.viaje_end, CAM.fabrica, self.progress);
			narrate(self.progress);
			components.chapterNumeral?.show('III');
			components.chapterNumeral?.setProgress(self.progress);
		},
		onEnter: () => {
			travelComplete = true;
			components.routeLines?.setVisibility(false);
			components.travelHUD?.hide();
			letterbox(false);
			mapAPI.setGrade('barcelona');
			mapAPI.clearStamps();
			shownStamps.clear();
			const ph = seq[6];
			if (ph.marker) mapAPI.addMarker({ ...ph.marker, style: 'fabrica' });
			showCard(ph);
			components.progressDots?.setActive(5);
		},
		onLeave: () => { hideCard(); components.chapterNumeral?.hide(); },
		onLeaveBack: () => {
			travelComplete = false;
			mapAPI.clearMarkers();
			mapAPI.setGrade('atlantico');
			components.routeLines?.setVisibility(true);
			components.chapterNumeral?.hide();
			hideCard();
			components.progressDots?.setActive(4);
		}
	}));

	// ============================================
	// 8 — El oficio: órbita lenta alrededor del obrador
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-oficio',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			cam(CAM.fabrica, CAM.oficio, self.progress);
			narrate(self.progress);
		},
		onEnter: () => {
			showCard(seq[7]);
			components.progressDots?.setActive(6);
		},
		onLeave: () => hideCard(),
		onLeaveBack: () => {
			showCard(seq[6]);
			components.progressDots?.setActive(5);
		}
	}));

	// ============================================
	// 9 — Cierre: el Atlántico entero, la ruta y sus sellos
	// ============================================
	triggers.push(ScrollTrigger.create({
		trigger: '#section-cierre',
		start: 'top top',
		end: 'bottom top',
		scrub: 1.5,
		snap: SNAP,
		onUpdate: (self) => {
			cam(CAM.oficio, CAM.cierre, self.progress);
			narrate(self.progress);
		},
		onEnter: () => {
			// Pre-carga: salto a zoom intermedio para suavizar la transición 16.3 → 2.2
			if (!reducedMotion) {
				setPose(CAM.oficio.center, 9, 15, 15);
			}
			mapAPI.clearMarkers();
			mapAPI.setGrade('base', 3);
			if (components.routeLines) {
				components.routeLines.updateProgress(1.0);
				components.routeLines.setVisibility(true);
			}
			// La ruta completa merece sus tres sellos
			PORT_STAMPS.forEach(s => { mapAPI.addStamp(s); shownStamps.add(s.id); });
			showCard(seq[8]);
			components.progressDots?.setActive(7);
		},
		onLeave: () => hideCard(),
		onLeaveBack: () => {
			components.routeLines?.setVisibility(false);
			mapAPI.setGrade('barcelona');
			mapAPI.clearStamps();
			shownStamps.clear();
			showCard(seq[7]);
			components.progressDots?.setActive(6);
		}
	}));

	// ============================================
	// 10 — Final: el mapa cede el sitio al colofón
	// ============================================
	const colophon = document.querySelector('.final-colophon');
	triggers.push(ScrollTrigger.create({
		trigger: '#section-final',
		start: 'top 80%',
		end: 'bottom bottom',
		scrub: 1.5,
		onUpdate: (self) => {
			const p = self.progress;
			if (mapEl) mapEl.style.opacity = String(1 - p * 0.92);
			if (colophon) {
				colophon.style.opacity = String(smoothstep(0.25, 0.8, p));
				colophon.style.transform = `translateY(${lerp(24, 0, smoothstep(0.25, 0.8, p)).toFixed(1)}px)`;
			}
		},
		onEnter: () => {
			hideCard();
			components.progressDots?.hide();
		},
		onLeaveBack: () => {
			if (mapEl) mapEl.style.opacity = '1';
			components.progressDots?.show();
			showCard(seq[8]);
		}
	}));

	// La card de apertura espera lista bajo el primer tramo de scroll
	showCard(seq[0]);

	// ============================================================
	// Limpieza
	// ============================================================
	return () => {
		triggers.forEach(t => t.kill());
		gsap.ticker.remove(applyPose);
		liveTweens.forEach(t => t.kill());
		if (introTween) introTween.kill();
		if (mapEl) {
			mapEl.style.opacity = '1';
			gsap.set(mapEl, { rotate: 0, scale: 1, x: 0 });
		}
		if (boxTop && boxBottom) {
			gsap.set(boxTop, { yPercent: -101 });
			gsap.set(boxBottom, { yPercent: 101 });
		}
		mapAPI.clearMarkers();
		mapAPI.clearStamps();
		components.routeLines?.removeRoute();
		components.atmosphere?.reset();
		components.travelHUD?.hide();
		components.chapterNumeral?.hide();
		components.guideLine?.hide();
	};
}
