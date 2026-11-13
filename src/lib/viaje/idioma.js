import { writable } from 'svelte/store';

export const IDIOMAS = ['es', 'ca', 'en'];

function inicial() {
	if (typeof window === 'undefined') return 'es';
	try {
		const url = new URLSearchParams(window.location.search).get('lang');
		if (IDIOMAS.includes(url)) return url;
		const guardado = window.localStorage.getItem('blanxart-idioma');
		if (IDIOMAS.includes(guardado)) return guardado;
	} catch {
		// sin almacenamiento: seguimos con el idioma del navegador
	}
	const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
	return IDIOMAS.includes(nav) ? nav : 'es';
}

export const idioma = writable(inicial());

idioma.subscribe((v) => {
	if (typeof document === 'undefined') return;
	document.documentElement.lang = v;
	try {
		window.localStorage.setItem('blanxart-idioma', v);
	} catch {
		// modo privado: no pasa nada
	}
});

/** Miles con punto (es, ca) o coma (en). */
export function miles(n, lang) {
	return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
}
