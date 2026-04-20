import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import {
  QrCode,
  Share2,
  Download,
  ChevronRight,
  Landmark,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MerchantUI.module.css';
import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
  id: string;
  label: string;
  type: 'merchant' | 'check';
}

const AestheticQR: React.FC<QRDisplayProps> = ({ id, label, type }) => {
  const deepLink = type === 'merchant' 
    ? `${window.location.origin}/#/pay/quickpay`
    : `${window.location.origin}/#/check/${id}`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-xl)',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-primary)',
      width: '100%'
    }}>
      <div style={{ 
        position: 'relative', 
        padding: '16px', 
        backgroundColor: '#fff', 
        borderRadius: '24px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <QRCodeSVG 
          value={deepLink}
          size={200}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "", // We can add a logo here if needed
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#000',
          padding: '6px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Landmark size={24} color="var(--brand-accent)" strokeWidth={3} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 className={styles.title}>{label}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{type === 'merchant' ? 'Direct Merchant Payment' : `Check #${id}`}</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%' }}>
        <Button variant="outline" size="small" fullWidth><Download size={16} /> Save</Button>
        <Button variant="outline" size="small" fullWidth><Share2 size={16} /> Share</Button>
      </div>
    </div>
  );
};

export const QRManager: React.FC = () => {
  const { state } = useMerchant();
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);

  return (
    <div className={styles.qrManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 className={styles.title}>QR Terminal</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Share these QRs for payments</p>
      </header>

      <section style={{ marginBottom: 'var(--spacing-xxl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>Quickpay</h3>
        <AestheticQR id="merchant-id" label={state.name} type="merchant" />
      </section>

      <section>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>Check QRs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {state.checks.map(check => (
            <div
              key={check.id}
              onClick={() => setSelectedCheckId(check.id)}
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                border: '1px solid var(--border-primary)'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <QrCode size={20} color="var(--brand-accent)" />
                <span style={{ fontWeight: 600 }}>Check #{check.id}</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selectedCheckId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-xl)'
            }}
            onClick={() => setSelectedCheckId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '400px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button onClick={() => setSelectedCheckId(null)} style={{ color: '#fff', border: 'none', background: 'none' }}><X size={24} /></button>
              </div>
              <AestheticQR id={selectedCheckId} label={`Check #${selectedCheckId}`} type="check" />
              <div style={{ marginTop: '24px', textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>This QR is statically assigned to table/check #{selectedCheckId}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
