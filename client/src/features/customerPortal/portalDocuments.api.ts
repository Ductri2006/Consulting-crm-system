import { portalApiClient } from '../../lib/portalApiClient'
import type {
  PortalDocumentListParams,
  PortalDocumentListResponse,
  PortalDocumentRecord,
  PortalDocumentUploadInput,
} from './portalDocuments.types'

interface PortalDocumentResponse {
  document: PortalDocumentRecord
}

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

const buildDocumentListQuery = (
  params: PortalDocumentListParams,
): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'caseId', params.caseId)
  setOptionalParam(query, 'fileType', params.fileType)
  setOptionalParam(query, 'source', params.source)

  return query.toString()
}

const saveBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')

  link.href = url
  link.download = fileName
  globalThis.document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const listPortalDocuments = (
  params: PortalDocumentListParams,
): Promise<PortalDocumentListResponse> =>
  portalApiClient.get<PortalDocumentListResponse>(
    `/portal/documents?${buildDocumentListQuery(params)}`,
  )

export const uploadPortalDocument = async (
  input: PortalDocumentUploadInput,
): Promise<PortalDocumentRecord> => {
  const formData = new FormData()

  formData.append('file', input.file)
  formData.append('fileType', input.fileType)

  if (input.caseProfileId) {
    formData.append('caseProfileId', input.caseProfileId)
  }

  const response = await portalApiClient.postForm<PortalDocumentResponse>(
    '/portal/documents',
    formData,
  )

  return response.document
}

export const downloadPortalDocument = async (
  id: string,
  fileName: string,
): Promise<void> => {
  const response = await portalApiClient.download(
    `/portal/documents/${id}/download`,
  )

  saveBlob(response.blob, response.fileName ?? fileName)
}
