# Nigeria Livestock Price Index API

FarmPaddy's **Nigeria Livestock Price Index** — per-state, per-product figures
aggregated from field-agent submissions across Nigeria. Pull the **current** index or
**daily history**, filtered by product, state, and category.

- **Base URL:** `https://www.farmpaddy.com`
- **Format:** JSON over HTTPS. `GET` only.
- **Pricing units:** cattle & goats are priced **per head**, vaccines **per dose**,
  everything else **per kg**. Each price carries its `unit`.

---

## Authentication

Every `/api/v1/*` request needs an API key, sent either way:

```
X-API-Key: fp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```
Authorization: Bearer fp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Missing or invalid keys get `401 { "error": "invalid_api_key" }`.

**Getting a key:** keys are issued by the FarmPaddy team — contact us to request one.
Keep it secret; treat it like a password. A key can be revoked at any time.

---

## Rate limits

Best-effort **120 requests/minute** per key. Responses include:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Requests allowed per window |
| `X-RateLimit-Remaining` | Requests left in the current window |
| `X-RateLimit-Reset` | Unix time (seconds) when the window resets |

Over the limit returns `429 { "error": "rate_limited" }` with a `Retry-After` header.
Responses are edge-cached ~15 min, so polling more often than that just returns cached data.

---

## Endpoints

### `GET /api/v1/prices` — current index

Query parameters (all optional):

| Param | Description |
|---|---|
| `state` | Nigerian state, exact match, case-insensitive (e.g. `Kano`) |
| `product` | Product name, case-insensitive substring (e.g. `broiler`) |
| `category` | One of: `poultry`, `cattle`, `goat`, `sheep`, `pig`, `fish`, `feed`, `eggs`, `vaccine`, `other` |

```bash
curl -H "X-API-Key: $FARMPADDY_KEY" \
  "https://www.farmpaddy.com/api/v1/prices?state=Kano&category=poultry"
```

```json
{
  "fetchedAt": "2026-07-20T06:00:00.000Z",
  "count": 1,
  "degraded": false,
  "stale": false,
  "prices": [
    {
      "product": "Broiler (live)",
      "category": "poultry",
      "state": "Kano",
      "unit": "per kg",
      "priceNgn": 3200,
      "lowNgn": 2900,
      "highNgn": 3600,
      "confidence": 84,
      "sampleSize": 6
    }
  ]
}
```

### `GET /api/v1/prices/history` — daily history

Same filters as above, plus a date window. Each point is the modeled price for that
product + state **on that day**.

| Param | Description |
|---|---|
| `from` | Start date `YYYY-MM-DD`. Defaults to 90 days before `to`. |
| `to` | End date `YYYY-MM-DD`. Defaults to today (West Africa Time). |
| `state`, `product`, `category` | As in `/prices` |

```bash
curl -H "X-API-Key: $FARMPADDY_KEY" \
  "https://www.farmpaddy.com/api/v1/prices/history?product=broiler&from=2026-05-01&to=2026-07-01"
```

```json
{
  "from": "2026-05-01",
  "to": "2026-07-01",
  "count": 2,
  "degraded": false,
  "stale": false,
  "prices": [
    { "date": "2026-06-14", "product": "Broiler (live)", "category": "poultry", "state": "Kano", "unit": "per kg", "priceNgn": 3200, "lowNgn": 3000, "highNgn": 3400, "confidence": 80, "sampleSize": 4 },
    { "date": "2026-05-30", "product": "Broiler (live)", "category": "poultry", "state": "Kano", "unit": "per kg", "priceNgn": 3050, "lowNgn": 2900, "highNgn": 3200, "confidence": 74, "sampleSize": 3 }
  ]
}
```

### `GET /api/v1/meta` — query vocabulary

Lists the states and products currently in the index, the category vocabulary, and the
unit per category — useful for building dropdowns or validating queries.

```bash
curl -H "X-API-Key: $FARMPADDY_KEY" "https://www.farmpaddy.com/api/v1/meta"
```

---

## Response fields

| Field | Meaning |
|---|---|
| `product` | Canonical product name, e.g. `Broiler (live)` |
| `category` | Product category (see the list above) |
| `state` | Nigerian state |
| `unit` | `per head` (cattle, goats), `per dose` (vaccines) or `per kg` |
| `priceNgn` | Modeled representative price in ₦ (outlier-trimmed median) |
| `lowNgn` / `highNgn` | Plausible low–high range for the point |
| `confidence` | 0–100, from sample size and price spread. Higher = more agent data, tighter agreement |
| `sampleSize` | Number of agent entries behind the figure |
| `date` | (history only) `YYYY-MM-DD` in West Africa Time |
| `fetchedAt` | When the index was last rebuilt |
| `degraded` | `true` when the underlying dataset is thin — treat prices as indicative |
| `stale` | `true` when serving the last good index because a refresh failed |

Prices are FarmPaddy's own modeled estimates for guidance — not a quote or a guarantee.

---

## Errors

| Status | Body | Cause |
|---|---|---|
| `400` | `{ "error": "invalid_query" }` | Bad `category`, malformed `from`/`to`, or `from` after `to` |
| `401` | `{ "error": "invalid_api_key" }` | Missing, unknown, or revoked key |
| `429` | `{ "error": "rate_limited" }` | Over the rate limit |
| `502` | `{ ... "stale": true }` | Index temporarily unavailable and nothing cached |

## OpenAPI

A machine-readable spec is served at
[`/api/openapi.json`](https://www.farmpaddy.com/api/openapi.json).
