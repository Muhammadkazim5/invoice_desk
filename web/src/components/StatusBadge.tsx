import type { InvoiceStatus } from '../types/invoice';

const LABELS: Record<InvoiceStatus, string> = {
  processing: 'Processing',
  needs_review: 'Needs review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: InvoiceStatus }): JSX.Element {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}

export function DuplicateBadge(): JSX.Element {
  return (
    <span
      className="badge badge-duplicate"
      title="Vendor, invoice number, and amount match an existing invoice"
    >
      Possible duplicate
    </span>
  );
}
