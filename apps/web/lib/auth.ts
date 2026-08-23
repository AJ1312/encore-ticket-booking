import type { Session } from '@encore/shared';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function signIn(email: string, password: string): Promise<Session> {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error((await r.text()) || 'Unable to sign in');
  const data = (await r.json()) as { session: Session; accessToken?: string };
  if (data.accessToken && typeof window !== 'undefined') {
    window.localStorage.setItem('encore_token', data.accessToken);
    document.cookie = `encore_access=${data.accessToken}; path=/; max-age=900; SameSite=Lax`;
  }
  return data.session;
}

export async function signUp(name: string, email: string, password: string): Promise<Session> {
  const r = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  if (!r.ok) throw new Error((await r.text()) || 'Unable to register');
  const data = (await r.json()) as { session: Session; accessToken?: string };
  if (data.accessToken && typeof window !== 'undefined') {
    window.localStorage.setItem('encore_token', data.accessToken);
    document.cookie = `encore_access=${data.accessToken}; path=/; max-age=900; SameSite=Lax`;
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('encore_token');
    window.localStorage.removeItem('encore_profile');
    document.cookie = 'encore_access=; path=/; max-age=0; SameSite=Lax';
  }
  try {
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}
