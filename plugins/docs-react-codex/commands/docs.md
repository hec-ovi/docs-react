---
description: Find, read, write or bundle the project's Markdown docs
argument-hint: "[search <words> | get <id> | new <topic> <title> | bundle <topics>]"
---

Activate the `docs-react` skill and follow `skills/docs-react/SKILL.md`.

1. Resolve the CLI: `docs` on PATH. If it is missing, ask the user to run `./install.sh` in their
   docs-react checkout; do not install it yourself.
2. Map the argument to the same `docs` command (`search`, `get`, `list`, `new`, `index`, `bundle`).
   Empty: `docs info`, then `docs topics`.
3. After writing or editing a doc, run `docs index` and fix its warnings.

User argument: $ARGUMENTS
