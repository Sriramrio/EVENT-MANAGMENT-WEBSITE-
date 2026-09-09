import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session';

export function PermissionGuard({ permission }: { permission: string }) {
  const hasPermission = useSession(state => state.hasPermission);
  return hasPermission(permission) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
