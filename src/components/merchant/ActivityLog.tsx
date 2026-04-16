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
import styles from './MerchantUI.module.css';

interface ActivityLogProps {
  onBack: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ onBack }) => {
  const { state } = useMerchant();
  const { activities, orderHistory, invoices, menu } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'check_payment' | 'invoice_payment'>('all');
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
      // Strict lookup: Match by unique order ID only to prevent item mismatch
      return orderHistory.find(oh => oh.id === activity.referenceId);
    } else if (activity.type === 'invoice_payment') {
      return invoices.find(inv => inv.id === activity.referenceId);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 className={styles.title} style={{ fontSize: '1.5rem', margin: 0 }}>Transaction Ledger</h2>
        </div>

        <div className={styles.searchFilterGroup}>
          <Input 
            placeholder="Search by name, reference or amount..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
          <div className={styles.filterScroll}>
            <button 
              className={`${styles.pill} ${activeFilter === 'all' ? styles.pillActive : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`${styles.pill} ${activeFilter === 'check_payment' ? styles.pillActive : ''}`}
              onClick={() => setActiveFilter('check_payment')}
            >
              Check
            </button>
            <button 
              className={`${styles.pill} ${activeFilter === 'invoice_payment' ? styles.pillActive : ''}`}
              onClick={() => setActiveFilter('invoice_payment')}
            >
              Invoice
            </button>
          </div>
        </div>
      </header>

      {filteredActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-secondary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Calendar size={40} style={{ opacity: 0.3 }} />
          </div>
          <h3>No transactions found</h3>
          <p>Try adjusting your search or filters.</p>
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
                  <div>
                    <div style={{ fontWeight: 600 }}>{activity.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activity.subtitle} • {formatDate(activity.timestamp)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#4ade80' }}>
                      +₦{activity.amount.toLocaleString()}
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
                      onClick={(e) => e.stopPropagation()} // Prevent card toggle when clicking details
                    >
                      <div className={styles.detailSection}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Transaction Items
                        </div>
                        
                        {details ? (
                          <>
                            {'orders' in details && details.orders ? (
                              // Check Details
                              details.orders.map((order, i) => {
                                const item = menu.find(m => m.id === order.menuItemId);
                                return (
                                  <div key={i} className={styles.detailRow}>
                                    <div>
                                      <div className={styles.detailName}>{item?.name || 'Unknown Item'}</div>
                                      <div className={styles.detailQty}>{order.quantity} x ₦{(item?.price || 0).toLocaleString()}</div>
                                    </div>
                                    <div className={styles.detailPrice}>₦{((item?.price || 0) * order.quantity).toLocaleString()}</div>
                                  </div>
                                );
                              })
                            ) : 'items' in details && details.items ? (
                              // Invoice Details
                              details.items.map((item, i) => (
                                <div key={i} className={styles.detailRow}>
                                  <div>
                                    <div className={styles.detailName}>{item.name}</div>
                                    <div className={styles.detailQty}>{item.quantity} x ₦{item.price.toLocaleString()}</div>
                                  </div>
                                  <div className={styles.detailPrice}>₦{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '10px', textAlign: 'center', opacity: 0.5 }}>
                                <p>Detailed items not found.</p>
                              </div>
                            )}

                            <div className={styles.detailTotal}>
                              <span>Total Amount</span>
                              <span style={{ color: 'var(--brand-accent)' }}>₦{activity.amount.toLocaleString()}</span>
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
                                  Trans ID: {activity.id}<br />
                                  Date: {new Date(activity.timestamp).toLocaleString()}
                                </div>
                                <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
                                {'orders' in details ? (
                                  details.orders.map((o, i) => {
                                    const menuItem = menu.find(m => m.id === o.menuItemId);
                                    return (
                                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span>{o.quantity} {menuItem?.name}</span>
                                        <span>₦{((menuItem?.price || 0) * o.quantity).toLocaleString()}</span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  details.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                      <span>{item.quantity} {item.name}</span>
                                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                  ))
                                )}
                                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                                  <span>TOTAL</span>
                                  <span>₦{activity.amount.toLocaleString()}</span>
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
