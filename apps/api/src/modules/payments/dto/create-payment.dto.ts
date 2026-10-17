import { IsEnum, IsIn, IsOptional, IsUUID, Matches } from 'class-validator';

import { PaymentMethod } from '../../../../generated/prisma/client.js';

export class CreatePaymentDto {
  @IsUUID()
  ticketTypeId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @Matches(/^\+?\d{9,15}$/)
  phone?: string;

  // So para testes: "failure" faz o pagamento falhar
  @IsOptional()
  @IsIn(['success', 'failure'])
  simulate?: 'success' | 'failure';
}
