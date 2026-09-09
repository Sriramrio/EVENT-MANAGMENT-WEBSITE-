import { useRouteError } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Unexpected application error';
  return <div className="card p-8"><h1 className="text-xl font-bold">Application Error</h1><p className="mt-2 text-sm text-red-700">{message}</p></div>;
}
