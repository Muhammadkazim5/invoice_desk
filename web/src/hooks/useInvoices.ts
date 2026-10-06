import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvoice,
  fetchInvoiceCounts,
  fetchInvoices,
  updateInvoiceStatus,
} from '../api/invoices';
import type { InvoiceListStatusFilter, UpdateStatusPayload } from '../types/invoice';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (status?: InvoiceListStatusFilter) => ['invoices', 'list', status ?? 'all'] as const,
  counts: ['invoices', 'counts'] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const,
};

export function useInvoiceList(status?: InvoiceListStatusFilter) {
  return useQuery({
    queryKey: invoiceKeys.list(status),
    queryFn: () => fetchInvoices(status),
  });
}

export function useInvoiceCounts() {
  return useQuery({
    queryKey: invoiceKeys.counts,
    queryFn: fetchInvoiceCounts,
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => fetchInvoice(id),
    enabled: id.length > 0,
  });
}

export function useUpdateInvoiceStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStatusPayload) => updateInvoiceStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
