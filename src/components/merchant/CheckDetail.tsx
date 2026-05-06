import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Zap, 
  Users, 
  Plus, 
  Repeat, 
  Package, 
  X,
  Minus
} from 'lucide-react';
import type { Check, MenuItem, PastOrder } from '../../types/merchant';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AestheticQR } from './QRManager';
import { ReceiptRenderer } from './ReceiptRenderer';
import { formatCurrency } from '../../utils/formatters';
import styles from './MerchantUI.module.css';

interface QuantityStepperProps {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({ value, onIncrease, onDecrease, min = 0 }) => (
  <div className={styles.stepper}>
    <button 
      className={styles.stepperBtn} 
      onClick={(e) => { e.stopPropagation(); onDecrease(); }}
      disabled={value <= min}
    >
      <Minus size={16} />
    </button>
    <div className={styles.stepperCount}>{value}</div>
    <button 
      className={styles.stepperBtn} 
      onClick={(e) => { e.stopPropagation(); onIncrease(); }}
    >
      <Plus size={16} />
    </button>
  </div>
);

interface CheckDetailProps {
  check: Check;
  menu: MenuItem[];
  orderHistory: PastOrder[];
  merchantName: string;
  onClose: () => void;
  onAddItems: () => void;
  onSettle: () => void;
  onReset: () => void;
  onSetPaymentMode: (mode: 'itemized' | 'quickpay') => void;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onDownloadReceipt: (orderId: string) => void;
}

export const CheckDetail: React.FC<CheckDetailProps> = ({
  check,
  menu,
  orderHistory,
  merchantName,
  onClose,
  onAddItems,
  onSettle,
  onReset,
  onSetPaymentMode,
  onUpdateQuantity,
  onDownloadReceipt
}) => {
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  const getStatusColor = (status: Check['status']) => {
    switch (status) {
      case 'active': return 'var(--brand-accent)';
      case 'paid': return '#4ade80';
      default: return 'var(--border-primary)';
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        zIndex: 1000,
        padding: 'var(--spacing-lg)',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)' }}>
        <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 className={styles.title}>Check #{check.id}</h2>
        <div style={{ width: 24 }} />
      </div>

      {/* Mode Toggle */}
       <div style={{ marginBottom: 'var(--spacing-lg)' }}>
         <div className={styles.headerSegment}>
           <button 
             className={`${styles.segmentBtn} ${(!check.paymentMode || check.paymentMode === 'itemized') ? styles.segmentBtnActive : ''}`}
             onClick={() => onSetPaymentMode('itemized')}
             style={{ flex: 1 }}
           >
             Standard
           </button>
           <button 
             className={`${styles.segmentBtn} ${check.paymentMode === 'quickpay' ? styles.segmentBtnActive : ''}`}
             onClick={() => onSetPaymentMode('quickpay')}
             style={{ flex: 1 }}
           >
             Quickpay
           </button>
         </div>
       </div>

       {check.paymentMode === 'quickpay' ? (
         <div style={{ textAlign: 'center', padding: '40px 16px', backgroundColor: 'rgba(181, 153, 82, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--brand-accent)' }}>
           <Zap size={48} color="var(--brand-accent)" style={{ marginBottom: '16px' }} />
           <h3 style={{ color: 'var(--brand-accent)' }}>Quickpay Active</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
             Customer will enter any amount. Check-specific routing is active.
           </p>
           <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', display: 'inline-block', width: '100%' }}>
             <AestheticQR type="check" id={check.id} label={`Check #${check.id}`} />
           </div>
         </div>
       ) : check.status === 'open' ? (
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <Users size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
          <h3>Check is empty</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '0.925rem' }}>
            This table is currently available. Start a new order to begin.
          </p>
          <Button variant="accent" fullWidth onClick={onAddItems}>
            <Plus size={18} /> New Order
          </Button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <span className={styles.badge} style={{ backgroundColor: getStatusColor(check.status), color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {check.status}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(check.total)}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
            {check.orders.map((order, idx) => {
              const item = menu.find(m => m.id === order.menuItemId);
              const snapshotPrice = order.priceAtOrder || item?.price || 0;
              return (
                <div key={idx} className={styles.orderRow}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '6px', 
                      backgroundColor: 'var(--bg-tertiary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 0.6
                    }}>
                      {item?.type === 'subscription' ? <Repeat size={14} /> : item?.type === 'service' ? <Zap size={14} /> : <Package size={14} />}
                    </div>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderTitle}>{order.name}</span>
                      <span className={styles.orderSubtitle}>
                        {formatCurrency(snapshotPrice)}
                        {item?.type === 'subscription' && ` / ${item.billingCycle}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(snapshotPrice * order.quantity)}</span>
                    {check.status === 'active' && (
                      <QuantityStepper 
                        value={order.quantity} 
                        onIncrease={() => onUpdateQuantity(order.menuItemId, 1)}
                        onDecrease={() => onUpdateQuantity(order.menuItemId, -1)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {check.status === 'active' && (
              <>
                <Button variant="accent" fullWidth onClick={onAddItems}>
                  <Plus size={18} /> Add Items
                </Button>
                <Button variant="primary" fullWidth onClick={onSettle}>
                  Settled / Paid
                </Button>
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={onReset}
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <X size={18} /> Reset / Clear Check
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Inline Order History for this check */}
      <div style={{ marginTop: 'var(--spacing-xxl)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', opacity: 0.6 }}>Order History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {orderHistory
            .filter(o => o.checkId === check.id)
            .map(historyOrder => (
              <Card key={historyOrder.id}>
                <div 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => setExpandedOrderId(expandedOrderId === historyOrder.id ? null : historyOrder.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Order {historyOrder.id.split('_').pop()?.toUpperCase()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(historyOrder.timestamp).toLocaleDateString()} • {new Date(historyOrder.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#4ade80' }}>{formatCurrency(historyOrder.total)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{historyOrder.orders.length} items</div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrderId === historyOrder.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
                          {historyOrder.orders.map((o, i) => {
                            const menuItem = menu.find(m => m.id === o.menuItemId);
                            const snapshotPrice = o.priceAtOrder || menuItem?.price || 0;
                            return (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                                <span>{o.quantity}x {o.name}</span>
                                <span style={{ opacity: 0.7 }}>{formatCurrency(snapshotPrice * o.quantity)}</span>
                              </div>
                            );
                          })}
                          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                            <Button size="small" variant="secondary" fullWidth onClick={(e) => { e.stopPropagation(); onDownloadReceipt(historyOrder.id); }}>
                              Download Receipt
                            </Button>
                          </div>

                          <ReceiptRenderer order={historyOrder} merchantName={merchantName} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            ))}
          {orderHistory.filter(o => o.checkId === check.id).length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontStyle: 'italic', fontSize: '0.875rem' }}>
              No past orders for this table yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
