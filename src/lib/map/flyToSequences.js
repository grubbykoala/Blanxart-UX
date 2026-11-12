// ============================================
// Blanxart Origins — Secuencias narrativas
// Guion de cada DO: poses de cámara, textos,
// datos técnicos y composición de cada card.
// Los títulos admiten <em> para la itálica editorial.
// ============================================

import { ORIGINS, FABRICA } from '$lib/data/origins.js';

export const BRASIL_SEQUENCE = {
	initial: {
		center: [0, 20],
		zoom: 1.8,
		bearing: 0,
		pitch: 0
	},

	phases: [
		{
			id: 'zoom-brasil',
			narrative: {
				variant: 'entry',
				align: 'left',
				eyebrow: 'Capítulo I — El origen',
				title: 'Amazonas, <em>Brasil</em>',
				content: 'A nueve mil kilómetros de Barcelona, en el corazón húmedo del Amazonas, nace el chocolate que tienes en la mano.',
				dato: '03°28′S 60°01′O · 9.012 km a Barcelona'
			}
		},
		{
			id: 'plantacion',
			narrative: {
				variant: 'milestone',
				align: 'left',
				eyebrow: 'La plantación',
				title: 'Cultivo bajo <em>dosel</em>',
				content: 'El cacao Trinitario crece aquí desde hace generaciones. Bajo dosel cerrado, sin sol directo, cada fruto madura lento: seis meses de paciencia antes de la cosecha a mano.',
				dato: 'Var. Trinitario · altitud 100 m · cosecha a mano',
				image: '/assets/images/CacaoBrazil.avif'
			},
			marker: {
				id: 'selva',
				coords: [ORIGINS.brasil.puntos_locales[0].lng, ORIGINS.brasil.puntos_locales[0].lat],
				label: ORIGINS.brasil.puntos_locales[0].nombre
			}
		},
		{
			id: 'cooperativa',
			narrative: {
				variant: 'milestone',
				align: 'right',
				eyebrow: 'El oficio',
				title: 'Fermentación <em>y secado</em>',
				content: 'Seis días en cajas de madera de cedro. Las bacterias y levaduras transforman la pulpa azucarada en los precursores aromáticos del chocolate. Sin esta fermentación, solo habría amargor.',
				dato: '6 días · cajas de cedro · secado al sol',
				image: '/assets/images/TostadoCacao.avif'
			},
			marker: {
				id: 'cooperativa',
				coords: [ORIGINS.brasil.puntos_locales[1].lng, ORIGINS.brasil.puntos_locales[1].lat],
				label: ORIGINS.brasil.puntos_locales[1].nombre
			}
		},
		{
			id: 'notas-sensoriales',
			// La cámara descansa; habla la ficha de cata
			sensorial: {
				eyebrow: 'Cata Nº 01 — Trinitario',
				title: 'Perfil <em>sensorial</em>',
				dato: 'Var. Trinitario · tueste medio · 70 g'
			}
		},
		{
			id: 'pre-viaje',
			narrative: {
				variant: 'milestone',
				align: 'left',
				eyebrow: 'Capítulo II — La travesía',
				title: 'Rumbo a <em>Barcelona</em>',
				content: 'Los sacos de yute se cargan en el puerto de Belém. Treinta días de travesía atlántica separan el Amazonas de Catalunya.',
				dato: 'Belém → Barcelona · 30 días de mar'
			}
		},
		{
			id: 'ruta-viaje',
			waypoints: [
				{ progress: 0,    camera: { center: [-60.0, -3.5], zoom: 3.5, bearing: 45, pitch: 35 } },
				{ progress: 0.2,  camera: { center: [-48.0,  1.0], zoom: 3.2, bearing: 55, pitch: 30 } },
				{ progress: 0.4,  camera: { center: [-32.0,  7.0], zoom: 2.8, bearing: 65, pitch: 25 } },
				{ progress: 0.6,  camera: { center: [-18.0, 18.0], zoom: 2.8, bearing: 70, pitch: 20 } },
				{ progress: 0.75, camera: { center: [ -9.0, 28.0], zoom: 3.2, bearing: 65, pitch: 20 } },
				{ progress: 0.9,  camera: { center: [ -1.5, 37.0], zoom: 4.5, bearing: 40, pitch: 28 } },
				{ progress: 1,    camera: { center: [2.046, 41.369], zoom: 8, bearing: 15, pitch: 35 } }
			],
			routeCoords: ORIGINS.brasil.ruta_a_barcelona
		},
		{
			id: 'fabrica',
			narrative: {
				variant: 'milestone',
				align: 'left',
				eyebrow: 'Capítulo III — El obrador',
				title: 'Blanxart, <em>desde 1954</em>',
				content: 'En Sant Joan Despí, los mismos granos que cruzaron el Atlántico se tuestan, se muelen y se transforman despacio. Solo cacao y azúcar. Nada más.',
				dato: '41°22′N 02°02′E · fundada en 1954'
			},
			marker: {
				id: 'fabrica',
				coords: [FABRICA.lng, FABRICA.lat],
				label: FABRICA.nombre
			}
		},
		{
			id: 'oficio',
			narrative: {
				variant: 'milestone',
				align: 'right',
				eyebrow: 'Bean to bar',
				title: 'Setenta y dos horas <em>de conchado</em>',
				content: 'El conchado lento redondea la acidez y despierta los aromas que la selva sembró. Del grano a la tableta, sin intermediarios: el mismo oficio desde hace setenta años.',
				dato: 'Tostado 120 °C · conchado 72 h'
			}
		},
		{
			id: 'cierre',
			narrative: {
				variant: 'entry',
				align: 'left',
				eyebrow: 'Origins · Nº 01',
				title: 'Del Amazonas <em>a tu paladar</em>',
				content: 'Nueve mil kilómetros condensados en setenta gramos. Avellana, café, canela y un final cítrico. Ahora ya sabes de dónde viene.',
				dato: 'Brasil · Trinitario · 9.012 km · 70 g'
			}
		}
	]
};

// Estructuras pendientes de guion (Fase 2)
export const CONGO_SEQUENCE = {
	initial: { center: [0, 20], zoom: 1.8, bearing: 0, pitch: 0 },
	phases: []
};

export const PERU_SEQUENCE = {
	initial: { center: [0, 20], zoom: 1.8, bearing: 0, pitch: 0 },
	phases: []
};

export function getSequenceForOrigin(originId) {
	const sequences = {
		brasil: BRASIL_SEQUENCE,
		congo: CONGO_SEQUENCE,
		peru: PERU_SEQUENCE
	};
	return sequences[originId] || BRASIL_SEQUENCE;
}
