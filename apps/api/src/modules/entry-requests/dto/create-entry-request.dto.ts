import { IsUUID } from 'class-validator';

export class CreateEntryRequestDto {
  @IsUUID()
  gateId!: string;
}
