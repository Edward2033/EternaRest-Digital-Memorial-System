import type { ApiResult } from './types';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── Auth token helper ────────────────────────────────────────────────────────

export function getToken(): string {
  return localStorage.getItem('eternarest_token') ?? '';
}

// ─── Core request function ────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Pass true to include the admin JWT in the Authorization header */
  auth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { method = 'GET', body, auth = false, params } = options;

  // Build URL with optional query params
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Try to parse JSON regardless of status so we can surface server messages
    let json: Record<string, unknown>;
    try {
      json = await response.json();
    } catch {
      return {
        success: false,
        error: `Server returned ${response.status} with non-JSON body`,
      };
    }

    if (!response.ok || json.success === false) {
      // Special case: 202 PENDING — success:false but has a status field we need
      if (response.status === 202 && json.status === 'PENDING') {
        return { success: false, error: 'PENDING', data: json as unknown as T } as any;
      }
      const message =
        (json.message as string) ??
        (json.error as string) ??
        `Request failed with status ${response.status}`;
      return { success: false, error: message };
    }

    return { success: true, data: json as unknown as T };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Network error — server unreachable';
    return { success: false, error: message };
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const http = {
  get<T>(path: string, params?: RequestOptions['params'], auth = false) {
    return request<T>(path, { method: 'GET', params, auth });
  },
  post<T>(path: string, body: unknown, auth = false) {
    return request<T>(path, { method: 'POST', body, auth });
  },
  put<T>(path: string, body: unknown, auth = false) {
    return request<T>(path, { method: 'PUT', body, auth });
  },
  delete<T>(path: string, auth = false) {
    return request<T>(path, { method: 'DELETE', auth });
  },
};
