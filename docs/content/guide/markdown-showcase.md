---
title: Markdown showcase
topics: [guide]
tags: [markdown, tables, code, gfm]
summary: Everything the viewer renders, on one page: headings, lists, tables, quotes and highlighted code.
updated: 2026-11-03
order: 3
---

The viewer renders GitHub-flavoured Markdown. This page shows each element once.

## Text

Plain paragraphs with **bold**, *italic*, `inline code`, ~~strikethrough~~ and [external links](https://github.com/hec-ovi/docs-react).

> A blockquote keeps someone's words apart from the text around them.

## Lists

- An item
- Another item
  - A nested item
1. First step
2. Second step

- [x] A finished task
- [ ] An open task

## Table

| Column | Type | Note |
|---|---|---|
| `id` | string | The path without `.md` |
| `topics` | list | First one places the doc |
| `words` | number | Counted at index time |

## Code

```javascript
export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
```

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

```json
{ "title": "docs-react", "topicOrder": ["guide", "agents", "reference"] }
```

### A heading inside a section

Headings get anchors, and long pages list them in the "On this page" column.
