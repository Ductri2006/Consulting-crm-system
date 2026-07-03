import { z } from 'zod'
import { editableConsultationRequestStatuses } from './consultationRequests.types'

export const updateConsultationRequestStatusSchema = z.object({
  status: z.enum(editableConsultationRequestStatuses),
})
