import React from 'react';
import type { Invoice, InvoiceItem, Installment } from '../../types/merchant';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/formatters';

interface InvoicePDFContentProps {
  invoice: Invoice;
  merchantName: string;
}

export const InvoicePDFContent: React.FC<InvoicePDFContentProps> = ({ invoice, merchantName }) => {
  return (
    <div 
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
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#000' }}>INVOICE</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.7 }}>Issued by {merchantName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>BANKDROP</div>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.7 }}>#{invoice.id}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Bill To</h4>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{invoice.customerName}</p>
          {invoice.customerEmail && <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.7 }}>{invoice.customerEmail}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Date</h4>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{new Date(invoice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Description</th>
            <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Price</th>
            <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: InvoiceItem) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
              <td style={{ padding: '16px 0', fontWeight: 600 }}>{item.name || 'Custom Service'}</td>
              <td style={{ textAlign: 'center', padding: '16px 0' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '16px 0' }}>{formatCurrency(item.price)}</td>
              <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: '300px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Payment Link</h4>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <QRCodeSVG 
              value={`${window.location.origin}/#/pay/${invoice.id}`}
              size={100}
              level="H"
            />
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.5, lineHeight: 1.4 }}>
              Scan this QR code to view the secure paylink and complete your payment via Bank Transfer, Card, or USSD.
            </p>
          </div>
          
          {invoice.paymentPlan && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>Payment Schedule</h4>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Upfront Deposit</td>
                    <td style={{ padding: '8px 0', opacity: 0.5 }}>Paid Now</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(invoice.paymentPlan?.depositAmount || 0)}</td>
                  </tr>
                  {(invoice.paymentPlan?.installments || []).map((inst: Installment) => (
                    <tr key={inst.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>{inst.label}</td>
                      <td style={{ padding: '8px 0', opacity: 0.5 }}>
                        {inst.dueDate === 'on_delivery' ? 'Due on Delivery' : new Date(inst.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(inst.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', opacity: 0.6 }}>
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.items.reduce((sum: number, i: InvoiceItem) => sum + (i.price * i.quantity), 0))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid #000', fontSize: '20px', fontWeight: 800 }}>
            <span>Total Amount</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '60px', borderTop: '1px solid #f0f0f0', fontSize: '11px', opacity: 0.4, textAlign: 'center' }}>
        Thank you for your business. This invoice was generated via Bankdrop Merchant Services.
      </div>
    </div>
  );
};
