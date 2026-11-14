import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';

import { PaymentMethod } from '../../../../generated/prisma/client.js';

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

  // Apenas para testes: "failure" simula um pagamento recusado.
  @IsOptional()
  @IsIn(['success', 'failure'])
  simulate?: 'success' | 'failure';
}
