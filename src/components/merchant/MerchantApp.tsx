import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  User, 
  QrCode,
  Bell,
  Plus,
  Gift
} from 'lucide-react';
import { useMerchant } from '../../context/MerchantContext';
import { MerchantOnboarding } from './Onboarding';
import { MenuManager } from './Menu';
import { CheckManager } from './Checks';
import { InvoicesManager } from './Invoices';
import { QRManager } from './QRManager';
import { RewardsManager } from './Rewards';
import { ActionHub } from './ActionHub';
import { ProfileView } from './Profile';
import { PaymentAlert } from './PaymentAlert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import styles from './MerchantUI.module.css';

// Dashboard Screen Component
const Dashboard: React.FC<{ onTabChange: (tab: number) => void }> = ({ onTabChange }) => {
  const { state } = useMerchant();
  const activeChecks = state.checks.filter(c => c.status === 'active').length;
  const totalToday = state.checks.reduce((acc, c) => acc + (c.status === 'paid' ? c.total : 0), 0);

  return (
    <div className={styles.merchantApp}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '1.75rem' }}>Welcome, {state.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Today's overview - ₦{totalToday.toLocaleString()}</p>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Bell size={24} style={{ cursor: 'pointer' }} />
          </motion.div>
        </div>
      </header>

      <div className={styles.statsContainer}>
        <Card title="Active Checks">
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-accent)' }}>{activeChecks}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Orders in progress</p>
        </Card>
        <Card title="Revenue (Today)">
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-primary)' }}>₦{totalToday.toLocaleString()}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Settled payments</p>
        </Card>
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Quick Actions</h3>
      <div className={styles.quickActionGrid}>
        <Button 
          variant="secondary" 
          fullWidth 
          style={{ minHeight: '100px', flexDirection: 'column', gap: '8px' }}
          onClick={() => onTabChange(1)}
        >
          <BookOpen color="var(--brand-accent)" size={32} />
          <span>Edit Menu</span>
        </Button>
        <Button 
          variant="secondary" 
          fullWidth 
          style={{ minHeight: '100px', flexDirection: 'column', gap: '8px' }}
          onClick={() => onTabChange(3)}
        >
          <QrCode color="var(--brand-accent)" size={32} />
          <span>View Terminal QR</span>
        </Button>
      </div>

      <div style={{ marginTop: 'var(--spacing-xxl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
          <h3>Recent Activity</h3>
          <span style={{ color: 'var(--brand-accent)', fontSize: '0.875rem' }}>View All</span>
        </div>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Guest #142</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>New Order on Check 23</p>
            </div>
            <span style={{ fontWeight: 600 }}>₦12,500</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Main Layout Wrapper
export const MerchantApp: React.FC = () => {
  const { state } = useMerchant();
  const [activeTab, setActiveTab] = useState(0);
  const [isActionHubOpen, setIsActionHubOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState(false);
  const [segmentView, setSegmentView] = useState<'checks' | 'invoices'>('checks');
  const [isBuildingInvoice, setIsBuildingInvoice] = useState(false);

  // If bank info isn't linked, force onboarding
  if (!state.bankAccount) {
    return (
      <div className={styles.merchantLayout}>
        <div className={styles.header}>
          <div className={styles.title}>BANKDROP MERCHANT</div>
        </div>
        <div className={styles.content}>
          <MerchantOnboarding />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (viewProfile) return <ProfileView onBack={() => setViewProfile(false)} />;
    
    switch (activeTab) {
      case 0: return <Dashboard onTabChange={(tab) => setActiveTab(tab)} />;
      case 1: return <MenuManager />;
      case 2: 
        return segmentView === 'checks' ? <CheckManager /> : <InvoicesManager initialBuilding={isBuildingInvoice} onBuildingComplete={() => setIsBuildingInvoice(false)} />;
      case 3: return <QRManager />;
      case 4: return <RewardsManager />;
      default: return <Dashboard onTabChange={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className={styles.merchantLayout}>
      <div className={styles.header}>
        {activeTab === 2 && !viewProfile ? (
          <div className={styles.headerSegment}>
            <button 
              className={`${styles.segmentBtn} ${segmentView === 'checks' ? styles.segmentBtnActive : ''}`}
              onClick={() => setSegmentView('checks')}
            >
              Checks
            </button>
            <button 
              className={`${styles.segmentBtn} ${segmentView === 'invoices' ? styles.segmentBtnActive : ''}`}
              onClick={() => setSegmentView('invoices')}
            >
              Invoices
            </button>
          </div>
        ) : (
          <div className={styles.title} onClick={() => { setActiveTab(0); setViewProfile(false); }} style={{ cursor: 'pointer' }}>
            BANKDROP TERMINAL
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setViewProfile(true)}
            style={{ color: viewProfile ? 'var(--brand-accent)' : 'var(--text-primary)' }}
          >
            <User size={24} />
          </motion.button>
        </div>
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>

      {!viewProfile && (
        <motion.button 
          className={styles.fab}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActionHubOpen(true)}
        >
          <Plus size={32} />
        </motion.button>
      )}

      {!viewProfile && (
        <div className={styles.bottomNav}>
          <div 
            className={`${styles.navItem} ${activeTab === 0 ? styles.active : ''}`}
            onClick={() => setActiveTab(0)}
          >
            <LayoutDashboard size={24} className={styles.navIcon} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 1 ? styles.active : ''}`}
            onClick={() => setActiveTab(1)}
          >
            <BookOpen size={24} className={styles.navIcon} />
            <span>Menu</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 2 ? styles.active : ''}`}
            onClick={() => setActiveTab(2)}
          >
            <CreditCard size={24} className={styles.navIcon} />
            <span>Checks</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 3 ? styles.active : ''}`}
            onClick={() => setActiveTab(3)}
          >
            <QrCode size={24} className={styles.navIcon} />
            <span>QR</span>
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 4 ? styles.active : ''}`}
            onClick={() => setActiveTab(4)}
          >
            <Gift size={24} className={styles.navIcon} />
            <span>Rewards</span>
          </div>
        </div>
      )}

      <ActionHub 
        isOpen={isActionHubOpen} 
        onClose={() => setIsActionHubOpen(false)} 
        onAction={(tab, action) => {
          setActiveTab(tab);
          setViewProfile(false);
          if (action === 'new-invoice') {
            setSegmentView('invoices');
            setIsBuildingInvoice(true);
          }
        }}
      />
      <PaymentAlert />
    </div>
  );
};

export default MerchantApp;
