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
import type { Invoice, MerchantView } from '../../types/merchant';
import { MerchantAuth } from './MerchantAuth';
import { MerchantOnboarding } from './Onboarding';
import { MenuManager } from './Menu';
import { CheckManager } from './Checks';
import { InvoicesManager } from './Invoices';
import { QRManager } from './QRManager';
import { RewardsManager } from './Rewards';
import { ActionHub } from './ActionHub';
import { ProfileView } from './Profile';
import { SettingsView } from './Settings';
import { CheckSettings } from './CheckSettings';
import { ActivityLog } from './ActivityLog';
import { InvoiceBuilder } from './InvoiceBuilder';
import { PaymentAlert } from './PaymentAlert';
import { NotificationCenter } from './NotificationCenter';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import styles from './MerchantUI.module.css';

// Dashboard Screen Component
const Dashboard: React.FC<{ 
  onTabChange: (tab: number) => void; 
  onViewAll: () => void;
  onOpenNotifications: () => void;
}> = ({ onTabChange, onViewAll, onOpenNotifications }) => {
  const { state } = useMerchant();
  const activeChecks = state.checks.filter(c => c.status === 'active').length;
  const totalToday = state.checks.reduce((acc, c) => acc + (c.status === 'paid' ? c.total : 0), 0);
  const pendingVerifications = state.pendingVerifications?.filter(v => v.status === 'pending') || [];

  return (
    <div className={styles.merchantApp}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '1.75rem' }}>Welcome, {state.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Today's overview - ₦{totalToday.toLocaleString()}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={onOpenNotifications}
          >
            <Bell size={24} />
            {pendingVerifications.length > 0 && (
              <span className={styles.notificationBadge}>{pendingVerifications.length}</span>
            )}
          </motion.div>
        </div>
      </header>

      {pendingVerifications.length > 0 && (
        <Card 
          style={{ 
            marginBottom: 'var(--spacing-lg)', 
            border: '2px solid var(--brand-accent)',
            background: 'rgba(212, 175, 55, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={20} color="var(--brand-accent)" />
              <div>
                <div style={{ fontWeight: 700 }}>{pendingVerifications.length} Pending Verifications</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action required for customer payments</p>
              </div>
            </div>
            <Button size="small" variant="primary" onClick={onOpenNotifications}>View</Button>
          </div>
        </Card>
      )}

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

// Helper: map tab index to MerchantView
const TAB_VIEWS: MerchantView[] = ['dashboard', 'menu', 'checks', 'qr', 'rewards'];

// Helper: map MerchantView to tab index (returns -1 for overlay views)
const viewToTab = (view: MerchantView): number => {
  const idx = TAB_VIEWS.indexOf(view);
  return idx >= 0 ? idx : -1;
};

// Main Layout Wrapper
export const MerchantApp: React.FC = () => {
  const { state, isAuthenticated } = useMerchant();
  const [currentView, setCurrentView] = useState<MerchantView>('dashboard');
  const [isActionHubOpen, setIsActionHubOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [segmentView, setSegmentView] = useState<'checks' | 'invoices'>('checks');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);

  // Derived state
  const activeTabIndex = viewToTab(currentView);
  const isOverlayView = activeTabIndex === -1; // profile, settings, activity_log, invoice_builder
  const showChrome = currentView !== 'invoice_builder'; // hide header for full-screen builder

  if (!isAuthenticated) {
    return <MerchantAuth />;
  }

  // If business info or bank info isn't linked, force onboarding
  if (state.bankAccounts.length === 0 || !state.businessCategory) {
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

  const navigateTo = (view: MerchantView) => {
    setCurrentView(view);
  };

  const navigateToTab = (tabIndex: number) => {
    setCurrentView(TAB_VIEWS[tabIndex] || 'dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'invoice_builder':
        return (
          <InvoiceBuilder 
            initialData={editingInvoice}
            onClose={() => { 
              setCurrentView('checks');
              setSegmentView('invoices');
              setEditingInvoice(null); 
            }} 
          />
        );
      case 'settings':
        return <SettingsView onBack={() => setCurrentView('profile')} />;
      case 'profile':
        return (
          <ProfileView 
            onBack={() => setCurrentView('dashboard')} 
            onOpenSettings={() => navigateTo('settings')}
          />
        );
      case 'activity_log':
        return <ActivityLog onBack={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return (
          <Dashboard 
            onTabChange={navigateToTab} 
            onViewAll={() => navigateTo('activity_log')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
      case 'menu':
        return <MenuManager initialAdding={isAddingMenuItem} onAddingComplete={() => setIsAddingMenuItem(false)} />;
      case 'check_settings':
        return <CheckSettings onBack={() => setCurrentView('checks')} />;
      case 'checks':
        return segmentView === 'checks' ? (
          <CheckManager onOpenSettings={() => navigateTo('check_settings')} />
        ) : (
          <InvoicesManager 
            onStartBuilding={() => {
              setEditingInvoice(null);
              navigateTo('invoice_builder');
            }} 
            onEditInvoice={(inv) => {
              setEditingInvoice(inv);
              navigateTo('invoice_builder');
            }}
          />
        );
      case 'qr':
        return <QRManager />;
      case 'rewards':
        return <RewardsManager initialAdding={isAddingReward} onAddingComplete={() => setIsAddingReward(false)} />;
      default:
        return (
          <Dashboard 
            onTabChange={navigateToTab} 
            onViewAll={() => navigateTo('activity_log')} 
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        );
    }
  };

  return (
    <div className={styles.merchantLayout}>
      {showChrome && (
        <div className={styles.header}>
        {currentView === 'checks' && !isOverlayView ? (
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
          <div className={styles.title} onClick={() => navigateTo('dashboard')} style={{ cursor: 'pointer' }}>
            BANKDROP TERMINAL
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigateTo('profile')}
            style={{ color: currentView === 'profile' ? 'var(--brand-accent)' : 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <User size={24} />
          </motion.button>
        </div>
      </div>
      )}

      <div className={currentView === 'invoice_builder' ? styles.contentFull : styles.content}>
        {renderContent()}
      </div>

      {!isOverlayView && (
        <motion.button 
          className={styles.fab}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActionHubOpen(true)}
        >
          <Plus size={32} />
        </motion.button>
      )}

      {!isOverlayView && (
        <div className={styles.bottomNav}>
          <div 
            className={`${styles.navItem} ${currentView === 'dashboard' ? styles.active : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <LayoutDashboard size={24} className={styles.navIcon} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'menu' ? styles.active : ''}`}
            onClick={() => navigateTo('menu')}
          >
            <BookOpen size={24} className={styles.navIcon} />
            <span>Menu</span>
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'checks' ? styles.active : ''}`}
            onClick={() => { 
              navigateTo('checks'); 
              setSegmentView('checks');
            }}
          >
            <CreditCard size={24} className={styles.navIcon} />
            <span>Checks</span>
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'qr' ? styles.active : ''}`}
            onClick={() => navigateTo('qr')}
          >
            <QrCode size={24} className={styles.navIcon} />
            <span>QR</span>
          </div>
          <div 
            className={`${styles.navItem} ${currentView === 'rewards' ? styles.active : ''}`}
            onClick={() => navigateTo('rewards')}
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
          navigateToTab(tab);
          if (action === 'new-invoice') {
            setSegmentView('invoices');
            setCurrentView('invoice_builder');
          } else if (action === 'add-menu-item') {
            setIsAddingMenuItem(true);
          } else if (action === 'create-reward') {
            setIsAddingReward(true);
          } else if (action === 'new-check') {
            setSegmentView('checks');
          }
        }}
      />
      <PaymentAlert />
      <NotificationCenter 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  );
};

export default MerchantApp;
