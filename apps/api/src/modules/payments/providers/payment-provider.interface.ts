export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export type ChargeInput = {
  amount: string;
  method: string;
  phone?: string;
  simulate?: 'success' | 'failure';
};

export type ChargeResult = {
  success: boolean;
  reference: string;
  failureReason?: string;
};

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}
