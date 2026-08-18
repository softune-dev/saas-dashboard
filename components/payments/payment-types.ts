import type { PaymentProvider } from "./payment-data";

/** Mock connection state held in the payments page (no backend yet). */
export type PaymentConnection = {
  provider: PaymentProvider;
  /** COD optional fee note / Manual payment number / gateway label */
  label?: string;
  /** Optional COD fee in ৳ (display only). */
  codFee?: string;
  /** Manual: merchant payment number shown to customers. */
  paymentNumber?: string;
  /** Manual: which wallets they accept for instructions. */
  wallets?: ("bkash" | "nagad")[];
  /** Gateway: masked key hint once connected. */
  apiKeyHint?: string;
  /** Gateway: optional store/merchant id. */
  merchantId?: string;
};
