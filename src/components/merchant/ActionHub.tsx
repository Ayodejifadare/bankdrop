import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FilePlus, 
  Tag, 
  Gift, 
  LayoutDashboard,
  FileText
} from 'lucide-react';
import styles from './MerchantUI.module.css';

interface ActionHubProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (tab: number, action?: string) => void;
}

export const ActionHub: React.FC<ActionHubProps> = ({ isOpen, onClose, onAction }) => {
  const actions = [
    { id: 'check', label: 'New Check / Table', icon: <FilePlus size={24} />, tab: 2 },
    { id: 'invoice', label: 'New Invoice', icon: <FileText size={24} />, tab: 2, action: 'new-invoice' },
    { id: 'menu', label: 'Add Menu Item', icon: <Tag size={24} />, tab: 1 },
    { id: 'reward', label: 'Create Reward Offer', icon: <Gift size={24} />, tab: 4 },
    { id: 'dash', label: 'Back to Dashboard', icon: <LayoutDashboard size={24} />, tab: 0 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.actionHubOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className={styles.actionHubGrid}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 'var(--spacing-lg)', marginLeft: 'var(--spacing-sm)' }}>
              Quick Actions
            </h2>
            
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                className={styles.actionHubItem}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onAction(action.tab, (action as any).action);
                  onClose();
                }}
              >
                <div className={styles.actionHubIcon}>
                  {action.icon}
                </div>
                <div className={styles.actionHubLabel}>{action.label}</div>
              </motion.div>
            ))}

            <button 
              onClick={onClose}
              style={{
                marginTop: 'var(--spacing-xl)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(212, 175, 55, 0.3)'
              }}
            >
              <X size={32} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
