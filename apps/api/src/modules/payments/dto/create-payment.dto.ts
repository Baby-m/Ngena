import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

import { PaymentMethod } from '../../../../generated/prisma/client.js';

// Uma compra pode ter 1 ou 2 bilhetes (o segundo é partilhado por convite).
export const MAX_TICKETS_PER_PURCHASE = 2;

export class CreatePaymentDto {
  @IsUUID()
  ticketTypeId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ValidateIf((dto: CreatePaymentDto) => dto.method !== PaymentMethod.CARD)
  @IsNotEmpty({ message: 'Phone is required for mobile payments' })
  @Matches(/^\+?\d{9,15}$/, {
    message: 'Phone must contain 9 to 15 digits',
  })
  phone?: string;

  // Número de bilhetes da compra. Por omissão, 1.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_TICKETS_PER_PURCHASE)
  quantity?: number;

  // Apenas para testes: "failure" simula um pagamento recusado.
  @IsOptional()
  @IsIn(['success', 'failure'])
  simulate?: 'success' | 'failure';
}
