import { IsUUID } from 'class-validator';

export class AssignBarStaffDto {
  @IsUUID()
  userId!: string;
}
