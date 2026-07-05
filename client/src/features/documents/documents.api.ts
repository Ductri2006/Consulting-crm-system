import { API_BASE_URL } from '../../config/env'
import {
  AUTH_UNAUTHORIZED_EVENT,
  ApiError,
  apiClient,
  getAccessToken,
  setAccessToken,
} from '../../lib/apiClient'
import type {
  CaseOptionListResponse,
  CustomerOptionListResponse,
  DocumentDetail,
  DocumentListParams,
  DocumentListResponse,
  DocumentPortalVisibilityInput,
  DocumentRecord,
  DocumentUploadInput,
  UserOptionListResponse,
} from './documents.types'

interface DocumentResponse<TDocument extends DocumentRecord = DocumentRecord> {
  document: TDocument
}

interface ApiEnvelope<T> {
  success: true
  message: string
  data: T
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, '')}`

const setOptionalParam = (
  query: URLSearchParams,
  key: string,
  value?: string,
): void => {
  const trimmed = value?.trim()

  if (trimmed) {
    query.set(key, trimmed)
  }
}

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallback
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

const notifyUnauthorized = (): void => {
  setAccessToken(null)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
  }
}

const unwrapEnvelope = <T>(payload: unknown, status: number): T => {
  if (isRecord(payload) && payload.success === true && 'data' in payload) {
    return (payload as unknown as ApiEnvelope<T>).data
  }

  throw new ApiError(status, 'The server returned an unexpected response.')
}

const buildDocumentListQuery = (params: DocumentListParams): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'fileType', params.fileType)
  setOptionalParam(query, 'storageProvider', params.storageProvider)
  setOptionalParam(query, 'scanStatus', params.scanStatus)
  setOptionalParam(query, 'ocrStatus', params.ocrStatus)
  setOptionalParam(query, 'customerId', params.customerId)
  setOptionalParam(query, 'caseProfileId', params.caseProfileId)
  setOptionalParam(query, 'uploadedById', params.uploadedById)

  return query.toString()
}

export const listDocuments = (
  params: DocumentListParams,
): Promise<DocumentListResponse> =>
  apiClient.get<DocumentListResponse>(
    `/documents?${buildDocumentListQuery(params)}`,
  )

export const getDocument = async (id: string): Promise<DocumentDetail> => {
  const response = await apiClient.get<DocumentResponse<DocumentDetail>>(
    `/documents/${id}`,
  )
  return response.document
}

export const uploadDocument = async (
  input: DocumentUploadInput,
): Promise<DocumentRecord> => {
  const formData = new FormData()
  const token = getAccessToken()

  formData.append('file', input.file)
  formData.append('fileType', input.fileType)

  if (input.customerId) {
    formData.append('customerId', input.customerId)
  }

  if (input.caseProfileId) {
    formData.append('caseProfileId', input.caseProfileId)
  }

  let response: Response

  try {
    response = await fetch(buildUrl('/documents/upload'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
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
      notifyUnauthorized()
    }

    throw new ApiError(
      response.status,
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
    )
  }

  return unwrapEnvelope<DocumentResponse>(payload, response.status).document
}

export const downloadDocument = async (
  id: string,
  fileName: string,
): Promise<void> => {
  const token = getAccessToken()
  let response: Response

  try {
    response = await fetch(buildUrl(`/documents/${id}/download`), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to connect to the server. Please try again.',
    )
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized()
    }

    const payload = await parseResponseBody(response)
    throw new ApiError(
      response.status,
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
    )
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')

  link.href = url
  link.download = fileName
  globalThis.document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const deleteDocument = async (
  id: string,
): Promise<DocumentRecord> => {
  const response = await apiClient.delete<DocumentResponse>(
    `/documents/${id}`,
  )
  return response.document
}

export const updateDocumentPortalVisibility = async (
  id: string,
  input: DocumentPortalVisibilityInput,
): Promise<DocumentRecord> => {
  const response = await apiClient.patch<DocumentResponse>(
    `/documents/${id}/portal-visibility`,
    input,
  )
  return response.document
}

export const listDocumentCustomers = (
  search = '',
): Promise<CustomerOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)

  return apiClient.get<CustomerOptionListResponse>(
    `/customers?${query.toString()}`,
  )
}

export const listDocumentCases = (
  search = '',
): Promise<CaseOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)

  return apiClient.get<CaseOptionListResponse>(
    `/cases?${query.toString()}`,
  )
}

export const listDocumentUploaders =
  (): Promise<UserOptionListResponse> =>
    apiClient.get<UserOptionListResponse>('/users/assignable')
