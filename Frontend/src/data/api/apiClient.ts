import { appConfig } from '../../config/appConfig';

const TOKEN_KEY = 'lub-msme-hosur-access-token';

export class ApiError extends Error {
  constructor(public status: number, public errorCode: string, message: string, public details?: unknown) {
    super(message);
  }
}

export function setAccessToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-Id': crypto.randomUUID(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    let payload: { errorCode?: string; message?: string; details?: unknown } = {};
    try { payload = await response.json(); } catch { payload = {}; }
    if (response.status === 401) setAccessToken(null);
    throw new ApiError(response.status, payload.errorCode ?? 'HTTP_ERROR', payload.message ?? response.statusText, payload.details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<{ blob: Blob; fileName: string | null }> {
  const token = getAccessToken();
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'X-Correlation-Id': crypto.randomUUID(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let payload: { errorCode?: string; message?: string; details?: unknown } = {};
    try { payload = await response.json(); } catch { payload = {}; }
    if (response.status === 401) setAccessToken(null);
    throw new ApiError(response.status, payload.errorCode ?? 'HTTP_ERROR', payload.message ?? response.statusText, payload.details);
  }

  const disposition = response.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const fileName = match?.[1] ?? null;

  const blob = await response.blob();
  return { blob, fileName };
}

export const apiClient = {
  postFormData: <T>(
  path: string,
  formData: FormData
) =>
  request<T>(
    path,
    {
      method: 'POST',
      body: formData
    }
  ),
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getBlob: (path: string) => requestBlob(path)
};
