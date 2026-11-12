// ============================================
// Blanxart Origins — Datos de las DO
// ============================================

// Genera puntos great-circle entre cada par de waypoints
// para que la ruta dibuje curvas de navegación reales.
function smoothRoute(coords, steps = 7) {
	const toRad = d => d * Math.PI / 180;
	const toDeg = r => r * 180 / Math.PI;

	function gcInterp(p0, p1, n) {
		const [λ0, φ0] = [toRad(p0[0]), toRad(p0[1])];
		const [λ1, φ1] = [toRad(p1[0]), toRad(p1[1])];
		const v0 = [Math.cos(φ0)*Math.cos(λ0), Math.cos(φ0)*Math.sin(λ0), Math.sin(φ0)];
		const v1 = [Math.cos(φ1)*Math.cos(λ1), Math.cos(φ1)*Math.sin(λ1), Math.sin(φ1)];
		const dot = v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2];
		const Ω = Math.acos(Math.max(-1, Math.min(1, dot)));
		const sinΩ = Math.sin(Ω);
		const pts = [];
		for (let i = 0; i < n; i++) {
			const t = i / n;
			if (sinΩ < 1e-6) { pts.push([p0[0]+(p1[0]-p0[0])*t, p0[1]+(p1[1]-p0[1])*t]); continue; }
			const s0 = Math.sin((1-t)*Ω)/sinΩ, s1 = Math.sin(t*Ω)/sinΩ;
			const x = s0*v0[0]+s1*v1[0], y = s0*v0[1]+s1*v1[1], z = s0*v0[2]+s1*v1[2];
			pts.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x*x+y*y)))]);
		}
		return pts;
	}

	const result = [];
	for (let i = 0; i < coords.length - 1; i++) {
		result.push(...gcInterp(coords[i], coords[i+1], steps));
	}
	result.push(coords[coords.length - 1]);
	return result;
}

export const ORIGINS = {
	brasil: {
		id: 'brasil',
		nombre: 'Brasil',
		pais: 'Brasil (Amazonas)',
		variedad: 'Trinitario',
		altitud: '100 m',
		// Cromática del envoltorio físico (espejo de --color-brasil)
		envoltorio_color: '#48629D',
		notas: [
			{
				nombre: 'Avellana',
				descripcion: 'Frutos secos tostados, entrada redonda',
				icon: '/assets/icons/hazelnut.svg'
			},
			{
				nombre: 'Café',
				descripcion: 'Fondo profundo de arábica',
				icon: '/assets/icons/coffee.svg'
			},
			{
				nombre: 'Canela',
				descripcion: 'Calidez dulce y especiada',
				icon: '/assets/icons/cinnamon.svg'
			},
			{
				nombre: 'Cítricos',
				descripcion: 'Final fresco, ligeramente vibrante',
				icon: '/assets/icons/citrus.svg'
			}
		],
		coordenadas: { lng: -60.0, lat: -3.5 },
		zoom_entrada: 4.5,
		zoom_detalle: 9,
		bearing: -25,
		pitch: 40,
		puntos_locales: [
			{
				id: 'selva',
				nombre: 'Selva del Amazonas',
				lng: -60.0,
				lat: -3.5
			},
			{
				id: 'cooperativa',
				nombre: 'Cooperativa amazónica',
				lng: -59.0,
				lat: -3.1
			}
		],
		ruta_a_barcelona: smoothRoute([
			[-60.0,  -3.5],  // Amazonas
			[-55.0,  -1.8],  // nordeste de Brasil
			[-48.0,   1.0],  // salida al Atlántico
			[-40.0,   4.0],  // Atlántico ecuatorial W
			[-32.0,   7.0],  // Atlántico central
			[-24.0,  12.0],  // Atlántico central N
			[-18.0,  18.0],  // área de Canarias
			[-13.0,  24.0],  // Canarias
			[ -9.0,  28.0],  // Atlántico Norte
			[ -5.0,  33.0],  // aproximación a Gibraltar
			[ -1.5,  37.0],  // Gibraltar / Cádiz
			[  1.0,  40.0],  // Mediterráneo occidental
			[  2.046, 41.369] // Sant Joan Despí
		], 7)
	},

	congo: {
		id: 'congo',
		nombre: 'Congo',
		pais: 'República Democrática del Congo',
		variedad: 'Forastero',
		altitud: '1.200 m',
		envoltorio_color: '#3B4F3A', // espejo de --color-congo
		notas: [
			{ nombre: 'Frutos rojos', descripcion: 'Frutas del bosque, acidez viva', icon: '/assets/icons/berries.svg' },
			{ nombre: 'Cítricos',     descripcion: 'Frescor ácido y limpio',          icon: '/assets/icons/citrus.svg' },
			{ nombre: 'Especias',     descripcion: 'Final especiado y complejo',      icon: '/assets/icons/spices.svg' }
		],
		coordenadas: { lng: 23.6, lat: -2.9 },
		zoom_entrada: 5,
		zoom_detalle: 9,
		bearing: -15,
		pitch: 45,
		puntos_locales: [
			{ id: 'plantacion',  nombre: 'Plantaciones del Kivu', lng: 28.8, lat: -2.5 },
			{ id: 'cooperativa', nombre: 'Cooperativa de secado', lng: 28.6, lat: -2.7 }
		],
		ruta_a_barcelona: smoothRoute([
			[28.8, -2.5],
			[12.0, 5.0],
			[-5.0, 15.0],
			[-10.0, 30.0],
			[2.15, 41.38]
		], 7)
	},

	peru: {
		id: 'peru',
		nombre: 'Perú',
		pais: 'Perú (región Piura)',
		variedad: 'Criollo',
		altitud: '400 m',
		envoltorio_color: '#C8B89A', // espejo de --color-peru
		notas: [
			{ nombre: 'Madera',  descripcion: 'Fondo terroso y profundo',    icon: '/assets/icons/wood.svg' },
			{ nombre: 'Tabaco',  descripcion: 'Aromas maduros y complejos',  icon: '/assets/icons/tobacco.svg' },
			{ nombre: 'Regaliz', descripcion: 'Final dulce y persistente',   icon: '/assets/icons/licorice.svg' }
		],
		coordenadas: { lng: -80.6, lat: -5.2 },
		zoom_entrada: 5,
		zoom_detalle: 10,
		bearing: 20,
		pitch: 50,
		puntos_locales: [
			{ id: 'plantacion',  nombre: 'Valles de Piura', lng: -80.6, lat: -5.2 },
			{ id: 'exportacion', nombre: 'Puerto de Paita', lng: -81.1, lat: -5.09 }
		],
		ruta_a_barcelona: smoothRoute([
			[-80.6, -5.2],
			[-77.0, 2.0],
			[-60.0, 15.0],
			[-20.0, 30.0],
			[2.15, 41.38]
		], 7)
	}
};

// Destino final: obrador y tienda Blanxart
// Carrer del Tambor del Bruc 17, Sant Joan Despí (Barcelona)
export const FABRICA = {
	nombre: 'Obrador Blanxart',
	barrio: 'Sant Joan Despí, Barcelona',
	fundacion: 1954,
	lng: 2.046,
	lat: 41.369,
	zoom: 15,
	bearing: 20,
	pitch: 55
};
