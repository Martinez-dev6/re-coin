// Copia de design/tema.js (fuente de verdad de los colores). Si cambia allá, copiarlo aquí.
// Uso: const t = tema('#203fe3', 'light')  ->  objeto con todos los colores.
// Cambio propio (2026-10-04), no está en design/tema.js: "blackish" pide además poca saturación.
// Con los colores nuevos del dueño, el vinotinto #5c031a es tan oscuro como el negro (luminancia
// 0,024) y en modo oscuro su banner pasaba a gris grafito como si fuera el negro.
// En la app real conviene volcar estos valores a variables CSS (--page-bg, --surface, ...).
// Tokens extra que solo usa Inicio:
//   expenseOnWhite: isRed ? '#a3195b' : '#c62828',
//   badgeRedBg: dark ? (isRed ? '#f472b6' : '#ff7a70') : (isRed ? '#a3195b' : '#c62828'),
//   badgeRedText: dark ? '#1a0f0f' : '#ffffff',
//   badgeGreenBg: dark ? '#5fd39a' : '#0b7a43',
//   badgeGreenText: dark ? '#0e1a13' : '#ffffff',
export function tema(accent = '#203fe3', mode = 'light') {
const dark = mode === 'dark';
const a = accent;
const h = a.replace('#', '');
const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
const lin = (v) => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const rgba = (c, al) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + al + ')';
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const fromHex = (s) => { const m = parseInt(s.slice(1), 16); return [(m >> 16) & 255, (m >> 8) & 255, m & 255]; };
const mx = Math.max(rgb[0], rgb[1], rgb[2]), mn = Math.min(rgb[0], rgb[1], rgb[2]);
let hue = 0;
if (mx !== mn) { const d = mx - mn; hue = mx === rgb[0] ? ((rgb[1] - rgb[2]) / d + 6) % 6 : mx === rgb[1] ? (rgb[2] - rgb[0]) / d + 2 : (rgb[0] - rgb[1]) / d + 4; hue *= 60; }
const isRed = mx !== mn && (mx - mn) / mx > 0.4 && (hue >= 350 || hue <= 10);
const blackish = lum(rgb) < 0.03 && (mx === 0 || (mx - mn) / mx < 0.5);
let banner = rgb;
if (dark && blackish) banner = [43, 45, 55];
const bl = lum(banner);
const lightText = (bl + 0.05) / 0.055 <= 1.05 / (bl + 0.05);
let at = rgb;
if (dark) {
if (blackish) {
at = [244, 244, 247];
} else {
let t = 0;
while ((lum(at) + 0.05) / 0.0589 < 4.5 && t < 1) {
t += 0.05;
at = [rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t];
}
}
}
const hsl2rgb = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, hp = (((h % 360) + 360) % 360) / 60, x = c * (1 - Math.abs((hp % 2) - 1)), m = l - c / 2; const t = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x]; return t.map((v) => (v + m) * 255); };
const bn = banner.map((v) => v / 255), bmx = Math.max(bn[0], bn[1], bn[2]), bmn = Math.min(bn[0], bn[1], bn[2]), bdl = bmx - bmn, bl2 = (bmx + bmn) / 2;
const bs = bdl === 0 ? 0 : bdl / (1 - Math.abs(2 * bl2 - 1));
let bh = 0; if (bdl !== 0) { bh = bmx === bn[0] ? (((bn[1] - bn[2]) / bdl) + 6) % 6 : bmx === bn[1] ? (bn[2] - bn[0]) / bdl + 2 : (bn[0] - bn[1]) / bdl + 4; bh *= 60; }
const ts = bs < 0.15 ? bs : Math.max(bs, 0.9);
let tl = 0.7, tr = hsl2rgb(bh - 12, ts, tl);
while (1.05 / (lum(tr) + 0.05) < 4.5 && tl > 0.2) { tl -= 0.02; tr = hsl2rgb(bh - 12, ts, tl); }
const cats = dark ? ['#fb923c', '#22d3ee', '#a78bfa', '#fbbf24'] : ['#c2410c', '#0e7490', '#6d28d9', '#b45309'];
return {
pageBg: dark ? '#0e0e13' : '#f3f4f8',
pageBg0: dark ? 'rgba(14,14,19,0)' : 'rgba(243,244,248,0)',
surface: dark ? '#17171e' : '#ffffff',
line: dark ? '#24242d' : '#e7e9f0',
divider: dark ? '#25252e' : '#eceef4',
shadow: dark ? 'none' : '0 1px 2px rgba(20,21,28,0.06)',
text: dark ? '#f4f4f7' : '#14151c',
muted: dark ? '#a0a0ae' : '#5b5f70',
income: dark ? '#5fd39a' : '#0b7a43',
expense: dark ? (isRed ? '#f9a8d4' : '#ff8a80') : (isRed ? '#a3195b' : '#c62828'),
expenseOnWhite: isRed ? '#a3195b' : '#c62828',
pending: dark ? '#fbbf24' : '#b45309',
track: dark ? '#2a2a34' : '#e7e9f0',
swRing: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.10)',
swBg: dark ? hex(at) : '#9a9eb0',
swKnob: dark ? '#0e0e13' : '#ffffff',
swPos: dark ? '20px' : '2px',
navBg: dark ? '#14141a' : '#ffffff',
navInactive: dark ? '#a0a0ae' : '#5b5f70',
accentText: hex(at),
transferBg: dark ? hex(banner.map((v) => v + (255 - v) * 0.45)) : hex(tr),
transferText: dark ? ((lum(banner.map((v) => v + (255 - v) * 0.45)) + 0.05) / 0.055 <= 1.05 / (lum(banner.map((v) => v + (255 - v) * 0.45)) + 0.05) ? "#ffffff" : "#0f1020") : "#ffffff",
onExpense: dark ? "#1a0f0f" : "#ffffff",
onIncome: dark ? "#0e1a13" : "#ffffff",
accentLight: hex(banner.map((v) => v + (255 - v) * 0.45)),
onAccentLight: (lum(banner.map((v) => v + (255 - v) * 0.45)) + 0.05) / 0.055 <= 1.05 / (lum(banner.map((v) => v + (255 - v) * 0.45)) + 0.05) ? "#ffffff" : "#0f1020",
swOff: dark ? "#3a3b47" : "#c5c8d6",
catE: dark ? "#f472b6" : "#be185d",
catESoft: dark ? "rgba(244,114,182,0.14)" : "rgba(190,24,93,0.14)",
catF: dark ? "#4ade80" : "#15803d",
catFSoft: dark ? "rgba(74,222,128,0.14)" : "rgba(21,128,61,0.14)",
catG: dark ? "#60a5fa" : "#1d4ed8",
catGSoft: dark ? "rgba(96,165,250,0.14)" : "rgba(29,78,216,0.14)",
ch1: dark ? "#199e70" : "#1baf7a",
ch2: dark ? "#d95926" : "#eb6834",
ch3: dark ? "#9085e9" : "#4a3aa7",
ch4: dark ? "#c98500" : "#eda100",
chOther: dark ? "#6b6f80" : "#8a8fa3",
grid: dark ? "#2a2a34" : "#e7e9f0",
expenseSoft: rgba(fromHex(dark ? (isRed ? "#f9a8d4" : "#ff8a80") : (isRed ? "#a3195b" : "#c62828")), 0.14),
accentSoft: rgba(at, dark ? 0.16 : 0.12),
bannerBg: hex(banner),
fabGlow: rgba(banner, dark ? 0.55 : 0.45),
bannerRing: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0)',
onBanner: lightText ? '#ffffff' : '#0f1020',
onBannerMuted: lightText ? 'rgba(255,255,255,0.88)' : 'rgba(15,16,32,0.78)',
bannerLine: lightText ? 'rgba(255,255,255,0.28)' : 'rgba(15,16,32,0.22)',
chipBg: lightText ? 'rgba(255,255,255,0.18)' : 'rgba(15,16,32,0.10)',
catA: cats[0],
catB: cats[1],
catC: cats[2],
catD: cats[3],
catASoft: rgba(fromHex(cats[0]), 0.14),
catBSoft: rgba(fromHex(cats[1]), 0.14),
catCSoft: rgba(fromHex(cats[2]), 0.14),
catDSoft: rgba(fromHex(cats[3]), 0.14)
};
}
