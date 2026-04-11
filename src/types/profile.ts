export interface LinkedAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  isPrimary: boolean;
}

export interface VendorReward {
  vendorId: string;
  vendorName: string;
  balance: number;
  currency: string;
}

export interface Activity {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  entity: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}
