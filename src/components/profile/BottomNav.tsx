import React from 'react';
import { motion } from 'framer-motion';
import { User, Wallet, Gift, Clock } from 'lucide-react';
import styles from './ProfileUI.module.css';

import type { ProfileTab } from '../../types/profile';

interface Props {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
  { id: 'rewards' as const, label: 'Rewards', icon: Gift },
  { id: 'activity' as const, label: 'Activity', icon: Clock },
];

export const BottomNav: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <nav className={styles.bottomNav}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`${styles.navItem} ${activeTab === id ? styles.navItemActive : ''}`}
          onClick={() => onTabChange(id)}
        >
          <div className={styles.navIconWrapper}>
            <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
            {activeTab === id && (
              <motion.div
                layoutId="activeDot"
                className={styles.activeDot}
              />
            )}
          </div>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};
