import React, { useEffect, useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { useCustomer } from '../../context/CustomerContext';
import { Gift, Sparkles, TrendingUp } from 'lucide-react';
import styles from './CustomerUI.module.css';

interface Props {
  total: number;
  onDiscountChange: (discount: number) => void;
}

export const RewardsBanner: React.FC<Props> = ({ total, onDiscountChange }) => {
  const { state: merchant } = useMerchant();
  const { isSignedIn, applyReward } = useCustomer();

  const { bestReward, nextReward } = useMemo(() => {
    const active = merchant.rewards.filter(r => r.status === 'active');
    
    const eligible = active
      .filter(r => total >= (r.minSpend ?? 0))
      .map(r => ({
        ...r,
        actualDiscount: r.rewardUnit === 'cash' ? (r.rewardValue ?? 0) : Math.round(total * ((r.rewardValue ?? 0) / 100))
      }))
      .sort((a, b) => b.actualDiscount - a.actualDiscount);

    const best = eligible[0] || null;

    const locked = active
      .filter(r => total < (r.minSpend ?? 0))
      .sort((a, b) => (a.minSpend ?? 0) - (b.minSpend ?? 0));

    return { bestReward: best, nextReward: locked[0] || null };
  }, [merchant.rewards, total]);

  useEffect(() => {
    if (bestReward) {
      applyReward(bestReward.id);
      onDiscountChange(bestReward.actualDiscount);
    } else {
      applyReward(null);
      onDiscountChange(0);
    }
  }, [bestReward, applyReward, onDiscountChange]);

  if (!isSignedIn || merchant.rewards.length === 0) return null;

  return (
    <div className={styles.rewardsWrapper}>
      {bestReward && (
        <div className={`${styles.rewardBanner} ${styles.rewardBannerActive}`}>
          <Sparkles size={20} color="var(--brand-accent)" />
          <div className={styles.rewardBannerContent}>
            <div className={styles.rewardBannerText}>
              <strong>{bestReward.title} Applied!</strong>
            </div>
            <div className={styles.rewardBannerSubtext}>
              You're saving ₦{(bestReward.actualDiscount ?? 0).toLocaleString()} on this visit
            </div>
          </div>
        </div>
      )}

      {nextReward && (
        <div className={`${styles.rewardBanner} ${styles.rewardBannerNext}`}>
          <TrendingUp size={20} color="var(--text-muted)" />
          <div className={styles.rewardBannerContent}>
            <div className={styles.rewardBannerText}>
              Spend ₦{((nextReward.minSpend ?? 0) - total).toLocaleString()} more to unlock 
              <strong> {nextReward.title}</strong>
            </div>
            <div className={styles.rewardBannerSubtext}>
              {nextReward.rewardUnit === 'cash' ? `₦${nextReward.rewardValue ?? 0}` : `${nextReward.rewardValue ?? 0}%`} cash back value
            </div>
          </div>
        </div>
      )}

      {!bestReward && !nextReward && (
        <div className={styles.rewardBanner}>
          <Gift size={20} color="var(--text-muted)" />
          <span className={styles.rewardBannerText}>
            No active rewards available right now.
          </span>
        </div>
      )}
    </div>
  );
};
