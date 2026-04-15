import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { 
  Building2, 
  ExternalLink, 
  HelpCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import styles from './MerchantUI.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';

const NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTB)',
  'United Bank for Africa (UBA)',
  'Zenith Bank',
  'Stanbic IBTC',
  'Kuda Bank',
  'OPay',
  'Moniepoint',
];

interface ProfileProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileProps> = ({ onBack }) => {
  const { state, logout, addBankAccount, removeBankAccount, setPrimaryBankAccount } = useMerchant();
  const [showAddAccount, setShowAddAccount] = React.useState(false);
  const [isBankStackExpanded, setIsBankStackExpanded] = React.useState(false);
  const [newBank, setNewBank] = React.useState({
    bankName: NIGERIAN_BANKS[0],
    accountNumber: '',
    accountName: '',
  });

  // Sort primary to top
  const sortedAccounts = [...state.bankAccounts].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return 0;
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    addBankAccount(newBank);
    setShowAddAccount(false);
    setIsBankStackExpanded(true); // Auto expand to show new account
    setNewBank({
      bankName: NIGERIAN_BANKS[0],
      accountNumber: '',
      accountName: '',
    });
  };

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
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
        <span className={styles.rewardCategory} style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--brand-accent)' }}>
          {state.businessCategory || 'Merchant'}
        </span>
      </div>
      
      {state.businessProfile && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '300px', 
          margin: '0 auto var(--spacing-xxl)',
          lineHeight: 1.6 
        }}>
          {state.businessProfile}
        </p>
      )}

      <p className={styles.profileHandle}>merchant.bankdrop.io/{state.name.toLowerCase().replace(/\s+/g, '-')}</p>

      <div style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Linked Accounts</h3>
          <button 
            onClick={() => setShowAddAccount(true)}
            style={{ color: 'var(--brand-accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Add New
          </button>
        </div>

        <div className={`${styles.bankAccountStack} ${isBankStackExpanded ? styles.accountStackExpanded : ''}`}>
          {sortedAccounts.map((acc, idx) => (
            <motion.div 
              key={acc.id} 
              className={`${styles.bankCheckCard} ${styles.bankCardStacked} ${acc.isPrimary ? styles.bankCardPrimary : ''}`}
              onClick={() => setIsBankStackExpanded(!isBankStackExpanded)}
              style={{ zIndex: sortedAccounts.length - idx }}
              whileHover={!isBankStackExpanded ? { y: -10 } : {}}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {acc.isPrimary ? (
                    <span style={{ fontSize: '0.625rem', padding: '2px 6px', backgroundColor: 'var(--brand-accent)', color: '#000', borderRadius: '4px', fontWeight: 800 }}>PRIMARY</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>SETTLEMENT BANK</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!acc.isPrimary && isBankStackExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPrimaryBankAccount(acc.id); }}
                      style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Set as Primary"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  {state.bankAccounts.length > 1 && isBankStackExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeBankAccount(acc.id); }}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                      title="Remove Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '4px' }}>{acc.bankName}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>{acc.accountName}</div>
              <div style={{ fontSize: '1rem', fontVariantNumeric: 'tabular-nums', marginTop: '8px', letterSpacing: '0.1em' }}>
                **** {acc.accountNumber.slice(-4)}
              </div>
            </motion.div>
          ))}
          
          {state.bankAccounts.length > 1 && !isBankStackExpanded && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: 'var(--spacing-md)', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }} onClick={() => setIsBankStackExpanded(true)}>
              + {state.bankAccounts.length - 1} more accounts. Tap to manage.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddAccount && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={styles.addAccountOverlay}
          >
            <div className={styles.addAccountCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ margin: 0 }}>Add Bank Account</h3>
                <button onClick={() => setShowAddAccount(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <Select
                  label="Select Bank"
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  options={NIGERIAN_BANKS.map(bank => ({ value: bank, label: bank }))}
                />
                <Input
                  label="Account Number"
                  maxLength={10}
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  placeholder="10 digit account number"
                  required
                />
                <Input
                  label="Account Name"
                  value={newBank.accountName}
                  onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                  placeholder="Enter full account name"
                  required
                />
                <Button variant="accent" fullWidth type="submit" style={{ marginTop: 'var(--spacing-md)' }}>
                  Save Account
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* eslint-disable-next-line react-hooks/purity */}
        <p>Merchant ID: BD-{Math.floor(Math.random() * 90000) + 10000}</p>
      </div>
    </div>
  );
};
