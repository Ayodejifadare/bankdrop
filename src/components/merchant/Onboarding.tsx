import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { ShieldCheck, ArrowRight, Wallet, Store, Briefcase } from 'lucide-react';
import styles from './MerchantUI.module.css';
import { motion, AnimatePresence } from 'framer-motion';

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

const BUSINESS_CATEGORIES = [
  'Food & Beverages',
  'Retail & Shopping',
  'Professional Services',
  'Health & Wellness',
  'Technology',
  'Logistics & Transport',
  'Education',
  'Entertainment',
  'Other',
];

export const MerchantOnboarding: React.FC = () => {
  const { state, addBankAccount, updateBusinessInfo } = useMerchant();
  const [step, setStep] = useState<'business' | 'bank'>(
    state.businessCategory ? 'bank' : 'business'
  );

  const [businessData, setBusinessData] = useState({
    name: state.name || '',
    category: state.businessCategory || BUSINESS_CATEGORIES[0],
    profile: state.businessProfile || '',
  });

  const [bankData, setBankData] = useState({
    accountNumber: '',
    accountName: '',
    bankName: NIGERIAN_BANKS[0],
  });

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessInfo(businessData);
    setStep('bank');
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBankAccount(bankData);
  };

  const primaryAccount = state.bankAccounts.find(acc => acc.isPrimary) || state.bankAccounts[0];

  if (state.bankAccounts.length > 0 && state.businessCategory) {
    return (
      <div className={styles.onboardingForm}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '20px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <ShieldCheck size={48} color="var(--brand-accent)" />
          </div>
          <h2 className={styles.title}>Account Verified</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You are ready to start receiving payments.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Card title="Business Profile" description="Your terminal identity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{state.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--brand-accent)', fontWeight: 500 }}>{state.businessCategory}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{state.businessProfile}</p>
            </div>
          </Card>

          <Card title="Primary Settlement" description="Where your funds arrive by default">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bank</span>
                <span style={{ fontWeight: 600 }}>{primaryAccount.bankName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Number</span>
                <span style={{ fontWeight: 600 }}>{primaryAccount.accountNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Name</span>
                <span style={{ fontWeight: 600 }}>{primaryAccount.accountName}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.onboardingForm}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className={styles.title} style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Setup Terminal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {step === 'business' ? 'Tell us about your business.' : 'Connect your Nigerian bank account to start processing checks.'}
        </p>
      </header>

      <div className={styles.stepIndicator}>
        <div className={`${styles.stepDot} ${step === 'business' ? styles.stepActive : styles.stepComplete}`} />
        <div className={styles.stepLine} />
        <div className={`${styles.stepDot} ${step === 'bank' ? styles.stepActive : ''}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === 'business' ? (
          <motion.form 
            key="business-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleBusinessSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
          >
            <Input
              label="Business Name"
              icon={<Store size={18} />}
              placeholder="e.g. Bankdrop Grill"
              value={businessData.name}
              onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
              required
            />

            <Select
              label="Business Category"
              value={businessData.category}
              onChange={(e) => setBusinessData({ ...businessData, category: e.target.value })}
              options={BUSINESS_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            />

            <div className={styles.inputGroup}>
              <label className={styles.label}>Business Profile</label>
              <textarea
                className={styles.textareaField}
                placeholder="Briefly describe what your business offers..."
                value={businessData.profile}
                onChange={(e) => setBusinessData({ ...businessData, profile: e.target.value })}
                required
                rows={4}
              />
            </div>

            <Button variant="accent" fullWidth size="large" type="submit">
              Continue to Bank Access <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </Button>
          </motion.form>
        ) : (
          <motion.form 
            key="bank-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleBankSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}
          >
            <div 
              onClick={() => setStep('business')} 
              style={{ color: 'var(--brand-accent)', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '-8px' }}
            >
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to business info
            </div>

            <Select
              label="Select Bank"
              value={bankData.bankName}
              onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
              options={NIGERIAN_BANKS.map(bank => ({ value: bank, label: bank }))}
            />

            <Input
              label="Account Number"
              type="text"
              placeholder="10 digit account number"
              maxLength={10}
              value={bankData.accountNumber}
              onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
              required
            />

            <Input
              label="Account Name"
              type="text"
              placeholder="Name as it appears on bank"
              value={bankData.accountName}
              onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
              required
            />

            <Button variant="accent" fullWidth size="large" type="submit">
              Verify & Link Account <ShieldCheck size={18} style={{ marginLeft: '8px' }} />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={{ marginTop: 'var(--spacing-xxl)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Why Bankdrop?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Wallet size={20} color="var(--brand-accent)" />
            <span style={{ fontSize: '0.875rem' }}>Instant settlements into your Nigerian bank account.</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Briefcase size={20} color="var(--brand-accent)" />
            <span style={{ fontSize: '0.875rem' }}>Professional business profile visible to customers.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
