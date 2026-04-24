import React, { useState, useEffect } from 'react';
import type { CustomerPaymentType } from '../../types/checkout';
import { useCustomer } from '../../context/CustomerContext';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { CartView } from './CartView';
import { SplitSession } from './SplitSession';
import { ParticipantPicker } from './ParticipantPicker';
import { PayTransfer } from './PayTransfer';
import { TableOccupied } from './TableOccupied';
import { useResolvedCheck } from '../../hooks/useResolvedCheck';

type Screen = 'cart' | 'split' | 'pick' | 'pay';

interface Props {
  type: CustomerPaymentType;
  targetId: string;
  onExit: () => void;
}

export const CustomerApp: React.FC<Props> = ({ type, targetId, onExit }) => {
  const { state: merchant } = useMerchant();
  const { setCheckId, setSessionId, splitSession, joinSplitSession, clearSession, removeSessionReward, participantId } = useCustomer();
  const { isAuthenticated, user } = useCustomerProfile();
  const [screen, setScreen] = useState<Screen>('cart');
  const [payAmount, setPayAmount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const { check, archivedOrder, type: resolvedType } = useResolvedCheck(targetId);

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

    if (type === 'occupied') {
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

      if (resolvedType === 'archived' && archivedOrder) {
        setSessionId(checkIdOrSession);
        setCheckId(archivedOrder.checkId);
        setPayAmount(archivedOrder.total);
        setScreen('pay');
        setIsInitialized(true);
        return;
      }

      if (resolvedType === 'active' && check) {
        setCheckId(check.id);
        const activeSession = check.sessionId || checkIdOrSession;
        setSessionId(activeSession);

        if (check.paymentMode === 'quickpay') {
          setPayAmount(0);
          setScreen('pay');
        } else {
          setPayAmount(check.total);
          setScreen('cart');
        }

        if (activeSession) {
          localStorage.setItem(`last_session_check_${check.id}`, activeSession);
        }

        const savedSplit = localStorage.getItem(`check_split_${activeSession}`);
        if (savedSplit && !isInitialized) {
          joinSplitSession(activeSession);
          setScreen('pick');
        }
      }

      setIsInitialized(true);
    }
  }, [type, targetId, merchant.invoices, merchant.checks, setCheckId, joinSplitSession, clearSession, isInitialized, resolvedType, check, archivedOrder]);

  if (!isInitialized) return null;

  if (type === 'occupied') {
    return <TableOccupied checkId={targetId} onBack={onExit} />;
  }

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
