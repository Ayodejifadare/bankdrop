import React from 'react';
import styles from './StatusPill.module.css';

type PillVariant = 'paid' | 'unpaid' | 'partial' | 'pending' | 'draft' | 'active' | 'completed' | 'failed';

interface StatusPillProps {
  status: PillVariant;
  label?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label }) => {
  return (
    <span className={`${styles.statusPill} ${styles[status]}`}>
      {label || status}
    </span>
  );
};
