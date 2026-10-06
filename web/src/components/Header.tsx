import { Link } from 'react-router-dom';

export function Header(): JSX.Element {
  return (
    <header className="app-header">
      <Link to="/" className="app-title">
        Mini Invoice Approval Desk
      </Link>
    </header>
  );
}
