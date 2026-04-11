import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { MenuItem } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { Plus, Trash2, Edit3, BookOpen, Package, Zap, Repeat } from 'lucide-react';
import styles from './MerchantUI.module.css';

export const MenuManager: React.FC = () => {
  const { state, addMenuItem } = useMerchant();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'Main',
    type: 'item',
    billingCycle: 'monthly'
  });

  const categories = ['All', 'Main', 'Appetizer', 'Beverage', 'Dessert'];
  const [activeCategory, setActiveCategory] = useState('All');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.price) {
      addMenuItem({
        id: Date.now().toString(),
        name: newItem.name!,
        price: Number(newItem.price),
        category: newItem.category || 'Main',
        type: newItem.type || 'item',
        billingCycle: newItem.type === 'subscription' ? newItem.billingCycle : undefined
      });
      setIsAdding(false);
      setNewItem({ name: '', price: 0, category: 'Main' });
    }
  };

  const filteredMenu = activeCategory === 'All' 
    ? state.menu 
    : state.menu.filter(item => item.category === activeCategory);

  return (
    <div className={styles.menuManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 className={styles.title}>Menu Management</h2>
          <Button variant="accent" size="small" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add Item
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={styles.tabButton}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeCategory === cat ? 'var(--brand-accent)' : 'var(--bg-secondary)',
                color: activeCategory === cat ? '#000' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid var(--border-primary)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {isAdding && (
        <Card title="New Menu Item">
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <Input
              label="Item Name"
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <Select
                label="Type"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MenuItem['type'] })}
                options={[
                  { value: 'item', label: 'Product / Item' },
                  { value: 'service', label: 'Service' },
                  { value: 'subscription', label: 'Subscription' }
                ]}
              />
              {newItem.type === 'subscription' && (
                <Select
                  label="Billing Cycle"
                  value={newItem.billingCycle}
                  onChange={(e) => setNewItem({ ...newItem, billingCycle: e.target.value as MenuItem['billingCycle'] })}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]}
                />
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <Input
                label="Price (₦)"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                required 
              />
              <Select
                label="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                options={categories.slice(1).map(cat => ({ value: cat, label: cat }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
              <Button type="submit" variant="primary" fullWidth>Save Item</Button>
              <Button type="button" variant="ghost" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
        {filteredMenu.map(item => (
          <div 
            key={item.id} 
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'var(--bg-tertiary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: item.type === 'subscription' ? 'var(--brand-accent)' : 'var(--text-secondary)'
              }}>
                {item.type === 'subscription' ? <Repeat size={20} /> : item.type === 'service' ? <Zap size={20} /> : <Package size={20} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  {item.type !== 'item' && (
                    <span style={{ 
                      fontSize: '0.625rem', 
                      padding: '2px 6px', 
                      backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                      color: 'var(--brand-accent)', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      {item.type}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.category} • ₦{item.price.toLocaleString()}
                  {item.type === 'subscription' && ` / ${item.billingCycle}`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ color: 'var(--text-secondary)' }}><Edit3 size={18} /></button>
              <button style={{ color: '#ff4d4d' }}><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && !isAdding && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>No items in this category.</p>
        </div>
      )}
    </div>
  );
};
