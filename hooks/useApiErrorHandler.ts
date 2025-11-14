import { useCallback } from 'react';
import { useNotifications } from '../providers/NotificationProvider';

type ErrorHandlerOptions = {
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
  errorDescription?: string;
  suppressSuccess?: boolean;
  onError?: (error: unknown) => void;
};

export const useApiErrorHandler = (featureName: string) => {
  const { notifySuccess, notifyError } = useNotifications();

  const withErrorHandling = useCallback(
    async <T>(operation: () => Promise<T>, options: ErrorHandlerOptions = {}): Promise<T | undefined> => {
      try {
        const result = await operation();
        if (!options.suppressSuccess && options.successMessage) {
          notifySuccess(options.successMessage, options.successDescription);
        }
        return result;
      } catch (error) {
        console.error(`[${featureName}] API interaction failed`, error);
        notifyError(
          options.errorMessage ?? 'Something went wrong while communicating with the service.',
          options.errorDescription ?? 'Please retry in a moment or contact support with the timestamp in the console.',
        );
        if (options.onError) {
          options.onError(error);
        }
        return undefined;
      }
    },
    [featureName, notifySuccess, notifyError],
  );

  return { withErrorHandling };
};
