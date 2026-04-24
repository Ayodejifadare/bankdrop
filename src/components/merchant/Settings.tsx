import React, { useState } from 'react';
import { 
  Building2, 
  ChevronLeft, 
  Smartphone, 
  Monitor, 
  Lock, 
  ChevronRight
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import styles from './MerchantUI.module.css';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface SettingsProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({ onBack }) => {
  const { state, updateBusinessInfo, updateContactInfo, updatePreferences } = useMerchant();
  
  const [businessData, setBusinessData] = useState({
    name: state.name,
    profile: state.businessProfile || '',
    category: state.businessCategory || ''
  });

  const [contactData, setContactData] = useState({
    email: state.contactInfo?.email || '',
    mobile: state.contactInfo?.mobile || ''
  });

  const [prefs, setPrefs] = useState({
    notifications: state.preferences.notifications,
    autoPrintReceipts: state.preferences.autoPrintReceipts
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateBusinessInfo(businessData);
    updateContactInfo(contactData);
    updatePreferences(prefs);
    
    setIsSaving(false);
    onBack();
  };

  return (
    <div className={styles.merchantApp} style={{ paddingBottom: 'var(--spacing-xxl)' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title} style={{ fontSize: '1.5rem' }}>Merchant Settings</h1>
        </div>
      </header>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', opacity: 0.7, paddingLeft: '4px' }}>
            <Building2 size={16} />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Identity</h3>
          </div>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input 
                label="Business Name"
                value={businessData.name}
                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
              />
              <Select 
                label="Business Category"
                value={businessData.category}
                onChange={(e) => setBusinessData({ ...businessData, category: e.target.value })}
                options={[
                  { value: 'Food & Beverages', label: 'Food & Beverages' },
                  { value: 'Retail', label: 'Retail' },
                  { value: 'Services', label: 'Services' },
                  { value: 'Hospitality', label: 'Hospitality' }
                ]}
              />
              <div className={styles.inputGroup}>
                <label className={styles.label}>Business Bio</label>
                <textarea 
                  className={styles.textareaField}
                  rows={3}
                  value={businessData.profile}
                  onChange={(e) => setBusinessData({ ...businessData, profile: e.target.value })}
                  placeholder="Describe your business to customers..."
                />
              </div>
            </div>
          </Card>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', opacity: 0.7, paddingLeft: '4px' }}>
            <Smartphone size={16} />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</h3>
          </div>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Input 
                label="Public Email"
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
              />
              <Input 
                label="Public Mobile"
                value={contactData.mobile}
                onChange={(e) => setContactData({ ...contactData, mobile: e.target.value })}
              />
            </div>
          </Card>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', opacity: 0.7, paddingLeft: '4px' }}>
            <Monitor size={16} />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terminal Preferences</h3>
          </div>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <Select 
                label="Notification Sounds"
                value={prefs.notifications ? 'on' : 'off'}
                onChange={(e) => setPrefs({ ...prefs, notifications: e.target.value === 'on' })}
                options={[
                  { value: 'on', label: 'Enabled' },
                  { value: 'off', label: 'Disabled' }
                ]}
              />
              <Select 
                label="Auto-Print Receipts"
                value={prefs.autoPrintReceipts ? 'on' : 'off'}
                onChange={(e) => setPrefs({ ...prefs, autoPrintReceipts: e.target.value === 'on' })}
                options={[
                  { value: 'on', label: 'Always' },
                  { value: 'off', label: 'Manually' }
                ]}
              />
            </div>
          </Card>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)', opacity: 0.7, paddingLeft: '4px' }}>
            <Lock size={16} />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advanced</h3>
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <button 
              type="button"
              className={styles.linktreeItem} 
              style={{ border: 'none', background: 'none', borderRadius: 0, padding: 'var(--spacing-lg)' }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>Reset Terminal PIN</div>
                <p style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 400 }}>Change your 6-digit access code</p>
              </div>
              <ChevronRight size={18} opacity={0.4} />
            </button>
          </Card>
        </section>

        <Button 
          variant="accent" 
          fullWidth 
          type="submit" 
          disabled={isSaving}
          style={{ marginTop: 'var(--spacing-lg)', height: '56px', fontSize: '1rem' }}
        >
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
};
