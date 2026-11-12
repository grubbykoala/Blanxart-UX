# Blanxart Origins — experiencia QR

Experiencia móvil de scrollytelling para las tabletas Blanxart Origins. Cada QR del envoltorio abre el viaje del cacao desde su origen hasta el obrador de Barcelona.

## Desarrollo

```bash
npm install
cp .env.example .env   # y añade tu token público de Mapbox
npm run dev
```

`npm run build` genera el sitio estático en `build/`.

## Estructura

- `src/routes/+page.svelte` — página única (hoy solo Brasil)
- `src/lib/map/` — motor y estilo del mapa (Mapbox GL)
- `src/lib/scroll/` — coreografía de scroll (GSAP ScrollTrigger + Lenis)
- `src/lib/ui/` — componentes de interfaz
- `src/lib/data/origins.js` — datos de cada origen
