export type AppView = 'landing' | 'merchant' | 'customer' | 'profile';
export type CustomerPaymentType = 'check' | 'invoice' | 'quickpay' | 'occupied';

export interface AppRoute {
  view: AppView;
  type?: CustomerPaymentType;
  targetId?: string;
}

export type SplitMethod = 'items' | 'equal' | 'percentage' | 'custom';

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
  method: SplitMethod;
  participants: Participant[];
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
