import React from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import styles from './ProfileUI.module.css';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { activities } = useCustomerProfile();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
          <Clock size={20} style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '0.875rem' }}>No recent activity.</p>
        </div>
      ) : (
        <div className={styles.activityList}>
          {activities.map(activity => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityInfo}>
                <div className={styles.iconCircle}>
                  {activity.type === 'sent' ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownLeft size={18} color="var(--brand-accent)" />
                  )}
                </div>
                <div className={styles.activityMain}>
                  <span className={styles.activityEntity}>{activity.entity}</span>
                  <span className={styles.activityTime}>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
              <div className={`${styles.activityAmount} ${activity.type === 'sent' ? styles.sent : styles.received}`}>
                {activity.type === 'sent' ? '-' : '+'}₦{activity.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
