import React from 'react';
import { motion } from 'framer-motion';
import { Settings2, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import type { Installment } from '../../types/merchant';

interface PaymentPlanConfiguratorProps {
  hasPlan: boolean;
  setHasPlan: (val: boolean) => void;
  depositPercent: number;
  setDepositPercent: (val: number) => void;
  planMode: 'delivery' | 'date' | 'installments';
  setPlanMode: (val: 'delivery' | 'date' | 'installments') => void;
  installmentFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  setInstallmentFrequency: (val: 'weekly' | 'bi-weekly' | 'monthly') => void;
  installmentCount: number;
  setInstallmentCount: (val: number) => void;
  scheduledDate: string;
  setScheduledDate: (val: string) => void;
  installments: Installment[];
  depositAmount: number;
}

export const PaymentPlanConfigurator: React.FC<PaymentPlanConfiguratorProps> = ({
  hasPlan,
  setHasPlan,
  depositPercent,
  setDepositPercent,
  planMode,
  setPlanMode,
  installmentFrequency,
  setInstallmentFrequency,
  installmentCount,
  setInstallmentCount,
  scheduledDate,
  setScheduledDate,
  installments,
  depositAmount
}) => {
  return (
    <div style={{ 
      marginTop: '4px',
      padding: '16px', 
      borderRadius: '16px', 
      border: `2px solid ${hasPlan ? 'var(--brand-accent)' : 'var(--border-subtle)'}`,
      backgroundColor: hasPlan ? 'rgba(212, 175, 55, 0.05)' : 'none',
      cursor: 'pointer'
    }} onClick={() => setHasPlan(!hasPlan)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Settings2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Apply Payment Plan</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Split payment into installments</div>
          </div>
        </div>
        <div style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          border: '2px solid var(--brand-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hasPlan && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-accent)' }} />}
        </div>
      </div>

      {hasPlan && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deposit / Upfront Amount (%)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[25, 50, 75].map(p => (
                <Button 
                  key={p} 
                  size="small" 
                  variant={depositPercent === p ? 'accent' : 'secondary'}
                  style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setDepositPercent(p); }}
                >
                  {p}%
                </Button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div style={{ 
              display: 'flex', 
              backgroundColor: 'var(--bg-tertiary)', 
              padding: '4px', 
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid var(--border-subtle)'
            }}>
              {[
                { id: 'delivery', label: 'Delivery' },
                { id: 'date', label: 'By Date' },
                { id: 'installments', label: 'Installments' }
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => setPlanMode(mode.id as any)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: planMode === mode.id ? 'var(--brand-accent)' : 'transparent',
                    color: planMode === mode.id ? '#000' : 'var(--text-secondary)',
                    fontWeight: 700,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {planMode === 'installments' && (
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.1)'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frequency</label>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {['weekly', 'bi-weekly', 'monthly'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setInstallmentFrequency(f as any)}
                        style={{ 
                          flex: 1, 
                          padding: '6px', 
                          fontSize: '0.75rem', 
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: installmentFrequency === f ? 'var(--bg-tertiary)' : 'transparent',
                          color: installmentFrequency === f ? 'var(--brand-accent)' : 'var(--text-secondary)',
                          fontWeight: installmentFrequency === f ? 700 : 400
                        }}
                      >
                        {f.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Count</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button onClick={() => setInstallmentCount(Math.max(2, installmentCount - 1))} style={{ padding: '4px', background: 'none', border: 'none' }}><Minus size={14}/></button>
                    <span style={{ fontWeight: 700 }}>{installmentCount}</span>
                    <button onClick={() => setInstallmentCount(Math.min(12, installmentCount + 1))} style={{ padding: '4px', background: 'none', border: 'none' }}><Plus size={14}/></button>
                  </div>
                </div>
              </div>
            )}

            {planMode === 'date' && (
              <motion.div 
                animate={{ opacity: 1, y: 0 }} 
                initial={{ opacity: 0, y: -10 }}
                style={{ marginBottom: '16px' }}
              >
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Select Fulfillment Date</label>
                <Input 
                  type="date" 
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </motion.div>
            )}
          </div>

          <div style={{ 
            marginTop: '4px', 
            padding: '16px', 
            backgroundColor: 'var(--bg-primary)', 
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
              Payment Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Deposit / Upfront</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due immediately</div>
                </div>
                <div style={{ fontWeight: 700 }}>{formatCurrency(depositAmount)}</div>
              </div>
              
              {installments.map((inst) => (
                <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inst.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {inst.dueDate === 'on_delivery' ? 'On Delivery' : new Date(inst.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(inst.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
