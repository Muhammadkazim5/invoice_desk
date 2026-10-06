import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Not exposed over HTTP (no POST /invoices endpoint is part of this API's
 * scope) — used internally by InvoicesService.create, which the seed script
 * calls so seeded invoices go through the same duplicate-detection path as
 * any future ingestion route.
 */
export class CreateInvoiceDto {
  @ApiProperty() @IsString() @MinLength(1) invoiceNumber!: string;

  @ApiProperty() @IsString() @MinLength(1) vendorName!: string;

  @ApiProperty({ description: 'Amount in integer cents' })
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @ApiProperty({ default: 'USD' }) @IsString() @Length(3, 3) currency!: string;

  @ApiProperty() @IsISO8601() issueDate!: string;

  @ApiProperty() @IsISO8601() dueDate!: string;

  @ApiProperty() @IsString() @MaxLength(5000) description!: string;
}
