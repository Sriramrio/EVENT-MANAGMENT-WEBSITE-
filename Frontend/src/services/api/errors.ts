export type ErrorKind='authentication'|'permission'|'validation'|'not-found'|'conflict'|'precondition'|'rate-limit'|'network'|'timeout'|'server'|'offline'|'cancelled'|'unknown';
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  code?: string;
  errorCode?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
}
export class AppError extends Error {
  constructor(public readonly kind: ErrorKind, message: string, public readonly status?: number, public readonly problem?: ProblemDetails) {
    super(message);
    this.name = 'AppError';
  }
}
export function mapHttpError(status: number, problem: ProblemDetails): AppError {
  const kind: ErrorKind =
    status === 401 ? 'authentication' :
    status === 403 ? 'permission' :
    status === 404 ? 'not-found' :
    status === 409 ? 'conflict' :
    status === 412 ? 'precondition' :
    status === 422 ? 'validation' :
    status === 429 ? 'rate-limit' :
    status >= 500 ? 'server' : 'unknown';

  const message = problem.detail ?? problem.message ?? problem.title ?? `Request failed with status ${status}.`;
  return new AppError(kind, message, status, problem);
}
