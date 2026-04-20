import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { CartView } from './CartView';
import { SplitSession } from './SplitSession';
import { ParticipantPicker } from './ParticipantPicker';
import { PayTransfer } from './PayTransfer';

type Screen = 'cart' | 'split' | 'pick' | 'pay';

interface Props {
  type: 'check' | 'invoice' | 'quickpay';
  targetId: string;
  onExit: () => void;
}

export const CustomerApp: React.FC<Props> = ({ type, targetId, onExit }) => {
  const { state: merchant } = useMerchant();
  const { setCheckId, sessionId, setSessionId, splitSession, joinSplitSession, clearSession, removeSessionReward, participantId } = useCustomer();
  const { isAuthenticated, user } = useCustomerProfile();
  const [screen, setScreen] = useState<Screen>('cart');
  const [payAmount, setPayAmount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Logout / Session Protection
  useEffect(() => {
    if (!isAuthenticated && splitSession?.appliedBy) {
      const myName = user?.name || `Guest ${participantId.slice(0, 3)}`;
      if (splitSession.appliedBy === myName) {
        removeSessionReward();
      }
    }
  }, [isAuthenticated, splitSession, user, participantId, removeSessionReward]);

  // Robust Screen Logic
  useEffect(() => {
    if (type === 'quickpay') {
      setPayAmount(0);
      setScreen('pay');
      setIsInitialized(true);
      return;
    }

    if (type === 'invoice') {
      const invoice = merchant.invoices.find(inv => inv.id === targetId);
      if (invoice) {
        setPayAmount(invoice.total);
        setScreen('pay');
        setIsInitialized(true);
        return;
      }
    }

    if (type === 'check') {
      const checkIdOrSession = targetId;
      const isDirectSession = checkIdOrSession.startsWith('SESS_');
      
      if (isDirectSession) {
        setSessionId(checkIdOrSession);
        
        // Resolve the human-readable Check ID from archives if possible
        const archived = merchant.archivedSessions[checkIdOrSession];
        if (archived) {
          setCheckId(archived.checkId);
        } else {
          // Check if it's an active check session
          const activeCheck = merchant.checks.find(c => c.sessionId === checkIdOrSession);
          if (activeCheck) setCheckId(activeCheck.id);
        }

        setScreen('pay');
        setIsInitialized(true);
        return;
      }

      // It's a check ID (e.g. "1")
      setCheckId(checkIdOrSession);
      
      const check = merchant.checks.find(c => c.id === checkIdOrSession);
      if (!check) return;

      // Session Lock-in Logic
      let activeSession = check.sessionId;
      const cachedSession = localStorage.getItem(`last_session_check_${checkIdOrSession}`);
      
      // If we have a cached session and it's either the current active one OR the check was recently paid
      // we stay on that session to show the receipt or the current order.
      if (cachedSession && (activeSession === cachedSession || check.status === 'open')) {
        activeSession = cachedSession;
      }

      if (activeSession) {
        setSessionId(activeSession);
        localStorage.setItem(`last_session_check_${checkIdOrSession}`, activeSession);
      }

      if (check.status === 'paid' && !activeSession) {
        setScreen('pay');
        setPayAmount(check.total);
        setIsInitialized(true);
        return;
      }

      if (check.status === 'open' && !activeSession) {
        clearSession(checkIdOrSession);
        setScreen('cart');
        setIsInitialized(true);
        return;
      }

      const savedSplit = localStorage.getItem(`check_split_${activeSession || checkIdOrSession}`);
      if (savedSplit && !isInitialized) {
        joinSplitSession(activeSession || checkIdOrSession);
        setScreen('pick');
      }
      
      setIsInitialized(true);
    }
  }, [type, targetId, merchant.invoices, merchant.checks, setCheckId, joinSplitSession, clearSession, isInitialized]);

  if (!isInitialized) return null;

  switch (screen) {
    case 'cart':
      return (
        <CartView
          checkId={targetId}
          onPay={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onSplit={() => setScreen('split')}
          onBack={onExit}
        />
      );

    case 'split':
      return (
        <SplitSession
          checkId={targetId}
          onPayShare={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onPickItems={() => setScreen('pick')}
          onBack={() => setScreen('cart')}
        />
      );

    case 'pick':
      return (
        <ParticipantPicker
          checkId={targetId}
          onPay={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onBack={() => setScreen('split')}
        />
      );

    case 'pay':
      return (
        <PayTransfer
          type={type}
          targetId={targetId}
          amount={payAmount}
          onBack={type !== 'check' ? onExit : () => setScreen('cart')}
          onDone={onExit}
        />
      );
  }
};

export default CustomerApp;
