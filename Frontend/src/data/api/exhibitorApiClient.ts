import { appConfig } from '../../config/appConfig';

const EXHIBITOR_TOKEN_KEY = 'lub-msme-hosur-exhibitor-token';
const EXHIBITOR_PROFILE_KEY = 'lub-msme-hosur-exhibitor-profile';

export type ExhibitorSessionProfile = {
  companyName: string;
  registrationNumber: string;
  stallNumber?: string | null;
};

export class ExhibitorApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function setExhibitorToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(EXHIBITOR_TOKEN_KEY, token);
    localStorage.removeItem(EXHIBITOR_TOKEN_KEY);
  } else {
    sessionStorage.removeItem(EXHIBITOR_TOKEN_KEY);
    localStorage.removeItem(EXHIBITOR_TOKEN_KEY);
    sessionStorage.removeItem(EXHIBITOR_PROFILE_KEY);
    localStorage.removeItem(EXHIBITOR_PROFILE_KEY);
  }
}

export function setExhibitorSession(token: string | null, profile?: ExhibitorSessionProfile | null) {
  setExhibitorToken(token);
  if (profile) {
    sessionStorage.setItem(EXHIBITOR_PROFILE_KEY, JSON.stringify(profile));
    localStorage.removeItem(EXHIBITOR_PROFILE_KEY);
  } else {
    sessionStorage.removeItem(EXHIBITOR_PROFILE_KEY);
    localStorage.removeItem(EXHIBITOR_PROFILE_KEY);
  }
}

export function getExhibitorToken() {
  return sessionStorage.getItem(EXHIBITOR_TOKEN_KEY) || localStorage.getItem(EXHIBITOR_TOKEN_KEY);
}

export function getExhibitorProfile(): ExhibitorSessionProfile | null {
  const raw = sessionStorage.getItem(EXHIBITOR_PROFILE_KEY) || localStorage.getItem(EXHIBITOR_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExhibitorSessionProfile;
  } catch {
    return null;
  }
}

export function isExhibitorLoggedIn() {
  return Boolean(getExhibitorToken());
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getExhibitorToken();
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = payload.message ?? message;
    } catch {
      /* ignore body parse failure */
    }
    if (response.status === 401) setExhibitorToken(null);
    throw new ExhibitorApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const exhibitorApiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
};
