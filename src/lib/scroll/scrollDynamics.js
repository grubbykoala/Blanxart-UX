// ============================================
// Blanxart Origins — Física de scroll
// La velocidad del pulgar se filtra a tres variables
// CSS que consumen la tipografía (shear sutil), la
// lluvia (deriva del viento) y el grano (intensidad).
// Un solo write por frame; los consumidores son
// transform/opacity puros — coste GPU mínimo.
// ============================================

import { gsap } from 'gsap';

export function initScrollDynamics(lenis) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return () => {};
	}

	const root = document.documentElement;
	let target = 0;
	let current = 0;
	let resting = true;

	const onScroll = (e) => {
		// Lenis entrega px/frame; acotamos a un shear editorial
		target = Math.max(-1.4, Math.min(1.4, e.velocity * 0.022));
	};

	const tick = () => {
		target *= 0.9;                              // decaimiento al soltar
		current += (target - current) * 0.12;       // asentamiento suave

		if (Math.abs(current) < 0.004 && Math.abs(target) < 0.004) {
			if (!resting) {
				resting = true;
				root.style.setProperty('--scroll-skew', '0deg');
				root.style.setProperty('--scroll-tilt', '0deg');
				root.style.setProperty('--scroll-grain', '0');
			}
			return;
		}

		resting = false;
		root.style.setProperty('--scroll-skew', `${current.toFixed(3)}deg`);
		root.style.setProperty('--scroll-tilt', `${(current * 2.4).toFixed(2)}deg`);
		root.style.setProperty('--scroll-grain', Math.min(0.035, Math.abs(current) * 0.03).toFixed(3));
	};

	lenis.on('scroll', onScroll);
	gsap.ticker.add(tick);

	return () => {
		gsap.ticker.remove(tick);
		root.style.setProperty('--scroll-skew', '0deg');
		root.style.setProperty('--scroll-tilt', '0deg');
		root.style.setProperty('--scroll-grain', '0');
	};
}
