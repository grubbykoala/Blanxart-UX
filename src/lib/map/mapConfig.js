// ============================================
// Blanxart Origins — Estilo cartográfico
// Mapa antiguo reinterpretado: oscuro, sobrio,
// etiquetas serif, sin carreteras, sin POIs.
// ============================================

// Espejo de las variables --map-* y de la paleta de tokens.css.
// Mapbox GL no puede leer custom properties de CSS, así que este
// objeto es la única excepción permitida a "hex solo en tokens.css".
export const MAP_PALETTE = {
	land:      '#2C1A0E',  // --map-land · masa terrestre = fondo
	water:     '#0D0804',  // --map-water · océanos casi negro cacao
	border:    '#7A4F2D',  // --map-border · fronteras en tierra tostada
	label:     '#C8A97A',  // --map-label · etiquetas en kraft
	labelHalo: '#1A0F07',  // halo de legibilidad sobre tierra
	bosque:    '#2D4A2D',  // cobertura vegetal, apenas perceptible
	space:     '#0D0804',  // espacio alrededor del globo
	horizon:   '#3D2410',  // resplandor del horizonte en la vista global
};

// Tipografías servidas por Mapbox (DM Serif Display no está en su
// catálogo; PT Serif es la serif editorial más cercana disponible).
const FONT_SERIF        = ['PT Serif Regular', 'Arial Unicode MS Regular'];
const FONT_SERIF_ITALIC = ['PT Serif Italic', 'Arial Unicode MS Regular'];

export const MAP_STYLE_CONFIG = {
	version: 8,
	name: 'Blanxart Origins',
	glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
	projection: { name: 'globe' },
	sources: {
		'mapbox-streets': {
			type: 'vector',
			url: 'mapbox://mapbox.mapbox-streets-v8'
		}
	},
	layers: [
		// La masa terrestre es el fondo; el agua se dibuja encima.
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': MAP_PALETTE.land }
		},

		// Cobertura vegetal — el Amazonas debe leerse como selva,
		// pero como sombra de tinta, no como verde de mapa turístico.
		{
			id: 'landcover',
			type: 'fill',
			source: 'mapbox-streets',
			'source-layer': 'landcover',
			filter: ['match', ['get', 'class'], ['wood', 'scrub'], true, false],
			paint: {
				'fill-color': MAP_PALETTE.bosque,
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.12, 6, 0.22, 10, 0.3],
				'fill-antialias': false
			}
		},

		// Océanos y masas de agua
		{
			id: 'water',
			type: 'fill',
			source: 'mapbox-streets',
			'source-layer': 'water',
			paint: { 'fill-color': MAP_PALETTE.water }
		},

		// Ríos — visibles solo en la escala local, en kraft tenue
		{
			id: 'waterway',
			type: 'line',
			source: 'mapbox-streets',
			'source-layer': 'waterway',
			minzoom: 5,
			paint: {
				'line-color': MAP_PALETTE.water,
				'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5, 16, 3],
				'line-opacity': 0.9
			}
		},

		// Fronteras nacionales — trazo discontinuo de mapa antiguo
		{
			id: 'admin-0',
			type: 'line',
			source: 'mapbox-streets',
			'source-layer': 'admin',
			filter: ['all',
				['==', ['get', 'admin_level'], 0],
				['==', ['get', 'maritime'], 'false']
			],
			paint: {
				'line-color': MAP_PALETTE.border,
				'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 8, 1],
				'line-opacity': 0.4,
				'line-dasharray': [3, 2]
			}
		},

		// Límites internos — solo aparecen al acercarse (escala local)
		{
			id: 'admin-1',
			type: 'line',
			source: 'mapbox-streets',
			'source-layer': 'admin',
			filter: ['all',
				['==', ['get', 'admin_level'], 1],
				['==', ['get', 'maritime'], 'false']
			],
			minzoom: 6,
			paint: {
				'line-color': MAP_PALETTE.border,
				'line-width': 0.5,
				'line-opacity': 0.18,
				'line-dasharray': [2, 3]
			}
		},

		// Nombres de océanos — serif itálica, tracking amplio,
		// en kraft apagado. Jamás azul.
		{
			id: 'ocean-labels',
			type: 'symbol',
			source: 'mapbox-streets',
			'source-layer': 'natural_label',
			filter: ['match', ['get', 'class'], ['ocean', 'sea'], true, false],
			layout: {
				'text-field': ['coalesce', ['get', 'name_es'], ['get', 'name']],
				'text-font': FONT_SERIF_ITALIC,
				'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 6, 14],
				'text-letter-spacing': 0.3,
				'text-transform': 'uppercase',
				'text-max-width': 6,
				'text-line-height': 1.6
			},
			paint: {
				'text-color': MAP_PALETTE.label,
				'text-opacity': 0.38
			}
		},

		// Ríos principales con nombre — escala local
		{
			id: 'river-labels',
			type: 'symbol',
			source: 'mapbox-streets',
			'source-layer': 'natural_label',
			filter: ['==', ['get', 'class'], 'river'],
			minzoom: 6,
			layout: {
				'text-field': ['coalesce', ['get', 'name_es'], ['get', 'name']],
				'text-font': FONT_SERIF_ITALIC,
				'text-size': 11,
				'text-letter-spacing': 0.15,
				'symbol-placement': 'line'
			},
			paint: {
				'text-color': MAP_PALETTE.label,
				'text-opacity': 0.45,
				'text-halo-color': MAP_PALETTE.labelHalo,
				'text-halo-width': 1
			}
		},

		// Ciudades — solo las que pertenecen a la historia.
		// Nada de POIs, nada de pueblos genéricos.
		{
			id: 'city-labels',
			type: 'symbol',
			source: 'mapbox-streets',
			'source-layer': 'place_label',
			filter: ['all',
				['in', ['get', 'name'],
					['literal', ['Manaus', 'Belém', 'Barcelona', 'Sant Joan Despí']]
				],
				// Solo Brasil y España: sin esto aparece la
				// Barcelona de Venezuela sobre el Caribe
				['match', ['get', 'iso_3166_1'], ['BR', 'ES'], true, false]
			],
			layout: {
				'text-field': ['coalesce', ['get', 'name_es'], ['get', 'name']],
				'text-font': FONT_SERIF,
				'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 9, 14, 15, 12],
				'text-transform': 'uppercase',
				'text-letter-spacing': 0.18,
				'text-max-width': 8,
				'text-offset': [0, 0.6],
				'text-anchor': 'top'
			},
			paint: {
				'text-color': MAP_PALETTE.label,
				'text-halo-color': MAP_PALETTE.labelHalo,
				'text-halo-width': 1.2,
				'text-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.85, 16, 0]
			}
		},

		// Países — serif versal con aire, presencia de atlas
		{
			id: 'country-labels',
			type: 'symbol',
			source: 'mapbox-streets',
			'source-layer': 'place_label',
			filter: ['all',
				['==', ['get', 'class'], 'country'],
				['<=', ['get', 'symbolrank'], 3]
			],
			maxzoom: 9,
			layout: {
				'text-field': ['coalesce', ['get', 'name_es'], ['get', 'name']],
				'text-font': FONT_SERIF,
				'text-size': ['interpolate', ['linear'], ['zoom'], 1, 11, 5, 15],
				'text-transform': 'uppercase',
				'text-letter-spacing': 0.22,
				'text-max-width': 6,
				'text-line-height': 1.5
			},
			paint: {
				'text-color': MAP_PALETTE.label,
				'text-halo-color': MAP_PALETTE.labelHalo,
				'text-halo-width': 1,
				'text-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.55, 4, 0.7, 8, 0.3]
			}
		}
	]
};

// Atmósfera del globo en la escala planetaria — se aplica
// en MapEngine tras la carga. Tonos cacao, sin estrellas.
export const FOG_CONFIG = {
	'color': MAP_PALETTE.horizon,
	'high-color': MAP_PALETTE.land,
	'space-color': MAP_PALETTE.space,
	'horizon-blend': 0.04,
	'star-intensity': 0
};

// ============================================
// COLOR GRADING POR CAPÍTULO — el mapa cambia
// de piel según el momento de la historia.
// MapEngine.setGrade() interpola entre estos looks.
// ============================================
export const MAP_GRADES = {
	// Vista planetaria neutra — la piel base del atlas
	base: {
		land: '#2C1A0E',
		water: '#0D0804',
		landcover: '#2D4A2D',
		landcoverOpacity: 0.22,
		fogColor: '#3D2410',
		fogHigh: '#2C1A0E',
		horizonBlend: 0.04
	},
	// La selva: verde húmedo, aire denso
	selva: {
		land: '#272310',
		water: '#0A0D06',
		landcover: '#3E5C38',
		landcoverOpacity: 0.4,
		fogColor: '#2E3A20',
		fogHigh: '#232D18',
		horizonBlend: 0.07
	},
	// El Atlántico: salitre pálido, calima en el horizonte
	atlantico: {
		land: '#241809',
		water: '#131009',
		landcover: '#2D4A2D',
		landcoverOpacity: 0.1,
		fogColor: '#4A3B26',
		fogHigh: '#2C1F10',
		horizonBlend: 0.11
	},
	// Barcelona: oro cálido de llegada
	barcelona: {
		land: '#33210D',
		water: '#0D0804',
		landcover: '#4A3E1E',
		landcoverOpacity: 0.26,
		fogColor: '#4A2E14',
		fogHigh: '#33210D',
		horizonBlend: 0.05
	}
};

// Relieve — mapbox-terrain-dem para que el Amazonas ondule
// y el litoral catalán se levante al llegar.
export const TERRAIN_CONFIG = {
	source: 'mapbox-dem',
	url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
	tileSize: 512,
	maxzoom: 14,
	exaggeration: 1.4
};

// Marcadores — semántica de color de la paleta
export const MARKER_STYLES = {
	default: { color: 'var(--color-kraft)' },
	active:  { color: 'var(--color-pin-activo)' },
	fabrica: { color: 'var(--color-oro-viejo)' }
};

// Cámara
export const CAMERA_CONFIG = {
	defaultDuration: 2000,
	essential: true   // flyTo siempre con essential: true
};

// Límites del mapa
export const MAP_BOUNDS = {
	maxZoom: 18,
	minZoom: 1
};
