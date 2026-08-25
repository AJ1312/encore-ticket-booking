import type { Session } from '@encore/shared';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function signIn(email: string, password: string, turnstileToken?: string): Promise<Session> {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, 'cf-turnstile-response': turnstileToken }),
  });
  if (!r.ok) throw new Error((await r.text()) || 'Unable to sign in');
  const data = (await r.json()) as { session: Session; accessToken?: string };
  if (data.accessToken && typeof window !== 'undefined') {
    window.localStorage.setItem('encore_token', data.accessToken);
    window.localStorage.setItem('encore_profile', JSON.stringify(data.session));
    document.cookie = `encore_access=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: data.session }));
  }
  return data.session;
}



export async function signUp(name: string, email: string, password: string, role?: 'customer' | 'organiser', turnstileToken?: string): Promise<Session> {
  const r = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password, role, 'cf-turnstile-response': turnstileToken }),
  });
  if (!r.ok) throw new Error((await r.text()) || 'Unable to register');
  const data = (await r.json()) as { session: Session; accessToken?: string };
  if (data.accessToken && typeof window !== 'undefined') {
    window.localStorage.setItem('encore_token', data.accessToken);
    window.localStorage.setItem('encore_profile', JSON.stringify(data.session));
    document.cookie = `encore_access=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: data.session }));
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
