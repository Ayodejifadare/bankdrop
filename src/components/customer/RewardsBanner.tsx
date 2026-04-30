import React, { useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { useCustomer } from '../../context/CustomerContext';
import { Button } from '../ui/Button';
import { Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import styles from './CustomerUI.module.css';

interface Props {
  total: number;
}

export const RewardsBanner: React.FC<Props> = ({ total }) => {
  const { state: merchant } = useMerchant();
  const { isAuthenticated, rewards, user } = useCustomerProfile();
  const { splitSession, applySessionReward, removeSessionReward, participantId, syncError } = useCustomer();

  // 1. Redemption Logic: Do they have an existing balance with this merchant?
  const existingReward = useMemo(() => {
    return rewards.find(r => r.vendorName === merchant.name);
  }, [rewards, merchant.name]);

  const rewardValue = useMemo(() => {
    if (!existingReward || existingReward.balance <= 0) return 0;
    return Math.min(existingReward.balance, total);
  }, [existingReward, total]);

  // Status from shared session
  const currentDiscount = splitSession?.discount || 0;
  const appliedBy = splitSession?.appliedBy || '';
  const isAppliedByMe = appliedBy === (user?.name || `Guest ${participantId.slice(0, 3)}`);

  const handleApply = () => {
    if (rewardValue > 0) {
      applySessionReward(rewardValue, user?.name || `Guest ${participantId.slice(0, 3)}`);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className={styles.rewardsWrapper}>
      {/* Sync Error Alert */}
      {syncError && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className={styles.syncError}
        >
          {syncError}
        </motion.div>
      )}

      {/* REDEMPTION Section */}
      {currentDiscount > 0 ? (
        <div className={`${styles.rewardBanner} ${styles.rewardBannerActive}`} style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Sparkles size={20} color="var(--brand-accent)" />
            <div className={styles.rewardBannerContent}>
              <div className={styles.rewardBannerText}>
                <strong>{formatCurrency(currentDiscount)} Reward Applied!</strong>
              </div>
              <div className={styles.rewardBannerSubtext}>
                Applied by {appliedBy}
              </div>
            </div>
          </div>
          {isAppliedByMe && (
            <Button variant="outline" size="small" onClick={removeSessionReward} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Remove
            </Button>
          )}
        </div>
      ) : rewardValue > 0 ? (
        <div className={styles.rewardBanner} style={{ justifyContent: 'space-between', border: '1px solid var(--brand-accent)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Gift size={20} color="var(--brand-accent)" />
            <div className={styles.rewardBannerContent}>
              <div className={styles.rewardBannerText}>
                <strong>{formatCurrency(rewardValue)} Balance Available</strong>
              </div>
              <div className={styles.rewardBannerSubtext}>
                Apply to this check to save for everyone
              </div>
            </div>
          </div>
          <Button variant="accent" size="small" onClick={handleApply}>
            Apply Now
          </Button>
        </div>
      ) : null}

      {/* EARNING Section (Only show if no discount is applied yet to keep it clean) */}
      {!currentDiscount && (
        <div className={`${styles.rewardBanner} ${styles.rewardBannerNext}`}>
          <Gift size={20} color="var(--brand-accent)" />
          <div className={styles.rewardBannerContent}>
            <div className={styles.rewardBannerText}>
              <strong>Earn Rewards</strong>
            </div>
            <div className={styles.rewardBannerSubtext}>
              Keep shopping to unlock your next cash back tier!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
