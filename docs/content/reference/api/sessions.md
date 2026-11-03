---
title: Sessions
topics: [reference/api]
tags: [api, sessions]
summary: An example API page: create, list and delete chat sessions.
updated: 2026-11-03
order: 2
---

Sample content: a small REST resource with three endpoints.

## Endpoints

| Method | Path | Does |
|---|---|---|
| `POST` | `/sessions` | Create a session |
| `GET` | `/sessions` | List your sessions |
| `DELETE` | `/sessions/{id}` | Delete a session and its messages |

## Create a session

```bash
curl -X POST https://api.example.com/sessions \
  -H "Authorization: Bearer abcd1234" \
  -d '{"name": "Research"}'
```

```json
{ "id": "s_01", "name": "Research", "created": "2026-11-03T10:00:00Z" }
```

Back to [authentication](authentication.md).
