/**
 * The single seam between this app and olx-api.
 *
 * Everything that talks to the backend goes through `apiFetch`, which exists to
 * do one thing the raw `fetch` API refuses to: turn a non-2xx response into a
 * thrown error. `fetch` only rejects on network failure, so without this every
 * caller would have to remember to check `res.ok` — and the one that forgets
 * renders an error envelope as if it were data.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'

/** Error codes the API returns in its `{ error: { code } }` envelope. */
export type ApiErrorCode =
  | 'invalid_id'
  | 'internal_error'
  | 'malformed_json'
  | 'validation_failed'
  | 'invalid_req_body'
  | 'validation_error'
  | 'invalid_credentials'
  | 'conflict'
  | 'unauthorized'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | (string & {})

interface ApiErrorEnvelope {
  error?: {
    code?: ApiErrorCode
    message?: string
    /** Set on 422s — names the request field that failed validation. */
    field?: string
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly field?: string

  constructor(status: number, message: string, code: ApiErrorCode, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** JWT from the auth store. Omit for public endpoints. */
  token?: string | null
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // A rejected fetch means the request never got an answer: the API is down,
    // DNS failed, or — the one that bites during setup — CORS blocked it. The
    // browser deliberately hides which, so say so rather than guessing.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, `Could not reach the server at ${API_BASE_URL}. Is olx-api running?`, 'network_error')
  }

  if (!response.ok) {
    // The error body is best-effort: a 502 from a proxy in front of the API
    // won't be JSON at all, and failing to parse it must not mask the status.
    let envelope: ApiErrorEnvelope = {}
    try {
      envelope = (await response.json()) as ApiErrorEnvelope
    } catch {
      // Keep the empty envelope and fall back to the status text below.
    }

    throw new ApiError(
      response.status,
      envelope.error?.message ?? response.statusText ?? 'Something went wrong',
      envelope.error?.code ?? 'internal_error',
      envelope.error?.field,
    )
  }

  // 204 (DELETE /listings/{id}) has no body to parse.
  if (response.status === 204) return null as T

  return (await response.json()) as T
}
