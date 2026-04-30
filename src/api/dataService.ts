import { STORAGE_KEYS } from '../utils/constants';
import type { MerchantState } from '../types/merchant';
import type { SplitSession } from '../types/checkout';
import type { UserProfile, LinkedAccount, Activity, VendorReward } from '../types/profile';
import { realtimeService, type RealtimeEvent } from './realtimeService';

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * MERCHANT SERVICE
 * Handles business operations, bank accounts, and order history.
 * Can be scaled independently or moved to a dedicated business backend.
 */
class MerchantService {
  async saveState(state: MerchantState, source = 'local'): Promise<void> {
    await simulateDelay();
    localStorage.setItem(STORAGE_KEYS.MERCHANT_STATE, JSON.stringify(state));
    realtimeService.notify('STATE_CHANGED', { source });
  }

  /**
   * ATOMIC PATCH
   * Fetches latest state, applies updates, and saves in one flow.
   * Reduces race conditions between Menu and Ops providers.
   */
  async patchState(update: Partial<MerchantState> | ((current: MerchantState) => MerchantState), source = 'local'): Promise<MerchantState> {
    await simulateDelay(); // Initial delay for simulation
    
    // ATOMIC CYCLE: Read, Modify, Write must be synchronous to avoid clobbering in the event loop
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_STATE);
    const current: MerchantState = saved ? JSON.parse(saved) : ({} as MerchantState);
    
    const next = typeof update === 'function' ? update(current) : { ...current, ...update };
    
    localStorage.setItem(STORAGE_KEYS.MERCHANT_STATE, JSON.stringify(next));
    realtimeService.notify('STATE_CHANGED', { source });
    return next;
  }

  async fetchState(): Promise<MerchantState | null> {
    await simulateDelay();
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_STATE);
    return saved ? JSON.parse(saved) : null;
  }
}

/**
 * CUSTOMER CHECKOUT SERVICE
 * Handles real-time split sessions and guest interactions.
 * Optimized for high-concurrency and real-time synchronization.
 */
class CustomerService {
  async saveSplitSession(session: SplitSession, source = 'local'): Promise<void> {
    await simulateDelay();
    const sessionId = session.id || session.checkId;
    const key = `check_split_${sessionId}`;
    localStorage.setItem(key, JSON.stringify(session));
    realtimeService.notify('SESSION_UPDATED', { sessionId, session, source });
  }

  /**
   * ATOMIC PATCH FOR SPLIT SESSIONS
   * Essential for multiplayer item picking.
   */
  async patchSplitSession(sessionId: string, update: Partial<SplitSession> | ((current: SplitSession) => SplitSession), source = 'local'): Promise<SplitSession> {
    await simulateDelay();
    
    // ATOMIC CYCLE: Synchronous read-update-write
    const key = `check_split_${sessionId}`;
    const saved = localStorage.getItem(key);
    const current: SplitSession = saved ? JSON.parse(saved) : ({} as SplitSession);
    
    const next = typeof update === 'function' ? update(current) : { ...current, ...update };
    
    localStorage.setItem(key, JSON.stringify(next));
    realtimeService.notify('SESSION_UPDATED', { sessionId, session: next, source });
    return next;
  }

  async fetchSplitSession(sessionId: string): Promise<SplitSession | null> {
    await simulateDelay();
    const key = `check_split_${sessionId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  async clearSplitSession(sessionId: string): Promise<void> {
    await simulateDelay();
    localStorage.removeItem(`check_split_${sessionId}`);
  }

  subscribeToSplitSession(sessionId: string, callback: (session: SplitSession) => void): () => void {
    return realtimeService.subscribe('SESSION_UPDATED', (event: RealtimeEvent) => {
      if (event.payload?.sessionId === sessionId && event.payload?.session) {
        callback(event.payload.session);
      }
    });
  }
}

/**
 * CUSTOMER PROFILE SERVICE
 * Handles identity, wallet management, and cross-vendor activity.
 * Can be integrated with centralized Auth/Identity providers.
 */
class ProfileService {
  async saveProfile(user: UserProfile | null, authenticated: boolean): Promise<void> {
    await simulateDelay();
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER_PROFILE);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_AUTH, authenticated.toString());
    realtimeService.notify('PROFILE_UPDATED', { key: STORAGE_KEYS.CUSTOMER_PROFILE, source: 'profile' });
  }

  async fetchProfile(): Promise<{ user: UserProfile | null; isAuthenticated: boolean }> {
    await simulateDelay();
    const userSaved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PROFILE);
    const authSaved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_AUTH) === 'true';
    return {
      user: userSaved ? JSON.parse(userSaved) : null,
      isAuthenticated: authSaved
    };
  }

  async saveWallet(wallet: LinkedAccount[]): Promise<void> {
    await simulateDelay();
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_WALLET, JSON.stringify(wallet));
    realtimeService.notify('PROFILE_UPDATED', { key: STORAGE_KEYS.CUSTOMER_WALLET, source: 'profile' });
  }

  async fetchWallet(): Promise<LinkedAccount[] | null> {
    await simulateDelay();
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_WALLET);
    return saved ? JSON.parse(saved) : null;
  }

  async saveActivities(activities: Activity[]): Promise<void> {
    await simulateDelay();
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ACTIVITIES, JSON.stringify(activities));
    realtimeService.notify('PROFILE_UPDATED', { key: STORAGE_KEYS.CUSTOMER_ACTIVITIES, source: 'profile' });
  }

  async fetchActivities(): Promise<Activity[] | null> {
    await simulateDelay();
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_ACTIVITIES);
    return saved ? JSON.parse(saved) : null;
  }

  async saveRewards(rewards: VendorReward[]): Promise<void> {
    await simulateDelay();
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_REWARDS, JSON.stringify(rewards));
    realtimeService.notify('PROFILE_UPDATED', { key: STORAGE_KEYS.CUSTOMER_REWARDS, source: 'profile' });
  }

  async fetchRewards(): Promise<VendorReward[] | null> {
    await simulateDelay();
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REWARDS);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * ATOMIC PATCH FOR PROFILE DATA
   * Fetches latest wallet, activities, and rewards, applies update, and saves.
   * Essential for preventing race conditions between tabs.
   */
  async patchProfile(update: (current: { wallet: LinkedAccount[]; activities: Activity[]; rewards: VendorReward[] }) => { wallet: LinkedAccount[]; activities: Activity[]; rewards: VendorReward[] }, source = 'profile'): Promise<{ wallet: LinkedAccount[]; activities: Activity[]; rewards: VendorReward[] }> {
    await simulateDelay();
    
    // ATOMIC CYCLE: Synchronous fetch from storage
    const walletSaved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_WALLET);
    const activitiesSaved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_ACTIVITIES);
    const rewardsSaved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REWARDS);

    const wallet = walletSaved ? JSON.parse(walletSaved) : [];
    const activities = activitiesSaved ? JSON.parse(activitiesSaved) : [];
    const rewards = rewardsSaved ? JSON.parse(rewardsSaved) : [];
    
    const next = update({ wallet, activities, rewards });
    
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_WALLET, JSON.stringify(next.wallet));
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ACTIVITIES, JSON.stringify(next.activities));
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_REWARDS, JSON.stringify(next.rewards));
    
    realtimeService.notify('PROFILE_UPDATED', { source });
    return next;
  }

  /**
   * CROSS-CONTEXT SYNC: Complete activity by reference ID.
   * Used by Merchant Settlement to update Customer Profile activity status.
   */
  async completeActivityByReference(referenceId: string): Promise<void> {
    await simulateDelay();
    await this.patchProfile(current => ({
      ...current,
      activities: current.activities.map(act => 
        act.referenceId === referenceId ? { ...act, status: 'completed' } : act
      )
    }), 'system');
  }
}

export const merchantService = new MerchantService();
export const customerService = new CustomerService();
export const profileService = new ProfileService();
export { realtimeService };
