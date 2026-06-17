import { Command } from "commander";
import chalk from "chalk";
import { extractMetadata } from "./metadata";
import { buildSvg } from "./template";
import { renderPng } from "./render";

interface Options {
  title?: string;
  desc?: string;
  author?: string;
  ver?: string;
  output: string;
  bg: string;
  width: string;
  height: string;
  package?: string;
  json?: boolean;
}

function parseHexColor(val: string): string {
  const cleaned = val.startsWith("#") ? val : `#${val}`;
  if (!/^#[0-9a-fA-F]{3,8}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${val}`);
  }
  return cleaned;
}

async function main() {
  const program = new Command();

  program
    .name("opengraph")
    .description("Zero-config OG image generator for solo builders")
    .version("0.1.0")
    .option("--title <text>", "Card title")
    .option("--desc <text>", "Card description")
    .option("--author <text>", "Author name")
    .option("--ver <text>", "Version string")
    .option("--output <path>", "Output file path", "./og-image.png")
    .option("--bg <hex>", "Background color (hex)", "#0a0a0a")
    .option("--width <px>", "Image width", "1200")
    .option("--height <px>", "Image height", "630")
    .option("--package <path>", "Path to package.json")
    .option("--json", "Output metadata as JSON instead of generating image")
    .action(async (opts: Options) => {
      try {
        const bg = parseHexColor(opts.bg);
        const width = parseInt(opts.width, 10);
        const height = parseInt(opts.height, 10);

        if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
          console.error(chalk.red("Error: --width and --height must be positive integers"));
          process.exit(1);
        }

        const meta = extractMetadata(opts.package, {
          title: opts.title,
          desc: opts.desc,
          author: opts.author,
          version: opts.ver,
        });

        if (opts.json) {
          console.log(JSON.stringify(meta, null, 2));
          return;
        }

        const svg = buildSvg(meta, { width, height, bg });
        const result = await renderPng(svg, { width, output: opts.output });

        console.log(chalk.green("✓") + ` OG image generated`);
        console.log(chalk.dim(`  ${result.path}`));
        console.log(chalk.dim(`  ${result.width}×${result.height}`));
      } catch (err) {
        console.error(
          chalk.red("Error:") +
            ` ${err instanceof Error ? err.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

main();
