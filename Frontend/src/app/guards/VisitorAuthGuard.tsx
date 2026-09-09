import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isVisitorLoggedIn } from '../../data/api/visitorApiClient';

import { useSession } from '../session';

// Visitor login stores its session in localStorage (see visitorApiClient.ts),
// not in the admin `useSession` zustand store that <AuthGuard /> checks.
// Using <AuthGuard /> here meant a visitor could never pass the guard after
// logging in — this guard checks the visitor's own session instead.
export function VisitorAuthGuard() {
  const location = useLocation();
  const isAdminLoggedIn = useSession((state) => state.user !== null);

  if (!isVisitorLoggedIn() && !isAdminLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
