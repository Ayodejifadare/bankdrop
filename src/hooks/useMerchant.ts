import { useContext, useMemo } from 'react';
import { MerchantOpsContext, type MerchantOpsContextType } from '../context/MerchantContext';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { useMerchantMenu } from '../context/MerchantMenuContext';

/**
 * Unified hook that joins Merchant Operations, Authentication, and Menu domains.
 * Maintains backward compatibility with components that expect a single useMerchant() hook.
 */
export const useMerchant = () => {
  const ops = useContext(MerchantOpsContext) as MerchantOpsContextType;
  const auth = useMerchantAuth();
  const menu = useMerchantMenu();

  if (!ops) {
    throw new Error('useMerchant must be used within MerchantOpsProvider');
  }

  return useMemo(() => ({
    ...ops,
    ...auth,
    ...menu,
    isSaving: ops.isSaving || menu.isSaving,
    isLoading: ops.isLoading || menu.isLoading,
    // Ensure 'state' contains menu/rewards for components that expect it
    state: { ...ops.state, menu: menu.menu, rewards: menu.rewards }
  }), [ops, auth, menu]);
};
