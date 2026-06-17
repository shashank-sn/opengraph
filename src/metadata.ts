import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

export interface Metadata {
  title: string;
  description: string;
  author: string;
  version: string;
  homepage: string;
}

interface PackageJson {
  name?: string;
  description?: string;
  version?: string;
  author?: string | { name?: string };
  repository?: string | { url?: string };
  homepage?: string;
}

function stripScope(name: string): string {
  return name.replace(/^@[^/]+\//, "");
}

function readPackageJson(pkgPath: string): PackageJson | null {
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }
}

function readReadmeFirstParagraph(readmePath: string): string | null {
  if (!existsSync(readmePath)) return null;
  try {
    let content = readFileSync(readmePath, "utf-8");

    // Strip YAML frontmatter
    if (content.startsWith("---")) {
      const end = content.indexOf("\n---", 3);
      if (end !== -1) {
        content = content.slice(end + 4);
      }
    }

    const lines = content.split("\n");
    let inParagraph = false;
    const paragraph: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) continue;

      if (trimmed === "") {
        if (inParagraph && paragraph.length > 0) break;
        continue;
      }

      inParagraph = true;
      paragraph.push(trimmed);
    }

    return paragraph.length > 0 ? paragraph.join(" ") : null;
  } catch {
    return null;
  }
}

export function extractMetadata(
  packagePath?: string,
  flags: Partial<Metadata> = {}
): Metadata {
  const cwd = process.cwd();
  const pkgDir = packagePath ? dirname(resolve(packagePath)) : cwd;
  const pkgFilePath = packagePath
    ? resolve(packagePath)
    : resolve(cwd, "package.json");

  const pkg = readPackageJson(pkgFilePath);
  const readmePath = resolve(pkgDir, "README.md");
  const readmeDesc = readReadmeFirstParagraph(readmePath);

  const author =
    typeof pkg?.author === "string"
      ? pkg.author
      : typeof pkg?.author === "object"
        ? pkg.author.name ?? ""
        : "";

  const homepage =
    pkg?.homepage ??
    (typeof pkg?.repository === "object" ? pkg.repository.url ?? "" : "") ??
    "";

  return {
    title: flags.title ?? (pkg?.name ? stripScope(pkg.name) : "Untitled"),
    description:
      flags.desc ?? pkg?.description ?? readmeDesc ?? "No description",
    author: flags.author ?? author,
    version: flags.version ?? pkg?.version ?? "",
    homepage: flags.homepage ?? homepage,
  };
}
