import React, { useState, useEffect, useRef } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { Invoice, InvoiceItem, PaymentPlan } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import styles from './MerchantUI.module.css';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Settings2,
  Share2,
  Download,
  Check as CheckIcon,
  ChevronRight,
  QrCode as QrIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceBuilderProps {
  onClose: () => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose }) => {
  const { state, createInvoice } = useMerchant();
  const [step, setStep] = useState<'build' | 'plan' | 'share'>('build');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);
  
  // Payment Plan state
  const [hasPlan, setHasPlan] = useState(false);
  const [depositPercent, setDepositPercent] = useState(50);
  const [remainingRule, setRemainingRule] = useState('on delivery');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenuPicker, setShowMenuPicker] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = totalOverride !== null ? totalOverride : calculatedTotal;

  const handleAddItem = (menuItem: any) => {
    const newItem: InvoiceItem = {
      id: menuItem.id || Date.now().toString(),
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1
    };
    setItems([...items, newItem]);
    setShowMenuPicker(false);
  };

  const addCustomItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: 'Custom Service',
      price: 0,
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveInvoice = () => {
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
      customerName,
      items,
      total: finalTotal,
      status: 'unpaid',
      createdAt: new Date().toISOString(),
      paymentPlan: hasPlan ? {
        type: 'upfront',
        depositPercent,
        rule: remainingRule
      } : undefined
    };
    createInvoice(newInvoice);
    setGeneratedInvoiceId(newInvoice.id);
    setStep('share');
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    // Temporarily make the hidden PDF section visible for capturing
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${customerName.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredMenu = state.menu.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      className={styles.actionHubOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={styles.onboardingForm}
        style={{ 
          backgroundColor: 'var(--bg-primary)', 
          padding: 'var(--spacing-xl)', 
          borderTopLeftRadius: 'var(--radius-xl)', 
          borderTopRightRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: '0',
          position: 'relative'
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {step !== 'build' && (
              <button 
                onClick={() => setStep(step === 'share' ? 'plan' : 'build')}
                style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
            )}
            <h3>
              {step === 'build' ? 'New Invoice' : 
               step === 'plan' ? 'Payment Terms' : 'Share Invoice'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        {step === 'build' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Customer Name"
              placeholder="Enter client name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Items & Services</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="small" variant="secondary" onClick={() => setShowMenuPicker(true)}>
                    <Search size={14} style={{ marginRight: '4px' }} /> Menu
                  </Button>
                  <Button size="small" variant="secondary" onClick={addCustomItem}>
                    <Plus size={14} style={{ marginRight: '4px' }} /> Custom
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {items.length === 0 ? (
                  <div style={{ 
                    padding: '30px', 
                    textAlign: 'center', 
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    opacity: 0.5
                  }}>
                    No items added yet.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className={styles.orderRow} style={{ alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            fontWeight: 600, 
                            width: '100%',
                            color: 'var(--text-primary)',
                            padding: 0
                          }} 
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.875rem' }}>₦</span>
                          <input 
                            type="number"
                            style={{ 
                              background: 'var(--bg-tertiary)', 
                              border: 'none', 
                              borderRadius: '4px',
                              padding: '2px 8px',
                              width: '80px',
                              fontSize: '0.875rem',
                              color: 'var(--brand-accent)',
                              fontWeight: 700
                            }} 
                            value={item.price}
                            onChange={(e) => updateItem(item.id, { price: parseInt(e.target.value) || 0 })}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×</span>
                          <input 
                            type="number"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              width: '30px',
                              fontSize: '0.875rem',
                              color: 'var(--text-primary)'
                            }} 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ color: '#ef4444', padding: '4px' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '12px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>₦{calculatedTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Final Total</span>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>₦</span>
                  <input 
                    type="number"
                    style={{ 
                      textAlign: 'right', 
                      padding: '8px 12px 8px 24px', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-primary)',
                      fontWeight: 800,
                      fontSize: '1.125rem',
                      width: '140px'
                    }}
                    value={finalTotal}
                    onChange={(e) => setTotalOverride(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <Button 
              fullWidth 
              variant="accent" 
              disabled={!customerName || items.length === 0}
              onClick={() => setStep('plan')}
            >
              Configure Terms <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {step === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              border: `2px solid ${hasPlan ? 'var(--brand-accent)' : 'var(--border-subtle)'}`,
              backgroundColor: hasPlan ? 'rgba(212, 175, 55, 0.05)' : 'none'
            }} onClick={() => setHasPlan(!hasPlan)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Apply Payment Plan</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Split payment into groups</div>
                  </div>
                </div>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: '2px solid var(--brand-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {hasPlan && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-accent)' }} />}
                </div>
              </div>

              {hasPlan && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deposit / Upfront Amount (%)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[20, 50, 70].map(p => (
                        <Button 
                          key={p} 
                          size="small" 
                          variant={depositPercent === p ? 'accent' : 'secondary'}
                          style={{ flex: 1 }}
                          onClick={(e) => { e.stopPropagation(); setDepositPercent(p); }}
                        >
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Balance Rule (e.g. Monthly, On Delivery)"
                    placeholder="e.g. 6 month installments"
                    value={remainingRule}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRemainingRule(e.target.value)}
                    style={{ marginTop: '16px' }}
                  />

                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-primary)', 
                    borderRadius: '8px',
                    fontSize: '0.875rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due Now ({depositPercent}%):</span>
                      <span style={{ fontWeight: 700 }}>₦{((finalTotal * depositPercent) / 100).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', opacity: 0.7 }}>
                      <span>Balance ({remainingRule}):</span>
                      <span>₦{(finalTotal - (finalTotal * depositPercent) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <Button fullWidth variant="accent" size="large" onClick={handleSaveInvoice}>
              Generate Invoice & Paylink
            </Button>
          </div>
        )}

        {step === 'share' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(74, 222, 128, 0.1)', 
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckIcon size={40} />
            </div>
            
            <div>
              <h3>Invoice Created!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Share the link with {customerName} to get paid.</p>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px' 
            }}>
              <QRCodeSVG 
                value={`${window.location.origin}/#/pay/${generatedInvoiceId}`}
                size={160}
                style={{ margin: '0 auto', borderRadius: '8px' }}
                includeMargin={true}
              />
              <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Scan to pay existing customer flow
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button fullWidth variant="secondary" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/#/pay/${generatedInvoiceId}`);
                alert('Paylink copied to clipboard!');
              }}>
                <Share2 size={18} style={{ marginRight: '8px' }} /> Copy Paylink URL
              </Button>
              <Button fullWidth variant="primary" onClick={downloadPDF}>
                <Download size={18} style={{ marginRight: '8px' }} /> Download PDF Invoice
              </Button>
            </div>

            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </motion.div>

      {/* Hidden PDF Component for html2canvas */}
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
        <div 
          ref={invoiceRef} 
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm', 
            backgroundColor: '#ffffff', 
            color: '#1a1a1a',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>INVOICE</h1>
              <p style={{ margin: 0, opacity: 0.6 }}>Issued by {state.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>BANKDROP</div>
              <p style={{ margin: 0, opacity: 0.6 }}>Inv # {Math.floor(Math.random() * 100000)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4 }}>Bill To</p>
              <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 700 }}>{customerName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4 }}>Date Issued</p>
              <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 700 }}>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', opacity: 0.5 }}>Description</th>
                <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '12px', opacity: 0.5 }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', opacity: 0.5 }}>Price</th>
                <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', opacity: 0.5 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '16px 0', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '16px 0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>₦{item.price.toLocaleString()}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600 }}>₦{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
            <div style={{ width: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ opacity: 0.5 }}>Subtotal</span>
                <span>₦{calculatedTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #1a1a1a', marginTop: '12px' }}>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>₦{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '30px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '20px', 
            display: 'flex', 
            gap: '30px', 
            alignItems: 'center' 
          }}>
            <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '12px' }}>
              <QRCodeSVG value="http://localhost:5173/join" size={100} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Join Bankdrop</div>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.6, lineHeight: 1.5 }}>
                Scan this QR code to download Bankdrop and experience the future of payments. 
                Fast, secure, and rewarding.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.3, fontSize: '10px' }}>
            Bankdrop Terminal Invoicing • Member FDIC • Powered by Bankdrop technology
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMenuPicker && (
          <motion.div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'flex-end'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMenuPicker(false)}
          >
            <motion.div 
              style={{ 
                width: '100%', 
                backgroundColor: 'var(--bg-secondary)', 
                padding: 'var(--spacing-lg)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Select from Menu"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} />}
                  autoFocus
                />
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredMenu.map(m => (
                  <div 
                    key={m.id} 
                    className={styles.orderRow} 
                    style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)' }}
                    onClick={() => handleAddItem(m)}
                  >
                    <div className={styles.orderInfo}>
                      <span className={styles.orderTitle}>{m.name}</span>
                      <span className={styles.orderSubtitle}>₦{m.price.toLocaleString()}</span>
                    </div>
                    <Plus size={20} color="var(--brand-accent)" />
                  </div>
                ))}
              </div>

              <Button fullWidth variant="secondary" onClick={() => setShowMenuPicker(false)} style={{ marginTop: '16px' }}>
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
