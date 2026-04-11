import React from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import styles from './ProfileUI.module.css';
import { Gift } from 'lucide-react';

export const RewardsTracker: React.FC = () => {
  const { rewards } = useCustomerProfile();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Rewards</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)' }}>Vendor Specific</span>
      </div>

      {rewards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Gift size={24} color="var(--text-muted)" style={{ marginBottom: 'var(--spacing-sm)' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No rewards earned yet.</p>
        </div>
      ) : (
        <div className={styles.rewardGrid}>
          {rewards.map(reward => (
            <div key={reward.vendorId} className={styles.rewardCard}>
              <div className={styles.vendorName}>{reward.vendorName}</div>
              <div className={styles.rewardBalance}>
                {reward.currency === 'NGN' ? '₦' : reward.currency}{reward.balance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
