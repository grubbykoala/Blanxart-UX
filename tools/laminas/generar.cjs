// Genera las láminas del mapa grabado (estilo envoltorio Origins) en proyección Mercator.
// Todas comparten el mismo espacio de coordenadas, así la cámara pasa de una a otra sin saltos.
//   node tools/laminas/generar.cjs   → static/mapa/*.webp + src/lib/mapa/laminas.json
const fs = require('fs');
const path = require('path');
const d3 = require('d3-geo');
const topojson = require('topojson-client');

const ROOT = path.join(__dirname, '..', '..');
const load = (n) => require(`sane-topojson/dist/${n}.json`);
const WORLD = load('world_50m');
const SA = load('south-america_50m');

const rad = (d) => (d * Math.PI) / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));

const cream = '#E3C59B';
const copper = '#C9764F';
const dark = '#2A1E16';

function compass(cx, cy, r, ink) {
  let s = `<g transform="translate(${cx},${cy})" fill="none" stroke="${ink}" stroke-width="0.6">`;
  s += `<circle r="${r}"/><circle r="${r * 0.86}" stroke-dasharray="1 2.2"/><circle r="${r * 0.3}"/>`;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const len = i % 4 === 0 ? r * 1.25 : i % 2 === 0 ? r * 0.82 : r * 0.55;
    const w = i % 4 === 0 ? 0.13 : 0.1;
    const tip = [Math.sin(a) * len, -Math.cos(a) * len];
    const l = [Math.sin(a - w * 3) * r * 0.3, -Math.cos(a - w * 3) * r * 0.3];
    const rr = [Math.sin(a + w * 3) * r * 0.3, -Math.cos(a + w * 3) * r * 0.3];
    s += `<path d="M${l}L${tip}L${rr}"/>`;
    s += `<path d="M0,0L${tip}L${rr}Z" fill="${ink}" fill-opacity="${i % 2 === 0 ? 0.55 : 0.3}" stroke="none"/>`;
  }
  s += `<text y="${-r * 1.38}" text-anchor="middle" font-family="IM Fell English" font-size="${r * 0.42}" fill="${ink}" stroke="none">N</text></g>`;
  return s;
}

/**
 * o: { id, ink, accent, west, east, south, north, d (unidades por radián), gratStep, shoreW, shoreBlur,
 *      landStipple, sub (malla de estados), feather, rose:[lon,lat,r], extra(), labels() }
 */
function plate(o) {
  const ink = o.ink;
  const W = Math.round((rad(o.east) - rad(o.west)) * o.d);
  const H = Math.round((merc(o.north) - merc(o.south)) * o.d);
  const proj = d3.geoMercator().scale(o.d).translate([-o.d * rad(o.west), o.d * merc(o.north)])
    .clipExtent([[-60, -60], [W + 60, H + 60]]);
  const gp = d3.geoPath(proj);
  const f = (k) => topojson.feature(WORLD, WORLD.objects[k]);
  const land = gp(f('land'));
  const countryMesh = topojson.mesh(WORLD, WORLD.objects.countries, (a, b) => a !== b);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<defs>
    <pattern id="hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 1.6H3.2" stroke="${ink}" stroke-width="0.45"/></pattern>
    <pattern id="stipple" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.42" fill="${ink}"/><circle cx="3.5" cy="3.4" r="0.42" fill="${ink}"/></pattern>
    <pattern id="copperHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><path d="M0 2H4" stroke="${o.accent}" stroke-width="1.1"/></pattern>
    <filter id="blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${o.shoreBlur || 7}"/></filter>
    <filter id="featherBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(o.feather || 0) * 0.45}"/></filter>
    <mask id="sea"><rect width="${W}" height="${H}" fill="#fff"/><path d="${land}" fill="#000"/></mask>
    <mask id="shore"><rect width="${W}" height="${H}" fill="#000"/><path d="${land}" fill="none" stroke="#fff" stroke-width="${o.shoreW || 26}" stroke-linejoin="round" filter="url(#blur)"/><path d="${land}" fill="#000"/></mask>
    <mask id="feather"><rect x="${o.feather || 0}" y="${o.feather || 0}" width="${W - 2 * (o.feather || 0)}" height="${H - 2 * (o.feather || 0)}" fill="#fff" filter="url(#featherBlur)"/></mask>`;
  [5, 10, 16].forEach((w, i) => {
    s += `<mask id="wl${i}"><rect width="${W}" height="${H}" fill="#000"/><path d="${land}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linejoin="round"/><path d="${land}" fill="#000" stroke="#000" stroke-width="${w - 1.1}" stroke-linejoin="round"/></mask>`;
  });
  s += `</defs><g ${o.feather ? 'mask="url(#feather)"' : ''}>`;

  // retícula
  const grat = d3.geoGraticule().step(o.gratStep || [10, 10]).extent([[o.west - 20, o.south - 10], [o.east + 20, o.north + 10]]);
  s += `<path d="${gp(grat())}" fill="none" stroke="${ink}" stroke-width="0.35" opacity="0.5"/>`;

  // rumbos: haz de líneas desde la rosa, solo sobre el mar
  if (o.rose) {
    const c = proj([o.rose[0], o.rose[1]]);
    let lines = '';
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      const L = 3 * Math.max(W, H);
      lines += `<path d="M${c[0].toFixed(1)},${c[1].toFixed(1)}l${(Math.sin(a) * L).toFixed(1)},${(-Math.cos(a) * L).toFixed(1)}" stroke-width="${i % 4 === 0 ? 0.45 : 0.28}" ${i % 2 ? 'stroke-dasharray="6 3"' : ''}/>`;
    }
    s += `<g fill="none" stroke="${ink}" opacity="0.42" mask="url(#sea)">${lines}</g>`;
  }

  // tierra, rayado de costa y líneas de agua
  s += `<path d="${land}" fill="url(#stipple)" opacity="${o.landStipple ?? 0.16}"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#hatch)" mask="url(#shore)" opacity="0.75"/>`;
  [0.55, 0.38, 0.22].forEach((op, i) => { s += `<rect width="${W}" height="${H}" fill="${ink}" mask="url(#wl${i})" opacity="${op}"/>`; });

  // ríos y lagos
  s += `<path d="${gp(f('rivers'))}" fill="none" stroke="${ink}" stroke-width="0.7" opacity="0.8" stroke-linecap="round"/>`;
  s += `<path d="${gp(f('lakes'))}" fill="url(#hatch)" stroke="${ink}" stroke-width="0.5" opacity="0.8"/>`;

  // límites
  if (o.sub) {
    const subMesh = topojson.mesh(SA, SA.objects.subunits, (a, b) => a !== b);
    s += `<path d="${gp(subMesh)}" fill="none" stroke="${ink}" stroke-width="0.55" stroke-dasharray="0.6 2.4" stroke-linecap="round" opacity="0.8"/>`;
  }
  s += `<path d="${gp(countryMesh)}" fill="none" stroke="${ink}" stroke-width="0.8" stroke-dasharray="5 2 1 2" opacity="0.85"/>`;

  // costa
  s += `<path d="${land}" fill="none" stroke="${ink}" stroke-width="1.15" stroke-linejoin="round"/>`;

  if (o.extra) s += o.extra(proj, gp, W, H);

  const T = (lon, lat, txt, st = {}) => {
    const p = proj([lon, lat]);
    const size = st.size || 9;
    const ls = st.ls ?? 0.5;
    return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="${st.anchor || 'middle'}" font-family="IM Fell English" font-size="${size}" ${st.italic ? 'font-style="italic"' : ''} letter-spacing="${ls}" fill="${st.fill || ink}" opacity="${st.op ?? 0.95}" ${st.rot ? `transform="rotate(${st.rot} ${p[0].toFixed(1)} ${p[1].toFixed(1)})"` : ''}>${txt}</text>`;
  };
  const City = (lon, lat, txt, st = {}) => {
    const p = proj([lon, lat]);
    return `<circle cx="${p[0]}" cy="${p[1]}" r="1.7" fill="none" stroke="${ink}" stroke-width="0.8"/><circle cx="${p[0]}" cy="${p[1]}" r="0.5" fill="${ink}"/>` +
      `<text x="${p[0] + (st.dx ?? 5)}" y="${p[1] + (st.dy ?? 3)}" text-anchor="${st.anchor || 'start'}" font-family="IM Fell English" font-style="italic" font-size="${st.size || 8.5}" fill="${ink}">${txt}</text>`;
  };
  // paralelo con nombre (Ecuador, trópicos)
  const Par = (lat, txt, lonLabel) => {
    const a = proj([o.west - 5, lat]);
    const b = proj([o.east + 5, lat]);
    const p = proj([lonLabel, lat]);
    return `<path d="M${a[0]},${a[1]}H${b[0]}" stroke="${ink}" stroke-width="0.7" stroke-dasharray="9 3 2 3" opacity="0.8" fill="none"/>` +
      `<text x="${p[0]}" y="${p[1] - 4}" text-anchor="middle" font-family="IM Fell English" font-style="italic" font-size="9" letter-spacing="3" fill="${ink}" opacity="0.9">${txt}</text>`;
  };
  if (o.labels) s += o.labels(T, City, Par, proj);
  if (o.rose) {
    const c = proj([o.rose[0], o.rose[1]]);
    s += compass(c[0], c[1], o.rose[2], ink);
  }
  s += `</g></svg>`;

  return {
    svg: s,
    meta: { id: o.id, x0: rad(o.west), y0: -merc(o.north), d: o.d, w: W, h: H },
  };
}

const mata = { type: 'Polygon', coordinates: [[[-38.2, -12.4], [-38.9, -12.9], [-38.95, -13.9], [-38.95, -15.0], [-38.85, -16.2], [-39.1, -17.3], [-39.6, -18.3], [-40.3, -18.25], [-40.25, -17.2], [-39.95, -16.1], [-40.0, -14.9], [-39.9, -13.6], [-39.5, -12.6], [-38.8, -12.1], [-38.2, -12.4]]] };

const plates = [
  // A — Atlántico: de Brasil a Europa. Portada (tono sobre tono) y travesía.
  plate({
    id: 'atlantico', ink: cream, accent: copper, sub: true,
    west: -84, east: 38, south: -46, north: 56, d: 560,
    gratStep: [10, 10], rose: [-14, -19, 30],
    extra: (proj, gp) => {
      const m = gp(mata);
      return `<path d="${m}" fill="${copper}" opacity="0.9"/>`;
    },
    labels: (T, City, Par) =>
      Par(0, 'Ecuador', -21) + Par(23.44, 'Trópico de Cáncer', -42) + Par(-23.44, 'Trópico de Capricornio', -22) +
      T(-52.5, -10.2, 'B R A S I L', { size: 25, ls: 5, op: 0.92 }) +
      T(-63, -5.4, 'Amazonas', { italic: 1, size: 11, ls: 2 }) + T(-52.5, -4.6, 'Pará', { italic: 1, size: 11, ls: 2 }) +
      T(-56, -14.2, 'Mato Grosso', { italic: 1, size: 10, ls: 1.5 }) + T(-49.4, -16.4, 'Goyaz', { italic: 1, size: 10, ls: 1.5 }) +
      T(-42, -12.2, 'Bahia', { italic: 1, size: 11, ls: 2 }) + T(-44.6, -18.9, 'Minas Geraes', { italic: 1, size: 9, ls: 1 }) +
      T(-45, -5.6, 'Maranhão', { italic: 1, size: 8.5, ls: 1 }) + T(-51.6, -25, 'Paraná', { italic: 1, size: 9, ls: 1.5 }) +
      T(-53.6, -30, 'Rio Grande', { italic: 1, size: 8.5, ls: 1 }) +
      T(-63.5, -17.5, 'BOLIVIA', { size: 8.5, ls: 3 }) +
      T(-75.2, -9.5, 'PERÚ', { size: 8.5, ls: 3 }) + T(-73.5, 3.6, 'COLOMBIA', { size: 8, ls: 2.5 }) + T(-70.6, -33, 'CHILE', { size: 8, ls: 3, rot: -86 }) +
      T(12.6, 42.9, 'ITALIA', { size: 7.5, ls: 2, rot: 48 }) + T(17.5, 27.2, 'Libia', { italic: 1, size: 10, ls: 2 }) + T(30, 26.2, 'Egipto', { italic: 1, size: 10, ls: 2 }) +
      T(27, 2.5, 'Uele', { italic: 1, size: 8, ls: 1 }) + T(24, 12.8, 'Sudán', { italic: 1, size: 10, ls: 2 }) + T(-80.5, -22, 'OCÉANO PACÍFICO', { italic: 1, size: 10, ls: 6, rot: -90 }) + T(-63, 7, 'VENEZUELA', { size: 8, ls: 2.5 }) + T(-63.5, -35, 'ARGENTINA', { size: 9, ls: 3 }) +
      T(-30.5, -30.5, 'OCÉANO', { italic: 1, size: 15, ls: 9 }) + T(-30, -33.2, 'ATLÁNTICO SUR', { italic: 1, size: 12, ls: 7 }) +
      T(-42, 34.5, 'OCÉANO', { italic: 1, size: 15, ls: 9 }) + T(-41.5, 32, 'ATLÁNTICO NORTE', { italic: 1, size: 12, ls: 7 }) +
      T(4, 21, 'Á F R I C A', { size: 22, ls: 5, op: 0.92 }) + T(-6, 26.3, 'Sáhara', { italic: 1, size: 11, ls: 3 }) +
      T(-10.5, 10.6, 'Guinea', { italic: 1, size: 9, ls: 1.5 }) + T(-6.5, 31.6, 'Marruecos', { italic: 1, size: 9, ls: 1.5 }) +
      T(4, 5.6, 'Golfo de Guinea', { italic: 1, size: 9, ls: 2 }) + T(15, -8, 'Congo', { italic: 1, size: 10, ls: 2 }) +
      T(-3.8, 40.3, 'ESPAÑA', { size: 10, ls: 3.5 }) + T(2.5, 47.2, 'FRANCIA', { size: 9, ls: 3 }) + T(9, 51.5, 'ALEMANIA', { size: 7.5, ls: 2 }) +
      T(-23.7, 13.6, 'Islas de Cabo Verde', { italic: 1, size: 8, ls: 0.8 }) + T(-18.2, 30.6, 'Islas Canarias', { italic: 1, size: 8, ls: 0.8, anchor: 'end' }) +
      T(-17.6, 33.9, 'Madeira', { italic: 1, size: 7.5, ls: 0.8, anchor: 'end' }) + T(-28, 40.4, 'Azores', { italic: 1, size: 8, ls: 0.8 }) +
      T(7, 39.2, 'Mediterráneo', { italic: 1, size: 8, ls: 2 }) +
      City(-38.5, -12.97, 'S. Salvador') + City(-43.2, -22.9, 'Rio de Janeiro') + City(-60.02, -3.1, 'Manáos', { dx: -5, anchor: 'end' }) +
      City(-48.5, -1.45, 'Belém', { dy: -4 }) + City(-34.9, -8.05, 'Pernambuco') + City(-9.14, 38.72, 'Lisboa', { dx: -5, anchor: 'end' }) +
      City(-17.45, 14.7, 'Dakar', { dx: 6 }) + City(2.17, 41.38, 'Barcelona', { dx: 6, dy: 6 }) + City(-5.6, 36.0, 'Gibraltar', { dx: -4, dy: 11, anchor: 'end' }),
  }),

  // B — Bahía: el origen, con la franja de selva atlántica en cobre.
  plate({
    id: 'bahia', ink: cream, accent: copper, sub: true,
    west: -50, east: -30, south: -26, north: -3, d: 2000,
    gratStep: [2, 2], shoreW: 44, shoreBlur: 12, landStipple: 0.2, feather: 46,
    extra: (proj, gp) => {
      const m = gp(mata);
      return `<path d="${m}" fill="url(#copperHatch)" opacity="0.95"/><path d="${m}" fill="none" stroke="${copper}" stroke-width="1.3" stroke-linejoin="round"/>`;
    },
    labels: (T, City) =>
      T(-42.6, -11.7, 'B A H I A', { size: 22, ls: 5 }) +
      T(-44.6, -17.8, 'Minas Geraes', { italic: 1, size: 15, ls: 2 }) + T(-40.9, -19.75, 'Espírito Santo', { italic: 1, size: 10.5, ls: 1 }) +
      T(-37.3, -10.45, 'Sergipe', { italic: 1, size: 10, ls: 1 }) + T(-47.6, -13.2, 'Goyaz', { italic: 1, size: 14, ls: 2 }) +
      T(-42.5, -7.4, 'Piauhy', { italic: 1, size: 13, ls: 2 }) + T(-37.5, -7.9, 'Pernambuco', { italic: 1, size: 11, ls: 1.5 }) +
      T(-45.5, -22.4, 'São Paulo', { italic: 1, size: 12, ls: 2 }) +
      T(-35.6, -15.2, 'OCÉANO', { italic: 1, size: 14, ls: 8 }) + T(-35.6, -16.0, 'ATLÁNTICO', { italic: 1, size: 14, ls: 8 }) +
      T(-43.15, -12.9, 'Río São Francisco', { italic: 1, size: 8.5, ls: 0.6, rot: -58 }) +
      City(-38.5, -12.97, 'S. Salvador', { dy: -5 }) + City(-39.05, -14.79, 'Ilhéus', { dx: 7, dy: 3 }) + City(-39.06, -16.45, 'Porto Seguro') +
      City(-40.3, -20.3, 'Victoria') + City(-43.2, -22.9, 'Rio de Janeiro', { dx: -5, anchor: 'end' }) + City(-34.9, -8.05, 'Recife', { dy: -4 }) +
      City(-37.07, -10.9, 'Aracajú', { dx: 6 }),
  }),

  // C — Mediterráneo occidental en tinta oscura, para el papel kraft de la llegada.
  plate({
    id: 'mediterraneo', ink: dark, accent: copper,
    west: -16, east: 12, south: 26, north: 49, d: 2000,
    gratStep: [2, 2], shoreW: 40, shoreBlur: 11, landStipple: 0.22, feather: 46,
    labels: (T, City) =>
      T(-3.4, 40.1, 'E S P A Ñ A', { size: 22, ls: 6 }) + T(2.2, 45.6, 'F R A N C I A', { size: 20, ls: 6 }) +
      T(-8.1, 39.6, 'PORTUGAL', { size: 10, ls: 3, rot: -78 }) + T(-6, 32.6, 'MARRUECOS', { size: 14, ls: 4 }) + T(3, 34.6, 'ARGELIA', { size: 14, ls: 4 }) +
      T(4.6, 38.25, 'MAR', { italic: 1, size: 15, ls: 9 }) + T(4.8, 37.55, 'MEDITERRÁNEO', { italic: 1, size: 15, ls: 7 }) +
      T(-11.6, 36.4, 'OCÉANO', { italic: 1, size: 13, ls: 7 }) + T(-11.6, 35.7, 'ATLÁNTICO', { italic: 1, size: 13, ls: 7 }) +
      T(2.95, 39.98, 'Islas Baleares', { italic: 1, size: 9.5, ls: 1 }) + T(-5.5, 35.55, 'Estrecho de Gibraltar', { italic: 1, size: 8, ls: 0.6 }) +
      T(-2.2, 35.75, 'Mar de Alborán', { italic: 1, size: 8.5, ls: 1 }) + T(4.3, 42.6, 'Golfo de León', { italic: 1, size: 9, ls: 1 }) +
      T(0.3, 42.72, 'Pirineos', { italic: 1, size: 9.5, ls: 3 }) + T(9.1, 40.1, 'Cerdeña', { italic: 1, size: 9, ls: 1, rot: -82 }) +
      City(-0.38, 39.47, 'Valencia', { dx: -5, anchor: 'end' }) + City(1.25, 41.12, 'Tarragona', { dx: -5, anchor: 'end' }) +
      City(-3.7, 40.42, 'Madrid', { dy: -5 }) + City(-9.14, 38.72, 'Lisboa', { dx: -5, anchor: 'end' }) + City(-5.98, 37.39, 'Sevilla', { dx: -5, anchor: 'end' }) +
      City(-4.42, 36.72, 'Málaga', { dy: -5 }) + City(5.37, 43.3, 'Marsella', { dy: -5 }) + City(-0.99, 37.6, 'Cartagena', { dx: -5, anchor: 'end' }) +
      City(3.06, 36.75, 'Argel', { dy: 11 }) + City(-0.88, 41.65, 'Zaragoza', { dx: -5, anchor: 'end' }),
  }),
];

(async () => {
  const { chromium } = require('playwright');
  const b64 = (p) => fs.readFileSync(require.resolve(p)).toString('base64');
  const ff = (file, style) => `@font-face{font-family:'IM Fell English';font-style:${style};font-weight:400;src:url(data:font/woff2;base64,${b64(file)}) format('woff2');}`;
  const fonts = ff('@fontsource/im-fell-english/files/im-fell-english-latin-400-normal.woff2', 'normal') +
    ff('@fontsource/im-fell-english/files/im-fell-english-latin-400-italic.woff2', 'italic');
  const outDir = path.join(ROOT, 'static', 'mapa');
  const tmpDir = path.join(__dirname, '.tmp');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const browser = await chromium.launch();
  const meta = {};
  for (const p of plates) {
    const page = await browser.newPage({ viewport: { width: p.meta.w, height: p.meta.h }, deviceScaleFactor: 2 });
    await page.setContent(`<style>${fonts} html,body{margin:0;background:transparent}svg{display:block}</style>${p.svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(tmpDir, `${p.meta.id}.png`), omitBackground: true });
    await page.close();
    meta[p.meta.id] = p.meta;
    console.log(p.meta.id, `${p.meta.w}×${p.meta.h}`, `${(p.svg.length / 1024).toFixed(0)} KB svg`);
  }
  await browser.close();
  fs.mkdirSync(path.join(ROOT, 'src', 'lib', 'mapa'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src', 'lib', 'mapa', 'laminas.json'), JSON.stringify(meta, null, 2) + '\n');
})();
