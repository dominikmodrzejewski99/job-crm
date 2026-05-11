import { DsApplicationStatus } from '@frontend/design-system/badge';

// Mirrors pl.dmod.crm.application.domain.ApplicationStatus on the backend.
export type ApiApplicationStatus =
  | 'DRAFT'
  | 'APPLIED'
  | 'ACK_RECEIVED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_DONE'
  | 'TASK_RECEIVED'
  | 'TASK_SUBMITTED'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'GHOSTED';

export type ApiApplicationSource =
  | 'LINKEDIN'
  | 'JUSTJOIN'
  | 'NOFLUFF'
  | 'REFERRAL'
  | 'COMPANY_SITE'
  | 'OTHER';

export interface ApiApplication {
  id: string;
  companyName: string;
  position: string;
  jobUrl: string | null;
  source: ApiApplicationSource;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  appliedAt: string;
  currentStatus: ApiApplicationStatus;
  nextFollowUpAt: string | null;
  archived: boolean;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
}

const statusMap: Record<ApiApplicationStatus, DsApplicationStatus> = {
  DRAFT: 'draft',
  APPLIED: 'applied',
  ACK_RECEIVED: 'ack',
  INTERVIEW_SCHEDULED: 'intsch',
  INTERVIEW_DONE: 'intdone',
  TASK_RECEIVED: 'taskrx',
  TASK_SUBMITTED: 'tasktx',
  OFFER: 'offer',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdraw',
  GHOSTED: 'ghosted',
};

export function statusToBadge(s: ApiApplicationStatus): DsApplicationStatus {
  return statusMap[s];
}
