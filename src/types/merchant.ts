export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: 'item' | 'service' | 'subscription';
  status: 'active' | 'archived';
  billingCycle?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  isPrimary: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Installment {
  id: string;
  label: string;
  amount: number;
  dueDate: string | 'on_delivery';
  status: 'pending' | 'paid';
}

export interface PaymentPlan {
  depositAmount: number;
  installments: Installment[];
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'on_delivery' | 'scheduled';
}

export interface Invoice {
  id: string;
  customerName: string;
  customerEmail?: string;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid';
  createdAt: string;
  paymentPlan?: PaymentPlan;
}

export interface Check {
  id: string;
  status: 'open' | 'active' | 'paid';
  enabled: boolean;
  orders: OrderItem[];
  total: number;
  sessionId?: string;
  archivedAt?: string;
  lifetimeOrders?: number;
  lifetimeRevenue?: number;
  bankAccountId?: string;
  paymentMode?: 'itemized' | 'quickpay';
}

export interface Reward {
  id: string;
  title: string;
  minSpend: number;
  rewardValue: number;
  rewardUnit: 'cash' | 'percentage';
  status: 'active' | 'paused' | 'archived';
  expiryDate: string | null;
}

export interface PendingVerification {
  id: string;
  type: 'check' | 'invoice' | 'quickpay';
  targetId: string;
  amount: number;
  method: 'Transfer' | 'POS' | 'Cash';
  timestamp: string;
  status: 'pending' | 'confirmed' | 'declined';
}

export interface MerchantActivity {
  id: string;
  type: 'check_payment' | 'invoice_payment' | 'quickpay';
  amount: number;
  referenceId: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

export interface PastOrder {
  id: string;
  checkId: string;
  sessionId: string;
  orders: OrderItem[];
  total: number;
  timestamp: string;
}

export interface MerchantPreferences {
  currency: 'NGN' | 'USD';
  theme: 'light' | 'dark';
  notifications: boolean;
  autoPrintReceipts: boolean;
  tableResetOnPay: boolean;
}

export interface MerchantContactInfo {
  email: string;
  mobile: string;
}

export type MerchantView =
  | 'dashboard'
  | 'menu'
  | 'checks'
  | 'qr'
  | 'rewards'
  | 'profile'
  | 'settings'
  | 'activity_log'
  | 'invoice_builder'
  | 'check_settings';

export interface MerchantState {
  name: string;
  businessProfile?: string;
  businessCategory?: string;
  contactInfo?: MerchantContactInfo;
  bankAccounts: BankAccount[];
  menu: MenuItem[];
  checks: Check[];
  rewards: Reward[];
  invoices: Invoice[];
  pendingVerifications: PendingVerification[];
  activities: MerchantActivity[];
  orderHistory: PastOrder[];
  archivedSessions: { [sessionId: string]: PastOrder };
  preferences: MerchantPreferences;
}
