import { apiClient } from './client';
import type {
  InvoiceCounts,
  InvoiceDetail,
  InvoiceListStatusFilter,
  InvoiceSummary,
  UpdateStatusPayload,
} from '../types/invoice';

export function fetchInvoices(status?: InvoiceListStatusFilter): Promise<InvoiceSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get<InvoiceSummary[]>(`/invoices${query}`);
}

export function fetchInvoiceCounts(): Promise<InvoiceCounts> {
  return apiClient.get<InvoiceCounts>('/invoices/counts');
}

export function fetchInvoice(id: string): Promise<InvoiceDetail> {
  return apiClient.get<InvoiceDetail>(`/invoices/${id}`);
}

export function updateInvoiceStatus(
  id: string,
  payload: UpdateStatusPayload,
): Promise<InvoiceDetail> {
  return apiClient.patch<InvoiceDetail>(`/invoices/${id}/status`, payload);
}
