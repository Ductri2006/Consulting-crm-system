import { z } from 'zod'
import {
  documentTypes,
  type DocumentUploadFormValues,
  type DocumentUploadInput,
} from './documents.types'

const fileListSchema = z
  .custom<FileList>((value) => value instanceof FileList)
  .refine((value) => value.length > 0, 'A file is required.')

export const documentUploadFormSchema = z
  .object({
    file: fileListSchema,
    customerId: z.string().trim(),
    caseProfileId: z.string().trim(),
    fileType: z.enum(documentTypes),
  })
  .refine(
    (values) =>
      values.customerId.trim() !== '' || values.caseProfileId.trim() !== '',
    {
      path: ['customerId'],
      message: 'Select a customer or case profile.',
    },
  )

const optionalTrimmedText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed || undefined
}

export const toDocumentUploadInput = (
  values: DocumentUploadFormValues,
): DocumentUploadInput => ({
  file: values.file[0],
  fileType: values.fileType,
  ...(optionalTrimmedText(values.customerId) && {
    customerId: values.customerId.trim(),
  }),
  ...(optionalTrimmedText(values.caseProfileId) && {
    caseProfileId: values.caseProfileId.trim(),
  }),
})
