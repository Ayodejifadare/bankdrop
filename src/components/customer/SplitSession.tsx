import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../ui/Button';
import type { SplitMethod } from '../../types/checkout';
import {
  Users,
  Percent,
  Equal,
  PenLine,
  Info,
  Minus,
  Plus,
  ArrowLeft
} from 'lucide-react';
import styles from './CustomerUI.module.css';

interface Props {
  checkId: string;
  onPayShare: (amount: number) => void;
  onPickItems: () => void;
  onBack: () => void;
}

export const SplitSession: React.FC<Props> = ({ checkId, onPayShare, onPickItems, onBack }) => {
  const { state: merchant } = useMerchant();
  const { splitSession, createSplitSession, changeSplitMethod } = useCustomer();

  const check = merchant.checks.find(c => c.id === checkId);
  const total = check?.total || 0;
  const discount = splitSession?.discount || 0;
  const finalTotal = Math.max(0, total - discount);

  // Init session if not yet created
  React.useEffect(() => {
    if (!splitSession) {
      createSplitSession(checkId, 'items');
    }
  }, [checkId, splitSession, createSplitSession]);

  const method: SplitMethod = splitSession?.method || 'items';

  // Equal split state
  const [numPeople, setNumPeople] = useState(2);
  const equalShare = Math.ceil(finalTotal / numPeople);

  // Percentage state
  const [myPercent, setMyPercent] = useState(50);
  const percentShare = Math.ceil(finalTotal * (myPercent / 100));

  // Custom state
  const [customAmount, setCustomAmount] = useState('');
  const customShare = Number(customAmount) || 0;

  const methods: { key: SplitMethod; label: string; icon: React.ReactNode }[] = [
    { key: 'items', label: 'By Items', icon: <Users size={20} /> },
    { key: 'equal', label: 'Equally', icon: <Equal size={20} /> },
    { key: 'percentage', label: 'Percentage', icon: <Percent size={20} /> },
    { key: 'custom', label: 'Custom', icon: <PenLine size={20} /> },
  ];

  const handleMethodChange = (m: SplitMethod) => {
    changeSplitMethod(m);
  };

  return (
    <div className={styles.customerLayout}>
      <div className={styles.checkoutHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
          <div>
            <div className={styles.merchantName}>Split Payment</div>
            <div className={styles.checkLabel}>Check #{checkId} • ₦{finalTotal.toLocaleString()} {discount > 0 && `(includes -₦${discount})`}</div>
          </div>
        </div>
      </div>

      <div className={styles.cartBody}>
        {/* Method Chips */}
        <div className={styles.methodChips}>
          {methods.map(m => (
            <button
              key={m.key}
              className={`${styles.methodChip} ${method === m.key ? styles.methodChipActive : ''}`}
              onClick={() => handleMethodChange(m.key)}
            >
              <span className={styles.methodChipIcon}>{m.icon}</span>
              <span className={styles.methodChipLabel}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* --- By Items --- */}
        {method === 'items' && (
          <div>
            <div className={styles.infoBox}>
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Other guests can scan the same check QR to join and pick their items automatically.</span>
            </div>

            {splitSession && splitSession.participants.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h4 className={styles.sectionTitle}>Participants</h4>
                {splitSession.participants.map(p => (
                  <div key={p.id} className={styles.participantRow}>
                    <div className={styles.participantAvatar}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={styles.participantName}>{p.name} {p.paid ? '' : '(You)'}</span>
                    {p.paid && <span className={styles.participantPaid}>✓ Paid</span>}
                  </div>
                ))}
              </div>
            )}

            <Button variant="accent" fullWidth size="large" onClick={onPickItems}>
              Select My Items
            </Button>
          </div>
        )}

        {/* --- Equal --- */}
        {method === 'equal' && (
          <div>
            <h4 className={styles.sectionTitle} style={{ textAlign: 'center' }}>How many people?</h4>
            <div className={styles.stepper}>
              <button className={styles.stepperBtn} onClick={() => setNumPeople(Math.max(2, numPeople - 1))}>
                <Minus size={20} />
              </button>
              <span className={styles.stepperValue}>{numPeople}</span>
              <button className={styles.stepperBtn} onClick={() => setNumPeople(Math.min(12, numPeople + 1))}>
                <Plus size={20} />
              </button>
            </div>
            <div className={styles.splitResult}>
              <div className={styles.splitResultAmount}>₦{equalShare.toLocaleString()}</div>
              <div className={styles.splitResultLabel}>per person</div>
            </div>
            <Button variant="accent" fullWidth size="large" onClick={() => onPayShare(equalShare)}>
              Pay My Share ₦{equalShare.toLocaleString()}
            </Button>
          </div>
        )}

        {/* --- Percentage --- */}
        {method === 'percentage' && (
          <div>
            <h4 className={styles.sectionTitle} style={{ textAlign: 'center' }}>My share</h4>
            <div className={styles.stepper}>
              <button className={styles.stepperBtn} onClick={() => setMyPercent(Math.max(5, myPercent - 5))}>
                <Minus size={20} />
              </button>
              <span className={styles.stepperValue}>{myPercent}%</span>
              <button className={styles.stepperBtn} onClick={() => setMyPercent(Math.min(100, myPercent + 5))}>
                <Plus size={20} />
              </button>
            </div>
            <div className={styles.splitResult}>
              <div className={styles.splitResultAmount}>₦{percentShare.toLocaleString()}</div>
              <div className={styles.splitResultLabel}>{myPercent}% of ₦{finalTotal.toLocaleString()}</div>
            </div>
            <Button variant="accent" fullWidth size="large" onClick={() => onPayShare(percentShare)}>
              Pay My Share ₦{percentShare.toLocaleString()}
            </Button>
          </div>
        )}

        {/* --- Custom --- */}
        {method === 'custom' && (
          <div>
            <h4 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Enter your amount</h4>
            <div style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, marginRight: '4px' }}>₦</span>
              <input
                type="number"
                className={styles.inlineInput}
                style={{ maxWidth: '200px', display: 'inline-block' }}
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="0"
                max={finalTotal}
              />
            </div>
            <div className={styles.splitResult}>
              <div className={styles.splitResultLabel}>Remaining for others</div>
              <div className={styles.splitResultAmount}>₦{Math.max(0, finalTotal - customShare).toLocaleString()}</div>
            </div>
            <Button
              variant="accent"
              fullWidth
              size="large"
              onClick={() => onPayShare(customShare)}
              disabled={customShare <= 0 || customShare > finalTotal}
            >
              Pay ₦{customShare.toLocaleString()}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
