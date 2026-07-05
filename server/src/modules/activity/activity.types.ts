import type { UserRole } from "@prisma/client";

import type { PaginationMeta } from "../../utils/pagination";

export type ActivitySort = "newest" | "oldest";

export interface ActivityListQuery {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  actorUserId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  sort: ActivitySort;
}

export interface ActivityActorSummary {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: Date;
  actor: ActivityActorSummary | null;
}

export interface ActivityListResult {
  items: ActivityItem[];
  meta: PaginationMeta;
}

export interface ActivitySummaryResult {
  totalToday: number;
  documentEventsToday: number;
  portalEventsToday: number;
  caseEventsToday: number;
  recentActivities: ActivityItem[];
}
