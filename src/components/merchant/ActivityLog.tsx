import React from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { Card } from '../ui/Card';
import { 
  ArrowDownLeft, 
  Receipt,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import styles from './MerchantUI.module.css';

interface ActivityLogProps {
  onBack: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ onBack }) => {
  const { state } = useMerchant();
  const { activities } = state;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'invoice_payment':
        return <Receipt size={20} color="var(--brand-accent)" />;
      case 'check_payment':
        return <ArrowDownLeft size={20} color="#4ade80" />;
      default:
        return <ShieldCheck size={20} color="var(--brand-accent)" />;
    }
  };

  return (
    <div className={styles.profileContainer}>
      <header style={{ width: '100%', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ color: 'var(--text-secondary)' }}>Back</button>
          <h2 style={{ fontSize: '1.25rem' }}>Transaction Ledger</h2>
          <div style={{ width: 40 }} /> {/* Spacer to center the title */}
        </div>
      </header>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>No recent transactions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {activities.map((activity) => (
            <Card key={activity.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '12px', 
                    backgroundColor: activity.type === 'check_payment' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {renderIcon(activity.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{activity.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activity.subtitle} • {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#4ade80' }}>
                    +₦{activity.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
