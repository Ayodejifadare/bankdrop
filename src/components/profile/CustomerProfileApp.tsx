import React from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import { WalletManager } from './WalletManager';
import { RewardsTracker } from './RewardsTracker';
import { RecentActivity } from './RecentActivity';
import styles from './ProfileUI.module.css';
import { LogOut, ChevronLeft, User, Bell } from 'lucide-react';

interface Props {
  onExit: () => void;
}

export const CustomerProfileApp: React.FC<Props> = ({ onExit }) => {
  const { user } = useCustomerProfile();

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <button onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={20} />
          <span style={{ fontWeight: 600 }}>Back</span>
        </button>
        <h1 className={styles.title}>Profile</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button style={{ color: 'var(--text-secondary)' }}><Bell size={20} /></button>
          <div className={styles.avatar}>
            {user.avatar ? <img src={user.avatar} alt="User" /> : <User size={20} color="var(--text-muted)" />}
          </div>
        </div>
      </header>

      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-secondary)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{user.name}</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{user.email}</p>
      </div>

      <WalletManager />
      <RewardsTracker />
      <RecentActivity />

      <footer style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xxl)' }}>
        <button 
          onClick={onExit}
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
    </div>
  );
};

export default CustomerProfileApp;
