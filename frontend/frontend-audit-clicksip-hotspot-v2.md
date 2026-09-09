# Frontend Audit — ClickSIP Hotspot

## SECTION A: Backend API Changes Requiring Frontend Integration

### A1. GET `/api/analytics/:campaignId` — Response Shape Changed (BREAKING)

**File:** `Analytics.tsx:29`

#### Before

```json
{
  "events": [
    {
      "eventType": "view",
      "_count": 5
    }
  ],
  "leads": 12
}
```

#### After

```json
{
  "events": [
    {
      "id": 1,
      "campaignId": 1,
      "eventType": "view",
      "timestamp": "...",
      "domain": "...",
      "metadata": {}
    }
  ],
  "aggregated": [
    {
      "eventType": "view",
      "_count": 5
    }
  ],
  "leads": 12
}
```

#### Required Change

**Current (broken):**

```ts
setEvents(eventsRes.data);
```

**Fixed:**

```ts
setEvents(eventsRes.data.events);
```

#### Impact if Not Fixed

- Views show zero
- Clicks show zero
- CTR shows zero
- Charts are empty
- Domain breakdown is empty

---

### A2. GET `/api/leads` — Now Supports `?campaignId=N` Filter

**Files:** `LeadsManager.tsx:21–23`, `Analytics.tsx:26`

#### Before

Always returned all user leads regardless of the query parameter.

#### After

Accepts an optional `?campaignId=N` filter.

Response now includes a slim campaign relation:

```json
{
  "id": 1,
  "campaignId": 1,
  "email": "...",
  "campaign": {
    "id": 1,
    "name": "..."
  }
}
```

#### Required Changes

- **`LeadsManager.tsx`** — Remove `campaignsApi.findAll()` and the `getCampaignName()` lookup. Use `lead.campaign.name` directly.
- **`Analytics.tsx`** — Already calls `leadsApi.findAll(id)`; this now correctly filters server-side.

---

### A3. DELETE `/api/leads/:id` — Now Returns 403 for Unauthorized Requests

**File:** `LeadsManager.tsx:70–78`

#### Before

There was no ownership check; the lead was always deleted.

#### After

Returns `403 Forbidden` if the lead belongs to another user.

#### Required Change

Handle `403` specifically instead of showing the generic:

> "Failed to delete lead"

---

### A4. GET `/api/campaigns/:id` — Now Returns 404 for Unauthorized Requests

**Files:** `CampaignEditor.tsx:90–105`, `Analytics.tsx:18–38`

#### Before

There was no ownership check; any authenticated user could fetch any campaign.

#### After

Returns `404 Not Found` if the campaign belongs to another user.

#### Current Handling

Both files catch errors and redirect to `/`.

**Required Change:** No change is needed, but error messages could be made more specific.

---

### A5. POST `/api/uploads` — Now Validates File Type and Size

**Files:** `Dashboard.tsx:42–55`, `CampaignEditor.tsx:190–203`

#### Before

Accepted any file of any size.

#### After

Returns `400 Bad Request` for:

- Disallowed file extensions
- Files larger than 10MB

#### Required Changes

1. Add client-side file type validation before upload.
2. Match the backend allowlist:
   - `jpg`
   - `jpeg`
   - `png`
   - `gif`
   - `webp`
   - `svg`
   - `mp4`
   - `webm`
   - `mp3`
   - `wav`
   - `ogg`
3. Add a client-side size check for files **under 10MB**.
4. Show specific error messages for:
   - File type mismatch
   - File size limit exceeded

---

### A6. POST `/api/auth/login` and POST `/api/auth/register` — Rate Limited

**File:** `Auth.tsx:14–31`

#### Before

Requests were unlimited.

#### After

Returns `429 Too Many Requests` when rate limited:

- Login: **10 requests / 15 seconds**
- Register: **5 requests / 15 minutes**
- Rate limiting is applied per IP

#### Current Handling

```ts
err.response?.data?.message || 'Authentication failed'
```

This may not clearly surface the rate-limit message.

#### Required Change

Check for `401` vs `429` and show:

> "Too many attempts. Please try again later."

for `429` responses.

---

# SECTION B: Frontend Bugs and Type Mismatches

## B1. Type Mismatches (`types.ts`)

The backend uses:

```prisma
Int @id @default(autoincrement())
```

for all IDs, but the frontend currently types all IDs as `string`.

| Field | Current | Should Be |
|---|---|---|
| `Campaign.id` | `string` | `number` |
| `Campaign.userId` | `string` | `number` |
| `Domain.id` | `string` | `number` |
| `Domain.userId` | `string` | `number` |
| `Hotspot.id` | `string` | `string \| number` |

### Impact

Every ID comparison using `===` or `!==` relies on implicit `toString()` coercion.

This can cause subtle bugs when strict typing is expected.

---

# SECTION C: Dummy Content to Remove

| File | Line | Content | Action |
|---|---:|---|---|
| `HotspotRenderer.tsx` | 469 | `(128 reviews)` hardcoded on every product modal | Remove — no review system exists |
| `Analytics.tsx` | 114–117 | `trend: "+ --%"` static strings on stat cards | Remove trend badge or compute from data |
| `CampaignEditor.tsx` | 256 | `"AI Magic Scan"` button fires `alert("Magic scan running...")` | Implement or remove |
| `Auth.tsx` | 64–73 | Fake testimonial: `"ClickSIP transformed... Sarah Jenkins, Head of E-commerce, StyleCo"` with fake 5-star rating | Replace with real testimonial or remove |
| `Dashboard.tsx` | 267 | `"Summer Collection 2024"` placeholder (outdated year) | Change to `"e.g. Summer Collection"` |
| `CampaignEditor.tsx` | 1070 | `"MCOM Properties"` deployment instruction | Remove — client-specific reference |

---

# SECTION D: Inefficiencies

## D1. LeadsManager Redundant API Call

**File:** `LeadsManager.tsx:21–23`

Calls `campaignsApi.findAll()` to build a campaign name lookup map.

The backend now returns:

```json
{
  "campaign": {
    "id": 1,
    "name": "..."
  }
}
```

on each lead.

### Required Change

Remove the redundant campaigns API call and use:

```ts
lead.campaign.name
```

directly.

---

## D2. CampaignEditor Over-Fetches for Scene Dropdown

**File:** `CampaignEditor.tsx:92–95`

`findAll()` fetches all campaigns with all hotspots just to populate the **Target Scene** dropdown.

### Required Change

Use a lightweight endpoint that returns only:

```json
{
  "id": 1,
  "name": "..."
}
```

for the dropdown.

> **Note:** This is not a bug, but it is wasteful.

---

# Summary by Priority

| Priority | Section | Issue | File |
|---|---|---|---|
| **Critical** | A1 | Analytics data shape mismatch | `Analytics.tsx` |
| **Critical** | B1 | Type mismatches (string vs number IDs) | `types.ts` |
| **High** | A2 | Leads `campaignId` filter + slim response | `LeadsManager.tsx`, `Analytics.tsx` |
| **High** | A3 | Leads delete 403 handling | `LeadsManager.tsx` |
| **High** | A5 | Upload file type/size validation | `Dashboard.tsx`, `CampaignEditor.tsx` |
| **Medium** | A6 | Auth rate-limit handling | `Auth.tsx` |
| **Medium** | C1–C6 | Dummy content (6 instances) | Multiple files |
| **Low** | D1 | Redundant campaigns fetch | `LeadsManager.tsx` |
| **Low** | D2 | Over-fetching for scene dropdown | `CampaignEditor.tsx` |
