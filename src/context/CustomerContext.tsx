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
  markPaid: () => void;
  clearSession: (checkId: string) => void;
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
      changeSplitMethod, markPaid, clearSession,
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
