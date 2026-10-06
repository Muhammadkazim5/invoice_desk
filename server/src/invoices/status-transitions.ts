import { HttpStatus } from '@nestjs/common';
import { AppException } from '../common/exceptions/app.exception';
import { InvoiceStatus } from './invoice-status.enum';

/**
 * The full state machine for invoice review. `approved` and `rejected` are
 * terminal: once reached, no further transition is allowed.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<InvoiceStatus, readonly InvoiceStatus[]>> = {
  [InvoiceStatus.PROCESSING]: [
    InvoiceStatus.APPROVED,
    InvoiceStatus.REJECTED,
    InvoiceStatus.NEEDS_REVIEW,
  ],
  [InvoiceStatus.NEEDS_REVIEW]: [InvoiceStatus.APPROVED, InvoiceStatus.REJECTED],
  [InvoiceStatus.APPROVED]: [],
  [InvoiceStatus.REJECTED]: [],
};

export function isFinalStatus(status: InvoiceStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] as InvoiceStatus[]).includes(to);
}

/**
 * Throws a 400 if rejecting without a note, or a 409 if the transition is not
 * allowed from the invoice's current status. Callers should run this inside
 * the same transaction that performs the update.
 */
export function assertValidStatusTransition(
  from: InvoiceStatus,
  to: InvoiceStatus,
  note: string | undefined,
): void {
  if (to === InvoiceStatus.REJECTED && (!note || note.trim().length === 0)) {
    throw new AppException(
      'NOTE_REQUIRED',
      'A non-empty note is required when rejecting an invoice',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (!canTransition(from, to)) {
    throw new AppException(
      'INVALID_TRANSITION',
      `Cannot transition invoice from "${from}" to "${to}"`,
      HttpStatus.CONFLICT,
    );
  }
}
