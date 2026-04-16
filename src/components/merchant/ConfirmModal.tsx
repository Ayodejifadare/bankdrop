import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '400px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              zIndex: 2001,
              overflow: 'hidden',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: variant === 'danger' ? '#ef4444' : 'var(--brand-accent)'
              }}>
                <AlertCircle size={32} />
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '24px' }}>
                {message}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <Button 
                  variant={variant === 'danger' ? 'primary' : 'accent'} 
                  fullWidth 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  style={variant === 'danger' ? { backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' } : {}}
                >
                  {confirmLabel}
                </Button>
                <Button variant="outline" fullWidth onClick={onClose} style={{ borderColor: 'var(--border-subtle)' }}>
                  {cancelLabel}
                </Button>
              </div>
            </div>

            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
