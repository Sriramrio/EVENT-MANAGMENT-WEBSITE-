
import { AppError, mapHttpError, type ProblemDetails } from './errors';
import { getAccessToken } from '../../data/api/apiClient';
import { appConfig } from '../../config/appConfig';
const timeoutMs = 15000;
function headers(extra?: HeadersInit) { const token = getAccessToken(); return { 'Accept': 'application/json', 'X-Correlation-Id': crypto.randomUUID(), ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...extra }; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, { ...init, credentials: 'include', signal: controller.signal, headers: headers(init.headers) });

    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw mapHttpError(response.status, (data && typeof data === 'object') ? data as ProblemDetails : { title: response.statusText, status: response.status });
    }
    return data as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw new AppError('timeout', 'The request timed out. Please retry.');
    if (!navigator.onLine) throw new AppError('offline', 'You appear to be offline. Your unsent work is preserved in this browser session.');
    throw new AppError('network', 'The service could not be reached. Please retry.');
  } finally { clearTimeout(timer); }
}
export const httpClient = { get: <T>(p: string) => request<T>(p), post: <T>(p: string, b: unknown, idempotencyKey?: string) => request<T>(p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) }, body: JSON.stringify(b) }), put: <T>(p: string, b: unknown) => request<T>(p, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }), patch: <T>(p: string, b: unknown, version?: number) => request<T>(p, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(version !== undefined ? { 'If-Match': String(version) } : {}) }, body: JSON.stringify(b) }), delete: <T>(p: string) => request<T>(p, { method: 'DELETE' }) };
