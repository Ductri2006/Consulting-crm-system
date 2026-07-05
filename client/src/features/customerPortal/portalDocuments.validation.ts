import { z } from 'zod'
import {
  portalDocumentSources,
  type PortalDocumentUploadInput,
} from './portalDocuments.types'
import { portalDocumentTypes } from './portalCases.types'

const fileListSchema = z
  .custom<FileList>((value) => value instanceof FileList)
  .refine((value) => value.length > 0, 'A file is required.')

export const portalDocumentSearchSchema = z
  .string()
  .trim()
  .max(100, 'Search must not exceed 100 characters.')

export const portalDocumentSourceFilterSchema = z
  .enum(portalDocumentSources)
  .or(z.literal(''))

export const portalDocumentFilterSchema = z.object({
  search: portalDocumentSearchSchema,
  caseId: z.string().trim(),
  source: portalDocumentSourceFilterSchema,
})

export const portalDocumentUploadFormSchema = z.object({
  file: fileListSchema,
  caseProfileId: z.string().trim(),
  fileType: z.enum(portalDocumentTypes),
})

export const toPortalDocumentUploadInput = (
  values: z.infer<typeof portalDocumentUploadFormSchema>,
): PortalDocumentUploadInput => ({
  file: values.file[0],
  fileType: values.fileType,
  ...(values.caseProfileId.trim() && {
    caseProfileId: values.caseProfileId.trim(),
  }),
})
