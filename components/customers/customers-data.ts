/**
 * Mock customer fixtures removed. There is no Customer model in the backend —
 * this page derives a read-only list by deduping Order.customer JSONB across
 * real orders (see customers-view.tsx).
 */

export type DerivedCustomer = {
  /** Dedup key (email:… / phone:… / order:…). */
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  /** Sum of order.total_cents across this customer's orders. */
  spentCents: number;
  /** Earliest order created_at for this customer. */
  firstOrderAt: string;
  /** Most recent order created_at. */
  lastOrderAt: string;
};
