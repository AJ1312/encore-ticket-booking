import type { Session } from '@encore/shared';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export async function signIn(email:string,password:string){const r=await fetch(`${API}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email,password})});if(!r.ok)throw new Error((await r.text())||'Unable to sign in');return (await r.json()).session as Session}
export async function signUp(name:string,email:string,password:string){const r=await fetch(`${API}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name,email,password})});if(!r.ok)throw new Error((await r.text())||'Unable to register');return (await r.json()).session as Session}
