import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { 
  Building2, 
  ExternalLink, 
  HelpCircle, 
  Settings, 
  CreditCard,
  LogOut,
  ChevronRight,
  Shield
} from 'lucide-react';
import styles from './MerchantUI.module.css';
import { motion } from 'framer-motion';

interface ProfileProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileProps> = ({ onBack }) => {
  const { state, logout } = useMerchant();

  const links = [
    { label: 'View Public Menu', icon: <ExternalLink size={20} /> },
    { label: 'Merchant Settings', icon: <Settings size={20} /> },
    { label: 'Security & Two-Factor', icon: <Shield size={20} /> },
    { label: 'Business Support', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className={styles.profileContainer}>
      <header style={{ width: '100%', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ color: 'var(--text-secondary)' }}>Back</button>
          <h2 style={{ fontSize: '1.25rem' }}>Merchant Account</h2>
          <button 
            onClick={logout}
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <motion.div 
        className={styles.profileAvatar}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {state.name.charAt(0)}
      </motion.div>
      
      <h1 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{state.name}</h1>
      <p className={styles.profileHandle}>merchant.bankdrop.io/{state.name.toLowerCase().replace(/\s+/g, '-')}</p>

      <div className={styles.bankCheckCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>LINKED SETTLEMENT BANK</span>
          <CreditCard size={14} color="var(--brand-accent)" />
        </div>
        <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '4px' }}>{state.bankAccount?.bankName}</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>{state.bankAccount?.accountName}</div>
        <div style={{ fontSize: '1rem', fontVariantNumeric: 'tabular-nums', marginTop: '8px', letterSpacing: '0.1em' }}>
          **** {state.bankAccount?.accountNumber.slice(-4)}
        </div>
      </div>

      <div className={styles.linktreeList}>
        {links.map((link, i) => (
          <motion.div
            key={link.label}
            className={styles.linktreeItem}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {link.icon}
            <span style={{ flex: 1 }}>{link.label}</span>
            <ChevronRight size={18} style={{ opacity: 0.4 }} />
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--spacing-xxl)', width: '100%', opacity: 0.4, fontSize: '0.75rem' }}>
        <Building2 size={32} style={{ margin: '0 auto 8px' }} />
        <p>Verified Business Account</p>
        <p>Merchant ID: BD-{Math.floor(Math.random() * 90000) + 10000}</p>
      </div>
    </div>
  );
};
