import { API_BASE_URL } from '../config/env'
import { ApiError } from './apiClient'

export const PORTAL_ACCESS_TOKEN_STORAGE_KEY = 'advisora_portal_access_token'
export const PORTAL_AUTH_UNAUTHORIZED_EVENT =
  'advisora-portal:unauthorized'

type RequestOptions = Omit<RequestInit, 'body' | 'method'>

interface ApiEnvelope<T> {
  success: true
  message: string
  data: T
}

const canUseBrowserStorage = () => typeof window !== 'undefined'

export const getPortalAccessToken = (): string | null => {
  if (!canUseBrowserStorage()) {
    return null
  }

  try {
    return window.localStorage.getItem(PORTAL_ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export const setPortalAccessToken = (token: string | null): void => {
  if (!canUseBrowserStorage()) {
    return
  }

  try {
    if (token) {
      window.localStorage.setItem(PORTAL_ACCESS_TOKEN_STORAGE_KEY, token)
      return
    }

    window.localStorage.removeItem(PORTAL_ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in restricted browsing modes.
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message
  }

  return fallback
}

const getErrorDetails = (payload: unknown): unknown => {
  if (isRecord(payload) && 'errors' in payload) {
    return payload.errors
  }

  return undefined
}

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const responseText = await response.text()

  if (!responseText) {
    return undefined
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    return responseText
  }
}

const notifyPortalUnauthorized = (): void => {
  setPortalAccessToken(null)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PORTAL_AUTH_UNAUTHORIZED_EVENT))
  }
}

const buildUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, '')}`

const request = async <T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> => {
  const headers = new Headers(options.headers)
  const token = getPortalAccessToken()

  headers.set('Accept', 'application/json')

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to connect to the server. Please try again.',
    )
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    if (response.status === 401) {
      notifyPortalUnauthorized()
    }

    throw new ApiError(
      response.status,
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
      getErrorDetails(payload),
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (
    isRecord(payload) &&
    payload.success === true &&
    'data' in payload
  ) {
    return (payload as unknown as ApiEnvelope<T>).data
  }

  throw new ApiError(
    response.status,
    'The server returned an unexpected response.',
  )
}

export const portalApiClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>(path, 'GET', undefined, options),

  post: <T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<T> => request<T>(path, 'POST', body, options),

  patch: <T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<T> => request<T>(path, 'PATCH', body, options),
}
