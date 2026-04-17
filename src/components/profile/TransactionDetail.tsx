import React from 'react';
import type { Activity } from '../../types/profile';
import { PaymentTimeline } from './PaymentTimeline';
import { 
  formatCurrency, 
  formatFullDateTime 
} from '../../utils/formatters';
import styles from './ProfileUI.module.css';
import { 
  ArrowLeft,
  Download, 
  Share2, 
  Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TransactionDetailProps {
  activity: Activity;
  onClose: () => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({ activity, onClose }) => {
  const handleDownload = async () => {
    const element = document.getElementById('receipt-download-area');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bankdrop_Receipt_${activity.id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Receipt generation failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bankdrop Transaction Receipt',
          text: `Transaction of ${formatCurrency(activity.amount)} to ${activity.entity}`,
          url: window.location.href
        });
      } catch {
        console.log('Share failed or cancelled');
      }
    } else {
      navigator.clipboard.writeText(activity.id);
      alert('Transaction ID copied to clipboard');
    }
  };

  return (
    <motion.div 
      className={styles.detailPage}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <header className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
        <h2 className={styles.detailTitle}>Transaction Detail</h2>
      </header>

      <div className={styles.detailScrollArea}>
        <div id="receipt-download-area" className={styles.receiptContentDetailed}>
          <div className={styles.receiptHeader}>
            <PaymentTimeline timestamp={activity.timestamp} status={activity.status} />
            
            <div className={styles.receiptAmount}>
              {formatCurrency(activity.amount)}
            </div>
            <div className={styles.receiptEntity}>
              {activity.category && <span style={{ opacity: 0.6, fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>{activity.category}</span>}
              {activity.type === 'sent' ? 'To' : 'From'} {activity.entity}
            </div>
          </div>

          <hr className={styles.receiptDivider} />

          {activity.items && activity.items.length > 0 && (
            <div className={styles.itemsSection}>
              <div className={styles.itemsHeader}>Order Items</div>
              {activity.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemDetail}>{item.quantity} x {formatCurrency(item.price)}</span>
                  </div>
                  <span className={styles.itemTotal}>{formatCurrency(item.quantity * item.price)}</span>
                </div>
              ))}
              
              <div className={styles.receiptTotalRow}>
                <span className={styles.totalLabel}>TOTAL</span>
                <span className={styles.totalValue}>{formatCurrency(activity.amount)}</span>
              </div>
            </div>
          )}

          <div className={styles.receiptGrid} style={activity.items?.length ? { marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-secondary)', paddingTop: 'var(--spacing-md)' } : {}}>
            <div className={styles.receiptRow}>
              <span className={styles.rowLabel}>Date & Time</span>
              <span className={styles.rowValue}>{formatFullDateTime(activity.timestamp)}</span>
            </div>
            <div className={styles.receiptRow}>
              <span className={styles.rowLabel}>Transaction ID</span>
              <span className={styles.rowValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {activity.id.slice(0, 12)}...
                <Copy size={12} style={{ cursor: 'pointer', opacity: 0.5 }} />
              </span>
            </div>
            <div className={styles.receiptRow}>
              <span className={styles.rowLabel}>Type</span>
              <span className={styles.rowValue}>
                {activity.type === 'sent' ? 'Sent' : 'Received'} Transfer
              </span>
            </div>
            <div className={styles.receiptRow}>
              <span className={styles.rowLabel}>Payment Method</span>
              <span className={styles.rowValue}>Bankdrop Wallet</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', opacity: 0.3, fontSize: '0.625rem' }}>
            <p>Officially generated by Bankdrop Systems</p>
            <p>{new Date().getFullYear()} © All Rights Reserved</p>
          </div>
        </div>

        <div className={styles.receiptActions}>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            <Download size={18} />
            Download PDF
          </button>
          <button className={styles.shareBtn} onClick={handleShare}>
            <Share2 size={18} />
            Share Receipt
          </button>
        </div>
      </div>
    </motion.div>
  );
};
