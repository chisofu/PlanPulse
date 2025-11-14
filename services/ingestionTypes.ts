import type { ValidationIssue } from "./validation";

export interface AuditEvent {
  dataset: "zppa" | "merchant";
  action: "stage" | "promote" | "rollback";
  actorId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type AuditHook = (event: AuditEvent) => void | Promise<void>;

export interface DiffResult<T> {
  added: T[];
  removed: T[];
  updated: { previous: T; next: T }[];
}

export interface StageResponse<T> {
  success: boolean;
  issues: ValidationIssue[];
  snapshot?: Snapshot<T>;
  diff?: DiffResult<T>;
}

export interface Snapshot<T> {
  data: T[];
  stagedAt: string;
  actorId: string;
}
