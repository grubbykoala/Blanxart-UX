// Origen Brasil: contenido, cámara y ruta.
// Los textos son provisionales (pendientes de validar con Blanxart), salvo los que
// vienen del envoltorio: nombre, región, porcentaje y notas de cata.

export default {
	id: 'brasil',
	papel: '#26344E',
	panel: '#1A2437',
	porcentaje: 76,
	diasDeMar: 18,

	// Cámara: [longitud, latitud, escala en px por radián]
	camara: {
		portada: [-50, -15, 760],
		origenA: [-40.6, -14.6, 1500],
		origenB: [-39.9, -14.5, 2200],
		origenC: [-39.35, -14.75, 2700],
		general: [-18.5, 18, 290],
		travesia: 640,
		llegada: 2400,
		final: [1.95, 41.25, 2650]
	},

	lugares: {
		finca: [-39.38, -14.72],
		rotulo: [-40.5, -13.45],
		puerto: [-39.03, -14.79],
		destino: [2.17, 41.36]
	},

	// Ruta marítima: Ilhéus → Atlántico → Estrecho de Gibraltar → Barcelona
	ruta: [
		[-39.03, -14.79], [-36.6, -13.4], [-32.5, -6.5], [-29.5, 0], [-28.4, 8], [-27.6, 15.5],
		[-23.6, 24.5], [-19.7, 29.6], [-14.5, 33.3], [-9.6, 35.3], [-7.2, 35.8], [-5.6, 35.95], [-3.4, 36.15],
		[-1.7, 36.45], [-0.15, 37.45], [0.75, 38.75], [1.35, 40.1], [2.17, 41.36]
	],

	// Hitos de la travesía, por latitud o longitud alcanzada
	hitos: [
		{ id: 'salida', hasta: (lon, lat) => lat < -12.5 },
		{ id: 'sur', hasta: (lon, lat) => lat < -2.5 },
		{ id: 'ecuador', hasta: (lon, lat) => lat < 5 },
		{ id: 'caboverde', hasta: (lon, lat) => lat < 21 },
		{ id: 'canarias', hasta: (lon, lat) => lat < 33 },
		{ id: 'gibraltar', hasta: (lon, lat) => lon < -4.2 },
		{ id: 'alboran', hasta: (lon, lat) => lat < 37.6 },
		{ id: 'baleares', hasta: (lon, lat) => lat < 40.75 },
		{ id: 'llegando', hasta: () => true }
	],

	fotos: {
		mazorcas: '/fotos/mazorcas.avif',
		granos: '/fotos/granos.avif',
		tableta: '/marca/tableta-brasil.png'
	},

	textos: {
		es: {
			portada: {
				sobre: 'El viaje de tu tableta',
				nombre: 'Brasil',
				region: 'Selva Tropical Atlántica',
				sub: 'Cacao ecológico',
				notas: 'Notas cítricas y afrutadas que se combinan con matices picantes, a nuez y tierra.',
				pista: 'Desliza para seguir su ruta'
			},
			capitulos: ['El origen', 'La travesía', 'El obrador'],
			rotulo: ['Selva', 'Tropical', 'Atlántica'],
			pasos: [
				null,
				{
					titulo: ['Selva Tropical', 'Atlántica'],
					cuerpo: 'Aquí, en el litoral de Bahía y a la sombra de la selva, crece el cacao de la tableta que tienes en la mano.',
					datos: [['Cacao', '76 %'], ['Cultivo', 'Ecológico'], ['Región', 'Bahía']]
				},
				{
					titulo: ['Recogido a mano,', 'secado al sol'],
					cuerpo: 'Las mazorcas se abren a machete. El grano fermenta seis días y se seca al sol antes de embarcar.',
					datos: [['Cosecha', 'A mano'], ['Fermento', '6 días'], ['Secado', 'Al sol']]
				},
				{
					titulo: ['Rumbo a', 'Barcelona'],
					cuerpo: 'Los sacos salen del puerto de Ilhéus y cruzan el Atlántico de sur a norte, hasta el Mediterráneo.',
					datos: [['Salida', 'Ilhéus'], ['Llegada', 'Barcelona'], ['Ruta', '{km} km']]
				},
				null,
				{
					titulo: ['Tostado a', 'llama directa'],
					cuerpo: 'El cacao seleccionado en origen se tuesta a llama directa y se convierte en esta receta única, con los mínimos ingredientes.',
					datos: [['Obrador', 'Sant Joan Despí'], ['Desde', '1954'], ['Oficio', 'Bean to bar']]
				},
				{
					titulo: ['Del grano', 'a tu tableta'],
					cuerpo: 'Molido fino, conchado largo y templado sin prisa. Tres ingredientes y nada más.',
					datos: [['Molido', '22 micras'], ['Conchado', 'Largo'], ['Peso', '75 g']]
				}
			],
			travesia: {
				recorridos: 'km recorridos',
				de: 'de {km} km',
				diaEtq: 'Día',
				dia: '{d} de {n}',
				hitos: {
					salida: 'Puerto de Ilhéus',
					sur: 'Atlántico Sur',
					ecuador: 'Cruzando el ecuador',
					caboverde: 'Frente a Cabo Verde',
					canarias: 'Islas Canarias a estribor',
					gibraltar: 'Estrecho de Gibraltar',
					alboran: 'Mar de Alborán',
					baleares: 'Islas Baleares a estribor',
					llegando: 'Puerto de Barcelona'
				}
			},
			final: {
				sobre: 'Fin del viaje',
				titulo: ['Ahora,', 'pruébala'],
				pasos: [
					['Parte', 'Una onza. Si el chasquido es limpio, está bien templada.'],
					['Funde', 'Déjala en la lengua sin morder. Dale medio minuto.'],
					['Busca', 'Primero cítricos y fruta. Al final, nuez, tierra y un punto picante.']
				],
				otros: 'Otros viajes',
				pronto: 'Pronto',
				tienda: 'Visitar blanxart.com',
				compartir: 'Compartir este viaje',
				copiado: 'Enlace copiado',
				volver: 'Volver al principio',
				pie: 'Chocolates con origen · Barcelona, 1954'
			}
		},

		ca: {
			portada: {
				sobre: 'El viatge de la teva rajola',
				nombre: 'Brasil',
				region: 'Selva Tropical Atlàntica',
				sub: 'Cacau ecològic',
				notas: 'Notes cítriques i afruitades que es combinen amb matisos picants, de nou i terra.',
				pista: 'Llisca per seguir la seva ruta'
			},
			capitulos: ["L'origen", 'La travessia', "L'obrador"],
			rotulo: ['Selva', 'Tropical', 'Atlàntica'],
			pasos: [
				null,
				{
					titulo: ['Selva Tropical', 'Atlàntica'],
					cuerpo: 'Aquí, al litoral de Bahia i a l’ombra de la selva, creix el cacau de la rajola que tens a la mà.',
					datos: [['Cacau', '76 %'], ['Cultiu', 'Ecològic'], ['Regió', 'Bahia']]
				},
				{
					titulo: ['Collit a mà,', 'assecat al sol'],
					cuerpo: 'Les cabosses s’obren a cop de matxet. El gra fermenta sis dies i s’asseca al sol abans d’embarcar.',
					datos: [['Collita', 'A mà'], ['Ferment', '6 dies'], ['Assecat', 'Al sol']]
				},
				{
					titulo: ['Rumb a', 'Barcelona'],
					cuerpo: 'Els sacs surten del port d’Ilhéus i travessen l’Atlàntic de sud a nord, fins al Mediterrani.',
					datos: [['Sortida', 'Ilhéus'], ['Arribada', 'Barcelona'], ['Ruta', '{km} km']]
				},
				null,
				{
					titulo: ['Torrat a', 'flama directa'],
					cuerpo: 'El cacau seleccionat en origen es torra a flama directa i es converteix en aquesta recepta única, amb els mínims ingredients.',
					datos: [['Obrador', 'Sant Joan Despí'], ['Des de', '1954'], ['Ofici', 'Bean to bar']]
				},
				{
					titulo: ['Del gra', 'a la teva rajola'],
					cuerpo: 'Mòlta fina, conxat llarg i temperat sense pressa. Tres ingredients i res més.',
					datos: [['Mòlta', '22 micres'], ['Conxat', 'Llarg'], ['Pes', '75 g']]
				}
			],
			travesia: {
				recorridos: 'km recorreguts',
				de: 'de {km} km',
				diaEtq: 'Dia',
				dia: '{d} de {n}',
				hitos: {
					salida: 'Port d’Ilhéus',
					sur: 'Atlàntic Sud',
					ecuador: 'Creuant l’equador',
					caboverde: 'Davant de Cap Verd',
					canarias: 'Illes Canàries a estribord',
					gibraltar: 'Estret de Gibraltar',
					alboran: 'Mar d’Alborán',
					baleares: 'Illes Balears a estribord',
					llegando: 'Port de Barcelona'
				}
			},
			final: {
				sobre: 'Fi del viatge',
				titulo: ['Ara,', 'tasta-la'],
				pasos: [
					['Trenca', 'Una presa. Si el cruixit és net, està ben temperada.'],
					['Fon', 'Deixa-la a la llengua sense mossegar. Dona-li mig minut.'],
					['Busca', 'Primer cítrics i fruita. Al final, nou, terra i un punt picant.']
				],
				otros: 'Altres viatges',
				pronto: 'Aviat',
				tienda: 'Visitar blanxart.com',
				compartir: 'Compartir aquest viatge',
				copiado: 'Enllaç copiat',
				volver: 'Tornar al principi',
				pie: 'Xocolates amb origen · Barcelona, 1954'
			}
		},

		en: {
			portada: {
				sobre: 'The journey of your bar',
				nombre: 'Brasil',
				region: 'Atlantic Rainforest',
				sub: 'Organic cocoa',
				notas: 'Citrus and fruity notes that blend with hints of spice, nuts and earth.',
				pista: 'Scroll to follow its route'
			},
			capitulos: ['The origin', 'The crossing', 'The workshop'],
			rotulo: ['Atlantic', 'Rain-', 'forest'],
			pasos: [
				null,
				{
					titulo: ['Atlantic', 'Rainforest'],
					cuerpo: 'Here, on the coast of Bahia and in the shade of the forest, grows the cocoa of the bar you are holding.',
					datos: [['Cocoa', '76 %'], ['Farming', 'Organic'], ['Region', 'Bahia']]
				},
				{
					titulo: ['Picked by hand,', 'dried in the sun'],
					cuerpo: 'The pods are opened with a machete. The beans ferment for six days and dry in the sun before sailing.',
					datos: [['Harvest', 'By hand'], ['Ferment', '6 days'], ['Drying', 'Sun']]
				},
				{
					titulo: ['Bound for', 'Barcelona'],
					cuerpo: 'The sacks leave the port of Ilhéus and cross the Atlantic from south to north, into the Mediterranean.',
					datos: [['From', 'Ilhéus'], ['To', 'Barcelona'], ['Route', '{km} km']]
				},
				null,
				{
					titulo: ['Roasted over', 'an open flame'],
					cuerpo: 'The cocoa selected at origin is roasted over an open flame and becomes this unique recipe, with the fewest ingredients.',
					datos: [['Workshop', 'Sant Joan Despí'], ['Since', '1954'], ['Craft', 'Bean to bar']]
				},
				{
					titulo: ['From bean', 'to your bar'],
					cuerpo: 'Finely ground, slowly conched and tempered without haste. Three ingredients and nothing else.',
					datos: [['Grind', '22 microns'], ['Conching', 'Long'], ['Weight', '75 g']]
				}
			],
			travesia: {
				recorridos: 'km travelled',
				de: 'of {km} km',
				diaEtq: 'Day',
				dia: '{d} of {n}',
				hitos: {
					salida: 'Port of Ilhéus',
					sur: 'South Atlantic',
					ecuador: 'Crossing the equator',
					caboverde: 'Off Cape Verde',
					canarias: 'Canary Islands to starboard',
					gibraltar: 'Strait of Gibraltar',
					alboran: 'Alboran Sea',
					baleares: 'Balearic Islands to starboard',
					llegando: 'Port of Barcelona'
				}
			},
			final: {
				sobre: 'Journey’s end',
				titulo: ['Now,', 'taste it'],
				pasos: [
					['Snap', 'One square. A clean snap means it is well tempered.'],
					['Melt', 'Let it rest on your tongue without biting. Give it half a minute.'],
					['Find', 'Citrus and fruit first. Then nuts, earth and a touch of spice.']
				],
				otros: 'Other journeys',
				pronto: 'Soon',
				tienda: 'Visit blanxart.com',
				compartir: 'Share this journey',
				copiado: 'Link copied',
				volver: 'Back to the start',
				pie: 'Chocolates with origin · Barcelona, 1954'
			}
		}
	},

	otros: [
		{ nombre: 'Congo', region: 'Mountains of the Moon', pct: 82, papel: '#5B373C', panel: '#40242A' },
		{ nombre: 'Perú', region: 'Alto Piura', pct: 100, papel: '#56443A', panel: '#3A2C25' }
	]
};
