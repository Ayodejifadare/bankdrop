import React, { createContext, useEffect, useState } from 'react';
import type { 
  BankAccount, 
  OrderItem, 
  Invoice, 
  Check, 
  PendingVerification, 
  MerchantActivity, 
  PastOrder, 
  MerchantState,
  MerchantPreferences,
  MerchantContactInfo
} from '../types/merchant';
import { MERCHANT_LIMITS } from '../utils/constants';
import { MerchantAuthProvider } from './MerchantAuthContext';
import { MerchantMenuProvider, useMerchantMenu } from './MerchantMenuContext';
import { merchantService, profileService, realtimeService } from '../api/dataService';
import type { RealtimeEvent } from '../api/realtimeService';
import { STORAGE_KEYS } from '../utils/constants';
import { generateId } from '../utils/idUtils';

// Re-export sub-context hooks for convenience
export { useMerchantAuth } from './MerchantAuthContext';
export { useMerchantMenu } from './MerchantMenuContext';

export interface MerchantOpsContextType {
  state: MerchantState;
  isSaving: boolean;
  isLoading: boolean;
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => Promise<void>;
  removeBankAccount: (id: string) => Promise<void>;
  setPrimaryBankAccount: (id: string) => Promise<void>;
  updateBusinessInfo: (info: { name: string; profile: string; category: string }) => Promise<void>;
  updateCheckStatus: (id: string, status: 'open' | 'active' | 'paid') => Promise<void>;
  addOrderToCheck: (checkId: string, item: OrderItem) => Promise<void>;
  addOrdersToCheck: (checkId: string, items: OrderItem[]) => Promise<void>;
  updateOrderQuantity: (checkId: string, menuItemId: string, quantityDelta: number) => Promise<void>;
  createInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  requestVerification: (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  resolveVerification: (id: string, confirmed: boolean, confirmedAmount?: number) => Promise<void>;
  resetCheck: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<MerchantPreferences>) => Promise<void>;
  updateContactInfo: (contact: Partial<MerchantContactInfo>) => Promise<void>;
  toggleCheckEnabled: (checkId: string) => Promise<void>;
  addCheck: () => Promise<void>;
  linkBankAccountToCheck: (checkId: string, bankAccountId: string | undefined) => Promise<void>;
  setCheckPaymentMode: (checkId: string, mode: 'itemized' | 'quickpay') => Promise<void>;
  startCheckSession: (checkId: string) => Promise<string>;
}

export const MerchantOpsContext = createContext<MerchantOpsContextType | undefined>(undefined);

// genId is replaced by generateId utility


const { MAX_ARCHIVED_SESSIONS, MAX_ORDER_HISTORY, MAX_ACTIVITIES } = MERCHANT_LIMITS;

const INITIAL_OPS_STATE: MerchantState = {
  name: "Bankdrop Grill",
  businessProfile: "Premium local grill serving the best Jollof and Suya in the city.",
  businessCategory: "Food & Beverages",
  bankAccounts: [],
  menu: [], // Managed by MenuContext
  checks: Array.from({ length: 3 }, (_, i) => ({
    id: `${i + 1}`,
    status: 'open' as const,
    enabled: true,
    orders: [],
    total: 0,
  })),
  rewards: [], // Managed by MenuContext
  invoices: [],
  pendingVerifications: [],
  activities: [],
  orderHistory: [],
  archivedSessions: {},
  preferences: {
    currency: 'NGN',
    theme: 'dark',
    notifications: true,
    autoPrintReceipts: false,
    tableResetOnPay: true
  }
};

const MerchantOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { menu, rewards } = useMerchantMenu();
  const [state, setState] = useState<MerchantState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_STATE);
    const loaded = saved ? JSON.parse(saved) : {};
    
    // HYDRATION SAFETY NET: Deep merge to prevent missing arrays from crashing legacy merchants
    return { 
      ...INITIAL_OPS_STATE, 
      ...loaded,
      preferences: { ...INITIAL_OPS_STATE.preferences, ...(loaded.preferences || {}) },
      contactInfo: { ...(INITIAL_OPS_STATE.contactInfo || {}), ...(loaded.contactInfo || {}) },
      menu: [], 
      rewards: [] 
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading] = useState(false);

  // Background Revalidation
  useEffect(() => {
    const revalidate = async () => {
      const saved = await merchantService.fetchState();
      if (saved) {
        setState(prev => ({
          ...prev,
          ...saved,
          menu: [],
          rewards: []
        }));
      }
    };
    revalidate();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const unsub = realtimeService.subscribe('STATE_CHANGED', async (event: RealtimeEvent) => {
      // Only refresh if the update came from another tab (storage_event) 
      // or another provider in the same tab (menu)
      if (event.payload?.source !== 'ops') {
        const saved = await merchantService.fetchState();
        if (saved) {
          setState(prev => ({
            ...prev,
            ...saved,
            menu: [], // Keep managed by MenuContext
            rewards: []
          }));
        }
      }
    });
    return unsub;
  }, []);


  // Deep Prune on Mount
  useEffect(() => {
    setState(prev => _pruneState(prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helper Methods (Internal) ---
  const _archiveCheckState = (checkId: string, check: Check, source: string) => {
    const pastOrderId = generateId('ord');
    const sessionId = check.sessionId || generateId('SESS');
    const timestamp = new Date().toISOString();

    const pastOrder: PastOrder = {
      id: pastOrderId,
      checkId: checkId,
      sessionId,
      orders: [...check.orders],
      total: check.total,
      timestamp
    };

    const activity: MerchantActivity = {
      id: generateId('act'),
      type: 'check_payment',
      amount: check.total,
      referenceId: sessionId,
      title: `Check #${checkId}`,
      subtitle: source,
      timestamp
    };

    return { pastOrder, activity, sessionId };
  };

  const _pruneState = (state: MerchantState): MerchantState => {
    let { activities, orderHistory, archivedSessions } = state;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const THIRTY_DAYS = 30 * ONE_DAY;

    // 1. Ghost & Stale Session Pruning
    const sessionEntries = Object.entries(archivedSessions);
    const filteredSessions = sessionEntries.filter(([_, session]) => {
      const timestamp = session.timestamp ? new Date(session.timestamp).getTime() : now;
      const age = now - timestamp;
      
      // Delete empty "Ghost" sessions after 24 hours
      if (session.orders.length === 0 && age > ONE_DAY) return false;
      
      // Hard limit: Delete any session older than 30 days
      if (age > THIRTY_DAYS) return false;
      
      return true;
    });

    archivedSessions = Object.fromEntries(filteredSessions);

    // 2. Activity & History Pruning (Size caps)
    if (activities.length > MAX_ACTIVITIES) activities = activities.slice(0, MAX_ACTIVITIES);
    if (orderHistory.length > MAX_ORDER_HISTORY) orderHistory = orderHistory.slice(0, MAX_ORDER_HISTORY);
    
    const sessionKeys = Object.keys(archivedSessions);
    if (sessionKeys.length > MAX_ARCHIVED_SESSIONS) {
      const keysToRemove = sessionKeys.slice(0, sessionKeys.length - MAX_ARCHIVED_SESSIONS);
      const newArchived = { ...archivedSessions };
      keysToRemove.forEach(k => {
        delete newArchived[k];
        // SIDE EFFECT: Cleanup split session data to prevent storage bloat
        localStorage.removeItem(`check_split_${k}`);
      });
      archivedSessions = newArchived;
    }
    
    // Cleanup any orphaned check_split keys that aren't in archivedSessions 
    // and aren't active in any check
    try {
      const activeSessions = new Set(state.checks.map(c => c.sessionId).filter(Boolean));
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('check_split_')) {
          const sId = key.replace('check_split_', '');
          if (!activeSessions.has(sId) && !archivedSessions[sId]) {
             localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      // Silently fail if localStorage access issues
    }

    return { ...state, activities, orderHistory, archivedSessions };
  };

  const _addActivity = (activities: MerchantActivity[], newAct: MerchantActivity): MerchantActivity[] => {
    if (newAct.referenceId) {
      const isDuplicate = activities.some(a => a.referenceId === newAct.referenceId && a.type === newAct.type);
      if (isDuplicate) return activities;
    }
    return [newAct, ...activities];
  };

  /**
   * CENTRALIZED PERSISTENCE HELPER
   * Standardizes the Fetch-Modify-Save pattern to prevent race conditions.
   * Now with Optimistic UI for instant feedback.
   */
  const performOpsUpdate = async (updater: (current: MerchantState) => MerchantState) => {
    const prevState = state;
    
    // 1. Apply Optimistic Update
    const optimisticState = updater(state);
    setState(optimisticState);
    setIsSaving(true);
    
    try {
      // 2. Persist in background
      const next = await merchantService.patchState(current => {
        const isStorageEmpty = Object.keys(current).length === 0;
        const safeCurrent = isStorageEmpty ? state : { ...INITIAL_OPS_STATE, ...current };

        const nextOps = updater(safeCurrent);
        
        // DE-DUPLICATION: Ensure checks are unique by ID to prevent dashboard ghosting
        const uniqueChecks = nextOps.checks.reduce((acc: Check[], check) => {
          if (!acc.find(c => c.id === check.id)) acc.push(check);
          return acc;
        }, []);

        return {
          ...nextOps,
          checks: uniqueChecks,
          menu: safeCurrent.menu || [],
          rewards: safeCurrent.rewards || []
        };
      }, 'ops');
      
      setState(next);
    } catch (err) {
      console.error('Failed to persist merchant state, rolling back:', err);
      setState(prevState);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Public Methods ---
  const addBankAccount = async (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      bankAccounts: [...current.bankAccounts, { ...bank, id: generateId('acc'), isPrimary: current.bankAccounts.length === 0 }] 
    }));
  };

  const removeBankAccount = async (id: string) => {
    await performOpsUpdate(current => {
      const newAccounts = current.bankAccounts.filter(acc => acc.id !== id);
      if (current.bankAccounts.find(acc => acc.id === id)?.isPrimary && newAccounts.length > 0) {
        newAccounts[0].isPrimary = true;
      }
      return { ...current, bankAccounts: newAccounts };
    });
  };

  const setPrimaryBankAccount = async (id: string) => {
    await performOpsUpdate(current => ({
      ...current,
      bankAccounts: current.bankAccounts.map(acc => ({ ...acc, isPrimary: acc.id === id }))
    }));
  };

  const updateBusinessInfo = async (info: { name: string; profile: string; category: string }) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      name: info.name, 
      businessProfile: info.profile, 
      businessCategory: info.category 
    }));
  };

  const updateCheckStatus = async (id: string, status: 'open' | 'active' | 'paid') => {
    await performOpsUpdate(current => {
      if (status === 'paid') {
        const check = current.checks.find(c => c.id === id || c.sessionId === id);
        if (check && check.total > 0) {
          const { pastOrder, activity, sessionId } = _archiveCheckState(check.id, check, 'Paid and settled');
          return _pruneState({
            ...current,
            checks: current.checks.map(c => (c.id === check.id) ? { 
              ...c, 
              status: 'open', 
              orders: [], 
              total: 0, 
              sessionId: undefined,
              lifetimeOrders: (c.lifetimeOrders || 0) + c.orders.length,
              lifetimeRevenue: (c.lifetimeRevenue || 0) + c.total
            } : c),
            activities: _addActivity(current.activities, activity),
            orderHistory: [pastOrder, ...current.orderHistory],
            archivedSessions: { ...current.archivedSessions, [sessionId]: pastOrder }
          });
        }
      }
      return { ...current, checks: current.checks.map(c => (c.id === id || c.sessionId === id) ? { ...c, status } : c) };
    });
  };

  const addOrdersToCheck = async (checkId: string, items: OrderItem[]) => {
    await performOpsUpdate(current => ({
      ...current,
      checks: current.checks.map(c => {
        if (c.id !== checkId && c.sessionId !== checkId) return c;
        const newOrders = [...c.orders];
        let totalDelta = 0;
        
        // Use current.menu from the latest storage state instead of the (possibly stale) context menu
        const activeMenu = current.menu || [];
        
        items.forEach(item => {
          const menuItem = activeMenu.find(m => m.id === item.menuItemId);
          const menuPrice = menuItem?.price || 0;
          const idx = newOrders.findIndex(o => o.menuItemId === item.menuItemId);
          
          if (idx >= 0) {
            newOrders[idx] = { ...newOrders[idx], quantity: newOrders[idx].quantity + item.quantity };
            totalDelta += newOrders[idx].priceAtOrder * item.quantity;
          } else {
            const price = item.priceAtOrder || menuPrice;
            newOrders.push({ ...item, priceAtOrder: price });
            totalDelta += price * item.quantity;
          }
        });
        return { ...c, status: 'active', orders: newOrders, total: c.total + totalDelta, sessionId: c.sessionId || generateId('SESS') };
      })
    }));
  };

  const addOrderToCheck = async (checkId: string, item: OrderItem) => await addOrdersToCheck(checkId, [item]);

  const updateOrderQuantity = async (checkId: string, menuItemId: string, quantityDelta: number) => {
    await performOpsUpdate(current => ({
      ...current,
      checks: current.checks.map(c => {
        if (c.id !== checkId && c.sessionId !== checkId) return c;
        const idx = c.orders.findIndex(o => o.menuItemId === menuItemId);
        if (idx === -1 && quantityDelta <= 0) return c;
        const newOrders = [...c.orders];
        let delta = 0;
        if (idx >= 0) {
          const item = newOrders[idx];
          const newQty = Math.max(0, item.quantity + quantityDelta);
          if (newQty === 0) {
            newOrders.splice(idx, 1);
            delta = -(item.priceAtOrder * item.quantity);
          } else {
            newOrders[idx] = { ...item, quantity: newQty };
            delta = item.priceAtOrder * quantityDelta;
          }
        } else {
          const activeMenu = current.menu || [];
          const menuPrice = activeMenu.find(m => m.id === menuItemId)?.price || 0;
          newOrders.push({ menuItemId, quantity: quantityDelta, priceAtOrder: menuPrice });
          delta = menuPrice * quantityDelta;
        }
        return { ...c, status: newOrders.length > 0 ? 'active' : 'open', orders: newOrders, total: Math.max(0, c.total + delta) };
      })
    }));
  };

  const createInvoice = async (invoice: Invoice) => {
    await performOpsUpdate(current => ({ ...current, invoices: [invoice, ...current.invoices] }));
  };
  const updateInvoice = async (invoice: Invoice) => {
    await performOpsUpdate(current => ({ ...current, invoices: current.invoices.map(inv => inv.id === invoice.id ? invoice : inv) }));
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    await performOpsUpdate(current => {
      let activities = current.activities;
      if (status === 'paid') {
        const inv = current.invoices.find(c => c.id === id);
        if (inv) {
          activities = _addActivity(current.activities, {
            id: generateId('act'), type: 'invoice_payment', amount: inv.total, referenceId: id,
            title: `Invoice ${id}`, subtitle: `Paid by ${inv.customerName}`, timestamp: new Date().toISOString()
          });
        }
      }
      return _pruneState({
        ...current,
        invoices: current.invoices.map(inv => inv.id === id ? { ...inv, status } : inv),
        activities
      });
    });
  };

  const requestVerification = async (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => {
    await performOpsUpdate(current => {
      const verifications = current.pendingVerifications || [];
      if (verifications.some(v => v.targetId === verification.targetId && v.type === verification.type && v.status === 'pending')) return current;
      return { 
        ...current, 
        pendingVerifications: [...verifications, { ...verification, id: generateId('VER'), timestamp: new Date().toISOString(), status: 'pending' }] 
      };
    });
  };

  const resolveVerification = async (id: string, confirmed: boolean, confirmedAmount?: number) => {
    await performOpsUpdate(current => {
      const verifications = current.pendingVerifications || [];
      const idx = verifications.findIndex(v => v.id === id);
      if (idx === -1) return current;
      
      const v = verifications[idx];
      const newVerifications = [...verifications];
      newVerifications[idx] = { ...v, status: confirmed ? 'confirmed' : 'declined' };
      let nextState = { ...current, pendingVerifications: newVerifications };

      if (confirmed) {
        if (v.type === 'check') {
          // Find check by ID or Session ID
          const check = current.checks.find(c => c.id === v.targetId || c.sessionId === v.targetId);
          if (check) {
            // REGRESSION FIX: Only reset check if this payment covers the remaining balance
            const isFullPayment = v.amount >= (check.total - 1); // 1 unit tolerance for rounding

            if (isFullPayment) {
              const { pastOrder, activity, sessionId } = _archiveCheckState(check.id, check, 'Paid and settled (Remote)');
              nextState = _pruneState({
                ...nextState,
                checks: nextState.checks.map(c => (c.id === check.id) ? { 
                  ...c, 
                  status: 'open', 
                  orders: [], 
                  total: 0, 
                  sessionId: undefined,
                  lifetimeOrders: (c.lifetimeOrders || 0) + c.orders.length,
                  lifetimeRevenue: (c.lifetimeRevenue || 0) + c.total
                } : c),
                activities: _addActivity(nextState.activities, activity),
                orderHistory: [pastOrder, ...nextState.orderHistory],
                archivedSessions: { ...nextState.archivedSessions, [sessionId]: pastOrder }
              });
            } else {
              // PARTIAL PAYMENT: Just subtract the amount and keep the check/session active
              nextState = {
                ...nextState,
                checks: nextState.checks.map(c => (c.id === check.id) ? {
                  ...c,
                  total: Math.max(0, c.total - v.amount),
                  lifetimeRevenue: (c.lifetimeRevenue || 0) + v.amount
                } : c),
                activities: _addActivity(nextState.activities, {
                  id: generateId('act'),
                  type: 'check_payment',
                  amount: v.amount,
                  referenceId: v.targetId,
                  title: `Partial Payment: Check #${check.id}`,
                  subtitle: `Verified share payment`,
                  timestamp: new Date().toISOString()
                })
              };
            }
          }
        } else if (v.type === 'invoice') {
          const inv = current.invoices.find(i => i.id === v.targetId);
          nextState = _pruneState({
            ...nextState,
            invoices: nextState.invoices.map(i => i.id === v.targetId ? { ...i, status: 'paid' } : i),
            activities: _addActivity(nextState.activities, {
              id: generateId('act'), type: 'invoice_payment', amount: confirmedAmount || v.amount, referenceId: v.targetId,
              title: `Invoice ${v.targetId}`, subtitle: inv ? `Paid by ${inv.customerName}` : 'Verified remote payment', timestamp: new Date().toISOString()
            })
          });
        } else if (v.type === 'quickpay') {
          nextState = _pruneState({
            ...nextState,
            activities: _addActivity(nextState.activities, {
              id: generateId('act'), type: 'quickpay', amount: confirmedAmount || v.amount, referenceId: v.targetId || v.id,
              title: 'Quickpay', subtitle: 'Received via QR Terminal', timestamp: new Date().toISOString()
            })
          });
        }
        
        // SYNC: Complete any customer activity linked to this targetId
        profileService.completeActivityByReference(v.targetId);
      }
      return _pruneState(nextState);
    });
  };

  const resetCheck = async (id: string) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      checks: current.checks.map(c => (c.id === id || c.sessionId === id) ? { ...c, status: 'open', orders: [], total: 0, sessionId: undefined } : c) 
    }));
  };
  const updatePreferences = async (prefs: Partial<MerchantPreferences>) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      preferences: { ...current.preferences, ...prefs } 
    }));
  };
  const updateContactInfo = async (contact: Partial<MerchantContactInfo>) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      contactInfo: { ...current.contactInfo!, ...contact } 
    }));
  };
  const toggleCheckEnabled = async (checkId: string) => {
    await performOpsUpdate(current => ({
      ...current,
      checks: current.checks.map(c => {
        if (c.id !== checkId) return c;
        if (c.enabled) {
          if (c.status !== 'open') return c;
          // Stats are now captured incrementally at checkout, no need to back-calculate here
          return { ...c, enabled: false, archivedAt: new Date().toISOString() };
        }
        return { ...c, enabled: true, archivedAt: undefined };
      })
    }));
  };

  const addCheck = async () => {
    await performOpsUpdate(current => {
      const maxId = current.checks.reduce((max, c) => Math.max(max, parseInt(c.id) || 0), 0);
      const newCheck: Check = { id: `${maxId + 1}`, status: 'open', enabled: true, orders: [], total: 0 };
      return { ...current, checks: [...current.checks, newCheck] };
    });
  };

  const linkBankAccountToCheck = async (checkId: string, bankAccountId: string | undefined) => {
    await performOpsUpdate(current => ({ 
      ...current, 
      checks: current.checks.map(c => (c.id === checkId || c.sessionId === checkId) ? { ...c, bankAccountId } : c) 
    }));
  };
  const setCheckPaymentMode = async (checkId: string, mode: 'itemized' | 'quickpay') => {
    await performOpsUpdate(current => ({ 
      ...current, 
      checks: current.checks.map(c => (c.id === checkId || c.sessionId === checkId) ? { ...c, paymentMode: mode } : c) 
    }));
  };

  const startCheckSession = async (checkId: string) => {
    const newSessionId = generateId('SESS');
    
    await performOpsUpdate(current => {
      const check = current.checks.find(c => c.id === checkId);
      if (!check) return current;

      let nextState = { ...current };
      let orderHistory = [...current.orderHistory];
      let activities = current.activities;

      // Archive previous session if it had data
      if (check.sessionId && (check.orders.length > 0 || check.total > 0)) {
        const { pastOrder, activity, sessionId } = _archiveCheckState(checkId, check, 'Table reset by new scan');
        orderHistory = [pastOrder, ...orderHistory];
        activities = _addActivity(current.activities, activity);
        nextState.archivedSessions = { ...current.archivedSessions, [sessionId]: pastOrder };
      }

      // Reset check and assign new session
      nextState.checks = nextState.checks.map(c => 
        c.id === checkId ? { 
          ...c, 
          status: 'open', 
          orders: [], 
          total: 0, 
          sessionId: newSessionId,
          lifetimeOrders: (c.lifetimeOrders || 0) + (check.orders?.length || 0),
          lifetimeRevenue: (c.lifetimeRevenue || 0) + (check.total || 0)
        } : c
      );

      return _pruneState({ ...nextState, activities, orderHistory });
    });

    return newSessionId;
  };

  return (
    <MerchantOpsContext.Provider value={{
      state: { ...state, menu, rewards }, // Unified state for backward compat
      isSaving,
      isLoading,
      addBankAccount, removeBankAccount, setPrimaryBankAccount, updateBusinessInfo,
      updateCheckStatus, addOrderToCheck, addOrdersToCheck, updateOrderQuantity,
      createInvoice, updateInvoice, updateInvoiceStatus, requestVerification,
      resolveVerification, resetCheck, updatePreferences, updateContactInfo,
      toggleCheckEnabled, addCheck, linkBankAccountToCheck, setCheckPaymentMode, startCheckSession
    }}>
      {children}
    </MerchantOpsContext.Provider>
  );
};

// --- Unified Merchant Provider (The Root) ---
export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MerchantAuthProvider>
      <MerchantMenuProvider>
        <MerchantOpsProvider>
          {children}
        </MerchantOpsProvider>
      </MerchantMenuProvider>
    </MerchantAuthProvider>
  );
};

export { useMerchant } from '../hooks/useMerchant';
