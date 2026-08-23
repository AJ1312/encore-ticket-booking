'use client';

import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { KeyRound, Plus, ShieldCheck, UserPlus, Check, Loader2 } from 'lucide-react';

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'organiser' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function loadUsers() {
    apiJson<{ users: UserItem[] }>('/admin/users')
      .then(res => {
        if (res.users) setUsers(res.users);
      })
      .catch(() => null)
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setSuccessMsg('');
    try {
      await apiJson('/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setSuccessMsg(`Created ${createForm.role} account for ${createForm.email}`);
      setCreateForm({ name: '', email: '', password: '', role: 'organiser' });
      setShowCreate(false);
      loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      await apiJson(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(current =>
        current.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="eyebrow">System control / Users</span>
            <h1>People &<br /><em>Organisers.</em></h1>
          </div>
          <button
            onClick={() => setShowCreate(prev => !prev)}
            className="coral-button"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <UserPlus size={16} /> {showCreate ? 'Close Form' : 'Add New Organiser / Admin'}
          </button>
        </div>

        {/* Demo Credentials Box */}
        <div style={{ padding: 18, background: '#16251e', border: '1px solid #2b4738', borderRadius: 4, margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={20} color="var(--green)" />
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#eef4eb' }}>Default Root & Organiser Credentials</strong>
              <span style={{ fontSize: 12, color: '#9ab5a1', font: '11px var(--mono)' }}>
                Admin: <strong style={{ color: 'var(--paper)' }}>admin@encore.local</strong> &nbsp;|&nbsp; Organiser: <strong style={{ color: 'var(--paper)' }}>organiser@encore.local</strong> &nbsp;|&nbsp; Password: <strong style={{ color: 'var(--peach)' }}>SeedPassword123!</strong>
              </span>
            </div>
          </div>
          <span style={{ font: '10px var(--mono)', padding: '5px 10px', background: '#0e1713', color: 'var(--green)', textTransform: 'uppercase' }}>
            PostgreSQL Auth
          </span>
        </div>

        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#172b1d', border: '1px solid #2c5938', color: '#b2e8c2', borderRadius: 4, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* Create Organiser / User Modal Form */}
        {showCreate && (
          <form onSubmit={handleCreate} style={{ padding: 24, background: '#181a1d', border: '1px solid #31363d', borderRadius: 6, marginBottom: 24 }}>
            <h2 style={{ font: '22px var(--serif)', margin: '0 0 16px', color: 'var(--paper)' }}>Provision New Account</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <label style={{ display: 'block' }}>
                Full Name
                <input
                  required
                  placeholder="Karan Verma"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', background: '#0e1012', border: '1px solid #363c45', color: '#fff', borderRadius: 4 }}
                />
              </label>
              <label style={{ display: 'block' }}>
                Email Address
                <input
                  required
                  type="email"
                  placeholder="karan@encore.local"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', background: '#0e1012', border: '1px solid #363c45', color: '#fff', borderRadius: 4 }}
                />
              </label>
              <label style={{ display: 'block' }}>
                Initial Password
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Password (min 8 chars)"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', background: '#0e1012', border: '1px solid #363c45', color: '#fff', borderRadius: 4 }}
                />
              </label>
              <label style={{ display: 'block' }}>
                Role Assignment
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', background: '#0e1012', border: '1px solid #363c45', color: '#fff', borderRadius: 4 }}
                >
                  <option value="organiser">Organiser (Create events, shows, check-in)</option>
                  <option value="admin">Admin (Full platform control)</option>
                  <option value="customer">Customer (Ticket buyer)</option>
                </select>
              </label>
            </div>

            {createError && <p className="form-error" style={{ marginTop: 16 }}>{createError}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" disabled={creating} className="coral-button" style={{ padding: '10px 20px' }}>
                {creating ? <><Loader2 size={16} className="spin" /> Creating account…</> : 'Create & Provision Access'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #474f5a', color: '#c0c8d4', borderRadius: 4, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Users Table with Role Switcher */}
        <div className="event-table admin-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading users from PostgreSQL database…</p>
          ) : users.length ? (
            users.map(u => (
              <div className="event-table-row" key={u.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 16 }}>
                <span>◌</span>
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{u.name}</strong>
                  <small style={{ color: 'var(--muted)' }}>{u.email}</small>
                </div>
                <div>
                  <select
                    value={u.role}
                    disabled={updatingId === u.id}
                    onChange={e => updateRole(u.id, e.target.value)}
                    style={{
                      padding: '4px 10px',
                      background: u.role === 'admin' ? '#2c1e1e' : u.role === 'organiser' ? '#17271e' : '#1b1d20',
                      border: `1px solid ${u.role === 'admin' ? '#5a3434' : u.role === 'organiser' ? '#2f573e' : '#3d444e'}`,
                      color: u.role === 'admin' ? '#ff9999' : u.role === 'organiser' ? 'var(--green)' : '#a4b1be',
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: 'var(--mono)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="admin">ADMIN</option>
                    <option value="organiser">ORGANISER</option>
                    <option value="customer">CUSTOMER</option>
                  </select>
                </div>
                <span style={{ fontSize: 11, color: '#9ab5a1', font: '11px var(--mono)', textAlign: 'right' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
              No users found.
            </div>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
