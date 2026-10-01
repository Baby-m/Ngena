import { IsString, MinLength } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @MinLength(5)
  code!: string;
}
