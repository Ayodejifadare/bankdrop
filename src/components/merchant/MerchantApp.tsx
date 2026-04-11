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
import { MerchantAuth } from './MerchantAuth';
import { MerchantOnboarding } from './Onboarding';
import { MenuManager } from './Menu';
import { CheckManager } from './Checks';
import { InvoicesManager } from './Invoices';
import { QRManager } from './QRManager';
import { RewardsManager } from './Rewards';
import { ActionHub } from './ActionHub';
import { ProfileView } from './Profile';
import { ActivityLog } from './ActivityLog';
import { PaymentAlert } from './PaymentAlert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import styles from './MerchantUI.module.css';

// Dashboard Screen Component
const Dashboard: React.FC<{ onTabChange: (tab: number) => void; onViewAll: () => void }> = ({ onTabChange, onViewAll }) => {
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
        <button 
          className={styles.linktreeItem}
          style={{ flexDirection: 'column', gap: '8px' }}
          onClick={() => onTabChange(1)}
        >
          <BookOpen color="var(--brand-accent)" size={32} />
          <span>Edit Menu</span>
        </button>
        <button 
          className={styles.linktreeItem}
          style={{ flexDirection: 'column', gap: '8px' }}
          onClick={() => onTabChange(3)}
        >
          <QrCode color="var(--brand-accent)" size={32} />
          <span>View Terminal QR</span>
        </button>
      </div>

      <div style={{ marginTop: 'var(--spacing-xxl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
          <h3>Recent Activity</h3>
          <button 
            onClick={onViewAll}
            style={{ color: 'var(--brand-accent)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            View All
          </button>
        </div>
        
        {state.activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <p>No recent activity.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.activities.slice(0, 5).map(activity => (
              <Card key={activity.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{activity.title}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.subtitle}</p>
                  </div>
                  <span style={{ fontWeight: 700, color: '#4ade80' }}>+₦{activity.amount.toLocaleString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Layout Wrapper
export const MerchantApp: React.FC = () => {
  const { state, isAuthenticated } = useMerchant();
  const [activeTab, setActiveTab] = useState(0);
  const [isActionHubOpen, setIsActionHubOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState(false);
  const [viewActivityLog, setViewActivityLog] = useState(false);
  const [segmentView, setSegmentView] = useState<'checks' | 'invoices'>('checks');
  const [isBuildingInvoice, setIsBuildingInvoice] = useState(false);

  if (!isAuthenticated) {
    return <MerchantAuth />;
  }

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
    if (viewActivityLog) return <ActivityLog onBack={() => setViewActivityLog(false)} />;
    
    switch (activeTab) {
      case 0: return <Dashboard onTabChange={(tab) => setActiveTab(tab)} onViewAll={() => setViewActivityLog(true)} />;
      case 1: return <MenuManager />;
      case 2: 
        return segmentView === 'checks' ? <CheckManager /> : <InvoicesManager initialBuilding={isBuildingInvoice} onBuildingComplete={() => setIsBuildingInvoice(false)} />;
      case 3: return <QRManager />;
      case 4: return <RewardsManager />;
      default: return <Dashboard onTabChange={(tab) => setActiveTab(tab)} onViewAll={() => setViewActivityLog(true)} />;
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
            style={{ color: viewProfile ? 'var(--brand-accent)' : 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
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
