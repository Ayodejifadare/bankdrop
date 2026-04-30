export type AppView = 'landing' | 'merchant' | 'customer' | 'profile';
export type CustomerPaymentType = 'check' | 'invoice' | 'quickpay' | 'occupied';

export interface AppRoute {
  view: AppView;
  type?: CustomerPaymentType;
  targetId?: string;
}

export type SplitMethod = 'items' | 'equal' | 'percentage' | 'custom' | 'full';

export interface SessionItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Participant {
  id: string;
  name: string;
  selectedItemIndices: number[];
  share: number;
  paid: boolean;
}

export interface SplitSession {
  id: string;
  checkId: string;
  businessName: string;
  method: SplitMethod;
  participants: Participant[];
  items: SessionItem[];
  createdAt: number;
  discount?: number;
  appliedBy?: string; // name of participant
}

export interface CustomerCheckout {
  checkId: string | null;
  splitSession: SplitSession | null;
  participantId: string;
  isSignedIn: boolean;
  appliedRewardId: string | null;
}
