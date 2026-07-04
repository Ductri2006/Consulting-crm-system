import { z } from 'zod'
import { portalCaseStatuses } from './portalCases.types'

export const portalCaseSearchSchema = z
  .string()
  .trim()
  .max(100, 'Search must not exceed 100 characters.')

export const portalCaseStatusFilterSchema = z
  .enum(portalCaseStatuses)
  .or(z.literal(''))

export const portalCaseListFilterSchema = z.object({
  search: portalCaseSearchSchema,
  status: portalCaseStatusFilterSchema,
})

export type PortalCaseListFilterValues = z.infer<
  typeof portalCaseListFilterSchema
>
