import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { Check } from '../../types/merchant';
import { Button } from '../ui/Button';
import { 
  Users, 
  Plus, 
  Minus,
  X, 
  Clock,
  ArrowLeft,
  Check as CheckIcon,
  Zap,
  Repeat,
  Package,
  Settings,
  Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './MerchantUI.module.css';
import { AestheticQR } from './QRManager';

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

interface CheckManagerProps {
  onOpenSettings?: () => void;
}

export const CheckManager: React.FC<CheckManagerProps> = ({ onOpenSettings }) => {
  const { state, addOrdersToCheck, updateOrderQuantity, updateCheckStatus, resetCheck, setCheckPaymentMode } = useMerchant();
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({});

  const selectedCheck = state.checks.find(c => c.id === selectedCheckId);

  const handleUpdatePendingQuantity = (menuItemId: string, delta: number) => {
    setPendingOrders(prev => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [menuItemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [menuItemId]: next };
    });
  };

  const handleConfirmAddItems = () => {
    if (selectedCheckId) {
      const itemsToAdd = Object.entries(pendingOrders).map(([menuItemId, quantity]) => {
        const menuItem = state.menu.find(m => m.id === menuItemId);
        return {
          menuItemId,
          quantity,
          priceAtOrder: menuItem?.price || 0
        };
      });
      if (itemsToAdd.length > 0) {
        addOrdersToCheck(selectedCheckId, itemsToAdd);
      }
      setPendingOrders({});
      setIsAddingItem(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddingItem(false);
    setPendingOrders({});
  };

  const getStatusColor = (status: Check['status']) => {
    switch (status) {
      case 'active': return 'var(--brand-accent)';
      case 'paid': return '#4ade80';
      default: return 'var(--border-primary)';
    }
  };

  const handleDownloadReceipt = async (orderId: string) => {
    const element = document.getElementById(`receipt-${orderId}`);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Receipt_${orderId}.pdf`);
  };

  return (
    <div className={styles.checkManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className={styles.title}>Checks & Tables</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Tap a check to manage orders</p>
          </div>
          {onOpenSettings && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onOpenSettings}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--text-secondary)', padding: '4px',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: 600
              }}
            >
              <Settings size={18} />
            </motion.button>
          )}
        </div>
        {state.checks.filter(c => !c.enabled).length > 0 && (
          <p style={{ 
            fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <span style={{ 
              width: '6px', height: '6px', borderRadius: '50%', 
              backgroundColor: 'var(--text-muted)', display: 'inline-block' 
            }} />
            {state.checks.filter(c => !c.enabled).length} check{state.checks.filter(c => !c.enabled).length > 1 ? 's' : ''} disabled
          </p>
        )}
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 'var(--spacing-md)' 
      }}>
        {state.checks.map(check => (
          <motion.div
            key={check.id}
            whileHover={check.enabled ? { scale: 1.02 } : {}}
            whileTap={check.enabled ? { scale: 0.95 } : {}}
            onClick={() => check.enabled && setSelectedCheckId(check.id)}
            style={{
              aspectRatio: '1/1',
              backgroundColor: check.enabled ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: check.enabled 
                ? `2px solid ${getStatusColor(check.status)}` 
                : '2px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: check.enabled ? 'pointer' : 'not-allowed',
              position: 'relative',
              overflow: 'hidden',
              opacity: check.enabled ? 1 : 0.35,
              transition: 'opacity 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{check.id}</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {!check.enabled ? 'Closed' : check.status === 'open' ? 'Free' : check.status}
            </span>
            {check.status === 'active' && check.enabled && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                padding: '4px',
                backgroundColor: 'var(--brand-accent)',
                color: '#000',
                borderBottomLeftRadius: 'var(--radius-sm)'
              }}>
                <Clock size={10} />
              </div>
            )}
            {check.bankAccountId && check.enabled && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                padding: '4px',
                color: 'var(--brand-accent)',
                opacity: 0.6
              }}>
                <Landmark size={10} />
              </div>
            )}
            {check.paymentMode === 'quickpay' && check.enabled && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                padding: '4px',
                color: 'var(--brand-accent)',
              }}>
                <Zap size={10} fill="var(--brand-accent)" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCheckId && (
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
              <button onClick={() => setSelectedCheckId(null)} style={{ border: 'none', background: 'none', color: 'var(--text-primary)' }}>
                <ArrowLeft size={24} />
              </button>
              <h2 className={styles.title}>Check #{selectedCheckId}</h2>
              <div style={{ width: 24 }} />
            </div>

            {/* Mode Toggle */}
             <div style={{ marginBottom: 'var(--spacing-lg)' }}>
               <div className={styles.headerSegment}>
                 <button 
                   className={`${styles.segmentBtn} ${(!selectedCheck?.paymentMode || selectedCheck.paymentMode === 'itemized') ? styles.segmentBtnActive : ''}`}
                   onClick={() => setCheckPaymentMode(selectedCheckId!, 'itemized')}
                   style={{ flex: 1 }}
                 >
                   Standard
                 </button>
                 <button 
                   className={`${styles.segmentBtn} ${selectedCheck?.paymentMode === 'quickpay' ? styles.segmentBtnActive : ''}`}
                   onClick={() => setCheckPaymentMode(selectedCheckId!, 'quickpay')}
                   style={{ flex: 1 }}
                 >
                   Quickpay
                 </button>
               </div>
             </div>

             {selectedCheck?.paymentMode === 'quickpay' ? (
               <div style={{ textAlign: 'center', padding: '40px 16px', backgroundColor: 'rgba(181, 153, 82, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--brand-accent)' }}>
                 <Zap size={48} color="var(--brand-accent)" style={{ marginBottom: '16px' }} />
                 <h3 style={{ color: 'var(--brand-accent)' }}>Quickpay Active</h3>
                 <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                   Customer will enter any amount. Check-specific routing is active.
                 </p>
                 <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', display: 'inline-block', width: '100%' }}>
                   <AestheticQR type="check" id={selectedCheckId!} label={`Check #${selectedCheckId}`} />
                 </div>
               </div>
             ) : selectedCheck?.status === 'open' ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <Users size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                <h3>Check is empty</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '0.925rem' }}>
                  This table is currently available. Start a new order to begin.
                </p>
                <Button variant="accent" fullWidth onClick={() => setIsAddingItem(true)}>
                  <Plus size={18} /> New Order
                </Button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                  <span className={styles.badge} style={{ backgroundColor: getStatusColor(selectedCheck?.status || 'open'), color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {selectedCheck?.status}
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₦{selectedCheck?.total.toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                  {selectedCheck?.orders.map((order, idx) => {
                    const item = state.menu.find(m => m.id === order.menuItemId);
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
                            <span className={styles.orderTitle}>{item?.name}</span>
                            <span className={styles.orderSubtitle}>
                              ₦{snapshotPrice.toLocaleString()}
                              {item?.type === 'subscription' && ` / ${item.billingCycle}`}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontWeight: 600 }}>₦{(snapshotPrice * order.quantity).toLocaleString()}</span>
                          {selectedCheck.status === 'active' && (
                            <QuantityStepper 
                              value={order.quantity} 
                              onIncrease={() => updateOrderQuantity(selectedCheckId!, order.menuItemId, 1)}
                              onDecrease={() => updateOrderQuantity(selectedCheckId!, order.menuItemId, -1)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  {selectedCheck?.status === 'active' && (
                    <>
                      <Button variant="accent" fullWidth onClick={() => setIsAddingItem(true)}>
                        <Plus size={18} /> Add Items
                      </Button>
                      <Button variant="primary" fullWidth onClick={() => updateCheckStatus(selectedCheckId, 'paid')}>
                        Settled / Paid
                      </Button>
                      <Button 
                        variant="outline" 
                        fullWidth 
                        onClick={() => selectedCheckId && resetCheck(selectedCheckId)}
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                      >
                        <X size={18} /> Reset / Clear Check
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Inline Order History for this check - Now Persistent */}
            <div style={{ marginTop: 'var(--spacing-xxl)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', opacity: 0.6 }}>Order History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {state.orderHistory
                  .filter(o => o.checkId === selectedCheckId)
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
                            <div style={{ fontWeight: 700, color: '#4ade80' }}>₦{historyOrder.total.toLocaleString()}</div>
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
                                  const menuItem = state.menu.find(m => m.id === o.menuItemId);
                                  const snapshotPrice = o.priceAtOrder || menuItem?.price || 0;
                                  return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                                      <span>{o.quantity}x {menuItem?.name || 'Item'}</span>
                                      <span style={{ opacity: 0.7 }}>₦{(snapshotPrice * o.quantity).toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                  <Button size="small" variant="secondary" fullWidth onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(historyOrder.id); }}>
                                    Download Receipt
                                  </Button>
                                </div>

                                <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
                                  <div 
                                    id={`receipt-${historyOrder.id}`}
                                    style={{ 
                                      width: '80mm', 
                                      padding: '10mm', 
                                      backgroundColor: '#ffffff', 
                                      color: '#000000',
                                      fontFamily: 'monospace',
                                      fontSize: '12px'
                                    }}
                                  >
                                    <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>BANKDROP</div>
                                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>{state.name}</div>
                                    <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
                                    <div style={{ marginBottom: '10px' }}>
                                      Check: #{historyOrder.checkId}<br />
                                      Order ID: {historyOrder.id}<br />
                                      Date: {new Date(historyOrder.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
                                    {historyOrder.orders.map((o, i) => {
                                      const menuItem = state.menu.find(m => m.id === o.menuItemId);
                                      const snapshotPrice = o.priceAtOrder || menuItem?.price || 0;
                                      return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                          <span>{o.quantity} {menuItem?.name}</span>
                                          <span>₦{(snapshotPrice * o.quantity).toLocaleString()}</span>
                                        </div>
                                      );
                                    })}
                                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                                      <span>TOTAL</span>
                                      <span>₦{historyOrder.total.toLocaleString()}</span>
                                    </div>
                                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
                                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
                                      Thank you for your business!<br />
                                      Powered by Bankdrop
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  ))}
                {state.orderHistory.filter(o => o.checkId === selectedCheckId).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontStyle: 'italic', fontSize: '0.875rem' }}>
                    No past orders for this table yet.
                  </div>
                )}
              </div>
            </div>

            {/* In-check Menu Selection Modal */}
            <AnimatePresence>
              {isAddingItem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    zIndex: 1100,
                    padding: 'var(--spacing-lg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ margin: 0 }}>Add Items</h3>
                      {Object.keys(pendingOrders).length > 0 && (
                        <span className={styles.pendingBadge}>
                          {Object.values(pendingOrders).reduce((a, b) => a + b, 0)} selected
                        </span>
                      )}
                    </div>
                    <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', color: 'var(--text-primary)' }}><X size={24} /></button>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-sm)',
                    paddingBottom: '100px',
                    overflowY: 'auto',
                    flex: 1
                  }}>
                    {state.menu.map(item => (
                      <div 
                        key={item.id} 
                        className={styles.orderRow}
                        style={{ padding: '12px 0' }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            backgroundColor: 'var(--bg-tertiary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center'
                          }}>
                            {item.type === 'subscription' ? <Repeat size={16} /> : item.type === 'service' ? <Zap size={16} /> : <Package size={16} />}
                          </div>
                          <div className={styles.orderInfo}>
                            <span className={styles.orderTitle}>{item.name}</span>
                            <span className={styles.orderSubtitle}>
                              ₦{item.price.toLocaleString()}
                              {item.type === 'subscription' && ` / ${item.billingCycle}`}
                            </span>
                          </div>
                        </div>
                        <QuantityStepper 
                          value={pendingOrders[item.id] || 0}
                          onIncrease={() => handleUpdatePendingQuantity(item.id, 1)}
                          onDecrease={() => handleUpdatePendingQuantity(item.id, -1)}
                        />
                      </div>
                    ))}
                  </div>

                  {Object.keys(pendingOrders).length > 0 && (
                    <motion.div 
                      className={styles.confirmBar}
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                    >
                      <Button 
                        variant="accent" 
                        fullWidth 
                        onClick={handleConfirmAddItems}
                        style={{ height: '56px', fontSize: '1.125rem' }}
                      >
                        <CheckIcon size={20} style={{ marginRight: '8px' }} />
                        Add to Check • ₦{Object.entries(pendingOrders).reduce((total, [id, qty]) => {
                          const price = state.menu.find(m => m.id === id)?.price || 0;
                          return total + (price * qty);
                        }, 0).toLocaleString()}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
