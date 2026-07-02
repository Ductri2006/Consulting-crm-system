import { z } from "zod";

import {
  casesByMonthQuerySchema,
  recentActivitiesQuerySchema,
  staffPerformanceQuerySchema,
  upcomingDeadlinesQuerySchema,
} from "./dashboard.validation";

export type CasesByMonthQuery = z.infer<
  typeof casesByMonthQuerySchema
>;
export type UpcomingDeadlinesQuery = z.infer<
  typeof upcomingDeadlinesQuerySchema
>;
export type StaffPerformanceQuery = z.infer<
  typeof staffPerformanceQuerySchema
>;
export type RecentActivitiesQuery = z.infer<
  typeof recentActivitiesQuerySchema
>;
