import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Minus,
  X, 
  Settings,
  Check as CheckIcon,
  Package,
  Repeat,
  Zap
} from 'lucide-react';
import type { PastOrder } from '../../types/merchant';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './MerchantUI.module.css';
import { CheckGrid } from './CheckGrid';
import { CheckDetail } from './CheckDetail';
import { formatCurrency } from '../../utils/formatters';

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
          id: '', // Context will generate a permanent ID if empty
          menuItemId,
          name: menuItem?.name || 'Item',
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

      <CheckGrid 
        checks={state.checks} 
        onSelectCheck={(id) => setSelectedCheckId(id)} 
      />

      <AnimatePresence>
        {selectedCheck && (
          <CheckDetail 
            check={selectedCheck}
            menu={state.menu}
            orderHistory={state.orderHistory}
            merchantName={state.name}
            onClose={() => setSelectedCheckId(null)}
            onAddItems={() => setIsAddingItem(true)}
            onSettle={() => updateCheckStatus(selectedCheck.id, 'paid')}
            onReset={() => resetCheck(selectedCheck.id)}
            onSetPaymentMode={(mode) => setCheckPaymentMode(selectedCheck.id, mode)}
            onUpdateQuantity={(menuItemId, delta) => updateOrderQuantity(selectedCheck.id, menuItemId, delta)}
            onDownloadReceipt={handleDownloadReceipt}
          />
        )}
      </AnimatePresence>

      {/* In-check Menu Selection Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <motion.div 
            className={styles.fullPageModal}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className={styles.title} style={{ margin: 0 }}>Add Items</h3>
                  {Object.keys(pendingOrders).length > 0 && (
                    <span className={styles.pendingBadge}>
                      {Object.values(pendingOrders).reduce((a, b) => a + b, 0)} selected
                    </span>
                  )}
                </div>
                {selectedCheck && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Check #{selectedCheck.id} • Table {selectedCheck.id}
                  </div>
                )}
              </div>
              <button onClick={handleCloseModal} className={styles.stepperBtn} style={{ width: '40px', height: '40px' }}><X size={24} /></button>
            </div>

            <div className={styles.modalBody}>
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
                        {formatCurrency(item.price)}
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
              <div className={styles.confirmBar}>
                <Button 
                  variant="accent" 
                  fullWidth 
                  onClick={handleConfirmAddItems}
                  style={{ height: '56px', fontSize: '1.125rem' }}
                >
                  <CheckIcon size={20} style={{ marginRight: '8px' }} />
                  Add to Check • {formatCurrency(Object.entries(pendingOrders).reduce((total, [id, qty]) => {
                    const price = state.menu.find(m => m.id === id)?.price || 0;
                    return total + (price * qty);
                  }, 0))}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
