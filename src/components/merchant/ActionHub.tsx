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
    { id: 'check', label: 'New Check / Table', icon: <FilePlus size={24} />, tab: 2, action: 'new-check' },
    { id: 'invoice', label: 'New Invoice', icon: <FileText size={24} />, tab: 2, action: 'new-invoice' },
    { id: 'menu', label: 'Add Menu Item', icon: <Tag size={24} />, tab: 1, action: 'add-menu-item' },
    { id: 'reward', label: 'Create Reward Offer', icon: <Gift size={24} />, tab: 4, action: 'create-reward' },
    { id: 'dash', label: 'Back to Dashboard', icon: <LayoutDashboard size={24} />, tab: 0 },
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.fabMenuOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className={styles.actionHubGrid}
            initial={isMobile ? { scale: 0.8, opacity: 0, originX: 1, originY: 1 } : { y: 50, opacity: 0 }}
            animate={isMobile ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={isMobile ? { scale: 0.8, opacity: 0 } : { y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                className={styles.actionHubItem}
                initial={{ x: isMobile ? 20 : 0, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: isMobile ? (actions.length - index) * 0.05 : index * 0.05 }}
                onClick={() => {
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

            <motion.button 
              className={styles.closeButton}
              onClick={onClose}
              whileTap={{ scale: 0.9, rotate: isMobile ? -90 : 0 }}
            >
              <X size={32} />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
