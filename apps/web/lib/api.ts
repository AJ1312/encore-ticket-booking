export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  return response.json() as Promise<T>;
}
