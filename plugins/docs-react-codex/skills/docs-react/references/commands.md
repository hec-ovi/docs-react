# docs CLI reference

All commands take `--root DIR` to pick a library; otherwise `DOCS_ROOT`, else the checkout's `content/`.
Output is plain text. Errors go to stderr as `error: ...` plus `hint: ...`.

## info

`docs info` prints the library folder, its title (`docs.config.json`), doc, topic and word counts, and
when the index was built.

## list [topic] [--json]

One line per doc in navigation order:

```text
rules/script-writing · Script writing rules · [rules, script] · How every line is written and what never goes in one.
```

With a topic, only docs carrying that topic or a sub-topic of it (`reference` matches `reference/api`).
`--json` prints id, path, title, topics, tags, summary and updated as JSON.

## topics

Every topic with the number of docs that carry it, indented by depth.

## search <words...> [-n N]

Docs that hold every word (case-insensitive) in the title, tags, topics, summary or body. Ranked:
title 8, tags 5, topics 4, summary 3, plus body hits (up to 20 per word). Each hit prints
`id · title · score N` and the first line holding all the words. `-n` sets how many (default 10).

## get <id|path|slug...> [--body]

Prints each doc as stored. `--body` prints `# Title` and the body without front matter. A file name
without folders works when it is unique; otherwise the error lists the full ids.

## new <topic> <title> [--tags a,b] [--summary "..."] [--slug name] [--stdin] [--force]

Creates `<root>/<topic>/<slug>.md` with front matter (title, topics, tags, summary, updated) and a
stub body, or the body read from stdin with `--stdin`. Prints the absolute path, then rebuilds the
index. Refuses to overwrite unless `--force`.

## index

Rebuilds `index.json` (navigation tree and one record per doc, read by the viewer) and `INDEX.md`
(one line per doc grouped by topic, for agents). Prints warnings: missing title, topics or summary,
summary over 200 characters, duplicate file names, email addresses, home-directory paths.

## bundle <topic|id...> [-o FILE] [--title "..."]

Joins every doc under the given topics (or the given ids) into one Markdown file: a title, a contents
list, then each doc as `# Title`, its topics, tags and summary, and its body. Without `-o` it prints to
stdout; with `-o` it writes the file and prints its size in words and an estimate in tokens.

## Library config (optional)

`docs.config.json` at the library root:

```json
{ "title": "Team docs", "topicOrder": ["guide", "reference"], "topicLabels": { "reference/api": "API" } }
```

`topicOrder` sorts the top of the navigation; `topicLabels` renames topics (default: the last part of
the topic, capitalized).

## Exit codes

0 ok · 1 invalid request · 2 not found · 4 nothing matched.
