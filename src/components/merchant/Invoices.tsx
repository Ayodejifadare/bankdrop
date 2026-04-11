import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { Invoice } from '../../context/MerchantContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import styles from './MerchantUI.module.css';
import { 
  FileText, 
  Search, 
  Plus, 
  Download, 
  Share2,
  MoreVertical,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvoiceBuilder } from './InvoiceBuilder';

interface InvoicesManagerProps {
  initialBuilding?: boolean;
  onBuildingComplete?: () => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({ initialBuilding, onBuildingComplete }) => {
  const { state } = useMerchant();
  const [isBuilding, setIsBuilding] = useState(initialBuilding || false);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');

  const filteredInvoices = state.invoices.filter(inv => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalOutstanding = state.invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className={styles.invoicesManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Outstanding Invoices</h2>
          <p style={{ color: 'var(--brand-accent)', fontSize: '1.25rem', fontWeight: 700 }}>
            ₦{totalOutstanding.toLocaleString()}
          </p>
        </div>
        <Button size="small" variant="accent" onClick={() => setIsBuilding(true)}>
          <Plus size={16} /> New Invoice
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

      <div className={styles.invoiceList}>
        {filteredInvoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
            <FileText size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p>No {filter !== 'all' ? filter : ''} invoices found.</p>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <motion.div 
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={styles.invoiceCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{invoice.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(invoice.createdAt).toLocaleDateString()} • {invoice.items.length} items
                      </div>
                    </div>
                  </div>
                  <div className={`
                    ${styles.statusPill} 
                    ${invoice.status === 'paid' ? styles.pillPaid : 
                      invoice.status === 'partial' ? styles.pillPartial : 
                      invoice.status === 'unpaid' ? styles.pillUnpaid : styles.pillDraft}
                  `}>
                    {invoice.status}
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>₦{invoice.total.toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="small" variant="secondary" style={{ padding: '8px' }}>
                      <Share2 size={16} />
                    </Button>
                    <Button size="small" variant="secondary" style={{ padding: '8px' }}>
                      <Download size={16} />
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
      </div>

      <AnimatePresence>
        {isBuilding && (
          <InvoiceBuilder 
            onClose={() => {
              setIsBuilding(false);
              onBuildingComplete?.();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
