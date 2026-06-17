import type { Metadata } from "./metadata";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface TemplateOptions {
  width: number;
  height: number;
  bg: string;
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function buildSvg(meta: Metadata, opts: TemplateOptions): string {
  const { width, height, bg } = opts;
  const accent = "#6366f1";
  const textLight = lighten(bg, 180);
  const textMuted = lighten(bg, 100);

  const padding = 80;
  const maxTextWidth = width - padding * 2;
  const maxCharsPerLine = Math.floor(maxTextWidth / 22);

  const titleLines = wrapText(meta.title, 20);
  const descLines = wrapText(meta.description, 50);

  const titleFontSize = 64;
  const descFontSize = 28;
  const lineHeight = 1.3;

  const titleBlockHeight = titleLines.length * titleFontSize * lineHeight;
  const descBlockHeight = descLines.length * descFontSize * lineHeight;

  const centerY = height / 2;
  const titleStartY = centerY - descBlockHeight / 2 - 20;

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : titleFontSize * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n      ");

  const descTspans = descLines
    .map(
      (line, i) =>
        `<tspan x="${width / 2}" dy="${i === 0 ? 0 : descFontSize * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("\n      ");

  const footerParts = [meta.author, meta.version && `v${meta.version}`].filter(
    Boolean
  );
  const footerText = footerParts.join(" · ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="${lighten(bg, 15)}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />

  <!-- Accent line -->
  <rect x="${padding}" y="${titleStartY - 30}" width="60" height="4" rx="2" fill="${accent}" />

  <!-- Title -->
  <text
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    font-size="${titleFontSize}"
    font-weight="700"
    fill="${textLight}"
    text-anchor="middle"
    y="${titleStartY}"
  >
    ${titleTspans}
  </text>

  <!-- Description -->
  <text
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    font-size="${descFontSize}"
    fill="${textMuted}"
    text-anchor="middle"
    y="${titleStartY + titleBlockHeight + 40}"
  >
    ${descTspans}
  </text>

  <!-- Footer -->
  ${
    footerText
      ? `<text
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    font-size="18"
    fill="${textMuted}"
    opacity="0.5"
    x="${padding}"
    y="${height - 40}"
  >${escapeXml(footerText)}</text>`
      : ""
  }
</svg>`;
}
