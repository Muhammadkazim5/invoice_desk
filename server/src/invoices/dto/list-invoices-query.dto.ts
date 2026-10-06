import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum InvoiceListStatusFilter {
  PROCESSING = 'processing',
  NEEDS_REVIEW = 'needs_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DECIDED = 'decided',
}

export class ListInvoicesQueryDto {
  @ApiPropertyOptional({
    enum: InvoiceListStatusFilter,
    description:
      'Filter invoices by status. "decided" returns approved and rejected invoices together.',
  })
  @IsOptional()
  @IsEnum(InvoiceListStatusFilter)
  status?: InvoiceListStatusFilter;
}
