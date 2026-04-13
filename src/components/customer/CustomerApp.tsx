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
  checkId: string;
  invoiceId?: string;
  onExit: () => void;
}

export const CustomerApp: React.FC<Props> = ({ checkId, invoiceId, onExit }) => {
  const { state: merchant } = useMerchant();
  const { setCheckId, splitSession, joinSplitSession, clearSession, removeSessionReward, participantId } = useCustomer();
  const { isAuthenticated, user } = useCustomerProfile();
  const [screen, setScreen] = useState<Screen>('cart');
  const [payAmount, setPayAmount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Logout / Session Protection
  useEffect(() => {
    if (!isAuthenticated && splitSession?.appliedBy) {
      // If we log out and we were the ones who applied the reward, remove it
      const myName = user?.name || `Guest ${participantId.slice(0, 3)}`;
      if (splitSession.appliedBy === myName) {
        removeSessionReward();
      }
    }
  }, [isAuthenticated, splitSession, user, participantId, removeSessionReward]);

  // Robust Screen Logic
  useEffect(() => {
    // Priority 0: Handle Invoice Paylinks
    if (invoiceId) {
      const invoice = merchant.invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPayAmount(invoice.total);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScreen('pay');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsInitialized(true);
        return;
      }
    }

    setCheckId(checkId);
    
    const check = merchant.checks.find(c => c.id === checkId);
    if (!check) return;

    // 1. Check if check is already PAID
    if (check.status === 'paid') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('pay');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayAmount(check.total);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitialized(true);
      return;
    }

    // 2. If check is empty/open, always clear any ghost session and show cart
    if (check.status === 'open') {
      clearSession(checkId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('cart');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitialized(true);
      return;
    }

    // 3. If check is active, see if a split session already exists
    const savedSplit = localStorage.getItem(`check_split_${checkId}`);
    if (savedSplit && !isInitialized) {
      joinSplitSession(checkId);
      setScreen('pick');
    }
    
    setIsInitialized(true);
  }, [checkId, invoiceId, merchant.invoices, merchant.checks, setCheckId, joinSplitSession, clearSession, isInitialized]);

  if (!isInitialized) return null;

  switch (screen) {
    case 'cart':
      return (
        <CartView
          checkId={checkId}
          onPay={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onSplit={() => setScreen('split')}
          onBack={onExit}
        />
      );

    case 'split':
      return (
        <SplitSession
          checkId={checkId}
          onPayShare={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onPickItems={() => setScreen('pick')}
          onBack={() => setScreen('cart')}
        />
      );

    case 'pick':
      return (
        <ParticipantPicker
          checkId={checkId}
          onPay={(amount) => { setPayAmount(amount); setScreen('pay'); }}
          onBack={() => setScreen('split')}
        />
      );

    case 'pay':
      return (
        <PayTransfer
          checkId={checkId}
          invoiceId={invoiceId}
          amount={payAmount}
          onBack={invoiceId ? onExit : () => setScreen('cart')}
          onDone={onExit}
        />
      );
  }
};

export default CustomerApp;
