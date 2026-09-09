import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isExhibitorLoggedIn } from '../../data/api/exhibitorApiClient';

export function ExhibitorAuthGuard() {
  const location = useLocation();

  if (!isExhibitorLoggedIn()) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
