import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';

export function normalizeVendorName(vendorName: string): string {
  return vendorName.trim().toLowerCase();
}

export type DuplicateCandidate = Pick<Invoice, 'vendorName' | 'invoiceNumber'>;

export function isDuplicateMatch(
  candidate: DuplicateCandidate,
  vendorName: string,
  invoiceNumber: string,
): boolean {
  return (
    normalizeVendorName(candidate.vendorName) === normalizeVendorName(vendorName) &&
    candidate.invoiceNumber === invoiceNumber
  );
}

/**
 * Pure matcher used by the unit tests: given a set of existing invoices,
 * returns the first one whose vendor (case/whitespace-insensitive) and
 * invoice number match.
 */
export function findDuplicate<T extends DuplicateCandidate>(
  existingInvoices: readonly T[],
  vendorName: string,
  invoiceNumber: string,
): T | undefined {
  return existingInvoices.find((invoice) => isDuplicateMatch(invoice, vendorName, invoiceNumber));
}

/**
 * Thin injectable wrapper that performs the same lookup against Postgres,
 * using the (lower(vendor_name), invoice_number) index instead of loading
 * every invoice into memory.
 */
@Injectable()
export class DuplicateDetectorService {
  async findExistingDuplicate(
    repository: Repository<Invoice>,
    vendorName: string,
    invoiceNumber: string,
  ): Promise<Invoice | null> {
    const match = await repository
      .createQueryBuilder('invoice')
      .where('lower(trim(invoice.vendorName)) = lower(trim(:vendorName))', { vendorName })
      .andWhere('invoice.invoiceNumber = :invoiceNumber', { invoiceNumber })
      .orderBy('invoice.createdAt', 'ASC')
      .getOne();
    return match ?? null;
  }
}
