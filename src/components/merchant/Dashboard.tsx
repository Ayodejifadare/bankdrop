import React from 'react';
import { Bell, BookOpen, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMerchant } from '../../context/MerchantContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, isToday } from '../../utils/formatters';
import styles from './MerchantUI.module.css';

interface DashboardProps {
  onTabChange: (tab: number) => void;
  onViewAll: () => void;
  onOpenNotifications: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onTabChange, 
  onViewAll, 
  onOpenNotifications 
}) => {
  const { state } = useMerchant();

  // Metrics calculation
  const activeChecks = state.checks.filter(c => c.status === 'active').length;
  
  // FIX: Calculate today's revenue from activity log, not active checks
  const totalToday = state.activities.reduce((acc, act) => {
    if (isToday(act.timestamp) && (act.type === 'check_payment' || act.type === 'invoice_payment' || act.type === 'quickpay')) {
      return acc + (act.amount || 0);
    }
    return acc;
  }, 0);

  const pendingVerifications = state.pendingVerifications?.filter(v => v.status === 'pending') || [];

  return (
    <div className={styles.merchantApp}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '1.75rem' }}>Welcome, {state.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Today's overview - {formatCurrency(totalToday)}</p>
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
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{formatCurrency(totalToday)}</div>
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
                  <span style={{ fontWeight: 700, color: '#4ade80' }}>+{formatCurrency(activity.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
