import React from 'react';
import { Button } from '../ui/Button';
import { ShieldAlert, Users, PhoneCall, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './CustomerUI.module.css';

interface Props {
  checkId: string;
  onBack: () => void;
}

export const TableOccupied: React.FC<Props> = ({ checkId, onBack }) => {
  return (
    <div className={styles.customerLayout}>
      <div className={styles.checkoutHeader}>
        <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
        <div className={styles.merchantName}>Table #{checkId}</div>
      </div>

      <div className={styles.cartBody} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '60px' }}>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={styles.occupiedIconWrapper}
        >
          <ShieldAlert size={48} color="var(--brand-accent)" />
        </motion.div>

        <h2 className={styles.title} style={{ marginTop: '24px', marginBottom: '12px' }}>Table Occupied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', padding: '0 20px' }}>
          This table currently has an active order. If you are joining a friend, please follow the steps below.
        </p>

        <div className={styles.guideBox}>
          <div className={styles.guideStep}>
            <div className={styles.stepNum}><Users size={16} /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ask your friend</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Request them to tap "Invite Friends" on their screen.</div>
            </div>
          </div>
          
          <div className={styles.guideStep}>
            <div className={styles.stepNum}>2</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Scan their phone</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use your camera to scan the QR code on their phone.</div>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button variant="secondary" fullWidth onClick={() => alert('Server has been paged. Someone will be with you shortly.')}>
            <PhoneCall size={18} /> Call Server
          </Button>
          <Button variant="outline" fullWidth onClick={onBack}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};
