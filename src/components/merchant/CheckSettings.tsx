import React, { useMemo } from 'react';
import { 
  ChevronLeft, 
  Plus,
  BarChart3,
  Landmark
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { motion } from 'framer-motion';
import styles from './MerchantUI.module.css';

interface CheckSettingsProps {
  onBack: () => void;
}

export const CheckSettings: React.FC<CheckSettingsProps> = ({ onBack }) => {
  const { state, toggleCheckEnabled, addCheck, linkBankAccountToCheck } = useMerchant();

  // Stats are now maintained incrementally in the check object directly.


  const enabledCount = state.checks.filter(c => c.enabled).length;
  const disabledCount = state.checks.filter(c => !c.enabled).length;

  return (
    <div className={styles.merchantApp} style={{ paddingBottom: 'var(--spacing-xxl)' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={onBack} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className={styles.title} style={{ fontSize: '1.5rem' }}>Check Settings</h1>
          </div>
          <Button 
            variant="accent" 
            size="small" 
            onClick={addCheck}
            style={{ gap: '4px' }}
          >
            <Plus size={16} /> Add
          </Button>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          marginTop: 'var(--spacing-md)',
          paddingLeft: '40px'
        }}>
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              backgroundColor: '#4ade80', display: 'inline-block' 
            }} />
            {enabledCount} active
          </span>
          {disabledCount > 0 && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                backgroundColor: 'var(--text-muted)', display: 'inline-block' 
              }} />
              {disabledCount} disabled
            </span>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {state.checks.map((check, index) => {
          const cachedLifetimeOrders = check.lifetimeOrders || 0;
          const cachedLifetimeRevenue = check.lifetimeRevenue || 0;
          const isActive = check.status !== 'open';

          return (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card style={{ 
                opacity: check.enabled ? 1 : 0.5,
                borderLeft: `3px solid ${check.enabled ? '#4ade80' : 'var(--border-subtle)'}`,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Left: Check info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>Check #{check.id}</span>
                      {isActive && (
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--brand-accent)',
                          letterSpacing: '0.05em'
                        }}>
                          {check.status}
                        </span>
                      )}
                      {!check.enabled && check.archivedAt && (
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic'
                        }}>
                          disabled
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BarChart3 size={12} />
                        {cachedLifetimeOrders} orders
                      </span>
                      <span>{formatCurrency(cachedLifetimeRevenue)}</span>
                    </div>
                  </div>

                  {/* Account Selector */}
                  <div style={{ minWidth: '140px', maxWidth: '200px' }}>
                    <label className={styles.accountLabel}>
                      <Landmark size={12} /> Linked Account
                    </label>
                    <select 
                      className={styles.accountSelect}
                      value={check.bankAccountId || 'default'}
                      onChange={(e) => linkBankAccountToCheck(check.id, e.target.value === 'default' ? undefined : e.target.value)}
                    >
                      <option value="default">Default (Primary)</option>
                      {state.bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} - {acc.accountNumber.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right: Toggle + Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleCheckEnabled(check.id)}
                      disabled={isActive}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: check.enabled ? '#4ade80' : 'var(--bg-tertiary)',
                        position: 'relative',
                        cursor: isActive ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s ease',
                        opacity: isActive ? 0.4 : 1,
                        flexShrink: 0
                      }}
                      title={isActive ? 'Cannot disable an active check' : (check.enabled ? 'Disable check' : 'Enable check')}
                    >
                      <motion.div 
                        animate={{ x: check.enabled ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>

                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add check CTA at bottom */}
      <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center' }}>
        <Button 
          variant="outline" 
          fullWidth 
          onClick={addCheck}
          style={{ borderStyle: 'dashed', height: '48px', gap: '8px' }}
        >
          <Plus size={18} /> Add New Check
        </Button>
      </div>
    </div>
  );
};
