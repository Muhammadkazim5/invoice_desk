import { Link } from 'react-router-dom';
import type { InvoiceCounts } from '../types/invoice';

export type TabKey = 'processing' | 'needs_review' | 'decided';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'processing', label: 'Processing' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'decided', label: 'Approved / Rejected' },
];

interface TabNavProps {
  activeTab: TabKey;
  counts: InvoiceCounts | undefined;
}

export function TabNav({ activeTab, counts }: TabNavProps): JSX.Element {
  return (
    <nav className="tab-nav" aria-label="Invoice status tabs">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const count = counts?.[tab.key];
        return (
          <Link
            key={tab.key}
            to={`/?tab=${tab.key}`}
            className={`tab${isActive ? ' tab-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
            {count !== undefined && <span className="tab-count">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
