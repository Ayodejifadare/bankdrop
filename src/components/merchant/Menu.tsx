import React, { useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import type { MenuItem } from '../../context/MerchantContext';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Package, 
  Zap, 
  Repeat, 
  Archive, 
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MerchantUI.module.css';

interface MenuManagerProps {
  initialAdding?: boolean;
  onAddingComplete?: () => void;
}

interface MenuFormProps {
  item?: MenuItem | null;
  onSave: (data: Partial<MenuItem>) => void;
  onCancel: () => void;
  categories: string[];
}

const MenuForm: React.FC<MenuFormProps> = ({ item, onSave, onCancel, categories }) => {
  const [formData, setFormData] = useState<Partial<MenuItem>>(item || {
    name: '',
    price: 0,
    category: 'Main',
    type: 'item',
    billingCycle: 'monthly'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && (formData.price !== undefined)) {
      onSave(formData);
    }
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'var(--bg-tertiary)', 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--brand-accent)',
        marginBottom: '12px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>
          {item ? 'Edit Menu Item' : 'New Menu Item'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Input
            label="Item Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Margherita Pizza"
            required 
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MenuItem['type'] })}
              options={[
                { value: 'item', label: 'Product / Item' },
                { value: 'service', label: 'Service' },
                { value: 'subscription', label: 'Subscription' }
              ]}
            />
            {formData.type === 'subscription' && (
              <Select
                label="Billing Cycle"
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as MenuItem['billingCycle'] })}
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
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required 
            />
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories.slice(1).map(cat => ({ value: cat, label: cat }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
            <Button type="submit" variant="accent" fullWidth>{item ? 'Save' : 'Add'}</Button>
            <Button type="button" variant="ghost" fullWidth onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export const MenuManager: React.FC<MenuManagerProps> = ({ initialAdding, onAddingComplete }) => {
  const { 
    state, 
    addMenuItem, 
    updateMenuItem, 
    archiveMenuItem, 
    restoreMenuItem, 
    deleteMenuItem 
  } = useMerchant();

  const [view, setView] = useState<'active' | 'archived'>('active');
  const [isAdding, setIsAdding] = useState(initialAdding || false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const categories = ['All', 'Main', 'Appetizer', 'Beverage', 'Dessert'];
  const [activeCategory, setActiveCategory] = useState('All');

  const handleSave = (data: Partial<MenuItem>) => {
    if (editingId) {
      const existing = state.menu.find(m => m.id === editingId);
      if (existing) {
        updateMenuItem({ ...existing, ...data as MenuItem });
      }
      setEditingId(null);
    } else {
      addMenuItem({
        id: Date.now().toString(),
        name: data.name!,
        price: Number(data.price),
        category: data.category || 'Main',
        type: data.type || 'item',
        status: 'active',
        billingCycle: data.type === 'subscription' ? data.billingCycle : undefined
      });
      setIsAdding(false);
      onAddingComplete?.();
    }
  };

  const menuToDisplay = state.menu.filter(item => 
    item.status === (view === 'active' ? 'active' : 'archived') &&
    (activeCategory === 'All' || item.category === activeCategory)
  );

  return (
    <div className={styles.menuManager}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 className={styles.title}>Menu Management</h2>
          <Button variant="accent" size="small" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add Item
          </Button>
        </div>

        {/* View Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px'
        }}>
          <button 
            onClick={() => setView('active')}
            style={{
              padding: '8px 4px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'transparent',
              border: 'none',
              color: view === 'active' ? 'var(--brand-accent)' : 'var(--text-secondary)',
              borderBottom: view === 'active' ? '2px solid var(--brand-accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Active Items ({state.menu.filter(m => m.status === 'active').length})
          </button>
          <button 
            onClick={() => setView('archived')}
            style={{
              padding: '8px 4px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'transparent',
              border: 'none',
              color: view === 'archived' ? 'var(--brand-accent)' : 'var(--text-secondary)',
              borderBottom: view === 'archived' ? '2px solid var(--brand-accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Archive ({state.menu.filter(m => m.status === 'archived').length})
          </button>
        </div>

        {/* Category Pills */}
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

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
        <AnimatePresence>
          {isAdding && (
            <MenuForm 
              categories={categories} 
              onSave={handleSave} 
              onCancel={() => { setIsAdding(false); onAddingComplete?.(); }} 
            />
          )}

          {menuToDisplay.map(item => (
            <React.Fragment key={item.id}>
              {editingId === item.id ? (
                <MenuForm 
                  item={item}
                  categories={categories}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
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
                    {view === 'active' ? (
                      <>
                        <button onClick={() => setEditingId(item.id)} style={{ color: 'var(--text-secondary)', padding: '6px' }}><Edit3 size={18} /></button>
                        <button onClick={() => archiveMenuItem(item.id)} style={{ color: 'var(--text-muted)', padding: '6px' }}><Archive size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => restoreMenuItem(item.id)} style={{ color: 'var(--brand-accent)', padding: '6px' }}><RefreshCcw size={18} /></button>
                        <button onClick={() => deleteMenuItem(item.id)} style={{ color: '#ff4d4d', padding: '6px' }}><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>

      {menuToDisplay.length === 0 && !isAdding && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.1, marginBottom: '16px', margin: '0 auto' }} />
          <p>{view === 'active' ? 'No active items in this category.' : 'No archived items.'}</p>
        </div>
      )}
    </div>
  );
};
