import React, { useEffect, useRef } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { CheckCircle2, XCircle, Landmark, CreditCard, Banknote, BellRing } from 'lucide-react';
import styles from './MerchantUI.module.css';

export const PaymentAlert: React.FC = () => {
  const { state, resolveVerification } = useMerchant();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get all pending and focus on the latest one
  const pendingList = state.pendingVerifications?.filter(v => v.status === 'pending') || [];
  const activeItem = pendingList[pendingList.length - 1];

  useEffect(() => {
    if (activeItem && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(e => console.log('Audio play blocked:', e));
        audioRef.current = audio;
      } catch (err) {
        console.error('Audio init error:', err);
      }
    }
  }, [activeItem?.id]);

  if (!activeItem) return null;

  const getIcon = () => {
    switch (activeItem.method) {
      case 'Transfer': return <Landmark size={24} color="var(--brand-accent)" />;
      case 'POS': return <CreditCard size={24} color="#8b5cf6" />;
      case 'Cash': return <Banknote size={24} color="#22c55e" />;
      default: return <BellRing size={24} color="var(--brand-accent)" />;
    }
  };

  return (
    <div className={styles.notificationBanner}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`${styles.bannerCard} ${styles.hapticPulse}`}
        >
          <div className={styles.bannerAccent} />
          <div className={styles.bannerPulse} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '16px', width: '100%' }}>
            <motion.div 
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 2 }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-primary)',
                flexShrink: 0
              }}
            >
              {getIcon()}
            </motion.div>

            <div className={styles.bannerContent}>
              <div className={styles.bannerHeader}>
                <span className={styles.bannerLabel}>
                  {pendingList.length > 1 ? `Incoming Payments (${pendingList.length})` : 'Incoming Payment'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Just now</span>
              </div>
              
              <div className={styles.bannerAmount}>
                ₦{activeItem.amount.toLocaleString()}
              </div>
              
              <div className={styles.bannerDetail}>
                {activeItem.method} via {activeItem.type === 'check' ? `Check #${activeItem.targetId}` : `Invoice ${activeItem.targetId}`}
              </div>

              <div className={styles.bannerActions}>
                <Button 
                  fullWidth 
                  size="small"
                  variant="outline" 
                  style={{ borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'transparent' }}
                  onClick={() => resolveVerification(activeItem.id, false)}
                >
                  <XCircle size={16} style={{ marginRight: '6px' }} /> Decline
                </Button>
                <Button 
                  fullWidth 
                  size="small"
                  variant="primary" 
                  style={{ backgroundColor: '#4ade80', color: '#000', border: 'none' }}
                  onClick={() => resolveVerification(activeItem.id, true)}
                >
                  <CheckCircle2 size={16} style={{ marginRight: '6px' }} /> Confirm
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
