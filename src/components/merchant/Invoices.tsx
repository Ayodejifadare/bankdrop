import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { Invoice } from '../../context/MerchantContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/StatusPill';
import styles from './MerchantUI.module.css';
import { 
  FileText, 
  Plus, 
  Download, 
  Share2,
  Clock,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoicePDFContent } from './InvoicePDFContent';

interface InvoicesManagerProps {
  onStartBuilding?: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({ 
  onStartBuilding,
  onEditInvoice
}) => {
  const { state } = useMerchant();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const downloadRef = React.useRef<HTMLDivElement>(null);

  const filteredInvoices = state.invoices.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalOutstanding = state.invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    // Wait for the hidden container to render (300ms for safer mobile rendering)
    setTimeout(async () => {
      if (!downloadRef.current) {
        setDownloadingId(null);
        return;
      }
      
      try {
        const canvas = await html2canvas(downloadRef.current, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${invoice.id}_${invoice.customerName.replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error('Download failed', err);
      } finally {
        setDownloadingId(null);
      }
    }, 100);
  };

  const handleShare = async (invoice: Invoice) => {
    const shareUrl = `${window.location.origin}/#/pay/${invoice.id}`;
    const shareData = {
      title: `Invoice from ${state.name}`,
      text: `Hi ${invoice.customerName}, here is your invoice for ₦${invoice.total.toLocaleString()}. Pay securely here:`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Paylink copied to clipboard!');
    }
  };

  return (
    <div className={styles.invoicesManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Outstanding Invoices</h2>
          <p style={{ color: 'var(--brand-accent)', fontSize: '1.25rem', fontWeight: 700 }}>
            ₦{totalOutstanding.toLocaleString()}
          </p>
        </div>
        <Button size="small" variant="accent" onClick={onStartBuilding}>
          <Plus size={18} /> New Invoice
        </Button>
      </header>

      <div className={styles.tabGroup} style={{ marginBottom: 'var(--spacing-md)' }}>
        <button 
          className={`${styles.tabItem} ${filter === 'all' ? styles.tabItemActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`${styles.tabItem} ${filter === 'unpaid' ? styles.tabItemActive : ''}`}
          onClick={() => setFilter('unpaid')}
        >
          Unpaid
        </button>
        <button 
          className={`${styles.tabItem} ${filter === 'paid' ? styles.tabItemActive : ''}`}
          onClick={() => setFilter('paid')}
        >
          Paid
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {filteredInvoices.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No invoices found.</p>
            </div>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <motion.div 
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{invoice.customerName}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Invoice #{invoice.id} • {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={invoice.status} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    ₦{invoice.total.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" size="small" style={{ padding: '8px' }} onClick={() => onEditInvoice?.(invoice)} disabled={!!downloadingId}>
                      <Edit3 size={18} />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => handleDownload(invoice)}
                      loading={downloadingId === invoice.id}
                      disabled={!!downloadingId && downloadingId !== invoice.id}
                    >
                      <Download size={18} />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={() => handleShare(invoice)}
                      disabled={!!downloadingId}
                    >
                      <Share2 size={18} />
                    </Button>
                  </div>
                </div>

                {invoice.paymentPlan && (
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--brand-accent)'
                  }}>
                    <Clock size={12} />
                    <span>Plan: {invoice.paymentPlan.depositPercent}% Upfront + {invoice.paymentPlan.rule}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      {/* Hidden PDF Container for Download */}
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
        {downloadingId && (
          <div ref={downloadRef}>
            <InvoicePDFContent 
              merchantName={state.name}
              invoice={state.invoices.find(inv => inv.id === downloadingId)!}
            />
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
