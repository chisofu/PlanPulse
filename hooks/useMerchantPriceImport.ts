import { useCallback, useMemo, useState } from "react";
import type { AuditHook, DiffResult, Snapshot } from "../services/ingestionTypes";
import type { ValidationIssue, MerchantPriceRecord } from "../services/validation";
import { MerchantPriceIngestionService, type MerchantStageResponse, type PriceVariance } from "../services/merchantPriceIngestion";

interface ImportState {
  status: ImportStatus;
  progress: number;
  issues: ValidationIssue[];
  diff: DiffResult<MerchantPriceRecord> | null;
  priceAlerts: PriceVariance[];
  requiresOverride: boolean;
  snapshot?: Snapshot<MerchantPriceRecord>;
  error?: string;
}

export type ImportStatus =
  | "idle"
  | "validating"
  | "staged"
  | "promoting"
  | "rollingBack"
  | "error";

export function useMerchantPriceImport(auditHook?: AuditHook) {
  const service = useMemo(() => new MerchantPriceIngestionService({ auditHook }), [auditHook]);
  const [state, setState] = useState<ImportState>({
    status: "idle",
    progress: 0,
    issues: [],
    diff: null,
    priceAlerts: [],
    requiresOverride: false,
  });

  const updateState = useCallback((partial: Partial<ImportState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const stage = useCallback(
    async (csv: string, actorId: string) => {
      updateState({ status: "validating", progress: 0.25, error: undefined });
      try {
        const result: MerchantStageResponse = await service.stageCsv(csv, actorId);
        if (!result.success) {
          updateState({
            status: "error",
            progress: 0,
            issues: result.issues,
            diff: null,
            priceAlerts: [],
            requiresOverride: false,
            error: "Validation failed",
          });
          return result;
        }
        updateState({
          status: "staged",
          progress: 0.5,
          issues: [],
          diff: result.diff ?? null,
          priceAlerts: result.priceAlerts,
          requiresOverride: result.requiresOverride,
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
        updateState({
          status: "idle",
          progress: 1,
          snapshot,
          diff: null,
          priceAlerts: [],
          requiresOverride: false,
        });
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

  const refreshPriceAlerts = useCallback(async () => {
    const alerts = await service.getPriceAlerts();
    updateState({ priceAlerts: alerts, requiresOverride: alerts.length > 0 });
    return alerts;
  }, [service, updateState]);

  return {
    service,
    state,
    stage,
    promote,
    rollback,
    refreshDiff,
    refreshPriceAlerts,
  };
}
