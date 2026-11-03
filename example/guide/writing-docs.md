---
title: Writing docs
topics: [guide]
tags: [front-matter, topics, format]
summary: The front matter every doc carries, how topics build the navigation, and links between docs.
updated: 2026-11-03
order: 2
---

Every doc is one `.md` file. A short front matter block on top tells the viewer where the doc belongs and how to describe it.

## Front matter

```yaml
---
title: Writing docs
topics: [guide, reference/format]
tags: [front-matter, topics]
summary: One line that tells a reader (or an agent) what the doc holds.
updated: 2026-11-03
order: 2
---
```

| Field | Required | Use |
|---|---|---|
| `title` | yes | Shown as the page heading and in the navigation |
| `topics` | yes | The first topic places the doc in the navigation; nest with `/` |
| `tags` | no | Extra words for search |
| `summary` | yes | One line, under 160 characters, shown in the index |
| `updated` | no | A date; defaults to the file's modification day |
| `order` | no | A number that sorts docs inside a topic |

Lists can also be written as YAML blocks:

```yaml
tags:
  - front-matter
  - topics
```

## Topics build the navigation

`topics: [reference/api]` puts the doc under **Reference**, then **Example API**. A doc can carry several topics: the first places it in the navigation, the others make it show up in `docs list <topic>` and in bundles.

## The body

Start with a short lead paragraph, then `##` sections. The title is printed from the front matter, so there is no need to repeat it as `# Title`.

Link other docs with relative paths, such as [the Markdown showcase](markdown-showcase.md) or [the CLI](../agents/cli.md). Images sit next to the docs and use relative paths too.
