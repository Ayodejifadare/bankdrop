import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  User, 
  QrCode,
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
import { Dashboard } from './Dashboard';
import { motion } from 'framer-motion';
import styles from './MerchantUI.module.css';


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
