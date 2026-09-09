import { appConfig } from '../../config/appConfig';

const VISITOR_TOKEN_KEY = 'lub-msme-hosur-visitor-token';
const VISITOR_PROFILE_KEY = 'lub-msme-hosur-visitor-profile';

export type VisitorSessionProfile = {
  visitorId: string;
  registrationNumber: string;
  legalName: string;
  contactPersonName: string;
};

export class VisitorApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function setVisitorSession(token: string | null, profile: VisitorSessionProfile | null) {
  if (token) {
    sessionStorage.setItem(VISITOR_TOKEN_KEY, token);
    localStorage.removeItem(VISITOR_TOKEN_KEY);
  } else {
    sessionStorage.removeItem(VISITOR_TOKEN_KEY);
    localStorage.removeItem(VISITOR_TOKEN_KEY);
  }

  if (profile) {
    sessionStorage.setItem(VISITOR_PROFILE_KEY, JSON.stringify(profile));
    localStorage.removeItem(VISITOR_PROFILE_KEY);
  } else {
    sessionStorage.removeItem(VISITOR_PROFILE_KEY);
    localStorage.removeItem(VISITOR_PROFILE_KEY);
  }
}

export function getVisitorToken() {
  return sessionStorage.getItem(VISITOR_TOKEN_KEY) || localStorage.getItem(VISITOR_TOKEN_KEY);
}

// Used by StallProfilePage to auto-fill "I'm Interested" without asking the visitor
// to type their name/mobile again — read straight from what login stored.
export function getVisitorProfile(): VisitorSessionProfile | null {
  const raw = sessionStorage.getItem(VISITOR_PROFILE_KEY) || localStorage.getItem(VISITOR_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VisitorSessionProfile;
  } catch {
    return null;
  }
}

export function isVisitorLoggedIn() {
  return Boolean(getVisitorToken() && getVisitorProfile());
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getVisitorToken();
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
    if (response.status === 401) setVisitorSession(null, null);
    throw new VisitorApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const visitorApiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
};
