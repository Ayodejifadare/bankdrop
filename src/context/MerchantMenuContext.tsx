import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, Reward } from '../types/merchant';
import { merchantService, realtimeService } from '../api/dataService';
import type { RealtimeEvent } from '../api/realtimeService';
import { STORAGE_KEYS } from '../utils/constants';

interface MerchantMenuContextType {
  menu: MenuItem[];
  rewards: Reward[];
  isSaving: boolean;
  isLoading: boolean;
  addMenuItem: (item: MenuItem) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  archiveMenuItem: (id: string) => Promise<void>;
  restoreMenuItem: (id: string) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addReward: (reward: Reward) => Promise<void>;
  updateReward: (reward: Reward) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
}

const MerchantMenuContext = createContext<MerchantMenuContextType | undefined>(undefined);

// Helper for initial state (mirrors what was in MerchantContext)
const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Margherita Pizza', price: 4500, category: 'Main', type: 'item', status: 'active' },
  { id: 'm2', name: 'Jollof Rice & Chicken', price: 3800, category: 'Main', type: 'item', status: 'active' },
  { id: 'm3', name: 'Coca-Cola 35cl', price: 400, category: 'Beverage', type: 'item', status: 'active' },
  { id: 'm4', name: 'Chapman Cocktail', price: 2500, category: 'Beverage', type: 'item', status: 'active' },
  { id: 'm5', name: 'Spring Rolls (4pcs)', price: 1800, category: 'Appetizer', type: 'item', status: 'active' }
];

const DEFAULT_REWARDS: Reward[] = [
  { 
    id: '1', 
    title: '10% Cash Back', 
    minSpend: 10000, 
    rewardValue: 10, 
    rewardUnit: 'percentage', 
    status: 'active', 
    expiryDate: null 
  },
];

export const MerchantMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_STATE);
    return saved ? JSON.parse(saved).menu || DEFAULT_MENU : DEFAULT_MENU;
  });
  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_STATE);
    return saved ? JSON.parse(saved).rewards || DEFAULT_REWARDS : DEFAULT_REWARDS;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading] = useState(false);

  // Background Revalidation
  useEffect(() => {
    const revalidate = async () => {
      const saved = await merchantService.fetchState();
      if (saved) {
        if (saved.menu) setMenu(saved.menu);
        if (saved.rewards) setRewards(saved.rewards);
      }
    };
    revalidate();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const unsub = realtimeService.subscribe('STATE_CHANGED', async (event: RealtimeEvent) => {
      // Refresh if the update came from another tab or from the Ops provider
      if (event.payload?.source !== 'menu') {
        const saved = await merchantService.fetchState();
        if (saved) {
          if (saved.menu) setMenu(saved.menu);
          if (saved.rewards) setRewards(saved.rewards);
        }
      }
    });
    return unsub;
  }, []);

  /**
   * CENTRALIZED PERSISTENCE HELPER
   * Standardizes the Fetch-Modify-Save pattern to prevent race conditions.
   */
  const performMenuUpdate = async (updater: (curMenu: MenuItem[], curRewards: Reward[]) => { nextMenu: MenuItem[], nextRewards: Reward[] }) => {
    const prevMenu = menu;
    const prevRewards = rewards;
    
    // 1. Calculate and Apply Optimistic State
    const { nextMenu, nextRewards } = updater(menu, rewards);
    setMenu(nextMenu);
    setRewards(nextRewards);
    setIsSaving(true);
    
    try {
      // 2. Persist in background
      const next = await merchantService.patchState(current => {
        // Re-calculate based on latest storage state to handle potential concurrent updates
        const result = updater(current.menu || menu, current.rewards || rewards);
        return { ...current, menu: result.nextMenu, rewards: result.nextRewards };
      }, 'menu');
      
      // 3. Silent re-sync with actual result from storage
      setMenu(next.menu || []);
      setRewards(next.rewards || []);
    } catch (err) {
      console.error('Failed to persist menu state, rolling back:', err);
      setMenu(prevMenu);
      setRewards(prevRewards);
    } finally {
      setIsSaving(false);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: [...m, { ...item, status: item.status || 'active' }], 
      nextRewards: r 
    }));
  };

  const updateMenuItem = async (item: MenuItem) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m.map(i => i.id === item.id ? item : i), 
      nextRewards: r 
    }));
  };

  const archiveMenuItem = async (id: string) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m.map(i => i.id === id ? { ...i, status: 'archived' as const } : i), 
      nextRewards: r 
    }));
  };

  const restoreMenuItem = async (id: string) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m.map(i => i.id === id ? { ...i, status: 'active' as const } : i), 
      nextRewards: r 
    }));
  };

  const deleteMenuItem = async (id: string) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m.filter(i => i.id !== id), 
      nextRewards: r 
    }));
  };

  const addReward = async (reward: Reward) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m, 
      nextRewards: [...r, reward] 
    }));
  };

  const updateReward = async (reward: Reward) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m, 
      nextRewards: r.map(i => i.id === reward.id ? reward : i) 
    }));
  };

  const deleteReward = async (id: string) => {
    await performMenuUpdate((m, r) => ({ 
      nextMenu: m, 
      nextRewards: r.filter(i => i.id !== id) 
    }));
  };

  return (
    <MerchantMenuContext.Provider value={{ 
      menu, 
      rewards, 
      isSaving,
      isLoading,
      addMenuItem, 
      updateMenuItem, 
      archiveMenuItem, 
      restoreMenuItem, 
      deleteMenuItem,
      addReward,
      updateReward,
      deleteReward
    }}>
      {children}
    </MerchantMenuContext.Provider>
  );
};

export const useMerchantMenu = () => {
  const context = useContext(MerchantMenuContext);
  if (context === undefined) {
    throw new Error('useMerchantMenu must be used within a MerchantMenuProvider');
  }
  return context;
};
