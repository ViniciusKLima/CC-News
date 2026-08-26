// Utilitários de cor usados para gerar o degradê da capa das edições (ver
// gradienteCapa): parte da cor escolhida pelo usuário e escurece mantendo o
// mesmo tom (hue) e saturação, via HSL, em vez de só escurecer o RGB —
// assim o resultado fica consistente pra qualquer cor, clara ou escura.

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexParaRgb(hex: string): Rgb {
  const valor = hex.replace('#', '');
  return {
    r: parseInt(valor.substring(0, 2), 16),
    g: parseInt(valor.substring(2, 4), 16),
    b: parseInt(valor.substring(4, 6), 16),
  };
}

function rgbParaHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }

  return { h: (h / 6) * 360, s: s * 100, l: l * 100 };
}

function hslParaHex({ h, s, l }: Hsl): string {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;

  const paraHex = (canal: number): string =>
    Math.round(canal * 255)
      .toString(16)
      .padStart(2, '0');

  if (sn === 0) {
    const cinza = paraHex(ln);
    return `#${cinza}${cinza}${cinza}`;
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const r = hue2rgb(p, q, hn + 1 / 3);
  const g = hue2rgb(p, q, hn);
  const b = hue2rgb(p, q, hn - 1 / 3);

  return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`;
}

// Reduz a luminosidade proporcionalmente (não em pontos fixos), preservando
// tom e saturação. Uma redução proporcional evita estourar pra preto em
// cores já escuras e ainda garante contraste perceptível em cores claras.
function escurecerCor(hex: string, fator = 0.35): string {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  const luminosidadeMinima = 4;
  const novaLuminosidade = Math.max(hsl.l * (1 - fator), luminosidadeMinima);
  return hslParaHex({ ...hsl, l: novaLuminosidade });
}

// Degradê vertical usado na capa de cor sólida das edições: a cor escolhida
// no topo evoluindo pra uma variação mais escura da mesma cor na base, em
// vez de uma cor chapada. Mantém a identidade da cor escolhida.
export function gradienteCapa(hex: string): string {
  return `linear-gradient(180deg, ${hex} 0%, ${escurecerCor(hex)} 100%)`;
}
