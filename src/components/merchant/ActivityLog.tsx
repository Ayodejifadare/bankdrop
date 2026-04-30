import React, { useState, useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { MerchantActivity } from '../../types/merchant';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
  Calendar,
  Search,
  Download,
  ArrowLeft,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCurrency } from '../../utils/formatters';
import styles from './MerchantUI.module.css';

interface ActivityLogProps {
  onBack: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ onBack }) => {
  const { state } = useMerchant();
  const { activities, orderHistory, invoices, menu } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'check_payment' | 'invoice_payment' | 'quickpay'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Pending';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.amount.toString().includes(searchQuery);
      
      const matchesFilter = activeFilter === 'all' || activity.type === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [activities, searchQuery, activeFilter]);


  const getDetails = (activity: MerchantActivity) => {
    if (activity.type === 'check_payment') {
      // Lookup by sessionId (which is our referenceId) in orderHistory
      return orderHistory.find(oh => oh.sessionId === activity.referenceId || oh.id === activity.referenceId);
    } else if (activity.type === 'invoice_payment') {
      return invoices.find(inv => inv.id === activity.referenceId);
    } else if (activity.type === 'quickpay') {
      return { isQuickPay: true };
    }
    return null;
  };

  const handleDownloadReceipt = async (activityId: string, type: string) => {
    const element = document.getElementById(`receipt-${activityId}`);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Receipt_${type}_${activityId}.pdf`);
  };

  return (
    <div className={styles.activityLedger}>
      <header className={styles.ledgerHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 className={styles.title} style={{ fontSize: '1.25rem', margin: 0 }}>Transaction Ledger</h2>
        </div>

        <div className={styles.searchFilterGroup}>
          <Input 
            placeholder="Search reference or amount..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
          <div className={styles.filterScroll} style={{ gap: '8px' }}>
            {(['all', 'check_payment', 'invoice_payment', 'quickpay'] as const).map(f => (
              <button 
                key={f}
                className={`${styles.pill} ${activeFilter === f ? styles.pillActive : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f.split('_')[0].charAt(0).toUpperCase() + f.split('_')[0].slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {filteredActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-secondary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px',
            opacity: 0.5
          }}>
            <Calendar size={32} />
          </div>
          <h3>No transactions found</h3>
          <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {filteredActivities.map((activity) => {
            const isExpanded = expandedId === activity.id;
            const details = getDetails(activity);

            return (
              <Card 
                key={activity.id} 
                className={styles.invoiceCard}
                onClick={() => setExpandedId(isExpanded ? null : activity.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activity.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {activity.subtitle} • {formatDate(activity.timestamp)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#4ade80', fontSize: '1rem' }}>
                      +{formatCurrency(activity.amount)}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <div className={styles.detailSection}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Transaction Items
                        </div>
                        
                        {details ? (
                          <>
                            { 'isQuickPay' in details ? (
                              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                                <Package size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Quickpay Transaction</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standalone payment via terminal QR</div>
                              </div>
                            ) : 'orders' in details && details.orders ? (
                              details.orders.map((order: any, i: number) => {
                                const menuItem = menu.find(m => m.id === order.menuItemId);
                                const price = order.priceAtOrder || menuItem?.price || 0;
                                return (
                                  <div key={i} className={styles.detailRow}>
                                    <div>
                                      <div className={styles.detailName}>{menuItem?.name || 'Unknown Item'}</div>
                                      <div className={styles.detailQty}>{order.quantity} x {formatCurrency(price)}</div>
                                    </div>
                                    <div className={styles.detailPrice}>{formatCurrency(price * order.quantity)}</div>
                                  </div>
                                );
                              })
                            ) : 'items' in details && details.items ? (
                              details.items.map((item: any, i: number) => (
                                <div key={i} className={styles.detailRow}>
                                  <div>
                                    <div className={styles.detailName}>{item.name}</div>
                                    <div className={styles.detailQty}>{item.quantity} x {formatCurrency(item.price)}</div>
                                  </div>
                                  <div className={styles.detailPrice}>{formatCurrency(item.price * item.quantity)}</div>
                                </div>
                              ))
                            ) : null}

                            <div className={styles.detailTotal}>
                              <span>Total Settled</span>
                              <span style={{ color: 'var(--brand-accent)' }}>{formatCurrency(activity.amount)}</span>
                            </div>

                            <button 
                              className={styles.downloadBtn}
                              onClick={() => handleDownloadReceipt(activity.id, activity.type)}
                            >
                              <Download size={18} />
                              Download Digital Receipt
                            </button>

                            {/* Hidden Receipt for PDF Generation */}
                            <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
                              <div 
                                id={`receipt-${activity.id}`}
                                style={{ 
                                  width: '80mm', 
                                  padding: '10mm', 
                                  backgroundColor: '#ffffff', 
                                  color: '#000000',
                                  fontFamily: 'monospace',
                                  fontSize: '12px'
                                }}
                              >
                                <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>BANKDROP</div>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>{state.name}</div>
                                <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
                                <div style={{ marginBottom: '10px' }}>
                                  Ref: {activity.referenceId}<br />
                                  Type: {activity.type === 'quickpay' ? 'Quickpay' : activity.type.split('_')[0].toUpperCase()}<br />
                                  Trans ID: {activity.id}<br />
                                  Date: {new Date(activity.timestamp).toLocaleString()}
                                </div>
                                <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
                                { 'isQuickPay' in details ? (
                                   <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                      QUICKPAY TRANSACTION
                                   </div>
                                ) : 'orders' in details ? (
                                  details.orders.map((o: any, i: number) => {
                                    const menuItem = menu.find(m => m.id === o.menuItemId);
                                    const price = o.priceAtOrder || menuItem?.price || 0;
                                    return (
                                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>{o.quantity} {menuItem?.name || 'Unknown'}</span>
                                        <span>{formatCurrency(price * o.quantity)}</span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  details.items.map((item: any, j: number) => (
                                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                      <span>{item.quantity} {item.name}</span>
                                      <span>{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                  ))
                                )}
                                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                                  <span>TOTAL</span>
                                  <span>{formatCurrency(activity.amount)}</span>
                                </div>
                                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
                                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
                                  Thank you for using Bankdrop!<br />
                                  www.bankdrop.dev
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                            <Package size={32} style={{ marginBottom: '8px' }} />
                            <p>Product details not available for this record.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
