# Frontend ↔ backend integration

This documents wiring `olx-api-frontend` up to the real `olx-api` Go service, and
every change that took to make it work. Read `CLAUDE.md` first for the
architecture; this file is the changelog for the integration pass.

Ground rule followed throughout: **the backend's existing endpoints kept their
existing shapes.** Where the frontend assumed something the backend didn't
provide, either a new backend endpoint was added (never a change to an
existing one), or the frontend was adapted to what the backend actually
returns.

## 1. What was broken before this pass

Comparing `hooks/`, `lib/api/types.ts` against `olx-api/internal/handlers`
turned up:

1. No CORS on the backend at all — a browser could not call it from
   `localhost:3000`, full stop.
2. `SigninResponse` had no JSON tags, so `POST /signin` actually returned
   `{"Token": "...", "ExpiresIn": ...}`, not `{"token", "expiresIn"}`.
3. No `GET /me` — `useMe()` had nothing to call.
4. No `GET /listings/{id}` — the listing detail page and its `generateMetadata`
   had nothing to call.
5. No `GET /me/listings` — the my-listings page had nothing to call.
6. `GET /listings` returns `{ data: [...], next_cursor }`, not a bare array.
7. `POST /listings` returns `{id, title, status, created_at}`, not a full
   listing.
8. Image objects only ever carry `{id, object_key, position}`. There is no
   `thumb_url` / `card_url` / `full_url`, no distinct sizes, and no public URL
   — the worker normalizes each upload to one JPEG and nothing builds a
   servable URL for it.

## 2. Backend changes (`olx-api`)

All additive except the one explicit bug fix.

| File | Change |
| --- | --- |
| `internal/handlers/auth_dto.go` | Added JSON tags to `SigninResponse` (`token`, `expiresIn`) — this was a bug independent of the frontend, fixed as requested. Added `MeResponse`. |
| `internal/handlers/auth.go` | Added `AuthHandler.Me` — `GET /me`, auth required, returns `{id, name, email, created_at}`. |
| `internal/handlers/listings.go` | Added `ListingHandler.Get` — `GET /listings/{id}`, public, reuses the same row shape as `GET /listings` (a single object, not wrapped in `{data}`), 404s if the id doesn't exist. Added `ListingHandler.MyListings` — `GET /me/listings`, auth required, returns the caller's listings (any status, including `processing`/`rejected`) wrapped in the same `{data, next_cursor}` envelope as `GET /listings`, capped at 200 rows, no cursor. Both reuse the existing `collapse`/`toImageResponse` helpers already used by `List`. |
| `internal/middleware/cors.go` (new) | Minimal CORS middleware: reflects one configured origin, handles `OPTIONS` preflight. |
| `internal/config/config.go` | Added `FrontendOrigin`, read from `FRONTEND_ORIGIN`, defaulting to `http://localhost:3000` if unset — existing `.env` files keep working untouched. |
| `cmd/api/main.go` | Registered the three new routes; wrapped the mux with the CORS middleware. No existing route's handler or shape changed. |

Set `FRONTEND_ORIGIN` in the backend's `.env` when the frontend isn't on
`localhost:3000` (e.g. in production).

### Deliberately not touched

- `GET /listings` response shape, `POST /listings` response shape, and the
  `ImageResponse{id, object_key, position}` shape — the frontend adapts to
  these instead (see below).
- No per-size image variants (thumb/card/full) or public-URL field were added
  to any response. That would have meant changing the existing `ImageResponse`
  struct used by three existing endpoints. See section 4.

## 3. Frontend changes (`olx-api-frontend`)

| File | Change |
| --- | --- |
| `lib/api/types.ts` | `ApiImage` now matches the real `{id, object_key, position}`. Added `ListListingsResponse` (the `{data, next_cursor}` envelope) and `CreateListingResponse`. Rewrote `imageUrls()` to build `${NEXT_PUBLIC_R2_PUBLIC_URL}/listings/${listing.id}/${object_key}` instead of reading precomputed URL fields (see §4 for the `listings/{id}/` prefix); dropped the now-meaningless `size` argument everywhere it was called. |
| `hooks/use-listings.ts` | `useListings(filters?)` is now a `useInfiniteQuery`, paging through `GET /listings` with the backend's cursor (`next_cursor` in, `after` out) and forwarding `city`/`min_price`/`max_price`. `useMyListings()` still unwraps `.data` from the envelope (not paginated — see §7). `useCreateListing()`'s success type is now `CreateListingResponse`, matching what `POST /listings` actually returns. |
| `components/shadcn-space/blocks/datatable-01/datatable.tsx` | Status badge map used `failed`, the API's real value is `rejected` — fixed. |
| `.env.example` | Added `NEXT_PUBLIC_R2_PUBLIC_URL`. |

`hooks/use-auth.ts`, `hooks/use-image-uploads.ts`, and the listing-detail page's
`generateMetadata` needed no changes — they already called `GET /me`,
`GET /listings/{id}`, and `POST /uploads/presign` in the shapes those now
match.

## 4. The image URL gap

The backend has no concept of a public, servable image URL — `storage.Client`
only ever does signed PUTs, HEAD checks, and internal GETs. `imageUrls()`
in `lib/api/types.ts` now builds the URL on the client:

```
${NEXT_PUBLIC_R2_PUBLIC_URL}/listings/${listing.id}/${image.object_key}
```

The `listings/{listing.id}/` prefix is not part of `object_key` — the `images`
table stores just the filename (`mintImageKey`), while the worker actually
writes the final object to `listings/{listingId}/{imageId}.jpg`
(`mintFinalObjectKey` in `internal/handlers/images_key.go`). The frontend has
to reassemble that path itself since the API never returns it.

This requires the R2 bucket to be publicly readable (Cloudflare's "Public
Development URL", or a custom domain attached to the bucket) — separate from,
and in addition to, the CORS-for-PUT setup already needed for uploads. Set
`NEXT_PUBLIC_R2_PUBLIC_URL` to that base URL. Leave it unset during local dev
and listings still work, just without photos (`imageUrls()` returns `[]`).

There is also only one size per image (the worker normalizes to a single
2048px-edge JPEG) — no separate thumb/card/full variants exist yet. If that's
wanted later, it belongs in the worker (writing multiple derivatives) and in
`ImageResponse` (returning their keys), which is why it wasn't added here: it
changes an existing response shape.

## 5. Endpoints added — quick reference

```
GET  /me            (auth)  -> {id, name, email, created_at}
GET  /listings/{id}         -> {id, title, description, price, city, status, user_id, images, created_at}
GET  /me/listings    (auth)  -> {data: [...], next_cursor: null}
```

## 6. Running it locally

1. `olx-api`: fill in `.env` as before (see its own setup docs); `FRONTEND_ORIGIN`
   is optional and defaults to `http://localhost:3000`.
2. `olx-api-frontend`: copy `.env.example` to `.env.local`. Set
   `NEXT_PUBLIC_R2_PUBLIC_URL` if the bucket is public; leave blank otherwise.
3. Start both (`go run ./cmd/api` and `pnpm dev`). Sign up, post a listing, and
   confirm it shows up on `/listing` and `/my-listings` once its status flips
   from `processing` to `ready`.

## 7. Pagination and filters (`/listing`)

`useListings(filters?)` (`hooks/use-listings.ts`) is a `useInfiniteQuery`
against `GET /listings`. City and price-bucket filters (`app/(landing)/listing/filters.ts`)
are sent as real query params (`city`, `min_price`, `max_price`) and the
"Load more" button on `/listing` calls `fetchNextPage()`, which sends the
previous page's `next_cursor` back as `after`. Changing a filter changes the
React Query key, which resets pagination automatically.

The sort dropdown was removed: the backend always orders `created_at DESC,
id DESC` and has no server-side sort by price, so a client-side sort could
only ever be correct on the one page currently loaded — it silently broke
the moment there was a second page. The API's fixed newest-first order is
kept as-is.

The search box also stays client-side (the backend has no full-text search),
but is now explicitly scoped to already-loaded pages only — typing a term
does not fetch further pages to search them.

### Known simplifications (not bugs)

- The city filter dropdown is populated from a separate, unfiltered
  `useListings()` sample (first page, default limit) rather than a real
  "distinct cities" endpoint — a city that only appears on a later page won't
  show up as an option.
- `GET /me/listings` is still capped at 200 rows with no cursor — a personal
  listings page didn't need full pagination for this course project.
