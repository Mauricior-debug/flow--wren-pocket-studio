import { clearToken, getApiBase, getToken } from './session';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: any;
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = await getApiBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  if (options.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: options.method || (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body,
    signal: options.signal,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (res.status === 401 && options.auth !== false) {
    await clearToken();
  }
  if (!res.ok) {
    throw new ApiError(data?.error || data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data as T;
}

export const authApi = {
  login: (email: string, password: string) => apiRequest('/api/auth/login', { method: 'POST', auth: false, body: { email, password } }),
  verify2fa: (email: string, code: string, challengeToken: string) =>
    apiRequest('/api/auth/verify-2fa', { method: 'POST', auth: false, body: { email, code, challengeToken } }),
  me: () => apiRequest('/api/auth/me'),
};

export const employeesApi = {
  list: () => apiRequest('/api/ai-employees'),
  update: (id: string, body: any) => apiRequest(`/api/ai-employees/${id}`, { method: 'PUT', body }),
};

export const deskApi = {
  load: (id: string, status = 'work', limit = 40) =>
    apiRequest(`/api/ai-employees/${id}/run-architect?status=${encodeURIComponent(status)}&limit=${limit}`),
  run: (id: string, tasks: string[]) => apiRequest(`/api/ai-employees/${id}/run-architect`, { method: 'POST', body: { tasks } }),
  patch: (id: string, body: any) => apiRequest(`/api/ai-employees/${id}/run-architect`, { method: 'PATCH', body }),
};

export const promptApi = {
  post: (id: string, body: any) => apiRequest(`/api/ai-employees/${id}/wren-prompt`, { method: 'POST', body }),
};

export function liveUrl(employeeId: string, token: string, base: string) {
  const root = base.replace(/\/$/, '');
  return `${root}/api/ai-employees/${employeeId}/wren-live?access_token=${encodeURIComponent(token)}`;
}
