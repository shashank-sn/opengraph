import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const CLI_PATH = join(import.meta.dirname || __dirname, "../dist/index.js");
const testDir = join(import.meta.dirname || __dirname, "__cli_fixtures__");

function run(args: string, cwd?: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args}`, {
      cwd: cwd || testDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      code: err.status || 1,
    };
  }
}

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(
    join(testDir, "package.json"),
    JSON.stringify({
      name: "@test/cli-app",
      description: "A CLI test app",
      version: "2.0.0",
      author: "CLI Author",
    })
  );
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  // Clean generated files
  try { rmSync(join(testDir, "og-image.png"), { force: true }); } catch {}
  try { rmSync(join(testDir, "custom.png"), { force: true }); } catch {}
});

describe("CLI smoke tests", () => {
  it("generates image with defaults", () => {
    const result = run("--output og-image.png");
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("OG image generated");
    expect(existsSync(join(testDir, "og-image.png"))).toBe(true);
  });

  it("--json outputs metadata", () => {
    const result = run("--json");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toBe("cli-app");
    expect(data.description).toBe("A CLI test app");
    expect(data.version).toBe("2.0.0");
    expect(data.author).toBe("CLI Author");
  });

  it("--title overrides package name", () => {
    const result = run("--json --title CustomTitle");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toBe("CustomTitle");
  });

  it("--desc overrides description", () => {
    const result = run("--json --desc CustomDesc");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.description).toBe("CustomDesc");
  });

  it("--author overrides author", () => {
    const result = run("--json --author CustomAuthor");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.author).toBe("CustomAuthor");
  });

  it("--ver overrides version", () => {
    const result = run("--json --ver 99.0.0");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.version).toBe("99.0.0");
  });

  it("--bg sets background color", () => {
    const result = run("--bg 1a1a2e --output custom.png");
    expect(result.code).toBe(0);
  });

  it("--width and --height set dimensions", () => {
    const result = run("--width 800 --height 400 --output custom.png");
    expect(result.code).toBe(0);
  });

  it("exits 1 on invalid hex color", () => {
    const result = run("--bg notacolor --output custom.png");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Invalid hex color");
  });

  it("exits 1 on zero width", () => {
    const result = run("--width 0 --output custom.png");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("positive integers");
  });

  it("exits 1 on negative height", () => {
    const result = run("--height -100 --output custom.png");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("positive integers");
  });

  it("falls back to README description when no description in package.json", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ name: "no-desc" })
    );
    writeFileSync(
      join(testDir, "README.md"),
      "# Title\n\nReadme fallback description."
    );
    const result = run("--json");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.description).toBe("Readme fallback description.");
  });

  it("handles package with no name gracefully", () => {
    writeFileSync(join(testDir, "package.json"), JSON.stringify({}));
    const result = run("--json");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toBe("Untitled");
  });

  it("handles missing package.json", () => {
    rmSync(join(testDir, "package.json"));
    const result = run("--json");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toBe("Untitled");
  });

  it("generates image with all flags combined", () => {
    const result = run(
      '--title "Full Test" --desc "All flags" --author "Me" --ver 3.0.0 --bg 2d2d2d --output custom.png'
    );
    expect(result.code).toBe(0);
    expect(existsSync(join(testDir, "custom.png"))).toBe(true);
  });

  it("--help shows usage", () => {
    const result = run("--help");
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("opengraph");
    expect(result.stdout).toContain("--title");
    expect(result.stdout).toContain("--output");
  });

  it("handles output to nested directory (fails gracefully)", () => {
    const result = run("--output /nonexistent/deep/path/out.png");
    expect(result.code).toBe(1);
  });

  it("output file is a valid PNG", () => {
    run("--output og-image.png");
    const buf = readFileSync(join(testDir, "og-image.png"));
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  it("output file size is reasonable (not empty, not huge)", () => {
    run("--output og-image.png");
    const buf = readFileSync(join(testDir, "og-image.png"));
    expect(buf.length).toBeGreaterThan(5000);   // > 5KB
    expect(buf.length).toBeLessThan(500000);     // < 500KB
  });

  it("--package points to a different package.json", () => {
    const subDir = join(testDir, "sub");
    mkdirSync(subDir, { recursive: true });
    writeFileSync(
      join(subDir, "pkg.json"),
      JSON.stringify({ name: "sub-pkg", description: "From sub" })
    );
    const result = run(`--json --package "${join(subDir, "pkg.json")}"`);
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toBe("sub-pkg");
    expect(data.description).toBe("From sub");
  });

  it("handles title with special XML characters", () => {
    const result = run('--json --title "Tom & Jerry \\"Show\\""');
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.title).toContain("&");
  });

  it("handles description with angle brackets", () => {
    const result = run('--json --desc "Use <template> tags"');
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.description).toContain("<template>");
  });

  it("generates large image (2400x1260)", () => {
    const result = run("--width 2400 --height 1260 --output custom.png");
    expect(result.code).toBe(0);
  });

  it("generates small image (400x210)", () => {
    const result = run("--width 400 --height 210 --output custom.png");
    expect(result.code).toBe(0);
  });
});
