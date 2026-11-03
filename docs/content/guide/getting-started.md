---
title: Getting started
topics: [guide]
tags: [install, dev, build]
summary: Install, run the viewer, and point it at your own folder of Markdown docs.
updated: 2026-11-03
order: 1
---

docs-react turns a folder of Markdown files into a documentation site with nested navigation, search, code highlighting, tables and dark and light themes. The same folder is readable by agents through the `docs` CLI.

## Run it

```bash
git clone https://github.com/hec-ovi/docs-react.git && cd docs-react
npm install
npm run dev
```

The viewer opens on `http://localhost:5173/` and shows this example library from `example/`.

## Use your own library

Put your Markdown files in `content/` (ignored by git, so private docs never reach the repository), or point `DOCS_ROOT` at any folder:

```bash
DOCS_ROOT=/srv/team-docs npm run dev
```

| Setting | Default | Meaning |
|---|---|---|
| `DOCS_ROOT` | `content/` if it exists, else `example/` | The folder the viewer and the CLI read |
| `docs.config.json` | none | Library title, topic order and topic labels |

## Build a static site

```bash
npm run build          # dist/, with your library copied to dist/content/
npm run build:pages    # docs/, from example/ only (the public demo)
```

Serve `dist/` with any static server, for example `npx serve dist`.
