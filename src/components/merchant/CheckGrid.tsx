import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Landmark, Zap } from 'lucide-react';
import type { Check } from '../../types/merchant';

interface CheckGridProps {
  checks: Check[];
  onSelectCheck: (id: string) => void;
}

export const CheckGrid: React.FC<CheckGridProps> = ({ checks, onSelectCheck }) => {
  const getStatusColor = (status: Check['status']) => {
    switch (status) {
      case 'active': return 'var(--brand-accent)';
      case 'paid': return '#4ade80';
      default: return 'var(--border-primary)';
    }
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: 'var(--spacing-md)' 
    }}>
      {checks.map(check => (
        <motion.div
          key={check.id}
          whileHover={check.enabled ? { scale: 1.02 } : {}}
          whileTap={check.enabled ? { scale: 0.95 } : {}}
          onClick={() => check.enabled && onSelectCheck(check.id)}
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
  );
};
