import React from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  footer,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const classes = [
    styles.card,
    variant === 'elevated' ? styles.elevated : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={classes}
      onClick={onClick}
    >
      <div className={styles.cardContent}>
        {(title || description) && (
          <div className={styles.cardHeader}>
            <div>
              {title && <h3 className={styles.cardTitle}>{title}</h3>}
              {description && <p className={styles.cardDescription}>{description}</p>}
            </div>
          </div>
        )}
        <div className={styles.cardBody}>{children}</div>
        {footer && <div className={styles.cardFooter}>{footer}</div>}
      </div>
    </motion.div>
  );
};
