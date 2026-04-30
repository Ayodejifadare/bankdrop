import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Landmark, CreditCard, Banknote, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { PendingVerification } from '../../types/merchant';
import styles from './MerchantUI.module.css';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItemProps {
  item: PendingVerification;
  isSaving: boolean;
  onResolve: (id: string, confirmed: boolean, amount?: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ item, isSaving, onResolve }) => {
  const [entryAmount, setEntryAmount] = React.useState<number | ''>('');
  const [isResolving, setIsResolving] = React.useState(false);
  const isQuickPayOpen = item.type === 'quickpay' && item.amount === 0;

  const getIcon = (method: string) => {
    switch (method) {
      case 'Transfer': return <Landmark size={20} color="var(--brand-accent)" />;
      case 'POS': return <CreditCard size={20} color="#8b5cf6" />;
      case 'Cash': return <Banknote size={20} color="#22c55e" />;
      default: return <Bell size={20} />;
    }
  };

  const getLabel = () => {
    if (item.type === 'quickpay') return 'Quickpay';
    return item.type === 'check' ? `Check #${item.targetId}` : `Invoice ${item.targetId}`;
  };

  const handleAction = async (confirmed: boolean) => {
    setIsResolving(true);
    try {
      if (confirmed && isQuickPayOpen) {
        if (typeof entryAmount === 'number' && entryAmount > 0) {
          await onResolve(item.id, true, entryAmount);
        }
      } else {
        await onResolve(item.id, confirmed);
      }
    } finally {
      setIsResolving(false);
    }
  };

  const isLoading = isSaving && isResolving;

  return (
    <Card style={{ padding: '16px', borderLeft: '4px solid var(--brand-accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            backgroundColor: 'var(--bg-tertiary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {getIcon(item.method)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {isQuickPayOpen ? 'Open Amount' : formatCurrency(item.amount)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {getLabel()}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isQuickPayOpen && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            ENTER RECEIVED AMOUNT
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-primary)' }}>{getCurrencySymbol()}</span>
            <input 
              type="number"
              placeholder="0.00"
              disabled={isLoading}
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value === '' ? '' : Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 10px 10px 28px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--brand-accent)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '1.25rem',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          fullWidth 
          size="small" 
          variant="outline"
          disabled={isLoading}
          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '8px' }}
          onClick={() => handleAction(false)}
        >
          <XCircle size={14} style={{ marginRight: '6px' }} /> Decline
        </Button>
        <Button 
          fullWidth 
          size="small" 
          variant="primary"
          disabled={isLoading || (isQuickPayOpen && (!entryAmount || entryAmount <= 0))}
          style={{ 
            backgroundColor: (isLoading || (isQuickPayOpen && (!entryAmount || entryAmount <= 0))) ? 'var(--bg-tertiary)' : '#4ade80', 
            color: '#000', 
            border: 'none', 
            padding: '8px' 
          }}
          onClick={() => handleAction(true)}
        >
          {isLoading ? (
            <Loader2 size={14} className={styles.spin} />
          ) : (
            <><CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Confirm</>
          )}
        </Button>
      </div>
    </Card>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { state, resolveVerification, isSaving } = useMerchant();
  const pending = state.pendingVerifications?.filter(v => v.status === 'pending') || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.notificationCenterOverlay} onClick={onClose}>
          <motion.div 
            className={styles.notificationCenter}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.notificationHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <Bell size={20} color="var(--brand-accent)" />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notifications</h2>
              </div>
              <button 
                onClick={onClose}
                style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.notificationList}>
              {pending.length === 0 ? (
                <div className={styles.emptyState}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--bg-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '16px',
                    opacity: 0.5
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3>All caught up!</h3>
                  <p style={{ fontSize: '0.875rem' }}>No pending verifications at the moment.</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 4px' }}>
                    Pending Verifications ({pending.length})
                  </p>
                  {pending.map((item) => (
                    <NotificationItem 
                      key={item.id} 
                      item={item} 
                      isSaving={isSaving}
                      onResolve={resolveVerification} 
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
