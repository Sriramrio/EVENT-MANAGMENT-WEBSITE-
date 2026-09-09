import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-red-600">Access restricted</p>
      <h1 className="mt-2 text-2xl font-extrabold">Permission required</h1>
      <p className="mt-2 text-sm text-slate-600">Your role does not have permission to open this admin function.</p>
      <Link to="/app/dashboard" className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
    </div>
  );
}
