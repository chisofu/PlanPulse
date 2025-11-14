import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

type Listener = (message: ChatMessage) => void;

class MockMessagingClient {
  private listeners: Record<string, Listener[]> = {};

  subscribe(threadId: string, listener: Listener) {
    if (!this.listeners[threadId]) {
      this.listeners[threadId] = [];
    }
    this.listeners[threadId].push(listener);
    return () => {
      this.listeners[threadId] = this.listeners[threadId].filter((l) => l !== listener);
    };
  }

  publish(threadId: string, payload: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const message: ChatMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...payload,
    };
    (this.listeners[threadId] ?? []).forEach((listener) => listener(message));
    return message;
  }

  seed(threadId: string) {
    setTimeout(() => {
      this.publish(threadId, {
        sender: 'Merchant',
        text: 'Automated reminder: quote still pending final approval.',
      });
    }, 6000);
  }
}

export const mockMessagingClient = new MockMessagingClient();
