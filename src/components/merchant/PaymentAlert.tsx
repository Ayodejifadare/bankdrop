import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { CheckCircle2, XCircle, Landmark, CreditCard, Banknote } from 'lucide-react';

export const PaymentAlert: React.FC = () => {
  const { state, resolveVerification } = useMerchant();

  const pending = state.pendingVerifications?.find(v => v.status === 'pending');

  if (!pending) return null;

  const getIcon = () => {
    switch (pending.method) {
      case 'Transfer': return <Landmark size={24} color="#3b82f6" />;
      case 'POS': return <CreditCard size={24} color="#8b5cf6" />;
      case 'Cash': return <Banknote size={24} color="#22c55e" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-lg)'
        }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '24px',
            padding: 'var(--spacing-xl)',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, var(--brand-accent), #4ade80)'
          }} />

          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid var(--border-primary)'
              }}
            >
              {getIcon()}
            </motion.div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Confirm Payment
            </h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              ₦{pending.amount.toLocaleString()}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: 'var(--spacing-xl)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Method</span>
              <span style={{ fontWeight: 600 }}>{pending.method}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Source</span>
              <span style={{ fontWeight: 600 }}>
                {pending.type === 'check' ? `Check #${pending.targetId}` : `Inv #${pending.targetId}`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              fullWidth 
              variant="outline" 
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
              onClick={() => resolveVerification(pending.id, false)}
            >
              <XCircle size={18} style={{ marginRight: '8px' }} /> Decline
            </Button>
            <Button 
              fullWidth 
              variant="primary" 
              style={{ backgroundColor: '#4ade80', color: '#000', border: 'none' }}
              onClick={() => resolveVerification(pending.id, true)}
            >
              <CheckCircle2 size={18} style={{ marginRight: '8px' }} /> Confirm
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
