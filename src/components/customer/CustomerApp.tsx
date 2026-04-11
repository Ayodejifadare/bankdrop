import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { useMerchant } from '../../context/MerchantContext';
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
  const { setCheckId, joinSplitSession, clearSession } = useCustomer();
  const [screen, setScreen] = useState<Screen>('cart');
  const [payAmount, setPayAmount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Robust Screen Logic
  useEffect(() => {
    // Priority 0: Handle Invoice Paylinks
    if (invoiceId) {
      const invoice = merchant.invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setPayAmount(invoice.total);
        setScreen('pay');
        setIsInitialized(true);
        return;
      }
    }

    setCheckId(checkId);
    
    const check = merchant.checks.find(c => c.id === checkId);
    if (!check) return;

    // 1. Check if check is already PAID
    if (check.status === 'paid') {
      setScreen('pay'); // Or a special 'receipt' screen, but PayTransfer handles 'confirmed' state well
      setPayAmount(check.total);
      setIsInitialized(true);
      return;
    }

    // 2. If check is empty/open, always clear any ghost session and show cart
    if (check.status === 'open') {
      clearSession(checkId);
      setScreen('cart');
      setIsInitialized(true);
      return;
    }

    // 2. If check is active, see if a split session already exists
    const savedSplit = localStorage.getItem(`check_split_${checkId}`);
    if (savedSplit && !isInitialized) {
      joinSplitSession(checkId);
      setScreen('pick'); // Jump straight to picking items
    }
    
    setIsInitialized(true);
  }, [checkId, merchant.checks, setCheckId, joinSplitSession, clearSession, isInitialized]);

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
