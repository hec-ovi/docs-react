---
title: Authentication
topics: [reference/api]
tags: [api, login, token]
summary: An example API page: sign in with a username and password and receive a token.
updated: 2026-11-03
order: 1
---

This page is sample content that shows how an API reference reads in docs-react.

## Sign in

```http
POST /user/signin
Content-Type: application/json
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | The user's login name |
| `password` | string | yes | The user's password |

### Response

```json
{
  "token": "abcd1234",
  "expires_in": 3600
}
```

## Sign out

```bash
curl -X POST https://api.example.com/user/signout -H "Authorization: Bearer abcd1234"
```

Next: [sessions](sessions.md).
