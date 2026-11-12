// Geometría del mapa. Todo vive en un único espacio Mercator:
// x = longitud en radianes, y = −ln(tan(π/4 + lat/2)) (crece hacia el sur, como la pantalla).

export const rad = (d) => (d * Math.PI) / 180;
export const mercY = (lat) => -Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));
export const mundo = (lon, lat) => ({ x: rad(lon), y: mercY(lat) });
const latDe = (y) => 2 * Math.atan(Math.exp(-y)) - Math.PI / 2;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const suave = (a, b, v) => {
	const t = clamp((v - a) / (b - a));
	return t * t * (3 - 2 * t);
};

function haversineKm(lon1, lat1, lon2, lat2) {
	const dLat = lat2 - lat1;
	const dLon = lon2 - lon1;
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Convierte una lista de puntos de paso [lon, lat] en una ruta suave (Catmull-Rom)
 * parametrizada por longitud en pantalla, para que el barco avance a ritmo constante.
 */
export function construirRuta(pasos, porTramo = 28) {
	const P = pasos.map(([lon, lat]) => mundo(lon, lat));
	const pts = [];
	for (let i = 0; i < P.length - 1; i++) {
		const p0 = P[Math.max(0, i - 1)];
		const p1 = P[i];
		const p2 = P[i + 1];
		const p3 = P[Math.min(P.length - 1, i + 2)];
		for (let j = 0; j < porTramo; j++) {
			const t = j / porTramo;
			const t2 = t * t;
			const t3 = t2 * t;
			pts.push({
				x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
				y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
			});
		}
	}
	pts.push({ ...P[P.length - 1] });

	const n = pts.length;
	const largo = new Float64Array(n);
	const km = new Float64Array(n);
	for (let i = 1; i < n; i++) {
		const a = pts[i - 1];
		const b = pts[i];
		largo[i] = largo[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
		km[i] = km[i - 1] + haversineKm(a.x, latDe(a.y), b.x, latDe(b.y));
	}
	const total = largo[n - 1];
	const u = Array.from(largo, (l) => l / total);

	/** Punto de la ruta para una fracción u (0–1): posición, km recorridos e índice. */
	function en(f) {
		f = clamp(f);
		let lo = 0;
		let hi = n - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (u[mid] <= f) lo = mid;
			else hi = mid;
		}
		const k = u[hi] === u[lo] ? 0 : (f - u[lo]) / (u[hi] - u[lo]);
		return {
			x: lerp(pts[lo].x, pts[hi].x, k),
			y: lerp(pts[lo].y, pts[hi].y, k),
			km: lerp(km[lo], km[hi], k),
			i: lo
		};
	}

	/** Fracción u del primer punto que cumple la condición (para situar hitos de la ruta). */
	function uDonde(cond) {
		for (let i = 0; i < n; i++) if (cond(pts[i].x, pts[i].y)) return u[i];
		return 1;
	}

	return { pts, u, km, totalKm: km[n - 1], en, uDonde };
}
