import React from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  loading = false,
  ...props
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  // We filter out native props that conflict with framer-motion's motion.button
  const { 
    onDrag: _od, 
    onDragStart: _ods, 
    onDragEnd: _ode, 
    ...safeProps 
  } = (props as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any);

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
      disabled={loading || props.disabled}
      {...safeProps}
    >
      {loading ? (
        <span className={styles.spinner}>...</span> // Simple spinner placeholder
      ) : (
        children
      )}
    </motion.button>
  );
};
