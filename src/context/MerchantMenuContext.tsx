import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, Reward } from '../types/merchant';

interface MerchantMenuContextType {
  menu: MenuItem[];
  rewards: Reward[];
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  archiveMenuItem: (id: string) => void;
  restoreMenuItem: (id: string) => void;
  deleteMenuItem: (id: string) => void;
  addReward: (reward: Reward) => void;
  updateReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
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
  // Load from local storage or use defaults
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('merchant_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.menu || DEFAULT_MENU;
    }
    return DEFAULT_MENU;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem('merchant_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.rewards || DEFAULT_REWARDS;
    }
    return DEFAULT_REWARDS;
  });

  // Sync menu/rewards to the main state object in localStorage for backward compat
  useEffect(() => {
    const saved = localStorage.getItem('merchant_state');
    const currentState = saved ? JSON.parse(saved) : {};
    localStorage.setItem('merchant_state', JSON.stringify({
      ...currentState,
      menu,
      rewards
    }));
  }, [menu, rewards]);

  const addMenuItem = (item: MenuItem) => {
    setMenu(prev => [...prev, { ...item, status: item.status || 'active' }]);
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenu(prev => prev.map(m => m.id === item.id ? item : m));
  };

  const archiveMenuItem = (id: string) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, status: 'archived' } : m));
  };

  const restoreMenuItem = (id: string) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, status: 'active' } : m));
  };

  const deleteMenuItem = (id: string) => {
    setMenu(prev => prev.filter(m => m.id !== id));
  };

  const addReward = (reward: Reward) => {
    setRewards(prev => [...prev, reward]);
  };

  const updateReward = (reward: Reward) => {
    setRewards(prev => prev.map(r => r.id === reward.id ? reward : r));
  };

  const deleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  return (
    <MerchantMenuContext.Provider value={{ 
      menu, 
      rewards, 
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
