import React, { useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { Button } from '../ui/Button';
import { RewardsBanner } from './RewardsBanner';
import { CheckoutAuth } from './CheckoutAuth';
import { Landmark, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './CustomerUI.module.css';

interface Props {
  checkId: string;
  onPay: (amount: number) => void;
  onSplit: () => void;
  onBack: () => void;
}

export const CartView: React.FC<Props> = ({ checkId, onPay, onSplit, onBack }) => {
  const { state: merchant } = useMerchant();
  const { splitSession, checkId: contextCheckId } = useCustomer();
  const { isAuthenticated } = useCustomerProfile();

  const check = merchant.checks.find(c => c.id === checkId);
  const subtotal = check?.total || 0;
  const discount = splitSession?.discount || 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const orderItems = useMemo(() => {
    if (!check) return [];
    return check.orders.map(o => {
      const menuItem = merchant.menu.find(m => m.id === o.menuItemId);
      const snapshotPrice = o.priceAtOrder || menuItem?.price || 0;
      return {
        name: menuItem?.name || 'Unknown',
        price: snapshotPrice,
        quantity: o.quantity,
        total: snapshotPrice * o.quantity,
      };
    });
  }, [check, merchant.menu]);



  if (!check || check.status === 'open') {
    return (
      <div className={styles.customerLayout}>
        <div className={styles.checkoutHeader}>
          <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
          <div className={styles.merchantName}>No Active Order</div>
        </div>
        <div className={styles.cartBody} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <Landmark size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <h3>This check has no order yet</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Ask your server to add items to this check.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.customerLayout}>
      <div className={styles.checkoutHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <Landmark size={20} color="var(--brand-accent)" />
          <div>
            <div className={styles.merchantName}>{merchant.name}</div>
            <div className={styles.checkLabel}>Check #{contextCheckId || checkId}</div>
          </div>
        </div>
      </div>

      <div className={styles.cartBody}>
        <h3 className={styles.sectionTitle}>Your Order</h3>

        {orderItems.map((item, i) => (
          <motion.div
            key={i}
            className={styles.orderItem}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={styles.itemLeft}>
              <span className={styles.itemQty}>{item.quantity}</span>
              <span className={styles.itemName}>{item.name}</span>
            </div>
            <span className={styles.itemPrice}>₦{item.total.toLocaleString()}</span>
          </motion.div>
        ))}

        {discount > 0 && (
          <div className={styles.discountRow}>
            <span>Reward Discount</span>
            <span>-₦{discount.toLocaleString()}</span>
          </div>
        )}

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>₦{finalTotal.toLocaleString()}</span>
        </div>

        {isAuthenticated ? (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <RewardsBanner total={subtotal} />
          </div>
        ) : (
          <CheckoutAuth />
        )}
      </div>

      <div className={styles.stickyCTA}>
        <Button variant="accent" fullWidth size="large" onClick={() => onPay(finalTotal)}>
          Pay ₦{finalTotal.toLocaleString()}
        </Button>
        <Button variant="outline" fullWidth size="large" onClick={onSplit}>
          Split Payment
        </Button>
      </div>
    </div>
  );
};
