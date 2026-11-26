import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BarSosCategory } from '../../../../generated/prisma/client.js';

export class CreateBarSosDto {
  @IsEnum(BarSosCategory)
  category!: BarSosCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
