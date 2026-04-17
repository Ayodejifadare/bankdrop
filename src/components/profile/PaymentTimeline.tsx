import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatTimeWithOffset } from '../../utils/formatters';
import styles from './ProfileUI.module.css';

interface PaymentStep {
  label: string;
  offsetSeconds: number;
}

interface PaymentTimelineProps {
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

const STEPS: PaymentStep[] = [
  { label: 'Initiated', offsetSeconds: -125 },
  { label: 'Pending Verification', offsetSeconds: -60 },
  { label: 'Success', offsetSeconds: 0 }
];

export const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ timestamp, status }) => {
  const [showProgress, setShowProgress] = React.useState(false);

  // If failed or pending, we might want different steps, but for now we follow the user's request
  // which specified the "success" badge behavior.
  
  return (
    <div className={styles.timelineWrapper}>
      <motion.div 
        className={`${styles.receiptStatus} ${status === 'completed' ? styles.statusCompleted : styles.statusPending}`}
        onClick={() => setShowProgress(!showProgress)}
        whileTap={{ scale: 0.96 }}
        layout
      >
        <span style={{ textTransform: 'capitalize' }}>{status === 'completed' ? 'Success' : status}</span>
        <motion.div
          animate={{ rotate: showProgress ? 180 : 0 }}
          style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', opacity: 0.5 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showProgress && (
          <motion.div 
            className={styles.timelineContainer}
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
          >
            {STEPS.map((step, index) => (
              <div key={index} className={styles.timelineStep}>
                <div className={styles.timelineIndicator}>
                  <div className={styles.timelineDot} />
                  {index < STEPS.length - 1 && <div className={styles.timelineLine} />}
                </div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineLabel}>{step.label}</span>
                  <span className={styles.timelineTime}>{formatTimeWithOffset(timestamp, step.offsetSeconds)}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
