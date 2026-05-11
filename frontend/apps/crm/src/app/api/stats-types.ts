import { ApiApplicationStatus } from './application-types';

export interface DashboardStats {
  total: number;
  active: number;
  byStatus: Partial<Record<ApiApplicationStatus, number>>;
  funnel: { applied: number; interview: number; offer: number };
  responseRate: number;
  followUpsDueWithin7Days: number;
  weekly: WeeklyBucket[];
}

export interface WeeklyBucket {
  weekStart: string;
  applied: number;
}
