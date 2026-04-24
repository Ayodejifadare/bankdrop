import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
import { MerchantAuthProvider, useMerchantAuth } from './MerchantAuthContext';
import { MerchantMenuProvider, useMerchantMenu } from './MerchantMenuContext';

// Re-export sub-context hooks for convenience
export { useMerchantAuth } from './MerchantAuthContext';
export { useMerchantMenu } from './MerchantMenuContext';

interface MerchantOpsContextType {
  state: MerchantState;
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => void;
  removeBankAccount: (id: string) => void;
  setPrimaryBankAccount: (id: string) => void;
  updateBusinessInfo: (info: { name: string; profile: string; category: string }) => void;
  updateCheckStatus: (id: string, status: 'open' | 'active' | 'paid') => void;
  addOrderToCheck: (checkId: string, item: OrderItem) => void;
  addOrdersToCheck: (checkId: string, items: OrderItem[]) => void;
  updateOrderQuantity: (checkId: string, menuItemId: string, quantityDelta: number) => void;
  createInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  requestVerification: (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => void;
  resolveVerification: (id: string, confirmed: boolean, confirmedAmount?: number) => void;
  resetCheck: (id: string) => void;
  updatePreferences: (prefs: Partial<MerchantPreferences>) => void;
  updateContactInfo: (contact: Partial<MerchantContactInfo>) => void;
  toggleCheckEnabled: (checkId: string) => void;
  addCheck: () => void;
  linkBankAccountToCheck: (checkId: string, bankAccountId: string | undefined) => void;
  setCheckPaymentMode: (checkId: string, mode: 'itemized' | 'quickpay') => void;
  startCheckSession: (checkId: string) => string;
}

const MerchantOpsContext = createContext<MerchantOpsContextType | undefined>(undefined);

// Hardened ID generator
const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const MAX_ARCHIVED_SESSIONS = 50;
const MAX_ORDER_HISTORY = 100;
const MAX_ACTIVITIES = 150;

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
    const saved = localStorage.getItem('merchant_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...INITIAL_OPS_STATE, 
        ...parsed,
        menu: [], // Ensure these are kept empty in Ops state to avoid sync issues
        rewards: []
      };
    }
    return INITIAL_OPS_STATE;
  });

  // Sync to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('merchant_state');
    const currentState = saved ? JSON.parse(saved) : {};
    localStorage.setItem('merchant_state', JSON.stringify({
      ...currentState,
      ...state,
      menu, // Keep global state object in LocalStorage complete for other apps
      rewards
    }));
  }, [state, menu, rewards]);

  // Deep Prune on Mount
  useEffect(() => {
    setState(prev => _pruneState(prev));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Helper Methods (Internal) ---
  const _archiveCheckState = (checkId: string, check: Check, source: string) => {
    const pastOrderId = genId('ord');
    const sessionId = check.sessionId || genId('SESS');
    const timestamp = new Date().toISOString();

    const pastOrder: PastOrder = {
      id: pastOrderId,
      checkId: checkId,
      orders: [...check.orders],
      total: check.total,
      timestamp
    };

    const activity: MerchantActivity = {
      id: genId('act'),
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
      keysToRemove.forEach(k => delete newArchived[k]);
      archivedSessions = newArchived;
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

  // --- Public Methods ---
  const addBankAccount = (bank: Omit<BankAccount, 'id' | 'isPrimary'>) => {
    setState(prev => ({ 
      ...prev, 
      bankAccounts: [...prev.bankAccounts, { ...bank, id: genId('acc'), isPrimary: prev.bankAccounts.length === 0 }] 
    }));
  };

  const removeBankAccount = (id: string) => {
    setState(prev => {
      const newAccounts = prev.bankAccounts.filter(acc => acc.id !== id);
      if (prev.bankAccounts.find(acc => acc.id === id)?.isPrimary && newAccounts.length > 0) {
        newAccounts[0].isPrimary = true;
      }
      return { ...prev, bankAccounts: newAccounts };
    });
  };

  const setPrimaryBankAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(acc => ({ ...acc, isPrimary: acc.id === id }))
    }));
  };

  const updateBusinessInfo = (info: { name: string; profile: string; category: string }) => {
    setState(prev => ({ ...prev, name: info.name, businessProfile: info.profile, businessCategory: info.category }));
  };

  const updateCheckStatus = (id: string, status: 'open' | 'active' | 'paid') => {
    setState(prev => {
      if (status === 'paid') {
        const check = prev.checks.find(c => c.id === id);
        if (check && check.total > 0) {
          const { pastOrder, activity, sessionId } = _archiveCheckState(id, check, 'Paid and settled');
          return _pruneState({
            ...prev,
            checks: prev.checks.map(c => c.id === id ? { ...c, status: 'open', orders: [], total: 0, sessionId: undefined } : c),
            activities: _addActivity(prev.activities, activity),
            orderHistory: [pastOrder, ...prev.orderHistory],
            archivedSessions: { ...prev.archivedSessions, [sessionId]: pastOrder }
          });
        }
      }
      return { ...prev, checks: prev.checks.map(c => c.id === id ? { ...c, status } : c) };
    });
  };

  const addOrdersToCheck = (checkId: string, items: OrderItem[]) => {
    setState(prev => ({
      ...prev,
      checks: prev.checks.map(c => {
        if (c.id !== checkId) return c;
        const newOrders = [...c.orders];
        let totalDelta = 0;
        items.forEach(item => {
          const menuPrice = menu.find(m => m.id === item.menuItemId)?.price || 0;
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
        return { ...c, status: 'active', orders: newOrders, total: c.total + totalDelta, sessionId: c.sessionId || genId('SESS') };
      })
    }));
  };

  const addOrderToCheck = (checkId: string, item: OrderItem) => addOrdersToCheck(checkId, [item]);

  const updateOrderQuantity = (checkId: string, menuItemId: string, quantityDelta: number) => {
    setState(prev => {
      const menuPrice = menu.find(m => m.id === menuItemId)?.price || 0;
      return {
        ...prev,
        checks: prev.checks.map(c => {
          if (c.id !== checkId) return c;
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
            newOrders.push({ menuItemId, quantity: quantityDelta, priceAtOrder: menuPrice });
            delta = menuPrice * quantityDelta;
          }
          return { ...c, status: newOrders.length > 0 ? 'active' : 'open', orders: newOrders, total: Math.max(0, c.total + delta) };
        })
      };
    });
  };

  const createInvoice = (invoice: Invoice) => setState(prev => ({ ...prev, invoices: [invoice, ...prev.invoices] }));
  const updateInvoice = (invoice: Invoice) => setState(prev => ({ ...prev, invoices: prev.invoices.map(inv => inv.id === invoice.id ? invoice : inv) }));

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setState(prev => {
      let activities = prev.activities;
      if (status === 'paid') {
        const inv = prev.invoices.find(c => c.id === id);
        if (inv) {
          activities = _addActivity(prev.activities, {
            id: genId('act'), type: 'invoice_payment', amount: inv.total, referenceId: id,
            title: `Invoice ${id}`, subtitle: `Paid by ${inv.customerName}`, timestamp: new Date().toISOString()
          });
        }
      }
      return _pruneState({ ...prev, invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status } : inv), activities });
    });
  };

  const requestVerification = (verification: Omit<PendingVerification, 'id' | 'timestamp' | 'status'>) => {
    setState(prev => {
      const verifications = prev.pendingVerifications || [];
      if (verifications.some(v => v.targetId === verification.targetId && v.type === verification.type && v.status === 'pending')) return prev;
      return { ...prev, pendingVerifications: [...verifications, { ...verification, id: genId('VER'), timestamp: new Date().toISOString(), status: 'pending' }] };
    });
  };

  const resolveVerification = (id: string, confirmed: boolean, confirmedAmount?: number) => {
    setState(prev => {
      const verifications = prev.pendingVerifications || [];
      const idx = verifications.findIndex(v => v.id === id);
      if (idx === -1) return prev;
      const v = verifications[idx];
      const newVerifications = [...verifications];
      newVerifications[idx] = { ...v, status: confirmed ? 'confirmed' : 'declined' };
      const nextState = { ...prev, pendingVerifications: newVerifications };

      if (confirmed) {
        if (v.type === 'check') {
          const check = prev.checks.find(c => c.id === v.targetId);
          if (check && check.orders.length > 0) {
            const { pastOrder, activity, sessionId } = _archiveCheckState(v.targetId, check, 'Paid and settled (Remote)');
            return _pruneState({
              ...nextState,
              checks: nextState.checks.map(c => c.id === v.targetId ? { ...c, status: 'open', orders: [], total: 0, sessionId: undefined } : c),
              activities: _addActivity(nextState.activities, activity),
              orderHistory: [pastOrder, ...nextState.orderHistory],
              archivedSessions: { ...nextState.archivedSessions, [sessionId]: pastOrder }
            });
          }
        } else if (v.type === 'invoice') {
          const inv = prev.invoices.find(i => i.id === v.targetId);
          return _pruneState({
            ...nextState,
            invoices: nextState.invoices.map(i => i.id === v.targetId ? { ...i, status: 'paid' } : i),
            activities: _addActivity(nextState.activities, {
              id: genId('act'), type: 'invoice_payment', amount: confirmedAmount || v.amount, referenceId: v.targetId,
              title: `Invoice ${v.targetId}`, subtitle: inv ? `Paid by ${inv.customerName}` : 'Verified remote payment', timestamp: new Date().toISOString()
            })
          });
        } else if (v.type === 'quickpay') {
          return _pruneState({
            ...nextState,
            activities: _addActivity(nextState.activities, {
              id: genId('act'), type: 'quickpay', amount: confirmedAmount || v.amount, referenceId: v.targetId || v.id,
              title: 'Quickpay', subtitle: 'Received via QR Terminal', timestamp: new Date().toISOString()
            })
          });
        }
      }
      return _pruneState(nextState);
    });
  };

  const resetCheck = (id: string) => setState(prev => ({ ...prev, checks: prev.checks.map(c => c.id === id ? { ...c, status: 'open', orders: [], total: 0, sessionId: undefined } : c) }));
  const updatePreferences = (prefs: Partial<MerchantPreferences>) => setState(prev => ({ ...prev, preferences: { ...prev.preferences, ...prefs } }));
  const updateContactInfo = (contact: Partial<MerchantContactInfo>) => setState(prev => ({ ...prev, contactInfo: { ...prev.contactInfo!, ...contact } }));
  const toggleCheckEnabled = (checkId: string) => {
    setState(prev => ({
      ...prev,
      checks: prev.checks.map(c => {
        if (c.id !== checkId) return c;
        if (c.enabled) {
          if (c.status !== 'open') return c;
          const checkOrders = prev.orderHistory.filter(o => o.checkId === checkId);
          return { ...c, enabled: false, archivedAt: new Date().toISOString(), lifetimeOrders: (c.lifetimeOrders || 0) + checkOrders.reduce((sum, o) => sum + o.orders.length, 0), lifetimeRevenue: (c.lifetimeRevenue || 0) + checkOrders.reduce((sum, o) => sum + o.total, 0) };
        }
        return { ...c, enabled: true, archivedAt: undefined };
      })
    }));
  };

  const addCheck = () => {
    setState(prev => {
      const maxId = prev.checks.reduce((max, c) => Math.max(max, parseInt(c.id) || 0), 0);
      return { ...prev, checks: [...prev.checks, { id: `${maxId + 1}`, status: 'open', enabled: true, orders: [], total: 0 }] };
    });
  };

  const linkBankAccountToCheck = (checkId: string, bankAccountId: string | undefined) => setState(prev => ({ ...prev, checks: prev.checks.map(c => c.id === checkId ? { ...c, bankAccountId } : c) }));
  const setCheckPaymentMode = (checkId: string, mode: 'itemized' | 'quickpay') => setState(prev => ({ ...prev, checks: prev.checks.map(c => c.id === checkId ? { ...c, paymentMode: mode } : c) }));

  const startCheckSession = (checkId: string) => {
    const newSessionId = genId('SESS');
    setState(prev => {
      const check = prev.checks.find(c => c.id === checkId);
      if (!check) return prev;
      let nextState = { ...prev };
      let activities = prev.activities;
      const orderHistory = [...prev.orderHistory];
      if (check.sessionId && (check.orders.length > 0 || check.total > 0)) {
        const { pastOrder, activity, sessionId } = _archiveCheckState(checkId, check, 'Table reset by new scan');
        orderHistory.unshift(pastOrder);
        activities = _addActivity(prev.activities, activity);
        nextState.archivedSessions = { ...prev.archivedSessions, [sessionId]: pastOrder };
      }
      nextState.checks = nextState.checks.map(c => c.id === checkId ? { ...c, status: 'open', orders: [], total: 0, sessionId: newSessionId } : c);
      return _pruneState({ ...nextState, activities, orderHistory });
    });
    return newSessionId;
  };

  return (
    <MerchantOpsContext.Provider value={{
      state: { ...state, menu, rewards }, // Unified state for backward compat
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

// --- Unified Hook (Backward Compatible) ---
export const useMerchant = () => {
  const ops = useContext(MerchantOpsContext);
  const auth = useMerchantAuth();
  const menu = useMerchantMenu();

  if (!ops) throw new Error('useMerchant must be used within MerchantProvider');

  return useMemo(() => ({
    ...ops,
    ...auth,
    ...menu,
    // Ensure 'state' contains menu/rewards for components that expect it
    state: { ...ops.state, menu: menu.menu, rewards: menu.rewards }
  }), [ops, auth, menu]);
};
