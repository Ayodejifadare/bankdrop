/**
 * Order Utilities
 * Centralizes flattening, selection, and reconciliation logic
 * for the "Unclaimed First" split payment system.
 */

import type { SelectedItem, SessionItem } from '../types/checkout';

export interface FlatItem {
  lineItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

/**
 * Flattens a list of order items into display-ready rows.
 * Each row corresponds to one line item (identified by its persistent ID).
 * Unlike the old system, this does NOT split quantity > 1 into individual units.
 */
export function flattenOrders(orders: any[]): FlatItem[] {
  if (!orders || orders.length === 0) return [];

  return orders.map((o) => ({
    lineItemId: o.id || '',
    name: o.name || 'Unknown',
    price: o.price || o.priceAtOrder || 0,
    quantity: o.quantity || 1,
    total: (o.price || o.priceAtOrder || 0) * (o.quantity || 1)
  }));
}

/**
 * Returns the selected items from a flattened list, using count-based selections.
 * Each returned FlatItem has its quantity set to the claimed count.
 */
export function getSelectedItems(flattened: FlatItem[], selections: SelectedItem[]): FlatItem[] {
  if (!selections || selections.length === 0) return [];

  return selections
    .map(sel => {
      const item = flattened.find(f => f.lineItemId === sel.lineItemId);
      if (!item || sel.count <= 0) return null;
      return {
        ...item,
        quantity: sel.count,
        total: item.price * sel.count
      };
    })
    .filter((item): item is FlatItem => item !== null);
}

/**
 * Calculates the total share from a list of selections against flattened items.
 */
export function calculateShare(flattened: FlatItem[], selections: SelectedItem[]): number {
  return getSelectedItems(flattened, selections)
    .reduce((sum, item) => sum + item.total, 0);
}

/**
 * "Unclaimed First" Reconciliation Algorithm
 * 
 * When a merchant modifies order quantities, this function adjusts all
 * participants' selections to fit within the new quantities, absorbing
 * reductions from the unclaimed pool first before touching any claims.
 * 
 * @param currentItems - The current merchant order items (with updated quantities)
 * @param allParticipants - All participants with their current selections
 * @returns Updated selections for each participant (keyed by participant ID)
 */
export function reconcileSelections(
  currentItems: { id: string; quantity: number }[],
  allParticipants: { id: string; selectedItems: SelectedItem[] }[]
): Map<string, SelectedItem[]> {
  const result = new Map<string, SelectedItem[]>();

  // Initialize with current selections
  allParticipants.forEach(p => {
    result.set(p.id, [...(p.selectedItems || []).map(s => ({ ...s }))]);
  });

  // Process each line item
  currentItems.forEach(item => {
    const totalClaimed = allParticipants.reduce((sum, p) => {
      const sel = (p.selectedItems || []).find(s => s.lineItemId === item.id);
      return sum + (sel?.count || 0);
    }, 0);

    const overflow = totalClaimed - item.quantity;

    if (overflow <= 0) {
      // Unclaimed pool can absorb any reduction. No changes needed.
      return;
    }

    // Need to reduce claims by `overflow` units.
    // Strategy: reduce from the largest claimant first (fairness).
    let remaining = overflow;

    // Build a list of claimants sorted by count descending
    const claimants = allParticipants
      .map(p => ({
        participantId: p.id,
        count: (p.selectedItems || []).find(s => s.lineItemId === item.id)?.count || 0
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    while (remaining > 0 && claimants.some(c => c.count > 0)) {
      // Find the current max
      const maxCount = claimants[0].count;

      // Find all claimants at the max level
      const atMax = claimants.filter(c => c.count === maxCount);

      // Reduce each by 1 in round-robin until we've absorbed the overflow
      for (const claimant of atMax) {
        if (remaining <= 0) break;
        claimant.count--;
        remaining--;
      }

      // Re-sort for next round
      claimants.sort((a, b) => b.count - a.count);
    }

    // Apply the corrected counts back to the result
    claimants.forEach(c => {
      const selections = result.get(c.participantId)!;
      const selIdx = selections.findIndex(s => s.lineItemId === item.id);
      if (selIdx >= 0) {
        if (c.count <= 0) {
          selections.splice(selIdx, 1);
        } else {
          selections[selIdx] = { ...selections[selIdx], count: c.count };
        }
      }
    });
  });

  // Clean up: remove selections for items that no longer exist
  const validItemIds = new Set(currentItems.map(i => i.id));
  result.forEach((selections, pId) => {
    result.set(pId, selections.filter(s => validItemIds.has(s.lineItemId)));
  });

  return result;
}

/**
 * Stability Guard: Migrate legacy numeric indices to count-based selections.
 * 
 * The old system used `selectedItemIndices: number[]` where indices were
 * calculated as `lineIdx * 1000 + unitIndex`. This function converts those
 * to the new `SelectedItem[]` format.
 * 
 * @param indices - Old-format numeric indices
 * @param sessionItems - Session items (may or may not have IDs)
 * @returns Migrated selections in the new count-based format
 */
export function migrateLegacySelections(
  indices: number[],
  sessionItems: SessionItem[]
): SelectedItem[] {
  if (!indices || indices.length === 0) return [];

  const counts = new Map<string, number>();

  indices.forEach(idx => {
    // Decode: lineIdx = Math.floor(idx / 1000), unitIdx = idx % 1000
    const lineIdx = Math.floor(idx / 1000);
    const item = sessionItems[lineIdx];
    if (!item) return;

    // Use item ID if available, otherwise fall back to a synthetic key
    const key = item.id || `legacy_${lineIdx}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([lineItemId, count]) => ({
    lineItemId,
    count
  }));
}
/**
 * Compares a merchant check's orders with a session's items to see if they are in sync.
 */
export const isCheckInSync = (orders: any[], sessionItems: any[]): boolean => {
  if (orders.length !== sessionItems.length) return false;
  
  // Sort both by ID to ensure order-independent comparison
  const sortedOrders = [...orders].sort((a, b) => (a.id || a.menuItemId).localeCompare(b.id || b.menuItemId));
  const sortedItems = [...sessionItems].sort((a, b) => a.id.localeCompare(b.id));

  return sortedOrders.every((o, idx) => {
    const s = sortedItems[idx];
    return (
      (o.id || o.menuItemId) === s.id &&
      o.quantity === s.quantity &&
      (o.priceAtOrder || 0) === s.price
    );
  });
};

/**
 * Transforms merchant OrderItems into SessionItems for the split session.
 */
export const transformToSessionItems = (orders: any[], menu: any[]): any[] => {
  return orders.map(o => {
    const menuItem = menu.find(m => m.id === o.menuItemId);
    return {
      id: o.id || o.menuItemId,
      name: o.name || menuItem?.name || 'Unknown Item',
      price: o.priceAtOrder || menuItem?.price || 0,
      quantity: o.quantity
    };
  });
};
