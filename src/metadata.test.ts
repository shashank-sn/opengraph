import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, chmodSync } from "fs";
import { join } from "path";
import { extractMetadata } from "./metadata";

const testDir = join(import.meta.dirname || __dirname, "__test_fixtures__");

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("extractMetadata", () => {
  it("extracts from package.json", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "@scope/my-app",
        description: "A cool app",
        version: "1.2.3",
        author: "Test Author",
      })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("my-app");
    expect(meta.description).toBe("A cool app");
    expect(meta.version).toBe("1.2.3");
    expect(meta.author).toBe("Test Author");
  });

  it("falls back to README for description", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test-pkg" }));
    writeFileSync(
      join(testDir, "README.md"),
      "# Test\n\nThis is from the readme.\n\nMore stuff."
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("This is from the readme.");
  });

  it("flags override file values", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "pkg-name", description: "pkg-desc" })
    );

    const meta = extractMetadata(pkgPath, {
      title: "Flag Title",
      desc: "Flag Desc",
    });

    expect(meta.title).toBe("Flag Title");
    expect(meta.description).toBe("Flag Desc");
  });

  it("handles missing package.json gracefully", () => {
    const meta = extractMetadata(join(testDir, "nonexistent.json"));
    expect(meta.title).toBe("Untitled");
    expect(meta.description).toBe("No description");
  });

  it("strips @scope/ from package name", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "@ftod/opengraph" }));

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("opengraph");
  });

  it("handles object-style author field", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", author: { name: "Obj Author" } })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.author).toBe("Obj Author");
  });

  it("handles empty package.json", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, "{}");

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("Untitled");
    expect(meta.description).toBe("No description");
    expect(meta.version).toBe("");
    expect(meta.author).toBe("");
  });

  it("handles malformed JSON in package.json", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, "{invalid json");

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("Untitled");
    expect(meta.description).toBe("No description");
  });

  it("handles README with no paragraphs (only headings)", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test" }));
    writeFileSync(join(testDir, "README.md"), "# Title\n## Subtitle\n### More");

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("No description");
  });

  it("handles empty README", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test" }));
    writeFileSync(join(testDir, "README.md"), "");

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("No description");
  });

  it("handles README with frontmatter-like content", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test" }));
    writeFileSync(
      join(testDir, "README.md"),
      "---\ntitle: foo\n---\n\nActual description here."
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("Actual description here.");
  });

  it("handles repository as string", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", repository: "https://github.com/user/repo" })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.homepage).toBe("");
  });

  it("handles repository as object with url", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "test",
        repository: { url: "https://github.com/user/repo" },
      })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.homepage).toBe("https://github.com/user/repo");
  });

  it("handles deeply scoped package names", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "@my-org/my-tool" }));

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("my-tool");
  });

  it("handles package with no scope", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "simple-name" }));

    const meta = extractMetadata(pkgPath);
    expect(meta.title).toBe("simple-name");
  });

  it("handles author as empty string", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test", author: "" }));

    const meta = extractMetadata(pkgPath);
    expect(meta.author).toBe("");
  });

  it("handles author as object with no name", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", author: { email: "a@b.com" } })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.author).toBe("");
  });

  it("handles special characters in description", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", description: "A <cool> & 'nice' tool" })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("A <cool> & 'nice' tool");
  });

  it("handles very long description from README", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test" }));
    const longDesc = "word ".repeat(200).trim();
    writeFileSync(join(testDir, "README.md"), `# Title\n\n${longDesc}`);

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe(longDesc);
  });

  it("prefers package.json description over README", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", description: "From pkg" })
    );
    writeFileSync(join(testDir, "README.md"), "# Title\n\nFrom readme");

    const meta = extractMetadata(pkgPath);
    expect(meta.description).toBe("From pkg");
  });

  it("flags override all individual fields independently", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        name: "pkg-name",
        description: "pkg-desc",
        version: "1.0.0",
        author: "pkg-author",
      })
    );

    const meta = extractMetadata(pkgPath, { title: "Flag Title" });
    expect(meta.title).toBe("Flag Title");
    expect(meta.description).toBe("pkg-desc");
    expect(meta.version).toBe("1.0.0");
    expect(meta.author).toBe("pkg-author");
  });

  it("handles homepage field from package.json", () => {
    const pkgPath = join(testDir, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({ name: "test", homepage: "https://example.com" })
    );

    const meta = extractMetadata(pkgPath);
    expect(meta.homepage).toBe("https://example.com");
  });
});
