import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { ShieldCheck, Landmark, ArrowRight, Wallet } from 'lucide-react';
import styles from './MerchantUI.module.css';

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

export const MerchantOnboarding: React.FC = () => {
  const { state, updateBank } = useMerchant();
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    bankName: NIGERIAN_BANKS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBank(formData);
  };

  if (state.bankAccount) {
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

        <Card title="Business Settlement" description="Where your funds arrive">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bank</span>
              <span style={{ fontWeight: 600 }}>{state.bankAccount.bankName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Number</span>
              <span style={{ fontWeight: 600 }}>{state.bankAccount.accountNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Name</span>
              <span style={{ fontWeight: 600 }}>{state.bankAccount.accountName}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.onboardingForm}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className={styles.title} style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Setup Terminal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your Nigerian bank account to start processing checks.</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <Select
          label="Select Bank"
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          options={NIGERIAN_BANKS.map(bank => ({ value: bank, label: bank }))}
        />

        <Input
          label="Account Number"
          type="text"
          placeholder="10 digit account number"
          maxLength={10}
          value={formData.accountNumber}
          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          required
        />

        <Input
          label="Account Name"
          type="text"
          placeholder="Name as it appears on bank"
          value={formData.accountName}
          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          required
        />

        <Button variant="accent" fullWidth size="large" type="submit">
          Verify & Link Account <ArrowRight size={18} style={{ marginLeft: '8px' }} />
        </Button>
      </form>

      <div style={{ marginTop: 'var(--spacing-xxl)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Why link an account?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Wallet size={20} color="var(--brand-accent)" />
            <span style={{ fontSize: '0.875rem' }}>Instant settlements into your Nigerian bank account.</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Landmark size={20} color="var(--brand-accent)" />
            <span style={{ fontSize: '0.875rem' }}>Supports all major banks and neo-banks in Nigeria.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
