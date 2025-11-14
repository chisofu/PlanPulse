import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type NotificationTone = 'info' | 'success' | 'error';

interface NotificationEntry {
  id: string;
  tone: NotificationTone;
  title: string;
  description?: string;
}

interface NotificationContextValue {
  notify: (tone: NotificationTone, title: string, description?: string) => void;
  notifyInfo: (title: string, description?: string) => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const toneStyles: Record<NotificationTone, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const toneAccent: Record<NotificationTone, string> = {
  info: 'text-sky-600',
  success: 'text-emerald-600',
  error: 'text-red-600',
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback<NotificationContextValue['notify']>((tone, title, description) => {
    const id = createId();
    const entry: NotificationEntry = { id, tone, title, description };
    setNotifications((current) => [...current, entry]);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => dismiss(id), 6000);
    }
  }, [dismiss]);

  const notifyInfo = useCallback<NotificationContextValue['notifyInfo']>((title, description) => {
    notify('info', title, description);
  }, [notify]);

  const notifySuccess = useCallback<NotificationContextValue['notifySuccess']>((title, description) => {
    notify('success', title, description);
  }, [notify]);

  const notifyError = useCallback<NotificationContextValue['notifyError']>((title, description) => {
    notify('error', title, description);
  }, [notify]);

  const contextValue = useMemo<NotificationContextValue>(() => ({
    notify,
    notifyInfo,
    notifySuccess,
    notifyError,
    dismiss,
  }), [notify, notifyInfo, notifySuccess, notifyError, dismiss]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border rounded-lg shadow-lg p-4 backdrop-blur bg-opacity-90 ${toneStyles[notification.tone]}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${toneAccent[notification.tone]}`}>{notification.title}</p>
                {notification.description && (
                  <p className="text-sm text-slate-600 mt-1">{notification.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(notification.id)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
