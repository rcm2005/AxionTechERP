export interface Oklch {
  l: number; // 0-1
  c: number; // chroma, tipicamente 0-0.4
  h: number; // graus, 0-360
}

// sRGB hex (#rrggbb) -> linear RGB (0-1 cada canal)
function hexParaLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [toLinear((n >> 16) & 255), toLinear((n >> 8) & 255), toLinear(n & 255)];
}

// linear RGB -> sRGB hex
function linearParaHex(rgb: [number, number, number]): string {
  const toSrgb = (c: number) => {
    const clamped = Math.min(1, Math.max(0, c));
    const s = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255);
  };
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(toSrgb(rgb[0]))}${hex(toSrgb(rgb[1]))}${hex(toSrgb(rgb[2]))}`;
}

// linear RGB -> OKLab (matrizes de Björn Ottosson, oklab.org)
function linearParaOklab(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

// OKLab -> linear RGB (inversa)
function oklabParaLinear(lab: [number, number, number]): [number, number, number] {
  const [L, a, b] = lab;
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

export function hexParaOklch(hex: string): Oklch {
  const [L, a, b] = linearParaOklab(hexParaLinear(hex));
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export function oklchParaHex(oklch: Oklch): string {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);
  return linearParaHex(oklabParaLinear([oklch.l, a, b]));
}

// Luminância relativa WCAG (fórmula do W3C, independente de OKLab)
function luminanciaRelativa(hex: string): number {
  const [r, g, b] = hexParaLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function razaoContraste(hex1: string, hex2: string): number {
  const l1 = luminanciaRelativa(hex1);
  const l2 = luminanciaRelativa(hex2);
  const mais_claro = Math.max(l1, l2);
  const mais_escuro = Math.min(l1, l2);
  return (mais_claro + 0.05) / (mais_escuro + 0.05);
}

export interface PaletaAccent {
  accentHover: string;
  accentDim: string;
  onAccent: string;
}

export function derivarPaletaAccent(accentHex: string): PaletaAccent {
  const base = hexParaOklch(accentHex);

  // Hover: mesmo H/C, mais escuro — nunca abaixo de L=0.15 (evita virar preto).
  const hover = oklchParaHex({ l: Math.max(base.l - 0.08, 0.15), c: base.c, h: base.h });

  // Dim: bem mais claro e bem menos saturado — mesmo espírito do
  // --color-accent-dim atual do skin corporate (#a9b8ea, um azul bem pálido
  // relativo ao #3157d5 do accent).
  const dim = oklchParaHex({ l: 0.88, c: base.c * 0.35, h: base.h });

  // Texto sobre o accent: escolhe entre preto e branco puro, o que der mais
  // contraste real (WCAG), não decide por "L>0.5=branco" (esse atalho erra
  // pra cores saturadas de luminância mediana).
  const contrasteComBranco = razaoContraste(accentHex, '#ffffff');
  const contrasteComPreto = razaoContraste(accentHex, '#000000');
  const onAccent = contrasteComBranco >= contrasteComPreto ? '#ffffff' : '#000000';

  return { accentHover: hover, accentDim: dim, onAccent };
}
