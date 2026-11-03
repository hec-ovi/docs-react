---
name: docs-react
description: >-
  Reads and writes a local Markdown documentation library through the docs
  CLI: finds docs by topic, searches them, prints one, creates a new doc with
  front matter, rebuilds the index, and bundles whole topics into one Markdown
  file to paste into a web chat. Use when the project keeps knowledge as docs
  (a docs-react content folder, INDEX.md, docs.config.json), when the user says
  "check the docs", "what do the docs say about", "save this as a doc", "write
  a doc about", "add it to the docs", "bundle the docs for Gemini" or "make a
  bundle", or asks for notes, rules or prompts kept in the docs. Same
  commands in Claude Code, Codex, Gemini CLI, Grok and OpenCode.
license: MIT
compatibility: >-
  Requires the docs CLI (Node 18+, stdlib only) from a docs-react checkout.
  The library is a folder of .md files: DOCS_ROOT, else the checkout's
  content/ folder. Runs from any agent shell; no MCP server.
metadata:
  author: Hector Oviedo
  version: "0.2.0"
allowed-tools: Bash(docs:*)
---

# docs-react

priority performance > quality > speed > budget tokens

The project's knowledge lives in a folder of Markdown docs, read by people in the docs-react viewer
and by agents through the `docs` CLI. Fetch only what the task needs; save what others will need.
Output is plain text; errors print `error:` and a `hint:` to run next.

## Start

1. `docs info`. Command not found: ask the user to run `./install.sh` in their docs-react checkout.
   Never install it yourself. `no library`: set `DOCS_ROOT` only if the user names the folder.
2. Learn the map once: `docs topics`, or read `INDEX.md` at the library root (one line per doc:
   title, path, topics, summary). Do not open docs you do not need.

## Read

| Need | Command |
|---|---|
| Docs under a topic (and its sub-topics) | `docs list reference/api` |
| Docs about something | `docs search <words...>` (all words must match; best first, with the line) |
| One doc | `docs get <id>` (id = path without `.md`; a unique file name also works) · `--body` drops front matter |
| Several docs | `docs get <id> <id> ...` |
| Everything on a subject, for another model | `docs bundle <topic|id...> -o bundle.md` |

## Write

1. Search first: `docs search <words>`. If a doc covers it, edit that file instead of adding one.
2. `docs new <topic> "<Title>" --tags a,b --summary "<one line>"` prints the new file's path.
   Pipe a finished body with `--stdin`: `docs new rules "Naming" --summary "..." --stdin < body.md`.
3. Fill the body: a 1-3 line lead, then `##` sections. No `# Title` (the title comes from front
   matter). Tables, lists, fenced code with a language, `>` quotes for someone's exact words.
4. `docs index` after any edit; fix every `warning:` it prints for your files.

Front matter (the CLI writes it; keep it when editing):

```yaml
---
title: Naming rules
topics: [rules, story]     # first topic = place in the navigation; nest with /
tags: [names, brands]
summary: One line under 160 characters that says what the doc holds.
updated: 2026-11-03
---
```

## Rules

- One subject per doc; split past about 3,000 words. Update a doc instead of adding a near copy.
- Keep a person's words verbatim in `>` quotes; mark sources in a `sources:` front matter list.
- Never write secrets, email addresses or home-directory paths into a doc; `docs index` warns about
  the last two.
- Never add the library folder to git in a public repository; it is ignored on purpose.
- Bundles are for pasting into web chats: check the printed token estimate against the chat's limit
  and bundle fewer topics when it is too big.
- Run `docs` plainly in the foreground; read a command's help (`docs help`) only after an error.

## Exit codes

| Code | Meaning | Do |
|---|---|---|
| 1 | invalid request | read `hint:` and fix the command once |
| 2 | not found | use the close matches the error lists, or `docs search` |
| 4 | nothing matched | fewer words, another topic, or `docs topics` |

Reference: [commands.md](references/commands.md) (every command, flag and output format).
