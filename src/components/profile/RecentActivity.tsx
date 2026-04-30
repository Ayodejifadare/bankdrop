import React from 'react';
import { useCustomerProfile } from '../../context/CustomerProfileContext';
import type { Activity } from '../../types/profile';
import styles from './ProfileUI.module.css';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatShortDate } from '../../utils/formatters';

interface RecentActivityProps {
  onActivityClick?: (activity: Activity) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ onActivityClick }) => {
  const { activities } = useCustomerProfile();


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
            <motion.div 
              key={activity.id} 
              className={styles.activityItem}
              onClick={() => onActivityClick?.(activity)}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.activityInfo}>
                <div className={styles.iconCircle}>
                  {activity.type === 'sent' ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownLeft size={18} color="var(--brand-accent)" />
                  )}
                </div>
                <div className={styles.activityMain}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={styles.activityEntity}>{activity.entity}</span>
                    {activity.status && activity.status !== 'completed' && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                  <span className={styles.activityTime}>{formatShortDate(activity.timestamp)}</span>
                </div>
              </div>
              <div className={`${styles.activityAmount} ${activity.type === 'sent' ? styles.sent : styles.received}`}>
                {activity.type === 'sent' ? '-' : '+'}{formatCurrency(activity.amount)}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
