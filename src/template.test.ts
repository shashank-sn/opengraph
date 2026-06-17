import { describe, it, expect } from "vitest";
import { buildSvg } from "./template";

function makeMeta(overrides: Record<string, string> = {}) {
  return {
    title: "Test",
    description: "A test description",
    author: "Author",
    version: "1.0.0",
    homepage: "",
    ...overrides,
  };
}

function opts(overrides: Record<string, string | number> = {}) {
  return { width: 1200, height: 630, bg: "#0a0a0a", ...overrides };
}

describe("buildSvg", () => {
  it("returns valid SVG with correct dimensions", () => {
    const svg = buildSvg(makeMeta(), opts());
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
  });

  it("escapes XML special characters in title", () => {
    const svg = buildSvg(makeMeta({ title: 'Tom & Jerry "show"' }), opts());
    expect(svg).toContain("Tom &amp; Jerry");
    expect(svg).toContain("&quot;show&quot;");
  });

  it("escapes XML special characters in description", () => {
    const svg = buildSvg(makeMeta({ description: "<b>bold</b>" }), opts());
    expect(svg).toContain("&lt;b&gt;bold&lt;/b&gt;");
  });

  it("escapes XML special characters in author", () => {
    const svg = buildSvg(makeMeta({ author: "O'Brien & Sons" }), opts());
    expect(svg).toContain("O&apos;Brien &amp; Sons");
  });

  it("uses custom background color", () => {
    const svg = buildSvg(makeMeta(), opts({ bg: "#1a1a2e" }));
    expect(svg).toContain("#1a1a2e");
  });

  it("includes author and version in footer", () => {
    const svg = buildSvg(makeMeta(), opts());
    expect(svg).toContain("Author · v1.0.0");
  });

  it("omits footer separator when only author present", () => {
    const svg = buildSvg(makeMeta({ version: "" }), opts());
    expect(svg).toContain("Author");
    expect(svg).not.toContain("· v");
  });

  it("omits footer separator when only version present", () => {
    const svg = buildSvg(makeMeta({ author: "" }), opts());
    expect(svg).toContain("v1.0.0");
  });

  it("wraps long titles to multiple lines", () => {
    const svg = buildSvg(
      makeMeta({ title: "This Is A Very Long Project Name That Should Wrap" }),
      opts()
    );
    const tspanMatches = svg.match(/<tspan/g);
    expect(tspanMatches!.length).toBeGreaterThan(2);
  });

  it("wraps long descriptions to multiple lines", () => {
    const svg = buildSvg(
      makeMeta({
        description:
          "This is a really long description that should wrap across multiple lines in the SVG template to test text wrapping functionality",
      }),
      opts()
    );
    const tspanMatches = svg.match(/<tspan/g);
    expect(tspanMatches!.length).toBeGreaterThan(3);
  });

  it("handles single character title", () => {
    const svg = buildSvg(makeMeta({ title: "X" }), opts());
    expect(svg).toContain(">X<");
  });

  it("handles empty description", () => {
    const svg = buildSvg(makeMeta({ description: "" }), opts());
    expect(svg).toContain('viewBox="0 0 1200 630"');
  });

  it("handles very long single-word title", () => {
    const svg = buildSvg(makeMeta({ title: "Supercalifragilisticexpialidocious" }), opts());
    expect(svg).toContain("Supercalifragilisticexpialidocious");
  });

  it("handles 3-char hex colors", () => {
    const svg = buildSvg(makeMeta(), opts({ bg: "#fff" }));
    expect(svg).toContain("#fff");
  });

  it("handles custom dimensions", () => {
    const svg = buildSvg(makeMeta(), opts({ width: 800, height: 400 }));
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="400"');
  });

  it("generates valid gradient with bg color", () => {
    const svg = buildSvg(makeMeta(), opts({ bg: "#112233" }));
    expect(svg).toContain("linearGradient");
    expect(svg).toContain("#112233");
  });

  it("handles title with newlines (should be one line per word)", () => {
    const svg = buildSvg(makeMeta({ title: "Line1 Line2 Line3" }), opts());
    expect(svg).toContain("Line1");
    expect(svg).toContain("Line2");
    expect(svg).toContain("Line3");
  });

  it("handles all fields empty except title", () => {
    const svg = buildSvg(
      makeMeta({ description: "", author: "", version: "" }),
      opts()
    );
    expect(svg).toContain("Test");
  });

  it("handles unicode in title", () => {
    const svg = buildSvg(makeMeta({ title: "日本語テスト" }), opts());
    expect(svg).toContain("日本語テスト");
  });

  it("handles emoji in description", () => {
    const svg = buildSvg(makeMeta({ description: "Cool stuff 🚀" }), opts());
    expect(svg).toContain("Cool stuff 🚀");
  });
});
