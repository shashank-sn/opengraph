# opengraph

your project already exists, it just doesn't have a social card yet, and this reads your package.json, grabs the name, description, version, author, stuff you already wrote, and turns it into a clean og image with one command, no figma or template configs needed.

## install it

```bash
npm install -g @ftod/opengraph
```

## use it

```bash
# reads package.json + README in your cwd
opengraph

# override whatever you want
opengraph --title "my project" --desc "does the thing" --output ./social.png

# different background
opengraph --bg "#1a1a2e"

# just see what it extracted
opengraph --json
```

## flags

| flag | default | what it does |
|------|---------|-------------|
| `--title` | package.json `name` | card title |
| `--desc` | package.json `description` or first README paragraph | card subtitle |
| `--author` | package.json `author` | bottom corner text |
| `--ver` | package.json `version` | bottom corner text |
| `--output` | `./og-image.png` | where the png goes |
| `--bg` | `#0a0a0a` | background color, hex |
| `--width` | `1200` | image width |
| `--height` | `630` | image height |
| `--package` | (none) | path to a different package.json |
| `--json` | (none) | print extracted metadata instead of rendering |

## how it works

reads your package.json. if there's no description there, it grabs the first real paragraph from your README. if there's yaml frontmatter, it skips that. strips the `@scope/` from scoped package names. merges anything you pass as flags on top.

then it builds an svg: dark gradient background, your title in big type, description below, author + version in the corner. pipes it through resvg-js, which is wasm-based so it installs clean on every platform without native compilation headaches.

writes a png. done.

## why resvg-js

sharp is more powerful. sharp also breaks on `npm install` half the time because of native bindings. resvg-js is wasm. it just works.

## license

mit
