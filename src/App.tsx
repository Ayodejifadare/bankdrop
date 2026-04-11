import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Lazy load the main applications
const MerchantApp = lazy(() => import('./components/merchant/MerchantApp'));
const CustomerApp = lazy(() => import('./components/customer/CustomerApp'));
const CustomerProfileApp = lazy(() => import('./components/profile/CustomerProfileApp'));

import { CustomerProfileProvider } from './context/CustomerProfileContext';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ShieldCheck, 
  Zap,
  Terminal,
  ScanLine
} from 'lucide-react';
import styles from './App.module.css';

type AppView = 'landing' | 'merchant' | 'customer' | 'profile';

function parseHash(): { view: AppView; checkId?: string; invoiceId?: string } {
  const hash = window.location.hash;
  
  // #/check/3
  const checkMatch = hash.match(/^#\/check\/([\w-]+)$/);
  if (checkMatch) return { view: 'customer', checkId: checkMatch[1] };

  // #/pay/INV-1234
  const invoiceMatch = hash.match(/^#\/pay\/([\w-]+)$/);
  if (invoiceMatch) return { view: 'customer', invoiceId: invoiceMatch[1] };

  if (hash === '#/merchant') return { view: 'merchant' };
  if (hash === '#/profile') return { view: 'profile' };
  return { view: 'landing' };
}

const App: React.FC = () => {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  // ---- Merchant Terminal ----
  if (route.view === 'merchant') {
    return (
      <div className={styles.app} style={{ height: '100vh', overflow: 'hidden' }}>
        <Suspense fallback={<LoadingScreen />}>
          <MerchantApp />
        </Suspense>
        <button 
          onClick={() => navigate('')}
          style={{
            position: 'fixed',
            top: '12px',
            right: '80px',
            zIndex: 10000,
            padding: '6px 12px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          Exit Terminal
        </button>
      </div>
    );
  }

  // ---- Customer Checkout ----
  if (route.view === 'customer' && (route.checkId || route.invoiceId)) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CustomerApp
          checkId={route.checkId || ''}
          invoiceId={route.invoiceId}
          onExit={() => navigate('')}
        />
      </Suspense>
    );
  }

  // ---- Customer Profile ----
  if (route.view === 'profile') {
    return (
      <CustomerProfileProvider>
        <Suspense fallback={<LoadingScreen />}>
          <CustomerProfileApp onExit={() => navigate('')} />
        </Suspense>
      </CustomerProfileProvider>
    );
  }

  // ---- Landing Page ----
  return (
    <div className={styles.app}>
      <Navbar />
      
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.badge}>Next-Gen Banking</div>
          <h1 className={styles.heroTitle}>Premium Financial Control. Designed for You.</h1>
          <p className={styles.heroSubtitle}>
            Experience a bank account that feels as good as it works. 
            High contrast, high performance, and high rewards.
          </p>
          <div className={styles.ctaSection}>
            <Button variant="primary" size="large" onClick={() => navigate('#/merchant')}>
              <Terminal size={18} style={{ marginRight: '8px' }} /> Merchant Terminal
            </Button>
            <Button variant="outline" size="large" onClick={() => navigate('#/check/1')}>
              <ScanLine size={18} style={{ marginRight: '8px' }} /> Demo: Scan Check #1
            </Button>
          </div>
        </section>

        <div className={styles.dashboard}>
          <Card 
            title="Total Balance" 
            description="Your current liquidity across all accounts"
            variant="elevated"
          >
            <div className={styles.statValue}>$142,500.00</div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>+12%</div>
                <div className={styles.statLabel}>Growth</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>$4,200</div>
                <div className={styles.statLabel}>Monthly</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>2.4k</div>
                <div className={styles.statLabel}>Bilt Points</div>
              </div>
            </div>
          </Card>

          <Card title="Recent Activity" description="Stay on top of your spending">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}><ArrowDownLeft size={16} /></div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Apple Store</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Electronics</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>-$1,299.00</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}><ArrowUpRight size={16} /></div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Bilt Rewards</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redemption</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--brand-accent)' }}>+$450.00</div>
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              <Button variant="secondary" size="small" fullWidth><Wallet size={16} /> Transfer</Button>
              <Button variant="secondary" size="small" fullWidth><CreditCard size={16} /> Cards</Button>
              <Button variant="secondary" size="small" fullWidth><ShieldCheck size={16} /> Security</Button>
              <Button variant="secondary" size="small" fullWidth><Zap size={16} /> Fast Pay</Button>
            </div>
          </Card>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 Bankdrop Inc. Member FDIC. Equal Housing Lender.</p>
      </footer>
    </div>
  );
};

export default App;
