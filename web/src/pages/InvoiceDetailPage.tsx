import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RejectDialog } from '../components/RejectDialog';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { useInvoiceDetail, useUpdateInvoiceStatus } from '../hooks/useInvoices';
import type { InvoiceStatus } from '../types/invoice';
import { ApiError } from '../api/client';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';

const FINAL_STATUSES: InvoiceStatus[] = ['approved', 'rejected'];

export function InvoiceDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const invoiceId = id ?? '';
  const { showToast } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);

  const detailQuery = useInvoiceDetail(invoiceId);
  const mutation = useUpdateInvoiceStatus(invoiceId);

  if (detailQuery.isLoading) {
    return (
      <main className="page">
        <p className="state-message">Loading invoice…</p>
      </main>
    );
  }

  if (detailQuery.isError) {
    const message =
      detailQuery.error instanceof ApiError && detailQuery.error.statusCode === 404
        ? 'This invoice could not be found.'
        : `Couldn't load this invoice: ${detailQuery.error.message}`;
    return (
      <main className="page">
        <p className="state-message state-error" role="alert">
          {message}
        </p>
        <Link to="/">Back to invoices</Link>
      </main>
    );
  }

  const invoice = detailQuery.data;
  if (!invoice) {
    return (
      <main className="page">
        <p className="state-message">Loading invoice…</p>
      </main>
    );
  }
  const isFinal = FINAL_STATUSES.includes(invoice.status);

  const handleApprove = (): void => {
    mutation.mutate(
      { status: 'approved' },
      {
        onSuccess: () => showToast('Invoice approved.', 'success'),
        onError: (error) => showToast(`Approve failed: ${error.message}`, 'error'),
      },
    );
  };

  const handleReject = (note: string): void => {
    mutation.mutate(
      { status: 'rejected', note },
      {
        onSuccess: () => {
          showToast('Invoice rejected.', 'success');
          setRejectOpen(false);
        },
        onError: (error) => showToast(`Reject failed: ${error.message}`, 'error'),
      },
    );
  };

  return (
    <main className="page invoice-detail">
      <Link to="/" className="back-link">
        ← Back to invoices
      </Link>

      <div className="invoice-detail-header">
        <div>
          <h1>{invoice.invoiceNumber}</h1>
          <p className="invoice-detail-vendor">{invoice.vendorName}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <dl className="invoice-fields">
        <div>
          <dt>Amount</dt>
          <dd>{formatMoney(invoice.amountCents, invoice.currency)}</dd>
        </div>
        <div>
          <dt>Issue date</dt>
          <dd>{formatDate(invoice.issueDate)}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>{formatDate(invoice.dueDate)}</dd>
        </div>
        <div className="invoice-field-wide">
          <dt>Description</dt>
          <dd>{invoice.description}</dd>
        </div>
        {invoice.duplicateOf && (
          <div className="invoice-field-wide">
            <dt>Possible duplicate of</dt>
            <dd>
              <Link to={`/invoices/${invoice.duplicateOf.id}`}>
                {invoice.duplicateOf.invoiceNumber} — {invoice.duplicateOf.vendorName}
              </Link>
            </dd>
          </div>
        )}
        {invoice.reviewNote && (
          <div className="invoice-field-wide">
            <dt>Review note</dt>
            <dd>{invoice.reviewNote}</dd>
          </div>
        )}
      </dl>

      {!isFinal && (
        <div className="invoice-actions">
          <button type="button" onClick={handleApprove} disabled={mutation.isPending}>
            {mutation.isPending ? 'Working…' : 'Approve'}
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={() => setRejectOpen(true)}
            disabled={mutation.isPending}
          >
            Reject
          </button>
        </div>
      )}

      <section className="status-history" aria-label="Status history">
        <h2>Status history</h2>
        {invoice.statusHistory.length === 0 ? (
          <p className="state-message">No status changes yet.</p>
        ) : (
          <ol className="timeline">
            {invoice.statusHistory.map((entry) => (
              <li key={entry.id}>
                <span className="timeline-time">{formatDateTime(entry.changedAt)}</span>
                <span className="timeline-transition">
                  {entry.fromStatus ? (
                    <>
                      <StatusBadge status={entry.fromStatus} /> →{' '}
                    </>
                  ) : (
                    'Created as '
                  )}
                  <StatusBadge status={entry.toStatus} />
                </span>
                {entry.note && <p className="timeline-note">{entry.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <RejectDialog
        open={rejectOpen}
        busy={mutation.isPending}
        onCancel={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </main>
  );
}
