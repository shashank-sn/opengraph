import { writeFileSync } from "fs";
import { resolve } from "path";
import { Resvg } from "@resvg/resvg-js";

interface RenderOptions {
  width: number;
  output: string;
}

export async function renderPng(
  svg: string,
  opts: RenderOptions
): Promise<{ path: string; width: number; height: number }> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: opts.width },
  });

  const rendered = resvg.render();
  const pngData = rendered.asPng();
  const outputPath = resolve(opts.output);

  writeFileSync(outputPath, pngData);

  return {
    path: outputPath,
    width: rendered.width,
    height: rendered.height,
  };
}
