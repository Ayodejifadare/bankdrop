import React, { useState, useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../ui/Button';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './CustomerUI.module.css';

import { flattenOrders, calculateShare } from '../../utils/orderUtils';
import type { SelectedItem } from '../../types/checkout';


interface Props {
  checkId: string;
  onPay: (amount: number) => void;
  onBack: () => void;
}

export const ParticipantPicker: React.FC<Props> = ({ checkId, onPay, onBack }) => {
  const { state: merchant } = useMerchant();
  const { splitSession, participantId, sessionId, updateParticipant, joinSplitSession } = useCustomer();

  // Join on mount if not already
  React.useEffect(() => {
    if (!splitSession && sessionId) {
      joinSplitSession(sessionId);
    }
  }, [sessionId, splitSession, joinSplitSession]);

  const me = splitSession?.participants.find(p => p.id === participantId);
  const myName = me?.name || `Guest ${participantId.slice(0, 3)}`;
  
  const discount = splitSession?.discount || 0;
  const appliedBy = splitSession?.appliedBy || '';
  const isAppliedByMe = appliedBy === myName;

  // Build flattened items from the SYNCED session items
  const orderItems = useMemo(() => {
    if (!splitSession?.items) return [];
    return flattenOrders(splitSession.items);
  }, [splitSession?.items]);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(me?.selectedItems || []);

  // Keep local state in sync with context (for multiplayer/external updates)
  React.useEffect(() => {
    if (me?.selectedItems && JSON.stringify(me.selectedItems) !== JSON.stringify(selectedItems)) {
      setSelectedItems(me.selectedItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.selectedItems]);

  // No longer need local reconciliation here as CustomerContext handles it globally
  // and updates splitSession.participants automatically.

  // Which items are claimed by OTHER participants (as counts per lineItemId)
  const claimedByOthers = useMemo(() => {
    const map = new Map<string, { name: string; count: number }[]>();
    if (!splitSession) return map;
    splitSession.participants.forEach(p => {
      if (p.id !== participantId) {
        (p.selectedItems || []).forEach(sel => {
          if (sel.count <= 0) return;
          if (!map.has(sel.lineItemId)) map.set(sel.lineItemId, []);
          map.get(sel.lineItemId)!.push({ name: p.name, count: sel.count });
        });
      }
    });
    return map;
  }, [splitSession, participantId]);

  // Build display groups
  const itemGroups = useMemo(() => {
    return orderItems.map((item) => {
      const mySelection = selectedItems.find(s => s.lineItemId === item.lineItemId);
      const myCount = mySelection?.count || 0;

      const othersClaims = claimedByOthers.get(item.lineItemId) || [];
      const othersTotalCount = othersClaims.reduce((sum, c) => sum + c.count, 0);

      const unclaimed = Math.max(0, item.quantity - myCount - othersTotalCount);

      return {
        lineItemId: item.lineItemId,
        name: item.name,
        price: item.price,
        totalQty: item.quantity,
        myCount,
        unclaimed,
        othersClaims,
      };
    });
  }, [orderItems, selectedItems, claimedByOthers]);

  const toggleItem = (lineItemId: string, delta: number) => {
    const group = itemGroups.find(g => g.lineItemId === lineItemId);
    if (!group) return;

    const currentSel = selectedItems.find(s => s.lineItemId === lineItemId);
    const currentCount = currentSel?.count || 0;
    const newCount = Math.max(0, Math.min(currentCount + delta, currentCount + group.unclaimed));

    // Don't allow increasing beyond what's available
    if (delta > 0 && group.unclaimed <= 0) return;

    const next = newCount <= 0
      ? selectedItems.filter(s => s.lineItemId !== lineItemId)
      : currentSel
        ? selectedItems.map(s => s.lineItemId === lineItemId ? { ...s, count: newCount } : s)
        : [...selectedItems, { lineItemId, count: newCount }];

    // 1. Update local state immediately for snappy UI
    setSelectedItems(next);

    // 2. Persist to session
    if (me && splitSession) {
      const share = calculateShare(orderItems, next);
      updateParticipant(splitSession.id, { ...me, selectedItems: next, share });
    }
  };

  const itemShare = calculateShare(orderItems, selectedItems);
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {itemGroups.map((group) => (
            <React.Fragment key={group.lineItemId}>
              {/* My Selected Units */}
              {group.myCount > 0 && (
                <motion.div
                  layout
                  className={`${styles.pickableItem} ${styles.pickableItemSelected}`}
                  onClick={() => toggleItem(group.lineItemId, -1)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                    <div className={`${styles.checkbox} ${styles.checkboxChecked}`}>
                      <Check size={14} color="#000" strokeWidth={3} />
                    </div>
                    <div className={styles.itemName}>{group.myCount}x {group.name}</div>
                  </div>
                  <span className={styles.itemPrice}>₦{(group.price * group.myCount).toLocaleString()}</span>
                </motion.div>
              )}

              {/* Unclaimed Units */}
              {group.unclaimed > 0 && (
                <motion.div
                  layout
                  className={styles.pickableItem}
                  onClick={() => toggleItem(group.lineItemId, 1)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                    <div className={styles.checkbox} />
                    <div className={styles.itemName}>{group.unclaimed}x {group.name}</div>
                  </div>
                  <span className={styles.itemPrice}>₦{(group.price * group.unclaimed).toLocaleString()}</span>
                </motion.div>
              )}

              {/* Claimed by Others */}
              {group.othersClaims.map((claim) => (
                <div key={claim.name} className={`${styles.pickableItem} ${styles.pickableItemClaimed}`} style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                    <div className={styles.checkbox} />
                    <div>
                      <div className={styles.itemName}>{claim.count}x {group.name}</div>
                      <span className={styles.claimedTag}>{claim.name}</span>
                    </div>
                  </div>
                  <span className={styles.itemPrice}>₦{(group.price * claim.count).toLocaleString()}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

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
