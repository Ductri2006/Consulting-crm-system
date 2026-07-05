import { z } from 'zod'
import { portalUpdateTypes } from './portalUpdates.types'

export const portalUpdateTypeFilterSchema = z
  .enum(portalUpdateTypes)
  .or(z.literal(''))

export type PortalUpdateTypeFilterValues = z.infer<
  typeof portalUpdateTypeFilterSchema
>
