import { useCallback, useEffect, useState } from 'react';
import { ZPPAImportBatch } from '../types';
import { mockIngestionService } from '../services/mockIngestion';
import { useApiErrorHandler } from './useApiErrorHandler';

interface UseZPPAImportResult {
  batches: ZPPAImportBatch[];
  isLoading: boolean;
  activeBatch?: ZPPAImportBatch;
  refresh: () => Promise<void>;
  triggerValidation: (batchId: string) => Promise<void>;
  promote: (batchId: string) => Promise<void>;
  rollback: (batchId: string) => Promise<void>;
  selectBatch: (batchId: string) => void;
}

export const useZPPAImport = (): UseZPPAImportResult => {
  const [batches, setBatches] = useState<ZPPAImportBatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeBatchId, setActiveBatchId] = useState<string | undefined>(undefined);
  const { withErrorHandling } = useApiErrorHandler('ZPPA Imports');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await withErrorHandling(
        () => mockIngestionService.listBatches(),
        {
          suppressSuccess: true,
          errorMessage: 'Unable to load import batches.',
          errorDescription: 'Check your connection and try refreshing the page.',
        },
      );
      if (data) {
        setBatches(data);
        if (data.length && !activeBatchId) {
          setActiveBatchId(data[0].id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeBatchId, withErrorHandling]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutateBatch = useCallback((updatedBatch: ZPPAImportBatch) => {
    setBatches((current) => current.map((batch) => (batch.id === updatedBatch.id ? updatedBatch : batch)));
    setActiveBatchId(updatedBatch.id);
  }, []);

  const triggerValidation = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const updated = await withErrorHandling(
        () => mockIngestionService.triggerValidation(batchId),
        {
          successMessage: 'Validation started',
          successDescription: 'We will refresh the staging area once the checks complete.',
          errorMessage: 'Failed to start validation.',
          errorDescription: 'Please retry in a moment. If the issue persists, review the console logs for more detail.',
        },
      );
      if (updated) {
        mutateBatch(updated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch, withErrorHandling]);

  const promote = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const updated = await withErrorHandling(
        () => mockIngestionService.promote(batchId),
        {
          successMessage: 'Import promoted to production',
          successDescription: 'PricePulse now references this dataset. A timestamp has been added to the audit trail.',
          errorMessage: 'Promotion failed.',
          errorDescription: 'Review the console output and try again or contact support if the problem continues.',
        },
      );
      if (updated) {
        mutateBatch(updated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch, withErrorHandling]);

  const rollback = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const updated = await withErrorHandling(
        () => mockIngestionService.rollback(batchId),
        {
          successMessage: 'Import rollback completed',
          successDescription: 'Staging has been reset and the audit timeline reflects the rollback entry.',
          errorMessage: 'Rollback failed.',
          errorDescription: 'Confirm your network connection and check the console logs before trying again.',
        },
      );
      if (updated) {
        mutateBatch(updated);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch, withErrorHandling]);

  return {
    batches,
    isLoading,
    activeBatch: batches.find((batch) => batch.id === activeBatchId),
    refresh,
    triggerValidation,
    promote,
    rollback,
    selectBatch: setActiveBatchId,
  };
};
