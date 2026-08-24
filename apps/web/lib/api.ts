export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('encore_token') : undefined;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };
  return fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData && Array.isArray(errorData.message)) {
        errorMsg = errorData.message.join(', ');
      } else if (errorData && typeof errorData.message === 'string') {
        errorMsg = errorData.message;
      } else if (errorData && typeof errorData.error === 'string') {
        errorMsg = errorData.error;
      }
    } catch {
      const errorText = await response.text().catch(() => '');
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }
  return response.json() as Promise<T>;
}
