// Mirrors server/src/invoices/dto/invoice-response.dto.ts and friends.

export type InvoiceStatus = 'processing' | 'needs_review' | 'approved' | 'rejected';

export type InvoiceListStatusFilter = InvoiceStatus | 'decided';

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  amountCents: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  duplicateOfId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateOfSummary {
  id: string;
  invoiceNumber: string;
  vendorName: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: InvoiceStatus | null;
  toStatus: InvoiceStatus;
  note: string | null;
  changedAt: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  description: string;
  reviewNote: string | null;
  duplicateOf: DuplicateOfSummary | null;
  statusHistory: StatusHistoryEntry[];
}

export interface InvoiceCounts {
  processing: number;
  needs_review: number;
  decided: number;
}

export type UpdatableInvoiceStatus = Exclude<InvoiceStatus, 'processing'>;

export interface UpdateStatusPayload {
  status: UpdatableInvoiceStatus;
  note?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}
