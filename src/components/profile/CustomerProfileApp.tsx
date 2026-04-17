import React, { useState } from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { WalletManager } from './WalletManager';
import { RewardsTracker } from './RewardsTracker';
import { RecentActivity } from './RecentActivity';
import { TransactionDetail } from './TransactionDetail';
import { BottomNav } from './BottomNav';
import { ProfileAuth } from './ProfileAuth';
import type { ProfileTab, Activity } from '../../types/profile';
import styles from './ProfileUI.module.css';
import { LogOut, ChevronLeft, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onExit: () => void;
}

export const CustomerProfileApp: React.FC<Props> = ({ onExit }) => {
  const { user, isAuthenticated, logout } = useCustomerProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  if (!isAuthenticated || !user) {
    return <ProfileAuth onExit={onExit} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WalletManager />
            <RewardsTracker />
            <RecentActivity onActivityClick={setSelectedActivity} />
            
            <footer style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xxl)' }}>
              <button 
                onClick={logout}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  width: '100%', 
                  padding: 'var(--spacing-md)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}
              >
                <LogOut size={18} /> Log Out
              </button>
            </footer>
          </motion.div>
        );
      case 'wallet':
        return (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WalletManager />
          </motion.div>
        );
      case 'rewards':
        return (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <RewardsTracker />
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div
            key="activity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <RecentActivity onActivityClick={setSelectedActivity} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.profileContainer}>
      <AnimatePresence>
        {!selectedActivity && (
          <motion.header 
            className={styles.header}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <button onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              <ChevronLeft size={20} />
              <span style={{ fontWeight: 600 }}>Back</span>
            </button>
            <h1 className={styles.title}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <button style={{ color: 'var(--text-secondary)' }}><Bell size={20} /></button>
              <motion.div 
                className={styles.avatar}
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ borderColor: 'var(--brand-accent)' }}
              >
                {user.avatar ? <img src={user.avatar} alt="User" /> : <User size={20} color="var(--text-muted)" />}
              </motion.div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!selectedActivity && isHeaderExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-secondary)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{user.name}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{user.email}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {!selectedActivity && renderContent()}
        </AnimatePresence>

        <AnimatePresence>
          {selectedActivity && (
            <TransactionDetail 
              activity={selectedActivity} 
              onClose={() => setSelectedActivity(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {!selectedActivity && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerProfileApp;
