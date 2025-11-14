import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, Mode } from '../../types';
import { mockMessagingClient } from '../../services/mockMessaging';
import { getModeTheme } from '../layout/ModeTheme';

interface QuoteThreadProps {
  threadId: string;
  initialMessages: ChatMessage[];
  mode: Mode;
  statusTimeline: { label: string; timestamp: string }[];
}

export const QuoteThread: React.FC<QuoteThreadProps> = ({ threadId, initialMessages, mode, statusTimeline }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [...initialMessages]);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const theme = getModeTheme(mode);

  useEffect(() => {
    setMessages([...initialMessages]);
  }, [initialMessages]);

  useEffect(() => {
    const unsubscribe = mockMessagingClient.subscribe(threadId, (message) => {
      setMessages((current) => [...current, message]);
    });
    mockMessagingClient.seed(threadId);
    return unsubscribe;
  }, [threadId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const groupedTimeline = useMemo(
    () =>
      statusTimeline.map((entry) => ({
        ...entry,
        displayDate: new Date(entry.timestamp).toLocaleString(),
      })),
    [statusTimeline]
  );

  const sendMessage = (sender: ChatMessage['sender']) => {
    if (!draft.trim()) return;
    const payload = { sender, text: draft.trim() } as Omit<ChatMessage, 'id' | 'timestamp'>;
    const message = mockMessagingClient.publish(threadId, payload);
    setMessages((current) => [...current, message]);
    setDraft('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === 'Procurement' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  message.sender === 'Procurement'
                    ? `${theme.accentBgClass} text-white`
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <p className="font-semibold text-xs uppercase tracking-wide">{message.sender}</p>
                <p>{message.text}</p>
              </div>
              <span className="text-xs text-slate-400 mt-1">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <label htmlFor={`message-${threadId}`} className="text-xs font-semibold uppercase text-slate-500">
            Send a message
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`message-${threadId}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type update for merchant..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm"
            />
            <button
              onClick={() => sendMessage('Procurement')}
              className={`${theme.accentBgClass} text-white px-4 py-2 rounded-lg text-sm font-semibold`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <aside className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Status timeline</h4>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            {groupedTimeline.map((entry) => (
              <li key={`${entry.label}-${entry.timestamp}`} className="border-l-2 border-slate-200 pl-3">
                <p className="font-semibold text-slate-800">{entry.label}</p>
                <p className="text-xs text-slate-500">{entry.displayDate}</p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
};
