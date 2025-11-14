import { useCallback, useEffect, useState } from 'react';
import { ZPPAImportBatch } from '../types';
import { mockIngestionService } from '../services/mockIngestion';

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

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockIngestionService.listBatches();
      setBatches(data);
      if (data.length && !activeBatchId) {
        setActiveBatchId(data[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeBatchId]);

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
      const updated = await mockIngestionService.triggerValidation(batchId);
      mutateBatch(updated);
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch]);

  const promote = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const updated = await mockIngestionService.promote(batchId);
      mutateBatch(updated);
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch]);

  const rollback = useCallback(async (batchId: string) => {
    setIsLoading(true);
    try {
      const updated = await mockIngestionService.rollback(batchId);
      mutateBatch(updated);
    } finally {
      setIsLoading(false);
    }
  }, [mutateBatch]);

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
