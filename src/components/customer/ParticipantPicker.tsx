import React, { useState, useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../ui/Button';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './CustomerUI.module.css';

interface Props {
  checkId: string;
  onPay: (amount: number) => void;
  onBack: () => void;
}

export const ParticipantPicker: React.FC<Props> = ({ checkId, onPay, onBack }) => {
  const { state: merchant } = useMerchant();
  const { splitSession, participantId, updateParticipant, joinSplitSession } = useCustomer();

  // Join on mount if not already
  React.useEffect(() => {
    if (!splitSession) {
      joinSplitSession(checkId);
    }
  }, [checkId, splitSession, joinSplitSession]);

  const check = merchant.checks.find(c => c.id === checkId);
  const me = splitSession?.participants.find(p => p.id === participantId);
  const myName = me?.name || `Guest ${participantId.slice(0, 3)}`;
  
  const discount = splitSession?.discount || 0;
  const appliedBy = splitSession?.appliedBy || '';
  const isAppliedByMe = appliedBy === myName;

  const orderItems = useMemo(() => {
    if (!check) return [];
    return check.orders.map((o, idx) => {
      const menuItem = merchant.menu.find(m => m.id === o.menuItemId);
      return {
        index: idx,
        name: menuItem?.name || 'Unknown',
        price: menuItem?.price || 0,
        quantity: o.quantity,
        total: (menuItem?.price || 0) * o.quantity,
      };
    });
  }, [check, merchant.menu]);

  const [selectedIndices, setSelectedIndices] = useState<number[]>(me?.selectedItemIndices || []);

  // Keep local state in sync with context (for multiplayer/external updates)
  React.useEffect(() => {
    if (me?.selectedItemIndices && JSON.stringify(me.selectedItemIndices) !== JSON.stringify(selectedIndices)) {
      setSelectedIndices(me.selectedItemIndices);
    }
  }, [me?.selectedItemIndices, selectedIndices]);

  // Which items are claimed by OTHER participants
  const claimedByOthers = useMemo(() => {
    const map = new Map<number, string>();
    if (!splitSession) return map;
    splitSession.participants.forEach(p => {
      if (p.id !== participantId) {
        p.selectedItemIndices.forEach(idx => map.set(idx, p.name));
      }
    });
    return map;
  }, [splitSession, participantId]);

  const toggleItem = (index: number) => {
    const next = selectedIndices.includes(index) 
      ? selectedIndices.filter(i => i !== index) 
      : [...selectedIndices, index];
    
    // 1. Update local state immediately for snappy UI
    setSelectedIndices(next);

    // 2. Persist to session (side effect outside of updater)
    if (me && splitSession) {
      const share = next.reduce((acc, i) => acc + (orderItems[i]?.total || 0), 0);
      updateParticipant(splitSession.id, { ...me, selectedItemIndices: next, share });
    }
  };

  const itemShare = selectedIndices.reduce((acc, i) => acc + (orderItems[i]?.total || 0), 0);
  const myFinalShare = isAppliedByMe ? Math.max(0, itemShare - discount) : itemShare;

  return (
    <div className={styles.customerLayout}>
      <div className={styles.checkoutHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
          <div>
            <div className={styles.merchantName}>Select Your Items</div>
            <div className={styles.checkLabel}>{merchant.name} • Check #{checkId}</div>
          </div>
        </div>
      </div>

      <div className={styles.cartBody}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)' }}>
          Tap the items you ordered. {isAppliedByMe ? 'Your reward will be applied to your share.' : 'Rewards are applied per check.'}
        </p>

        {orderItems.map((item) => {
          const claimedBy = claimedByOthers.get(item.index);
          const isSelected = selectedIndices.includes(item.index);
          const isClaimed = !!claimedBy;

          return (
            <motion.div
              key={item.index}
              className={`${styles.pickableItem} ${isSelected ? styles.pickableItemSelected : ''} ${isClaimed ? styles.pickableItemClaimed : ''}`}
              onClick={() => !isClaimed && toggleItem(item.index)}
              whileTap={!isClaimed ? { scale: 0.98 } : undefined}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div
                  className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}
                >
                  {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                </div>
                <div>
                  <div className={styles.itemName}>{item.quantity}x {item.name}</div>
                  {isClaimed && <span className={styles.claimedTag}>{claimedBy}</span>}
                </div>
              </div>
              <span className={styles.itemPrice}>₦{item.total.toLocaleString()}</span>
            </motion.div>
          );
        })}

        <div className={styles.totalRow}>
          <div style={{ flex: 1 }}>
            <span className={styles.totalLabel}>Subtotal</span>
            {isAppliedByMe && <div style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>- ₦{discount.toLocaleString()} Reward</div>}
          </div>
          <span className={styles.totalValue}>₦{myFinalShare.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.stickyCTA}>
        <Button
          variant="accent"
          fullWidth
          size="large"
          onClick={() => onPay(myFinalShare)}
          disabled={myFinalShare <= 0 && itemShare <= 0}
        >
          Pay My Share ₦{myFinalShare.toLocaleString()}
        </Button>
      </div>
    </div>
  );
};
