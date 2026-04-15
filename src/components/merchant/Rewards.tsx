import React, { useState } from 'react';
import type { Reward } from '../../context/MerchantContext';
import { useMerchant } from '../../context/MerchantContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import styles from './MerchantUI.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Star, 
  ChevronRight,
  Plus,
  X,
  Trash2,
  Archive,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';

interface RewardsManagerProps {
  initialAdding?: boolean;
  onAddingComplete?: () => void;
}

export const RewardsManager: React.FC<RewardsManagerProps> = ({ initialAdding, onAddingComplete }) => {
  const { state, addReward, updateReward, deleteReward } = useMerchant();
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isAdding, setIsAdding] = useState(initialAdding || false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Form state
  const [title, setTitle] = useState('');
  const [minSpend, setMinSpend] = useState(0);
  const [rewardValue, setRewardValue] = useState(0);
  const [rewardUnit, setRewardUnit] = useState<'cash' | 'percentage'>('percentage');
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>('active');
  const [expiryDate, setExpiryDate] = useState('');

  const startEdit = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setMinSpend(reward.minSpend);
    setRewardValue(reward.rewardValue);
    setRewardUnit(reward.rewardUnit);
    setStatus(reward.status);
    setExpiryDate(reward.expiryDate || '');
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingReward(null);
    setTitle('');
    setMinSpend(0);
    setRewardValue(0);
    setRewardUnit('percentage');
    setStatus('active');
    setExpiryDate('');
  };

  const handleSave = () => {
    if (!title || rewardValue <= 0) return;

    // eslint-disable-next-line react-hooks/purity
    const newId = Date.now().toString();
    const rewardData: Reward = {
      id: editingReward?.id || newId,
      title,
      minSpend,
      rewardValue,
      rewardUnit,
      status,
      expiryDate: expiryDate || null
    };

    if (editingReward) {
      updateReward(rewardData);
    } else {
      addReward(rewardData);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (editingReward) {
      deleteReward(editingReward.id);
      closeModal();
    }
  };

  const handleArchive = () => {
    if (editingReward) {
      updateReward({ ...editingReward, status: 'archived' });
      closeModal();
    }
  };

  const handleRestore = (reward: Reward) => {
    updateReward({ ...reward, status: 'active' });
  };

  const closeModal = () => {
    setEditingReward(null);
    setIsAdding(false);
    onAddingComplete?.();
  };

  const filteredRewards = state.rewards.filter(r => 
    activeTab === 'active' ? r.status !== 'archived' : r.status === 'archived'
  );

  return (
    <div className={styles.rewardsManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={styles.title}>Loyalty & Rewards</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drive repeat visits with offers</p>
        </div>
        <Button size="small" variant="accent" onClick={startAdd}>
          <Plus size={18} /> New Offer
        </Button>
      </header>

      <div className={styles.statsContainer}>
        <Card title="Total Members">
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>1,280</div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>+12% this month</div>
        </Card>
        <Card title="Redemptions">
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>45</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 days</div>
        </Card>
      </div>

      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className={styles.tabGroup}>
          <button 
            className={`${styles.tabItem} ${activeTab === 'active' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <CheckCircle2 size={18} /> Active Offers
          </button>
          <button 
            className={`${styles.tabItem} ${activeTab === 'archived' ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            <Archive size={18} /> Archive
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {filteredRewards.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No {activeTab} offers found.
            </div>
          ) : (
            filteredRewards.map(reward => (
              <div key={reward.id} onClick={() => activeTab === 'active' && startEdit(reward)} style={{ cursor: activeTab === 'active' ? 'pointer' : 'default' }}>
                <Card>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                      padding: '12px', 
                      borderRadius: '12px', 
                      backgroundColor: reward.status === 'paused' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                      color: reward.status === 'paused' ? 'var(--text-muted)' : 'var(--brand-accent)'
                    }}>
                      <Gift size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {reward.title}
                        {reward.status === 'paused' && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>PAUSED</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Spend ₦{(reward.minSpend ?? 0).toLocaleString()} → Get {reward.rewardUnit === 'cash' ? '₦' : ''}{reward.rewardValue ?? 0}{reward.rewardUnit === 'percentage' ? '%' : ''} back
                      </div>
                    </div>
                    {activeTab === 'active' ? (
                      <ChevronRight size={20} color="var(--text-muted)" />
                    ) : (
                      <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleRestore(reward); }}>
                        <RefreshCcw size={14} style={{ marginRight: '4px' }} /> Restore
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3>Customer Retention</h3>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>TO</div>
                <div>
                  <div style={{ fontWeight: 600 }}>Tunde O.</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 visits • Silver Member</div>
                </div>
              </div>
              <Star size={18} color="var(--brand-accent)" fill="var(--brand-accent)" />
            </div>
          </Card>
        </div>
      </section>

      {/* Add/Edit Modal Overlay */}
      <AnimatePresence>
        {(isAdding || editingReward) && (
          <motion.div 
            className={styles.actionHubOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className={styles.onboardingForm}
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                padding: 'var(--spacing-xl)', 
                borderTopLeftRadius: 'var(--radius-xl)', 
                borderTopRightRadius: 'var(--radius-xl)',
                width: '100%',
                maxWidth: '100%',
                margin: '0',
                position: 'relative'
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h3>{isAdding ? 'New Reward Offer' : 'Edit Reward'}</h3>
                <button onClick={closeModal} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>

              <Input
                label="Offer Title"
                placeholder="e.g. Mega Spender Bonus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className={styles.responsiveGrid} style={{ marginTop: 'var(--spacing-md)' }}>
                <Input
                  label="Min. Spend (₦)"
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Reward Value"
                  type="number"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(parseInt(e.target.value) || 0)}
                  rightAddon={
                    <select 
                      value={rewardUnit}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRewardUnit(e.target.value as 'cash' | 'percentage')}
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="percentage">%</option>
                      <option value="cash">₦</option>
                    </select>
                  }
                />
              </div>

              <div className={styles.responsiveGrid} style={{ marginTop: 'var(--spacing-md)' }}>
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Reward['status'])}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'archived', label: 'Archived' }
                  ]}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                {!isAdding && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%' }}>
                    <Button variant="secondary" className={styles.destructiveBtn} onClick={handleDelete} title="Delete Forever">
                      <Trash2 size={20} />
                    </Button>
                    {status !== 'archived' && (
                      <Button variant="secondary" onClick={handleArchive} style={{ flex: 1 }}>
                        <Archive size={20} style={{ marginRight: '8px' }} /> Archive
                      </Button>
                    )}
                  </div>
                )}
                <Button variant="accent" fullWidth onClick={handleSave}>
                  {isAdding ? 'Create Offer' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
