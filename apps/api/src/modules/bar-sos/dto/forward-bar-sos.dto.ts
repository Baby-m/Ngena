import { IsUUID } from 'class-validator';

export class ForwardBarSosDto {
  @IsUUID()
  managerId!: string;
}
