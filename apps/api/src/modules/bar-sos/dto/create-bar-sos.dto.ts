import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBarSosDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
