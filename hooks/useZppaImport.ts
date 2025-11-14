import { useCallback, useMemo, useState } from "react";
import type { AuditHook, DiffResult, Snapshot, StageResponse } from "../services/ingestionTypes";
import type { ValidationIssue, ZppaRecord } from "../services/validation";
import { ZppaIngestionService } from "../services/zppaIngestion";

export type ImportStatus =
  | "idle"
  | "validating"
  | "staged"
  | "promoting"
  | "rollingBack"
  | "error";

interface ImportState {
  status: ImportStatus;
  progress: number;
  issues: ValidationIssue[];
  diff: DiffResult<ZppaRecord> | null;
  snapshot?: Snapshot<ZppaRecord>;
  error?: string;
}

export function useZppaImport(auditHook?: AuditHook) {
  const service = useMemo(() => new ZppaIngestionService({ auditHook }), [auditHook]);
  const [state, setState] = useState<ImportState>({ status: "idle", progress: 0, issues: [], diff: null });

  const updateState = useCallback((partial: Partial<ImportState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const stage = useCallback(
    async (csv: string, actorId: string) => {
      updateState({ status: "validating", progress: 0.25, error: undefined });
      try {
        const result: StageResponse<ZppaRecord> = await service.stageCsv(csv, actorId);
        if (!result.success) {
          updateState({
            status: "error",
            progress: 0,
            issues: result.issues,
            diff: null,
            error: "Validation failed",
          });
          return result;
        }
        updateState({
          status: "staged",
          progress: 0.5,
          issues: [],
          diff: result.diff ?? null,
          snapshot: result.snapshot,
        });
        return result;
      } catch (error) {
        updateState({ status: "error", progress: 0, error: (error as Error).message });
        throw error;
      }
    },
    [service, updateState],
  );

  const promote = useCallback(
    async (actorId: string) => {
      updateState({ status: "promoting", progress: 0.75, error: undefined });
      try {
        const snapshot = await service.promote(actorId);
        updateState({ status: "idle", progress: 1, snapshot, diff: null });
        return snapshot;
      } catch (error) {
        updateState({ status: "error", progress: 0.5, error: (error as Error).message });
        throw error;
      }
    },
    [service, updateState],
  );

  const rollback = useCallback(
    async (actorId: string) => {
      updateState({ status: "rollingBack", progress: 0.5, error: undefined });
      try {
        const snapshot = await service.rollback(actorId);
        updateState({ status: "idle", progress: 1, snapshot });
        return snapshot;
      } catch (error) {
        updateState({ status: "error", progress: 0.5, error: (error as Error).message });
        throw error;
      }
    },
    [service, updateState],
  );

  const refreshDiff = useCallback(async () => {
    const diff = await service.diffWithProduction();
    updateState({ diff });
    return diff;
  }, [service, updateState]);

  return {
    service,
    state,
    stage,
    promote,
    rollback,
    refreshDiff,
  };
}
