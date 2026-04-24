import { useMerchant } from '../context/MerchantContext';
import type { Check, PastOrder } from '../types/merchant';

interface ResolvedCheck {
  check: Check | null;
  archivedOrder: PastOrder | null;
  isValid: boolean;
  type: 'active' | 'archived' | 'not_found';
}

export const useResolvedCheck = (idOrSession: string): ResolvedCheck => {
  const { state: merchant } = useMerchant();

  if (!idOrSession) {
    return { check: null, archivedOrder: null, isValid: false, type: 'not_found' };
  }

  // 1. Try finding an active check (by ID or Session ID)
  const activeCheck = merchant.checks.find(
    c => c.id === idOrSession || c.sessionId === idOrSession
  );

  if (activeCheck) {
    return {
      check: activeCheck,
      archivedOrder: null,
      isValid: true,
      type: 'active'
    };
  }

  // 2. Try finding in archives
  const archivedOrder = merchant.archivedSessions[idOrSession];
  if (archivedOrder) {
    return {
      check: null,
      archivedOrder,
      isValid: true,
      type: 'archived'
    };
  }

  return {
    check: null,
    archivedOrder: null,
    isValid: false,
    type: 'not_found'
  };
};
