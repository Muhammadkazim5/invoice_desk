import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { InvoiceStatus } from '../invoice-status.enum';

export const UPDATABLE_STATUSES = [
  InvoiceStatus.APPROVED,
  InvoiceStatus.REJECTED,
  InvoiceStatus.NEEDS_REVIEW,
] as const;

export type UpdatableInvoiceStatus = (typeof UPDATABLE_STATUSES)[number];

export class UpdateStatusDto {
  @ApiProperty({ enum: UPDATABLE_STATUSES, example: InvoiceStatus.APPROVED })
  @IsIn(UPDATABLE_STATUSES)
  status!: UpdatableInvoiceStatus;

  @ApiPropertyOptional({
    description:
      'Required (non-empty) when rejecting; optional when approving or flagging for review.',
    example: 'Amount does not match the signed purchase order.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
