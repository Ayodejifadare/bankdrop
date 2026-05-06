import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SplitSession, Participant, SplitMethod, SessionItem } from '../types/checkout';
import { customerService } from '../api/dataService';
import { generateSimpleId } from '../utils/idUtils';
import { useCustomerProfile } from './CustomerProfileContext';
import { STORAGE_KEYS } from '../utils/constants';
import { flattenOrders, getSelectedItems, migrateLegacySelections, isCheckInSync, transformToSessionItems, reconcileSelections } from '../utils/orderUtils';
import { useMerchant } from './MerchantContext';


interface CustomerContextType {
  checkId: string | null;
  sessionId: string | null;
  splitSession: SplitSession | null;
  participantId: string;
  isSignedIn: boolean;
  appliedRewardId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  setCheckId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setSignedIn: (v: boolean) => void;
  applyReward: (id: string | null) => void;
  createSplitSession: (checkId: string, sessionId: string, method: SplitMethod, items: SessionItem[], businessName: string) => Promise<SplitSession>;
  joinSplitSession: (sessionId: string) => Promise<SplitSession | null>;
  updateParticipant: (sessionId: string, participant: Participant) => Promise<void>;
  changeSplitMethod: (method: SplitMethod) => Promise<void>;
  applySessionReward: (amount: number, name: string) => Promise<void>;
  removeSessionReward: () => Promise<void>;
  markPaid: (amount?: number, items?: any[]) => Promise<void>;

  clearSession: (checkId: string) => Promise<void>;
  syncError: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participantId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID);
    if (saved) return saved;
    const id = generateSimpleId();
    localStorage.setItem(STORAGE_KEYS.PARTICIPANT_ID, id);
    return id;
  });
  const { user, isAuthenticated, addActivity } = useCustomerProfile();

  const [checkId, setCheckId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [splitSession, setSplitSession] = useState<SplitSession | null>(() => {
    const hash = window.location.hash;
    const sId = hash.includes('/session/') ? hash.split('/session/')[1]?.split('?')[0] : null;
    if (sId) {
      const saved = localStorage.getItem(`check_split_${sId}`);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [isSignedIn, setSignedIn] = useState(false);
  const [appliedRewardId, setAppliedRewardId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-clear sync errors
  useEffect(() => {
    if (syncError) {
      const t = setTimeout(() => setSyncError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [syncError]);

  // Background Revalidation
  useEffect(() => {
    if (sessionId) {
      const loadSession = async () => {
        const saved = await customerService.fetchSplitSession(sessionId);
        if (saved) setSplitSession(saved);
      };
      loadSession();
    }
  }, [sessionId]);

  // LIVE SYNC: Subscribe to dataService updates
  useEffect(() => {
    if (!sessionId) return;
    return customerService.subscribeToSplitSession(sessionId, (updated) => {
      setSplitSession(updated);
    });
  }, [sessionId]);

  // Persist State Helper (Optimistic)
  const performSessionUpdate = useCallback(async (updater: (cur: SplitSession) => SplitSession) => {
    if (!sessionId || !splitSession) return;
    const prev = splitSession;
    
    // 1. Instant UI update
    const optimistic = updater(splitSession);
    setSplitSession(optimistic);
    setIsSaving(true);
    
    try {
      // 2. Async persistence
      const next = await customerService.patchSplitSession(sessionId, updater, 'customer');
      // 3. Silent re-sync
      setSplitSession(next);
    } catch (err) {
      console.error('Session update failed, rolling back:', err);
      setSplitSession(prev);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, splitSession]);

  // --- LIVE MERCHANT-TO-SESSION SYNC BRIDGE ---
  // This ensures that if the merchant adds/removes items, the split session is updated
  const { state: merchant } = useMerchant();
  
  useEffect(() => {
    if (!splitSession || isSaving) return;

    const check = merchant.checks.find(c => c.id === splitSession.checkId || c.sessionId === splitSession.checkId);
    if (!check) return;

    const needsSync = !isCheckInSync(check.orders, splitSession.items || []);
    
    if (needsSync) {
      const newItems = transformToSessionItems(check.orders, merchant.menu);
      
      // Atomic update to items AND reconciliation of selections
      performSessionUpdate(current => {
        const reconciledMap = reconcileSelections(
          newItems.map(i => ({ id: i.id, quantity: i.quantity })),
          current.participants
        );

        const updatedParticipants = current.participants.map(p => ({
          ...p,
          selectedItems: reconciledMap.get(p.id) || []
        }));

        return {
          ...current,
          items: newItems,
          participants: updatedParticipants
        };
      });
    }
  }, [merchant.checks, splitSession?.id, isSaving]);

  const createSplitSession = useCallback(async (cId: string, sId: string, method: SplitMethod, items: SessionItem[], businessName: string): Promise<SplitSession> => {
    setIsSaving(true);
    try {
      // ATOMIC CREATE: Only create if doesn't exist, otherwise return existing
      const session = await customerService.patchSplitSession(sId, current => {
        if (current && current.id === sId) {
          // LEGACY MIGRATION: If existing session has old selectedItemIndices, migrate them
          const migratedParticipants = current.participants.map((p: any) => {
            if (p.selectedItemIndices && !p.selectedItems) {
              return {
                ...p,
                selectedItems: migrateLegacySelections(p.selectedItemIndices, current.items),
                selectedItemIndices: undefined
              };
            }
            return p;
          });
          return { ...current, participants: migratedParticipants };
        }
        
        return {
          id: sId,
          checkId: cId,
          businessName: businessName,
          method,
          participants: [{
            id: participantId,
            name: 'Guest 1',
            selectedItems: [],
            share: 0,
            paid: false,
          }],
          items: items,
          status: 'active',
          createdAt: Date.now()
        } as SplitSession;
      }, 'customer');

      setSplitSession(session);
      return session;
    } finally {
      setIsSaving(false);
    }
  }, [participantId]);
  
  const joinSplitSession = useCallback(async (sId: string): Promise<SplitSession | null> => {
    setIsLoading(true);
    try {
      // ATOMIC JOIN: Safely add participant to existing session
      const session = await customerService.patchSplitSession(sId, current => {
        if (!current || !current.id) return current; // Can't join non-existent
        
        if (!current.participants.find((p: Participant) => p.id === participantId)) {
          return {
            ...current,
            participants: [...current.participants, {
              id: participantId,
              name: `Guest ${current.participants.length + 1}`,
              selectedItems: [],
              share: 0,
              paid: false,
            }]
          };
        }
        return current;
      }, 'customer');
      
      setSplitSession(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, [participantId]);

  const updateParticipant = useCallback(async (_sessionId: string, updated: Participant) => {
    await performSessionUpdate(current => ({
      ...current,
      participants: current.participants.map((p: Participant) => p.id === updated.id ? updated : p)
    }));
  }, [performSessionUpdate]);

  const changeSplitMethod = useCallback(async (method: SplitMethod) => {
    await performSessionUpdate(current => ({ ...current, method }));
  }, [performSessionUpdate]);

  const applySessionReward = useCallback(async (amount: number, name: string) => {
    await performSessionUpdate(current => {
      const next = { ...current, discount: amount, appliedBy: name };
      return next;
    });
  }, [performSessionUpdate]);

  const removeSessionReward = useCallback(async () => {
    await performSessionUpdate(current => {
      const next = { ...current };
      delete next.discount;
      delete next.appliedBy;
      return next;
    });
  }, [performSessionUpdate]);

  const markPaid = useCallback(async (amount?: number, items?: any[]) => {
    // 1. Update session status
    await performSessionUpdate(current => ({
      ...current,
      participants: current.participants.map(p =>
        p.id === participantId ? { ...p, paid: true } : p
      )
    }));

    // 2. Record in Customer Profile Activity if logged in
    if (isAuthenticated && user) {
      const myParticipant = splitSession?.participants.find(p => p.id === participantId);
      
      // Use provided amount, or fall back to calculated share/total
      const finalAmount = amount ?? (
        splitSession?.method === 'full' 
          ? (splitSession.items?.reduce((sum: number, item: SessionItem) => sum + (item.price * item.quantity), 0) || 0)
          : (myParticipant?.share || 0)
      );

      // Don't record 0 amount activities unless it's explicitly intended
      if (finalAmount > 0 || amount !== undefined) {
        // PREPARE ITEMS FOR RECEIPT
        let receiptItems = items;
        
        // If items not provided but we have a split session, try to reconstruct them
        if (!receiptItems && splitSession && myParticipant) {
          const flat = flattenOrders(splitSession.items);
          receiptItems = getSelectedItems(flat, myParticipant.selectedItems || []);
        }

        await addActivity({
          type: 'sent',
          amount: finalAmount,
          entity: splitSession?.businessName || 'Merchant',
          timestamp: new Date().toISOString(),
          status: 'pending',
          category: 'Food & Drink',
          referenceId: splitSession?.id || checkId || undefined,
          items: receiptItems
        });
      }
    }
  }, [participantId, performSessionUpdate, isAuthenticated, user, splitSession, addActivity, checkId]);

  const clearSession = useCallback(async (cId: string) => {
    await customerService.clearSplitSession(cId);
    setSplitSession(null);
  }, []);

  return (
    <CustomerContext.Provider value={{
      checkId, sessionId, splitSession, participantId, isSignedIn, appliedRewardId,
      isSaving, isLoading,
      setCheckId, setSessionId, setSignedIn, applyReward: setAppliedRewardId,
      createSplitSession, joinSplitSession, updateParticipant,
      changeSplitMethod, applySessionReward, removeSessionReward, markPaid, clearSession,
      syncError
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};
