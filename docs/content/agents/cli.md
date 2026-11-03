---
title: The docs CLI
topics: [agents]
tags: [cli, search, bundle, index]
summary: Every docs command, for people and agents: list, search, get, new, index and bundle.
updated: 2026-11-03
order: 1
---

The `docs` CLI reads and writes the same folder the viewer shows. It needs only Node 18 or newer and prints plain text sized for agents. Errors print `error:` and a `hint:` with the command to run next.

## Commands

| Command | What it does |
|---|---|
| `docs info` | The library folder, doc and topic counts, when the index was built |
| `docs list [topic]` | One line per doc: id, title, topics, summary |
| `docs topics` | Every topic with its doc count |
| `docs search <words...>` | Docs holding all the words, best first, with the matching line |
| `docs get <id\|path\|slug>` | Print a doc (`--body` drops the front matter) |
| `docs new <topic> <title>` | Create a doc with front matter and print its path |
| `docs index` | Rebuild `index.json` and `INDEX.md`, and print warnings |
| `docs bundle <topic\|id...>` | Join docs into one Markdown file |

## Examples

```bash
docs list guide
docs search front matter
docs get guide/writing-docs
docs new reference/api "Rate limits" --tags api,limits --summary "Request limits per key."
echo "## Body" | docs new guide "Release notes" --stdin
docs bundle guide agents -o guide-bundle.md
```

## Bundles for web chats

`docs bundle` joins whole topics into one Markdown file with a table of contents, ready to paste or upload into a chat assistant on the web. It prints the size in words and an estimate in tokens, so you can keep a bundle under the assistant's limit.

## The index

`docs index` writes two files at the library root:

- `index.json`: the navigation tree and one record per doc (id, path, title, topics, tags, summary, updated, words). The viewer loads it once.
- `INDEX.md`: the same list as Markdown, one line per doc, grouped by topic, for agents that read files instead of running the CLI.

It also warns about docs without a title, topics or summary, duplicate file names, email addresses and home-directory paths.
