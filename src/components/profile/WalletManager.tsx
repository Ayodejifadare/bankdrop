import React, { useState } from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import type { LinkedAccount } from '../../types/profile';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './ProfileUI.module.css';
import { Plus, Landmark, Smartphone, ChevronRight, X, ShieldCheck, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

export const WalletManager: React.FC = () => {
  const { wallet, linkAccount } = useCustomerProfile();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  const activeAccount = wallet[selectedAccountIndex] || wallet[0];

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Wallet</h2>
        <Button variant="secondary" size="small" onClick={() => setShowLinkModal(true)}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Link Account
        </Button>
      </div>

      {wallet.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <Landmark size={32} color="var(--text-muted)" style={{ marginBottom: 'var(--spacing-md)' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>No bank accounts linked.</p>
          <Button variant="outline" onClick={() => setShowLinkModal(true)}>Get Started</Button>
        </div>
      ) : (
        <>
          <div className={styles.walletCarousel}>
            {wallet.map((account, idx) => (
              <div 
                key={account.id} 
                className={styles.accountCard}
                onClick={() => setSelectedAccountIndex(idx)}
              >
                <Card 
                  variant={selectedAccountIndex === idx ? 'elevated' : 'default'}
                  title={account.bankName}
                  description={account.accountNumber}
                >
                  <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₦{account.balance.toLocaleString()}</div>
                  </div>
                  {account.isPrimary && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      fontSize: '0.625rem', 
                      backgroundColor: 'rgba(181, 153, 82, 0.1)', 
                      color: 'var(--brand-accent)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      PRIMARY
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>

          {activeAccount && (
            <div className={styles.accountWidget}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>Account Widget</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan to initiate P2P payment to this account</p>
              </div>

              <div className={styles.qrContainer}>
                <QRCodeSVG 
                  value={`bankdrop://pay/account/${activeAccount.accountNumber}`}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', width: '100%' }}>
                <Button variant="secondary" fullWidth size="small">
                  <Download size={14} style={{ marginRight: '6px' }} /> Save Asset
                </Button>
                <Button variant="accent" fullWidth size="small">
                  <Smartphone size={14} style={{ marginRight: '6px' }} /> Add to Homescreen
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showLinkModal && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
              <h3 className={styles.title}>Link Account</h3>
              <button onClick={() => setShowLinkModal(false)}><X size={24} /></button>
            </div>

            <LinkForm onComplete={(data) => {
              linkAccount(data);
              setShowLinkModal(false);
            }} />
          </div>
        </div>
      )}
    </section>
  );
};

const LinkForm: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    bankName: NIGERIAN_BANKS[0],
    accountNumber: '',
    accountName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label className={styles.label}>Select Bank</label>
        <select 
          className={styles.input}
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
        >
          {NIGERIAN_BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Account Number</label>
        <input 
          type="text" 
          className={styles.input} 
          placeholder="10 digit account number"
          maxLength={10}
          value={formData.accountNumber}
          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Account Name</label>
        <input 
          type="text" 
          className={styles.input} 
          placeholder="Verified full name"
          value={formData.accountName}
          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          required
        />
      </div>

      <Button variant="accent" fullWidth size="large" type="submit" style={{ marginTop: 'var(--spacing-md)' }}>
        Verify & Link <ChevronRight size={18} style={{ marginLeft: '8px' }} />
      </Button>
      
      <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck size={14} color="var(--brand-accent)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Securely linked via Bankdrop Verification</span>
      </div>
    </form>
  );
};
