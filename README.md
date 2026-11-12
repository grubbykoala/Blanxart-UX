# Blanxart Origins · el viaje de tu tableta

Experiencia web para móvil que se abre al escanear el QR de una tableta Blanxart Origins.
Cuenta, con scroll, el viaje del cacao desde su origen hasta el obrador de Barcelona.

Proyecto por iniciativa propia, no oficial. Los textos son provisionales salvo los que vienen del envoltorio.

## Cómo funciona

- **Dirección de arte: "el envoltorio desplegado".** La pantalla es el papel de la tableta abierto: papel del color del origen, mapa antiguo grabado, tinta crema y acento cobre. Al llegar a Barcelona el papel cambia a kraft.
- **Mapa propio.** No usa Mapbox ni ningún servicio externo. Las láminas se dibujan con datos abiertos (Natural Earth) en proyección Mercator y se guardan como imágenes. Todas comparten coordenadas, así la cámara pasa de una a otra sin saltos.
- **Scroll.** GSAP ScrollTrigger mueve un reloj de 0 a 7,8 "pantallas". La cámara, la ruta y la portada van atadas al dedo; los textos se disparan al cruzar su umbral, así nunca se quedan a medio aparecer.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/lib/datos/brasil.js` | Contenido (ES, CA, EN), cámara, ruta y hitos del origen Brasil |
| `src/lib/viaje/Viaje.svelte` | El escenario: portada, mapa, panel, travesía |
| `src/lib/viaje/Final.svelte` | Final: cata, otros orígenes, compartir |
| `src/lib/mapa/geo.js` | Proyección, ruta suavizada y kilómetros |
| `tools/laminas/generar.cjs` | Genera las láminas del mapa en `static/mapa/` |

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # sitio estático en build/
```

Para regenerar las láminas del mapa hace falta Playwright con Chromium y Pillow:

```bash
node tools/laminas/generar.cjs
```

y después convertir los PNG de `tools/laminas/.tmp/` a WebP en `static/mapa/`.

## Publicación

`.github/workflows/pages.yml` publica `main` en GitHub Pages. Hay que activarlo una vez en
Settings → Pages → Source: GitHub Actions.
