import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { renderPng } from "./render";

function cleanup(path: string) {
  try {
    unlinkSync(path);
  } catch {}
}

describe("renderPng", () => {
  it("renders SVG to PNG file", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="red"/>
    </svg>`;
    const outPath = join(import.meta.dirname || __dirname, "__test_output.png");

    try {
      const result = await renderPng(svg, { width: 100, output: outPath });
      expect(existsSync(outPath)).toBe(true);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);

      const buf = readFileSync(outPath);
      expect(buf[0]).toBe(0x89); // PNG magic
      expect(buf[1]).toBe(0x50); // P
      expect(buf[2]).toBe(0x4e); // N
      expect(buf[3]).toBe(0x47); // G
    } finally {
      cleanup(outPath);
    }
  });

  it("renders at different widths", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="blue"/>
    </svg>`;
    const outPath = join(import.meta.dirname || __dirname, "__test_scaled.png");

    try {
      const result = await renderPng(svg, { width: 600, output: outPath });
      expect(result.width).toBe(600);
      expect(result.height).toBeGreaterThan(0);
    } finally {
      cleanup(outPath);
    }
  });

  it("renders a complex SVG with text", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#0a0a0a"/>
      <text x="600" y="315" text-anchor="middle" fill="white" font-size="64">Hello World</text>
      <text x="600" y="380" text-anchor="middle" fill="#888" font-size="28">This is a subtitle</text>
    </svg>`;
    const outPath = join(import.meta.dirname || __dirname, "__test_complex.png");

    try {
      const result = await renderPng(svg, { width: 1200, output: outPath });
      const buf = readFileSync(outPath);
      expect(buf.length).toBeGreaterThan(1000);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
    } finally {
      cleanup(outPath);
    }
  });

  it("renders SVG with gradient background", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a1a2e"/>
        <stop offset="100%" stop-color="#16213e"/>
      </linearGradient></defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
    </svg>`;
    const outPath = join(import.meta.dirname || __dirname, "__test_grad.png");

    try {
      const result = await renderPng(svg, { width: 1200, output: outPath });
      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
    } finally {
      cleanup(outPath);
    }
  });
});
