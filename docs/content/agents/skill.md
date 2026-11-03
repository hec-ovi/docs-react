---
title: The agent skill
topics: [agents]
tags: [skill, claude-code, codex, install]
summary: Install the docs-react skill so coding agents can write and fetch docs with the CLI.
updated: 2026-11-03
order: 2
---

The repository ships an agent skill (`skills/docs-react/SKILL.md`) in the open Agent Skills format. It teaches an agent to look up docs before asking, to fetch only what it needs, and to save new knowledge as docs with proper front matter.

## Install

```bash
./install.sh              # docs CLI in ~/.local/bin, skill links for Claude Code, Codex and Gemini CLI
./install.sh --project .  # skill links inside one project only
./install.sh --dry-run    # print what it would do
./install.sh --uninstall
```

The script only creates symlinks to this checkout and never replaces an existing file.

## What the skill tells agents

1. Read `INDEX.md` or run `docs list <topic>` first; open a doc with `docs get <id>`.
2. Search with `docs search <words>` before writing a new doc, and update the doc that exists.
3. Create docs with `docs new`, fill the body, then run `docs index`.
4. Use `docs bundle` to hand several topics to another model in one file.
