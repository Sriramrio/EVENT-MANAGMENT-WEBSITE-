import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../session';

export function AuthGuard() {
  const user = useSession(state => state.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
