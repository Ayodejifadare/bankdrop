import React, { useState, useRef, useMemo } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { Invoice, InvoiceItem, MenuItem, Installment } from '../../types/merchant';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import styles from './MerchantUI.module.css';
import { 
  X,
  Check as CheckIcon,
  Plus, 
  Minus,
  Trash2, 
  Search, 
  Share2,
  Download,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoicePDFContent } from './InvoicePDFContent';
import { PaymentPlanConfigurator } from './PaymentPlanConfigurator';
import { formatCurrency } from '../../utils/formatters';

interface InvoiceBuilderProps {
  onClose: () => void;
  initialData?: Invoice | null;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose, initialData }) => {
  const { state, createInvoice, updateInvoice } = useMerchant();
  const [step, setStep] = useState<'build' | 'plan' | 'share'>(initialData ? 'build' : 'build');
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || []);
  const [totalOverride, setTotalOverride] = useState<number | null>(initialData?.total || null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(initialData?.id || null);
  
  // Payment Plan state
  const [hasPlan, setHasPlan] = useState(!!initialData?.paymentPlan?.installments);
  const [depositPercent, setDepositPercent] = useState(() => {
    if (initialData?.paymentPlan?.depositAmount && initialData.total) {
      return Math.round((initialData.paymentPlan.depositAmount * 100) / initialData.total);
    }
    return 50;
  });

  const [planMode, setPlanMode] = useState<'delivery' | 'date' | 'installments'>(() => {
    const freq = initialData?.paymentPlan?.frequency;
    if (freq === 'scheduled') return 'date';
    if (freq === 'on_delivery' || !freq) return 'delivery';
    return 'installments';
  });

  const [installmentCount, setInstallmentCount] = useState(initialData?.paymentPlan?.installments?.length || 3);
  const [installmentFrequency, setInstallmentFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>(() => {
    const freq = initialData?.paymentPlan?.frequency;
    if (freq === 'weekly' || freq === 'bi-weekly' || freq === 'monthly') return freq;
    return 'monthly';
  });

  const [scheduledDate, setScheduledDate] = useState(() => {
    if (initialData?.paymentPlan?.frequency === 'scheduled' && initialData.paymentPlan.installments[0]) {
      const date = initialData.paymentPlan.installments[0].dueDate;
      if (date && date !== 'on_delivery') return date.split('T')[0];
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // Helper to map UI state to schema frequency
  const getFrequencyFromMode = () => {
    if (planMode === 'installments') return installmentFrequency;
    if (planMode === 'date') return 'scheduled';
    return 'on_delivery';
  };

  const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = totalOverride !== null ? totalOverride : calculatedTotal;

  const depositAmount = Math.round((finalTotal * depositPercent) / 100);
  const remainingAmount = finalTotal - depositAmount;

  // Generate artifacts for current plan
  const installments: Installment[] = useMemo(() => {
    if (!hasPlan) return [];
    
    if (planMode === 'delivery' || planMode === 'date') {
      return [{
        id: 'bal-1',
        label: 'Balance Payment',
        amount: remainingAmount,
        dueDate: planMode === 'date' ? scheduledDate : 'on_delivery',
        status: 'pending'
      }];
    }

    // Generate multi-installments (planMode === 'installments')
    const perInstallment = Math.round(remainingAmount / installmentCount);
    const schedule: Installment[] = [];
    
    const now = new Date();
    for (let i = 0; i < installmentCount; i++) {
      const date = new Date(now);
      if (installmentFrequency === 'monthly') {
        date.setMonth(date.getMonth() + (i + 1));
      } else if (installmentFrequency === 'bi-weekly') {
        date.setDate(date.getDate() + ((i + 1) * 14));
      } else {
        date.setDate(date.getDate() + ((i + 1) * 7));
      }
      
      schedule.push({
        id: `inst-${i}`,
        label: `Installment ${i + 1} of ${installmentCount}`,
        amount: i === installmentCount - 1 ? remainingAmount - (perInstallment * (installmentCount - 1)) : perInstallment,
        dueDate: date.toISOString(),
        status: 'pending'
      });
    }
    return schedule;
  }, [hasPlan, planMode, remainingAmount, installmentCount, installmentFrequency, scheduledDate]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenuPicker, setShowMenuPicker] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editingItem = items.find(i => i.id === editingItemId);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleAddItem = (menuItem: MenuItem) => {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newItem: InvoiceItem = {
      id: itemId,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1
    };
    setItems([...items, newItem]);
    setShowMenuPicker(false);
  };

  const addCustomItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: '',
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
    if (initialData) {
      const updatedInvoice: Invoice = {
        ...initialData,
        customerName,
        items,
        total: finalTotal,
        paymentPlan: hasPlan ? {
          depositAmount,
          installments,
          frequency: getFrequencyFromMode()
        } : undefined
      };
      updateInvoice(updatedInvoice);
      setGeneratedInvoiceId(updatedInvoice.id);
      setStep('share');
    } else {
      const invoiceNum = Math.floor(Math.random() * 9000) + 1000;
      const newInvoice: Invoice = {
        id: `INV-${invoiceNum}`,
        customerName,
        items,
        total: finalTotal,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        paymentPlan: hasPlan ? {
          depositAmount,
          installments,
          frequency: getFrequencyFromMode()
        } : undefined
      };
      createInvoice(newInvoice);
      setGeneratedInvoiceId(newInvoice.id);
      setStep('share');
    }
  };

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{ 
        flex: 1,
        minHeight: '100%',
        padding: 0,
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {step !== 'build' && (
              <button 
                onClick={() => setStep('build')}
                style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
            )}
            <h3>
              {step === 'build' ? 'New Invoice' : 'Share Invoice'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        {step === 'build' && (
          <div className={styles.builderScrollArea} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
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
                    <div 
                      key={item.id} 
                      className={styles.itemRowCompact} 
                      style={{ cursor: 'default' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input 
                          style={{ 
                            fontWeight: 600, 
                            color: 'var(--text-primary)', 
                            marginBottom: '4px',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            outline: 'none',
                            fontSize: '1rem'
                          }}
                          placeholder="Custom Service"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₦</span>
                          <input 
                            type="number"
                            style={{ 
                              width: '70px',
                              padding: '2px 6px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: 'var(--brand-accent)',
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px'
                            }}
                            value={item.price}
                            onChange={(e) => updateItem(item.id, { price: parseInt(e.target.value) || 0 })}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Σ</span>
                          <input 
                            type="number"
                            style={{ 
                              width: '80px',
                              padding: '2px 6px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: 'var(--brand-accent)',
                              backgroundColor: 'rgba(212, 175, 55, 0.05)',
                              border: '1px dashed var(--brand-accent)',
                              borderRadius: '4px'
                            }}
                            value={Math.round(item.price * item.quantity)}
                            onChange={(e) => {
                              const newLineTotal = parseInt(e.target.value) || 0;
                              updateItem(item.id, { price: Math.round(newLineTotal / item.quantity) });
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.stepperSmall}>
                          <button 
                            className={styles.stepperBtn} 
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                          <button 
                            className={styles.stepperBtn} 
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          style={{ color: 'var(--text-muted)', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ 
              marginTop: '4px', 
              padding: '16px', 
              backgroundColor: 'var(--bg-tertiary)', 
              borderRadius: '12px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatCurrency(calculatedTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Final Total</span>
                  {totalOverride !== null && (
                    <span style={{ 
                      fontSize: '10px', 
                      backgroundColor: 'var(--brand-accent)', 
                      color: 'black', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      Custom
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {totalOverride !== null && (
                    <button 
                      onClick={() => setTotalOverride(null)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--brand-accent)',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>₦</span>
                    <input 
                      type="number"
                      style={{ 
                        textAlign: 'right', 
                        padding: '8px 12px 8px 24px', 
                        borderRadius: '8px',
                        border: totalOverride !== null ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                        backgroundColor: totalOverride !== null ? 'rgba(212, 175, 55, 0.05)' : 'var(--bg-primary)',
                        boxShadow: totalOverride !== null ? '0 0 10px rgba(212, 175, 55, 0.1)' : 'none',
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        width: '140px',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      value={finalTotal}
                      onChange={(e) => setTotalOverride(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <PaymentPlanConfigurator 
              hasPlan={hasPlan}
              setHasPlan={setHasPlan}
              depositPercent={depositPercent}
              setDepositPercent={setDepositPercent}
              planMode={planMode}
              setPlanMode={setPlanMode}
              installmentFrequency={installmentFrequency}
              setInstallmentFrequency={setInstallmentFrequency}
              installmentCount={installmentCount}
              setInstallmentCount={setInstallmentCount}
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
              installments={installments}
              depositAmount={depositAmount}
            />
          </div>
        )}

        {step === 'build' && (
          <motion.button 
            className={styles.builderFabExtended}
            style={{ x: '-50%' }}
            initial={{ x: '-50%', opacity: 0, y: 20 }}
            animate={{ x: '-50%', opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, x: '-50%' }}
            whileTap={{ scale: 0.98, x: '-50%' }}
            disabled={!customerName || items.length === 0}
            onClick={handleSaveInvoice}
          >
            <CheckIcon size={24} /> {initialData ? 'Update & Save Changes' : 'Generate Invoice & Paylink'}
          </motion.button>
        )}

        <AnimatePresence>
          {editingItemId && editingItem && (
            <motion.div 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.85)', 
                zIndex: 1200,
                padding: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItemId(null)}
            >
              <motion.div 
                style={{ 
                  width: '100%', 
                  backgroundColor: 'var(--bg-secondary)', 
                  padding: 'var(--spacing-xl)',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px'
                }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Edit Name"
                      placeholder="Custom Service"
                      value={editingItem.name}
                      onChange={(e) => updateItem(editingItem.id, { name: e.target.value })}
                    />
                  </div>
                  <button onClick={() => setEditingItemId(null)} style={{ padding: '8px', marginLeft: '12px', marginTop: '28px' }}>
                    <X size={24} />
                  </button>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Unit Price (₦)</label>
                  <input 
                    type="number"
                    style={{ 
                      width: '100%',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--brand-accent)'
                    }}
                    value={editingItem.price}
                    onChange={(e) => updateItem(editingItem.id, { price: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <Button fullWidth variant="accent" size="large" onClick={() => setEditingItemId(null)}>
                  Save Changes
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
      
      {/* Hidden PDF Component for html2canvas */}
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
        {generatedInvoiceId && (
          <div ref={invoiceRef}>
            <InvoicePDFContent 
              merchantName={state.name}
              invoice={state.invoices.find(inv => inv.id === generatedInvoiceId) || {
                id: generatedInvoiceId,
                customerName,
                items,
                total: finalTotal,
                status: 'unpaid',
                createdAt: new Date().toISOString(),
                paymentPlan: hasPlan ? { 
                  depositAmount, 
                  installments,
                  frequency: getFrequencyFromMode()
                } : undefined
              }}
            />
          </div>
        )}
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
                      <span className={styles.orderSubtitle}>{formatCurrency(m.price)}</span>
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
