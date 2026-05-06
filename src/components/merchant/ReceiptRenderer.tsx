import React from 'react';
import type { PastOrder } from '../../types/merchant';
import { formatCurrency } from '../../utils/formatters';

interface ReceiptRendererProps {
  order: PastOrder;
  merchantName: string;
}

export const ReceiptRenderer: React.FC<ReceiptRendererProps> = ({ order, merchantName }) => {
  return (
    <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
      <div 
        id={`receipt-${order.id}`}
        style={{ 
          width: '80mm', 
          padding: '10mm', 
          backgroundColor: '#ffffff', 
          color: '#000000',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>BANKDROP</div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>{merchantName}</div>
        <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
        <div style={{ marginBottom: '10px' }}>
          Check: #{order.checkId}<br />
          Order ID: {order.id}<br />
          Date: {new Date(order.timestamp).toLocaleString()}
        </div>
        <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />
        {order.orders.map((o, i) => {
          const snapshotPrice = o.priceAtOrder || 0;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>{o.quantity} {o.name}</span>
              <span>{formatCurrency(snapshotPrice * o.quantity)}</span>
            </div>
          );
        })}
        <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }} />
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px' }}>
          Thank you for your business!<br />
          Powered by Bankdrop
        </div>
      </div>
    </div>
  );
};
