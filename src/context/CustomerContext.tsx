import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SplitSession, Participant, SplitMethod } from '../types/checkout';

interface CustomerContextType {
  checkId: string | null;
  splitSession: SplitSession | null;
  participantId: string;
  isSignedIn: boolean;
  appliedRewardId: string | null;
  setCheckId: (id: string | null) => void;
  setSignedIn: (v: boolean) => void;
  applyReward: (id: string | null) => void;
  createSplitSession: (checkId: string, method: SplitMethod) => SplitSession;
  joinSplitSession: (checkId: string) => SplitSession | null;
  updateParticipant: (sessionId: string, participant: Participant) => void;
  changeSplitMethod: (method: SplitMethod) => void;
  applySessionReward: (amount: number, name: string) => void;
  removeSessionReward: () => void;
  markPaid: () => void;
  clearSession: (checkId: string) => void;
  syncError: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participantId] = useState(() => {
    const saved = sessionStorage.getItem('participant_id');
    if (saved) return saved;
    const id = generateId();
    sessionStorage.setItem('participant_id', id);
    return id;
  });

  const [checkId, setCheckId] = useState<string | null>(null);
  const [splitSession, setSplitSession] = useState<SplitSession | null>(null);
  const [isSignedIn, setSignedIn] = useState(false);
  const [appliedRewardId, setAppliedRewardId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Auto-clear sync errors
  useEffect(() => {
    if (syncError) {
      const t = setTimeout(() => setSyncError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [syncError]);

  // Load split session from localStorage when checkId changes
  useEffect(() => {
    if (checkId) {
      const saved = localStorage.getItem(`check_split_${checkId}`);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSplitSession(JSON.parse(saved));
      } else {
        setSplitSession(null);
      }
    }
  }, [checkId]);

  // LIVE SYNC: Listen for storage events from other tabs to keep multiplayer state in sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (checkId && e.key === `check_split_${checkId}` && e.newValue) {
        setSplitSession(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkId]);

  // Persist split session changes
  const persistSession = useCallback((session: SplitSession) => {
    localStorage.setItem(`check_split_${session.checkId}`, JSON.stringify(session));
    setSplitSession(session);
  }, []);

  const createSplitSession = useCallback((cId: string, method: SplitMethod): SplitSession => {
    const session: SplitSession = {
      id: generateId(),
      checkId: cId,
      method,
      participants: [{
        id: participantId,
        name: `Guest 1`,
        selectedItemIndices: [],
        share: 0,
        paid: false,
      }],
      createdAt: Date.now(),
    };
    persistSession(session);
    return session;
  }, [participantId, persistSession]);

  const joinSplitSession = useCallback((cId: string): SplitSession | null => {
    const saved = localStorage.getItem(`check_split_${cId}`);
    if (!saved) return null;
    const session: SplitSession = JSON.parse(saved);
    // Don't duplicate if already joined
    if (!session.participants.find(p => p.id === participantId)) {
      session.participants.push({
        id: participantId,
        name: `Guest ${session.participants.length + 1}`,
        selectedItemIndices: [],
        share: 0,
        paid: false,
      });
      persistSession(session);
    }
    setSplitSession(session);
    return session;
  }, [participantId, persistSession]);

  const updateParticipant = useCallback((_sessionId: string, updated: Participant) => {
    const saved = localStorage.getItem(`check_split_${checkId}`);
    if (!saved) return;
    const session: SplitSession = JSON.parse(saved);
    session.participants = session.participants.map(p => p.id === updated.id ? updated : p);
    persistSession(session);
  }, [checkId, persistSession]);

  const changeSplitMethod = useCallback((method: SplitMethod) => {
    if (!splitSession) return;
    const updated = { ...splitSession, method };
    persistSession(updated);
  }, [splitSession, persistSession]);

  /**
   * OPTIMISTIC UI: applySessionReward
   */
  const applySessionReward = useCallback(async (amount: number, name: string) => {
    if (!splitSession) return;
    
    // 1. Capture previous state for rollback
    const previousSession = { ...splitSession };
    
    // 2. Optimistically update state
    const optimisticSession = {
      ...splitSession,
      discount: amount,
      appliedBy: name
    };
    setSplitSession(optimisticSession);
    
    // 3. Background Persistence (Simulated)
    try {
      // Small artificial delay to show the "snap"
      await new Promise(r => setTimeout(r, 400));
      
      localStorage.setItem(`check_split_${splitSession.checkId}`, JSON.stringify(optimisticSession));
    } catch {
      console.error('Persistence failed, rolling back');
      // Rollback!
      setSplitSession(previousSession);
      setSyncError('Failed to apply reward. Please try again.');
    }
  }, [splitSession]);

  /**
   * OPTIMISTIC UI: removeSessionReward
   */
  const removeSessionReward = useCallback(async () => {
    if (!splitSession) return;
    
    const previousSession = { ...splitSession };
    
    const optimisticSession = { ...splitSession };
    delete optimisticSession.discount;
    delete optimisticSession.appliedBy;
    
    setSplitSession(optimisticSession);
    
    try {
      await new Promise(r => setTimeout(r, 400));
      localStorage.setItem(`check_split_${splitSession.checkId}`, JSON.stringify(optimisticSession));
    } catch {
      setSplitSession(previousSession);
      setSyncError('Failed to remove reward. Please try again.');
    }
  }, [splitSession]);

  const markPaid = useCallback(() => {
    if (!splitSession) return;
    const updated = {
      ...splitSession,
      participants: splitSession.participants.map(p =>
        p.id === participantId ? { ...p, paid: true } : p
      ),
    };
    persistSession(updated);
  }, [splitSession, participantId, persistSession]);

  const clearSession = useCallback((cId: string) => {
    localStorage.removeItem(`check_split_${cId}`);
    setSplitSession(null);
  }, []);

  return (
    <CustomerContext.Provider value={{
      checkId, splitSession, participantId, isSignedIn, appliedRewardId,
      setCheckId, setSignedIn, applyReward: setAppliedRewardId,
      createSplitSession, joinSplitSession, updateParticipant,
      changeSplitMethod, applySessionReward, removeSessionReward, markPaid, clearSession,
      syncError
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};
