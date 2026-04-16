import React, { createContext, useContext, useEffect, useState } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: 'item' | 'service' | 'subscription';
  status: 'active' | 'archived';
  billingCycle?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  isPrimary: boolean;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Installment {
  id: string;
  label: string;
  amount: number;
  dueDate: string | 'on_delivery';
  status: 'pending' | 'paid';
}

export interface PaymentPlan {
  depositAmount: number;
  installments: Installment[];
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'on_delivery' | 'scheduled';
}

export interface Invoice {
  id: string;
  customerName: string;
  customerEmail?: string;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid';
  createdAt: string;
  paymentPlan?: PaymentPlan;
}

export interface Check {
  id: string;
  status: 'open' | 'active' | 'paid';
  orders: OrderItem[];
  total: number;
}

export interface Reward {
  id: string;
  title: string;
  minSpend: number;
  rewardValue: number;
  rewardUnit: 'cash' | 'percentage';
  status: 'active' | 'paused' | 'archived';
  expiryDate: string | null;
}

export interface PendingVerification {
  id: string;
  type: 'check' | 'invoice';
  targetId: string;
  amount: number;
  method: 'Transfer' | 'POS' | 'Cash';
  timestamp: string;
  status: 'pending' | 'confirmed' | 'declined';
}

export interface MerchantActivity {
  id: string;
  type: 'check_payment' | 'invoice_payment';
  amount: number;
  referenceId: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface PastOrder {
  id: string;
  checkId: string;
  orders: OrderItem[];
  total: number;
  timestamp: string;
}

export interface MerchantState {
  name: string;
  businessProfile?: string;
  businessCategory?: string;
  bankAccounts: BankAccount[];
  menu: MenuItem[];
  checks: Check[];
  rewards: Reward[];
  invoices: Invoice[];
  pendingVerifications: PendingVerification[];
  activities: MerchantActivity[];
  orderHistory: PastOrder[];
}

interface MerchantContextType {
  state: MerchantState;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  merchantUser: { name: string; email: string; mobile: string } | null;
  checkEmail: (email: string) => Promise<{ exists: boolean }>;
  login: (email: string, otp: string) => Promise<void>;
  signup: (userData: { name: string; email: string; mobile: string }, otp: string) => Promise<void>;
  logout: () => void;
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => void;
  removeBankAccount: (id: string) => void;
  setPrimaryBankAccount: (id: string) => void;
  updateBusinessInfo: (info: { name: string; profile: string; category: string }) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  archiveMenuItem: (id: string) => void;
  restoreMenuItem: (id: string) => void;
  deleteMenuItem: (id: string) => void;
  updateCheckStatus: (id: string, status: 'open' | 'active' | 'paid') => void;
  addOrderToCheck: (checkId: string, item: OrderItem) => void;
  addOrdersToCheck: (checkId: string, items: OrderItem[]) => void;
  updateOrderQuantity: (checkId: string, menuItemId: string, quantityDelta: number) => void;
  clearCheck: (id: string) => void;
  addReward: (reward: Reward) => void;
  updateReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  createInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  requestVerification: (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => void;
  resolveVerification: (id: string, confirmed: boolean) => void;
  resetCheck: (id: string) => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

const DEFAULT_STATE: MerchantState = {
  name: "Bankdrop Grill",
  businessProfile: "Premium local grill serving the best Jollof and Suya in the city.",
  businessCategory: "Food & Beverages",
  bankAccounts: [],
  menu: [
    { id: 'm1', name: 'Margherita Pizza', price: 4500, category: 'Main', type: 'item', status: 'active' },
    { id: 'm2', name: 'Jollof Rice & Chicken', price: 3800, category: 'Main', type: 'item', status: 'active' },
    { id: 'm3', name: 'Coca-Cola 35cl', price: 400, category: 'Beverage', type: 'item', status: 'active' },
    { id: 'm4', name: 'Chapman Cocktail', price: 2500, category: 'Beverage', type: 'item', status: 'active' },
    { id: 'm5', name: 'Spring Rolls (4pcs)', price: 1800, category: 'Appetizer', type: 'item', status: 'active' }
  ],
  checks: Array.from({ length: 12 }, (_, i) => ({
    id: `${i + 1}`,
    status: 'open',
    orders: [],
    total: 0,
  })),
  rewards: [
    { 
      id: '1', 
      title: '10% Cash Back', 
      minSpend: 10000, 
      rewardValue: 10, 
      rewardUnit: 'percentage', 
      status: 'active', 
      expiryDate: null 
    },
  ],
  invoices: [],
  pendingVerifications: [],
  activities: [
    {
      id: 'act_1',
      type: 'check_payment',
      amount: 4500,
      referenceId: '12',
      title: 'Guest #142',
      subtitle: 'New Order on Check 12',
      timestamp: new Date().toISOString()
    }
  ],
  orderHistory: [],
};

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MerchantState>(() => {
    const saved = localStorage.getItem('merchant_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migration: bankAccount -> bankAccounts
      if (parsed.bankAccount && !parsed.bankAccounts) {
        parsed.bankAccounts = [{
          ...parsed.bankAccount,
          id: 'default',
          isPrimary: true
        }];
        delete parsed.bankAccount;
      } else if (!parsed.bankAccounts) {
        parsed.bankAccounts = [];
      }

      return { 
        ...DEFAULT_STATE, 
        ...parsed, 
        activities: parsed.activities || DEFAULT_STATE.activities,
        orderHistory: parsed.orderHistory || DEFAULT_STATE.orderHistory
      };
    }
    return { ...DEFAULT_STATE };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('merchant_authenticated') === 'true';
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [merchantUser, setMerchantUser] = useState<{ name: string; email: string; mobile: string } | null>(() => {
    const saved = localStorage.getItem('merchant_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('merchant_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('merchant_authenticated', isAuthenticated.toString());
    if (merchantUser) {
      localStorage.setItem('merchant_user', JSON.stringify(merchantUser));
    } else {
      localStorage.removeItem('merchant_user');
    }
  }, [isAuthenticated, merchantUser]);

  const checkEmail = async (email: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoadingAuth(false);
    // Simulate finding the default merchant
    return { exists: email === 'merchant@bankdrop.dev' };
  };

  const login = async (email: string, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMerchantUser({ name: 'Admin', email, mobile: '+234 000 000 0000' });
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  };

  const signup = async (userData: { name: string; email: string; mobile: string }, _otp: string) => {
    setIsLoadingAuth(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMerchantUser(userData);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setMerchantUser(null);
    localStorage.removeItem('merchant_authenticated');
    localStorage.removeItem('merchant_user');
  };

  const addBankAccount = (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => {
    const newAccount: BankAccount = {
      ...bank,
      id: `acc_${Date.now()}`,
      isPrimary: state.bankAccounts.length === 0
    };
    setState(prev => ({ 
      ...prev, 
      bankAccounts: [...prev.bankAccounts, newAccount] 
    }));
  };

  const removeBankAccount = (id: string) => {
    setState(prev => {
      const newAccounts = prev.bankAccounts.filter(acc => acc.id !== id);
      // If we removed the primary account and have others left, promote the first one
      if (prev.bankAccounts.find(acc => acc.id === id)?.isPrimary && newAccounts.length > 0) {
        newAccounts[0].isPrimary = true;
      }
      return { ...prev, bankAccounts: newAccounts };
    });
  };

  const setPrimaryBankAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === id
      }))
    }));
  };

  const updateBusinessInfo = (info: { name: string; profile: string; category: string }) => {
    setState(prev => ({ 
      ...prev, 
      name: info.name, 
      businessProfile: info.profile, 
      businessCategory: info.category 
    }));
  };

  const addMenuItem = (item: MenuItem) => {
    setState(prev => ({ ...prev, menu: [...prev.menu, { ...item, status: item.status || 'active' }] }));
  };

  const updateMenuItem = (item: MenuItem) => {
    setState(prev => ({
      ...prev,
      menu: prev.menu.map(m => m.id === item.id ? item : m)
    }));
  };

  const archiveMenuItem = (id: string) => {
    setState(prev => ({
      ...prev,
      menu: prev.menu.map(m => m.id === id ? { ...m, status: 'archived' } : m)
    }));
  };

  const restoreMenuItem = (id: string) => {
    setState(prev => ({
      ...prev,
      menu: prev.menu.map(m => m.id === id ? { ...m, status: 'active' } : m)
    }));
  };

  const deleteMenuItem = (id: string) => {
    setState(prev => ({
      ...prev,
      menu: prev.menu.filter(m => m.id !== id)
    }));
  };

  const updateCheckStatus = (id: string, status: 'open' | 'active' | 'paid') => {
    setState(prev => {
      const newActivities = [...prev.activities];
      const newOrderHistory = [...prev.orderHistory];
      let newChecks = [...prev.checks];

      if (status === 'paid') {
        const check = prev.checks.find(c => c.id === id);
        if (check && check.total > 0) {
          const pastOrderId = `ord_${Date.now()}`;
          
          // Move to history
          newOrderHistory.unshift({
            id: pastOrderId,
            checkId: id,
            orders: [...check.orders],
            total: check.total,
            timestamp: new Date().toISOString()
          });

          // Create activity linked to unique order
          newActivities.unshift({
            id: `act_${Date.now()}`,
            type: 'check_payment',
            amount: check.total,
            referenceId: pastOrderId,
            title: `Check #${id}`,
            subtitle: 'Paid and settled',
            timestamp: new Date().toISOString()
          });

          // Reset the check to 'open' automatically
          newChecks = newChecks.map(c => 
            c.id === id ? { ...c, status: 'open', orders: [], total: 0 } : c
          );
        }
      } else {
        newChecks = newChecks.map(c => c.id === id ? { ...c, status } : c);
      }

      return {
        ...prev,
        checks: newChecks,
        activities: newActivities,
        orderHistory: newOrderHistory
      };
    });
  };

  const addOrderToCheck = (checkId: string, item: OrderItem) => {
    addOrdersToCheck(checkId, [item]);
  };

  const addOrdersToCheck = (checkId: string, items: OrderItem[]) => {
    setState(prev => {
      return {
        ...prev,
        checks: prev.checks.map(c => {
          if (c.id === checkId) {
            const newOrders = [...c.orders];
            let totalDelta = 0;

            items.forEach(item => {
              const menuPrice = prev.menu.find(m => m.id === item.menuItemId)?.price || 0;
              const existingOrderIndex = newOrders.findIndex(o => o.menuItemId === item.menuItemId);
              
              if (existingOrderIndex >= 0) {
                newOrders[existingOrderIndex] = {
                  ...newOrders[existingOrderIndex],
                  quantity: newOrders[existingOrderIndex].quantity + item.quantity
                };
              } else {
                newOrders.push(item);
              }
              totalDelta += menuPrice * item.quantity;
            });

            return {
              ...c,
              status: 'active',
              orders: newOrders,
              total: c.total + totalDelta
            };
          }
          return c;
        })
      };
    });
  };

  const updateOrderQuantity = (checkId: string, menuItemId: string, quantityDelta: number) => {
    setState(prev => {
      const menuPrice = prev.menu.find(m => m.id === menuItemId)?.price || 0;
      return {
        ...prev,
        checks: prev.checks.map(c => {
          if (c.id === checkId) {
            const existingOrderIndex = c.orders.findIndex(o => o.menuItemId === menuItemId);
            if (existingOrderIndex === -1 && quantityDelta <= 0) return c;

            const newOrders = [...c.orders];
            let finalTotalDelta = 0;

            if (existingOrderIndex >= 0) {
              const currentQty = newOrders[existingOrderIndex].quantity;
              const newQty = Math.max(0, currentQty + quantityDelta);
              
              if (newQty === 0) {
                newOrders.splice(existingOrderIndex, 1);
                finalTotalDelta = -(menuPrice * currentQty);
              } else {
                newOrders[existingOrderIndex] = { ...newOrders[existingOrderIndex], quantity: newQty };
                finalTotalDelta = menuPrice * quantityDelta;
              }
            } else if (quantityDelta > 0) {
              newOrders.push({ menuItemId, quantity: quantityDelta });
              finalTotalDelta = menuPrice * quantityDelta;
            }

            return {
              ...c,
              status: newOrders.length > 0 ? 'active' : 'open',
              orders: newOrders,
              total: Math.max(0, c.total + finalTotalDelta)
            };
          }
          return c;
        })
      };
    });
  };

  const clearCheck = (id: string) => {
    // Reuse the automated 'paid' logic which handles archiving and resetting
    updateCheckStatus(id, 'paid');
  };

  const addReward = (reward: Reward) => {
    setState(prev => ({ ...prev, rewards: [...prev.rewards, reward] }));
  };
  
  const updateReward = (reward: Reward) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => r.id === reward.id ? reward : r)
    }));
  };

  const deleteReward = (id: string) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.id !== id)
    }));
  };

  const createInvoice = (invoice: Invoice) => {
    setState(prev => ({
      ...prev,
      invoices: [invoice, ...prev.invoices]
    }));
  };

  const updateInvoice = (invoice: Invoice) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === invoice.id ? invoice : inv)
    }));
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setState(prev => {
      const newActivities = [...prev.activities];
      if (status === 'paid') {
        const invoice = prev.invoices.find(c => c.id === id);
        if (invoice && invoice.total > 0) {
          newActivities.unshift({
            id: `act_${Date.now()}`,
            type: 'invoice_payment',
            amount: invoice.total,
            referenceId: id,
            title: `Invoice ${id}`,
            subtitle: `Paid by ${invoice.customerName}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      return {
        ...prev,
        invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status } : inv),
        activities: newActivities
      };
    });
  };

  const requestVerification = (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => {
    setState(prev => {
      const verifications = prev.pendingVerifications || [];
      const alreadyPending = verifications.some(v => v.targetId === verification.targetId && v.type === verification.type && v.status === 'pending');
      
      if (alreadyPending) return prev;

      const newVerification: PendingVerification = {
        ...verification,
        id: `VER-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      return {
        ...prev,
        pendingVerifications: [...verifications, newVerification]
      };
    });
  };

  const resetCheck = (id: string) => {
    setState(prev => ({
      ...prev,
      checks: prev.checks.map(c => 
        c.id === id ? { ...c, status: 'open', orders: [], total: 0 } : c
      )
    }));
  };

  const resolveVerification = (id: string, confirmed: boolean) => {
    setState(prev => {
      const verifications = prev.pendingVerifications || [];
      const index = verifications.findIndex(v => v.id === id);
      if (index === -1) return prev;

      const verification = verifications[index];
      const newVerifications = [...verifications];
      newVerifications[index] = { ...verification, status: confirmed ? 'confirmed' : 'declined' };

      const newState = { ...prev, pendingVerifications: newVerifications };
      const newActivities = [...prev.activities];
      const newOrderHistory = [...prev.orderHistory];

      // Update actual status if confirmed
      if (confirmed) {
        if (verification.type === 'check') {
          // Automation: Automatically clear the check when confirmed
          const checkId = verification.targetId;
          const check = prev.checks.find(c => c.id === checkId);
          const pastOrderId = `ord_${Date.now()}`;
          
          if (check && check.orders.length > 0) {
            newOrderHistory.unshift({
                id: pastOrderId,
                checkId: checkId,
                orders: [...check.orders],
                total: check.total,
                timestamp: new Date().toISOString()
            });

            // Wipe the check back to 'open' state
            newState.checks = newState.checks.map(c => 
              c.id === checkId ? { ...c, status: 'open', orders: [], total: 0 } : c
            );
          }

          newActivities.unshift({
            id: `act_${Date.now()}`,
            type: 'check_payment',
            amount: verification.amount,
            referenceId: pastOrderId, // Link to unique order, not reusable check ID
            title: `Check #${checkId}`,
            subtitle: 'Paid and settled (Remote)',
            timestamp: new Date().toISOString()
          });
        } else if (verification.type === 'invoice') {
          newState.invoices = newState.invoices.map(inv => 
            inv.id === verification.targetId ? { ...inv, status: 'paid' } : inv
          );
          const inv = prev.invoices.find(i => i.id === verification.targetId);
          newActivities.unshift({
            id: `act_${Date.now()}`,
            type: 'invoice_payment',
            amount: verification.amount,
            referenceId: verification.targetId, // Invoices have unique IDs
            title: `Invoice ${verification.targetId}`,
            subtitle: inv ? `Paid by ${inv.customerName}` : 'Verified remote payment',
            timestamp: new Date().toISOString()
          });
        }
      }
      newState.activities = newActivities;
      newState.orderHistory = newOrderHistory;
      return newState;
    });
  };

  return (
    <MerchantContext.Provider value={{ 
      state, 
      isAuthenticated,
      isLoadingAuth,
      merchantUser,
      checkEmail,
      login,
      signup,
      logout,
      addBankAccount, 
      removeBankAccount,
      setPrimaryBankAccount,
      updateBusinessInfo,
      addMenuItem, 
      updateMenuItem,
      archiveMenuItem,
      restoreMenuItem,
      deleteMenuItem,
      updateCheckStatus, 
      addOrderToCheck, 
      addOrdersToCheck,
      updateOrderQuantity,
      clearCheck,
      addReward,
      updateReward,
      deleteReward,
      createInvoice,
      updateInvoice,
      updateInvoiceStatus,
      requestVerification,
      resolveVerification,
      resetCheck
    }}>
      {children}
    </MerchantContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMerchant = () => {
  const context = useContext(MerchantContext);
  if (!context) throw new Error('useMerchant must be used within MerchantProvider');
  return context;
};
