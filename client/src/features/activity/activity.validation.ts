import { z } from 'zod'

export const activityFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export type ActivityFilterValues = z.infer<typeof activityFilterSchema>
