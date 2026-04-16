import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Landmark, CreditCard, Banknote, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './MerchantUI.module.css';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { state, resolveVerification } = useMerchant();
  const pending = state.pendingVerifications?.filter(v => v.status === 'pending') || [];

  const getIcon = (method: string) => {
    switch (method) {
      case 'Transfer': return <Landmark size={20} color="var(--brand-accent)" />;
      case 'POS': return <CreditCard size={20} color="#8b5cf6" />;
      case 'Cash': return <Banknote size={20} color="#22c55e" />;
      default: return <Bell size={20} />;
    }
  };

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
                    <Card key={item.id} style={{ padding: '16px', borderLeft: '4px solid var(--brand-accent)' }}>
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
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>₦{item.amount.toLocaleString()}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.type === 'check' ? `Check #${item.targetId}` : `Invoice ${item.targetId}`}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          fullWidth 
                          size="small" 
                          variant="outline"
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '8px' }}
                          onClick={() => resolveVerification(item.id, false)}
                        >
                          <XCircle size={14} style={{ marginRight: '6px' }} /> Decline
                        </Button>
                        <Button 
                          fullWidth 
                          size="small" 
                          variant="primary"
                          style={{ backgroundColor: '#4ade80', color: '#000', border: 'none', padding: '8px' }}
                          onClick={() => resolveVerification(item.id, true)}
                        >
                          <CheckCircle2 size={14} style={{ marginRight: '6px' }} /> Confirm
                        </Button>
                      </div>
                    </Card>
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
