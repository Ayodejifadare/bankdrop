import React, { useState, useEffect, useRef } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../ui/Button';
import { 
  Copy, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Landmark, 
  Gift,
  Loader2,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './CustomerUI.module.css';

interface Props {
  checkId: string;
  invoiceId?: string;
  amount: number;
  onBack: () => void;
  onDone: () => void;
}

export const PayTransfer: React.FC<Props> = ({ checkId, invoiceId, amount, onBack, onDone }) => {
  const { state: merchant, requestVerification } = useMerchant();
  const { markPaid } = useCustomer();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 min

  const bank = merchant.bankAccount;

  const isPaid = invoiceId 
    ? merchant.invoices.find(i => i.id === invoiceId)?.status === 'paid'
    : merchant.checks.find(c => c.id === checkId)?.status === 'paid';

  const receiptItems = React.useMemo(() => {
    if (invoiceId) {
      const inv = merchant.invoices.find(i => i.id === invoiceId);
      return inv?.items || [];
    } else {
      const chk = merchant.checks.find(c => c.id === checkId);
      if (!chk) return [];
      return chk.orders.map(o => {
        const menuItem = merchant.menu.find(m => m.id === o.menuItemId);
        return {
          id: o.menuItemId,
          name: menuItem?.name || 'Unknown Item',
          price: menuItem?.price || 0,
          quantity: o.quantity
        };
      });
    }
  }, [merchant, invoiceId, checkId]);

  // Countdown
  useEffect(() => {
    if (isPaid || confirmed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, confirmed]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (bank) {
      navigator.clipboard.writeText(bank.accountNumber).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = () => {
    requestVerification({
      type: invoiceId ? 'invoice' : 'check',
      targetId: invoiceId || checkId,
      amount,
      method: 'Transfer',
    });
    setConfirmed(true);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      // Scale 3 ensures text is super crisp on the thermal PDF
      const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dynamic PDF dimensions to precisely match the thermal receipt's proportions
      const pdfWidth = 80; // 80mm standard wide thermal roll width
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${merchant.name.replace(/\s+/g, '_')}_${amount}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Post-Payment Linktree Join Page ----
  if (isPaid || confirmed) {
    return (
      <div className={styles.customerLayout}>
        <div className={styles.cartBody}>
          <div className={styles.joinPage}>
            <motion.div
              className={styles.successIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            >
              {isPaid ? (
                <CheckCircle2 size={40} color="#000" strokeWidth={2.5} />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 size={40} color="#000" strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.div>

            <motion.h2
              className={styles.sectionTitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: '1.5rem', marginBottom: '4px' }}
            >
              Payment Sent!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: 'var(--text-muted)', marginBottom: '8px' }}
            >
              ₦{amount.toLocaleString()} to {merchant.name}
            </motion.p>

            {/* Linktree-style Join Card */}
            <motion.div
              className={styles.joinCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <Landmark size={28} color="var(--brand-accent)" />
              </div>
              <div className={styles.joinCardTitle}>
                Join {merchant.name} on Bankdrop
              </div>
              <div className={styles.joinCardSub}>
                Lock in your reward for your next visit
              </div>

              {merchant.rewards.length > 0 && (
                <div className={styles.rewardPill}>
                  <Gift size={16} />
                  {merchant.rewards[0].title}
                </div>
              )}

              <Button variant="accent" fullWidth size="large">
                Join & Lock In Reward
              </Button>

              <div className={styles.skipLink} onClick={onDone}>
                Maybe later
              </div>
            </motion.div>

            {/* Receipt mini */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                marginTop: 'var(--spacing-xxl)',
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Amount</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₦{amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Merchant</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{merchant.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{new Date().toLocaleDateString()}</span>
              </div>
            </motion.div>

            {isPaid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '16px', width: '100%' }}
              >
                <Button variant="outline" fullWidth onClick={handleDownloadReceipt}>
                  <Download size={18} style={{ marginRight: '8px' }} /> Download Receipt
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* HIDDEN THERMAL RECEIPT FOR PDF (Off-screen component) */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={receiptRef}
            style={{ 
              width: '320px', 
              padding: '24px', 
              backgroundColor: '#ffffff', 
              color: '#000000',
              fontFamily: 'monospace' // Classic Thermal aesthetic
            }}
          >
            <div style={{ textAlign: 'center', margin: '0 0 16px 0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{merchant.name}</h2>
              <div style={{ fontSize: '12px', color: '#333' }}>Payment Receipt</div>
              <div style={{ fontSize: '12px', color: '#333' }}>{new Date().toLocaleString()}</div>
            </div>
            
            <div style={{ borderBottom: '2px dashed #000', margin: '16px 0' }}></div>
            
            <div style={{ fontSize: '14px' }}>
              {receiptItems.length > 0 ? receiptItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>{item.quantity} x ₦{item.price.toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>₦{(item.quantity * item.price).toLocaleString()}</div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>Custom Checkout Payment</div>
              )}
            </div>
            
            <div style={{ borderBottom: '2px dashed #000', margin: '16px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>
              <span>TOTAL</span>
              <span>₦{amount.toLocaleString()}</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', fontStyle: 'italic', fontWeight: 'bold' }}>
              Thank you for your patro!
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: '#666' }}>
              Powered by Bankdrop
            </div>
          </div>
        </div>
      </div>
    );
  }



  // ---- Transfer Details Screen ----
  return (
    <div className={styles.customerLayout}>
      <div className={styles.checkoutHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
          <div>
            <div className={styles.merchantName}>{invoiceId ? 'Invoice Payment' : 'Pay with Transfer'}</div>
            <div className={styles.checkLabel}>{invoiceId ? `Inv #${invoiceId}` : `Check #${checkId}`}</div>
          </div>
        </div>
      </div>

      <div className={styles.cartBody}>
        <div className={styles.transferCard}>
          <div className={styles.transferAmount}>₦{amount.toLocaleString()}</div>
          <div className={styles.transferSubtext}>Transfer this exact amount to</div>

          {bank ? (
            <div>
              <div className={styles.bankDetail}>
                <span className={styles.bankDetailLabel}>Bank</span>
                <span className={styles.bankDetailValue}>{bank.bankName}</span>
              </div>
              <div className={styles.bankDetail}>
                <span className={styles.bankDetailLabel}>Account Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.bankDetailValue}>{bank.accountNumber}</span>
                  <motion.button
                    className={styles.copyBtn}
                    onClick={handleCopy}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </motion.button>
                </div>
              </div>
              <div className={styles.bankDetail}>
                <span className={styles.bankDetailLabel}>Account Name</span>
                <span className={styles.bankDetailValue}>{bank.accountName}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Merchant has not linked a bank account yet.
            </p>
          )}
        </div>

        <div className={styles.timer}>
          <Clock size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Payment window expires in
          <div className={styles.timerValue}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className={styles.stickyCTA}>
        <Button variant="accent" fullWidth size="large" onClick={handleConfirm}>
          I've Sent the Money
        </Button>
      </div>
    </div>
  );
};
