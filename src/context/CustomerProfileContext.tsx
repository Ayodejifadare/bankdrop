import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LinkedAccount, VendorReward, Activity, UserProfile } from '../types/profile';

interface CustomerProfileContextType {
  user: UserProfile;
  wallet: LinkedAccount[];
  rewards: VendorReward[];
  activities: Activity[];
  linkAccount: (account: Omit<LinkedAccount, 'id' | 'balance' | 'isPrimary'>) => void;
  removeAccount: (id: string) => void;
  setPrimaryAccount: (id: string) => void;
}

const CustomerProfileContext = createContext<CustomerProfileContextType | undefined>(undefined);

const INITIAL_STATE = {
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

export const CustomerProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserProfile>(INITIAL_STATE.user);
  const [wallet, setWallet] = useState<LinkedAccount[]>(() => {
    const saved = localStorage.getItem('customer_wallet');
    return saved ? JSON.parse(saved) : INITIAL_STATE.wallet;
  });
  const [rewards] = useState<VendorReward[]>(INITIAL_STATE.rewards);
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('customer_activities');
    return saved ? JSON.parse(saved) : INITIAL_STATE.activities;
  });

  useEffect(() => {
    localStorage.setItem('customer_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('customer_activities', JSON.stringify(activities));
  }, [activities]);

  const linkAccount = (accountData: Omit<LinkedAccount, 'id' | 'balance' | 'isPrimary'>) => {
    const newAccount: LinkedAccount = {
      ...accountData,
      id: `acc_${Date.now()}`,
      balance: 0,
      isPrimary: wallet.length === 0,
    };
    setWallet(prev => [...prev, newAccount]);
  };

  const removeAccount = (id: string) => {
    setWallet(prev => prev.filter(acc => acc.id !== id));
  };

  const setPrimaryAccount = (id: string) => {
    setWallet(prev => prev.map(acc => ({
      ...acc,
      isPrimary: acc.id === id
    })));
  };

  return (
    <CustomerProfileContext.Provider value={{ 
      user, wallet, rewards, activities, 
      linkAccount, removeAccount, setPrimaryAccount 
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
