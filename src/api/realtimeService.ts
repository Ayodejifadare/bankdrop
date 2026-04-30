import { STORAGE_KEYS } from '../utils/constants';

export type EventType = 'STATE_CHANGED' | 'NEW_VERIFICATION' | 'PAYMENT_RECEIVED' | 'SESSION_UPDATED' | 'PROFILE_UPDATED';

export interface RealtimeEvent {
  type: EventType;
  payload?: any;
  timestamp: number;
}

export type EventCallback = (event: RealtimeEvent) => void;

class RealtimeService {
  private subscribers: Map<EventType, Set<EventCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (!event.key) return;

    // Detect changes to Merchant State
    if (event.key === STORAGE_KEYS.MERCHANT_STATE) {
      this.notify('STATE_CHANGED', { 
        source: 'storage_event',
        oldValue: event.oldValue,
        newValue: event.newValue 
      });

      // If a new verification was added
      try {
        const next = JSON.parse(event.newValue || '{}');
        const prev = JSON.parse(event.oldValue || '{}');
        if (next.pendingVerifications?.length > (prev.pendingVerifications?.length || 0)) {
          this.notify('NEW_VERIFICATION', next.pendingVerifications[next.pendingVerifications.length - 1]);
        }
      } catch (e) {
        // Silently fail
      }
    }

    // Detect changes to Split Sessions
    if (event.key.startsWith('check_split_')) {
      const sessionId = event.key.replace('check_split_', '');
      try {
        const session = JSON.parse(event.newValue || 'null');
        this.notify('SESSION_UPDATED', { sessionId, session, source: 'storage_event' });
      } catch (e) {
        // Silently fail
      }
    }

    // Detect changes to Customer Profile data
    if ([STORAGE_KEYS.CUSTOMER_PROFILE, STORAGE_KEYS.CUSTOMER_WALLET, STORAGE_KEYS.CUSTOMER_ACTIVITIES].includes(event.key as any)) {
      this.notify('PROFILE_UPDATED', { key: event.key, source: 'storage_event' });
    }
  }

  /**
   * Subscribe to real-time events.
   * Returns an unsubscribe function.
   */
  subscribe(type: EventType, callback: EventCallback): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);

    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  /**
   * Manually notify subscribers (used for local tab events)
   */
  notify(type: EventType, payload?: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    this.subscribers.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error(`Error in realtime subscriber for ${type}:`, err);
      }
    });
  }
}

export const realtimeService = new RealtimeService();
