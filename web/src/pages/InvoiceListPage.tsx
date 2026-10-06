import { Link, useSearchParams } from 'react-router-dom';
import { DuplicateBadge, StatusBadge } from '../components/StatusBadge';
import { TabNav, type TabKey } from '../components/TabNav';
import { useInvoiceCounts, useInvoiceList } from '../hooks/useInvoices';
import type { InvoiceSummary } from '../types/invoice';
import { formatDate, formatMoney } from '../utils/format';

const VALID_TABS: TabKey[] = ['processing', 'needs_review', 'decided'];

function parseTab(value: string | null): TabKey {
  return VALID_TABS.includes(value as TabKey) ? (value as TabKey) : 'processing';
}

function InvoiceRow({ invoice }: { invoice: InvoiceSummary }): JSX.Element {
  return (
    <li className="invoice-row">
      <Link to={`/invoices/${invoice.id}`} className="invoice-row-link">
        <span className="invoice-row-number">{invoice.invoiceNumber}</span>
        <span className="invoice-row-vendor">{invoice.vendorName}</span>
        <span className="invoice-row-amount">
          {formatMoney(invoice.amountCents, invoice.currency)}
        </span>
        <span className="invoice-row-due">Due {formatDate(invoice.dueDate)}</span>
        <span className="invoice-row-badges">
          <StatusBadge status={invoice.status} />
          {invoice.duplicateOfId && <DuplicateBadge />}
        </span>
      </Link>
    </li>
  );
}

export function InvoiceListPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));

  const countsQuery = useInvoiceCounts();
  const listQuery = useInvoiceList(tab);

  return (
    <div className="page">
      <TabNav activeTab={tab} counts={countsQuery.data} />

      <main className="invoice-list-main">
        {listQuery.isLoading && <p className="state-message">Loading invoices…</p>}

        {listQuery.isError && (
          <p className="state-message state-error" role="alert">
            Couldn&apos;t load invoices: {listQuery.error.message}
          </p>
        )}

        {listQuery.isSuccess && listQuery.data.length === 0 && (
          <p className="state-message">No invoices in this tab yet.</p>
        )}

        {listQuery.isSuccess && listQuery.data.length > 0 && (
          <ul className="invoice-list">
            {listQuery.data.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
