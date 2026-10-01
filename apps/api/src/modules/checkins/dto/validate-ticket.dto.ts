import {
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @MinLength(5)
  code!: string;

  @IsUUID()
  gateId!: string;
}
