import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LinkedAccount, VendorReward, Activity, UserProfile } from '../types/profile';
import { profileService, realtimeService } from '../api/dataService';
import type { RealtimeEvent } from '../api/realtimeService';
import { STORAGE_KEYS } from '../utils/constants';
import { generateId } from '../utils/idUtils';

interface CustomerProfileContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isSaving: boolean;
  isLoading: boolean;
  wallet: LinkedAccount[];
  rewards: VendorReward[];
  activities: Activity[];
  checkEmail: (email: string) => Promise<{ exists: boolean }>;
  login: (email: string, otp: string) => Promise<void>;
  signup: (userData: UserProfile & { mobile: string }, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  linkAccount: (account: Omit<LinkedAccount, 'id' | 'balance' | 'isPrimary'>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  setPrimaryAccount: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
}

const CustomerProfileContext = createContext<CustomerProfileContextType | undefined>(undefined);

const INITIAL_STATE: {
  user: UserProfile;
  wallet: LinkedAccount[];
  rewards: VendorReward[];
  activities: Activity[];
} = {
  user: {
    name: 'Alex Sterling',
    email: 'alex.sterling@example.com',
  },
  wallet: [
    {
      id: 'acc_1',
      bankName: 'Kuda Bank',
      accountNumber: '1234567890',
      accountName: 'Alex Sterling',
      balance: 45000,
      isPrimary: true,
    }
  ],
  rewards: [
    {
      vendorId: 'v_1',
      vendorName: 'Bankdrop Grill',
      balance: 1500,
      currency: 'NGN',
    },
    {
      vendorId: 'v_2',
      vendorName: 'Starbucks',
      balance: 12.50,
      currency: 'USD',
    }
  ],
  activities: [
    {
      id: 'act_1',
      type: 'sent',
      amount: 4500,
      entity: 'Bankdrop Grill',
      timestamp: new Date().toISOString(),
      status: 'completed',
      category: 'Food & Drink',
      items: [
        { name: 'Double Cheeseburger', quantity: 1, price: 2500 },
        { name: 'Large Fries', quantity: 1, price: 1200 },
        { name: 'Vanilla Milkshake', quantity: 1, price: 800 }
      ]
    },
    {
      id: 'act_2',
      type: 'received',
      amount: 12000,
      entity: 'Sarah Jones',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    }
  ]
};

const INITIAL_PROFILE_DATA = {
  wallet: INITIAL_STATE.wallet,
  activities: INITIAL_STATE.activities,
  rewards: INITIAL_STATE.rewards
};

export const CustomerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PROFILE);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOMER_AUTH) === 'true';
  });
  
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading] = useState(false); // No longer blocks UI
  
  const [wallet, setWallet] = useState<LinkedAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_WALLET);
    return saved ? JSON.parse(saved) : INITIAL_STATE.wallet;
  });
  
  const [rewards, setRewards] = useState<VendorReward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REWARDS);
    return saved ? JSON.parse(saved) : INITIAL_STATE.rewards;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_ACTIVITIES);
    return saved ? JSON.parse(saved) : INITIAL_STATE.activities;
  });

  // Initial Sync (Revalidation)
  useEffect(() => {
    const revalidate = async () => {
      const profile = await profileService.fetchProfile();
      if (profile.user) setUser(profile.user);
      setIsAuthenticated(profile.isAuthenticated);

      const savedWallet = await profileService.fetchWallet();
      if (savedWallet) setWallet(savedWallet);

      const savedRewards = await profileService.fetchRewards();
      if (savedRewards) setRewards(savedRewards);

      const savedActivities = await profileService.fetchActivities();
      if (savedActivities) setActivities(savedActivities);
    };
    revalidate();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const unsub = realtimeService.subscribe('PROFILE_UPDATED', async (event: RealtimeEvent) => {
      if (event.payload?.source !== 'profile') {
        const profile = await profileService.fetchProfile();
        setUser(profile.user);
        setIsAuthenticated(profile.isAuthenticated);

        const savedWallet = await profileService.fetchWallet();
        if (savedWallet) setWallet(savedWallet);

        const savedRewards = await profileService.fetchRewards();
        if (savedRewards) setRewards(savedRewards);

        const savedActivities = await profileService.fetchActivities();
        if (savedActivities) setActivities(savedActivities);
      }
    });
    return unsub;
  }, []);

  const checkEmail = async (email: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoadingAuth(false);
    return { exists: email === INITIAL_STATE.user.email };
  };

  const login = async (_email: string, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser(INITIAL_STATE.user);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    await profileService.saveProfile(INITIAL_STATE.user, true);
  };

  const signup = async (userData: UserProfile & { mobile: string }, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newUser = { name: userData.name, email: userData.email, avatar: userData.avatar };
    setUser(newUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    await profileService.saveProfile(newUser, true);
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await profileService.saveProfile(null, false);
  };

  /**
   * CENTRALIZED PERSISTENCE HELPER
   * Prevents race conditions and ensures atomic updates across components.
   */
  const performProfileUpdate = async (updater: (current: typeof INITIAL_PROFILE_DATA) => typeof INITIAL_PROFILE_DATA) => {
    const prevWallet = wallet;
    const prevActivities = activities;
    const prevRewards = rewards;

    // 1. Optimistic Update
    const optimistic = updater({ wallet, activities, rewards });
    setWallet(optimistic.wallet);
    setActivities(optimistic.activities);
    setRewards(optimistic.rewards);
    setIsSaving(true);

    try {
      // 2. Atomic Patch
      const next = await profileService.patchProfile(current => {
        // Hydration safety: Merge current storage data with INITIAL_PROFILE_DATA 
        // to handle schema evolution or empty storage.
        const safeCurrent = {
          wallet: current.wallet.length > 0 ? current.wallet : INITIAL_PROFILE_DATA.wallet,
          activities: current.activities.length > 0 ? current.activities.map(act => {
            // DEEP HYDRATION: Ensure demo activity has its items
            if (act.id === 'act_1' && (!act.items || act.items.length === 0)) {
              return { ...act, items: INITIAL_PROFILE_DATA.activities.find(a => a.id === 'act_1')?.items };
            }
            return act;
          }) : INITIAL_PROFILE_DATA.activities,
          rewards: current.rewards.length > 0 ? current.rewards : INITIAL_PROFILE_DATA.rewards,
        };

        return updater(safeCurrent);
      }, 'profile');

      // 3. Final sync
      setWallet(next.wallet);
      setActivities(next.activities);
      setRewards(next.rewards);
    } catch (err) {
      console.error('Profile update failed, rolling back:', err);
      setWallet(prevWallet);
      setActivities(prevActivities);
      setRewards(prevRewards);
    } finally {
      setIsSaving(false);
    }
  };

  const linkAccount = async (accountData: Omit<LinkedAccount, 'id' | 'balance' | 'isPrimary'>) => {
    await performProfileUpdate(cur => {
      const newAccount: LinkedAccount = {
        ...accountData,
        id: generateId('acc'),
        balance: 0,
        isPrimary: cur.wallet.length === 0,
      };
      return { ...cur, wallet: [...cur.wallet, newAccount] };
    });
  };

  const removeAccount = async (id: string) => {
    await performProfileUpdate(cur => {
      const nextWallet = cur.wallet.filter((acc: LinkedAccount) => acc.id !== id);
      if (cur.wallet.find(acc => acc.id === id)?.isPrimary && nextWallet.length > 0) {
        nextWallet[0].isPrimary = true;
      }
      return { ...cur, wallet: nextWallet };
    });
  };

  const setPrimaryAccount = async (id: string) => {
    await performProfileUpdate(cur => ({
      ...cur,
      wallet: cur.wallet.map((acc: LinkedAccount) => ({
        ...acc,
        isPrimary: acc.id === id
      }))
    }));
  };
  
  const addActivity = async (activityData: Omit<Activity, 'id'>) => {
    await performProfileUpdate(cur => {
      const newActivity: Activity = {
        ...activityData,
        id: generateId('act'),
      };
      return { ...cur, activities: [newActivity, ...cur.activities] };
    });
  };

  return (
    <CustomerProfileContext.Provider value={{ 
      user, isAuthenticated, isLoadingAuth, isSaving, isLoading,
      wallet, rewards, activities, 
      checkEmail, login, signup, logout,
      linkAccount, removeAccount, setPrimaryAccount,
      addActivity
    }}>
      {children}
    </CustomerProfileContext.Provider>
  );
};

export const useCustomerProfile = () => {
  const context = useContext(CustomerProfileContext);
  if (!context) throw new Error('useCustomerProfile must be used within CustomerProfileProvider');
  return context;
};
