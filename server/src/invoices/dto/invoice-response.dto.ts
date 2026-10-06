import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '../invoice-status.enum';

export class DuplicateOfSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() vendorName!: string;
}

export class InvoiceSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() vendorName!: string;
  @ApiProperty({ description: 'Amount in integer cents, e.g. 150000 = $1,500.00' })
  amountCents!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() issueDate!: string;
  @ApiProperty() dueDate!: string;
  @ApiProperty({ enum: InvoiceStatus }) status!: InvoiceStatus;
  @ApiPropertyOptional({ nullable: true, type: String }) duplicateOfId!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class StatusHistoryEntryDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ enum: InvoiceStatus, nullable: true }) fromStatus!: InvoiceStatus | null;
  @ApiProperty({ enum: InvoiceStatus }) toStatus!: InvoiceStatus;
  @ApiPropertyOptional({ nullable: true, type: String }) note!: string | null;
  @ApiProperty() changedAt!: Date;
}

export class InvoiceDetailDto extends InvoiceSummaryDto {
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) reviewNote!: string | null;
  @ApiPropertyOptional({ type: DuplicateOfSummaryDto, nullable: true })
  duplicateOf!: DuplicateOfSummaryDto | null;
  @ApiProperty({ type: [StatusHistoryEntryDto] })
  statusHistory!: StatusHistoryEntryDto[];
}

export class InvoiceCountsDto {
  @ApiProperty() processing!: number;
  @ApiProperty() needs_review!: number;
  @ApiProperty() decided!: number;
}
