'use client';

import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

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

  useEffect(() => {
    let isMounted = true;
    apiJson<{ users: UserItem[] }>('/admin/users')
      .then(res => {
        if (isMounted && res.users) setUsers(res.users);
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <span className="eyebrow">System control / Users</span>
        <h1>People in<br /><em>the room.</em></h1>

        <div className="event-table admin-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading users from PostgreSQL database…</p>
          ) : users.length ? (
            users.map(u => (
              <div className="event-table-row" key={u.id}>
                <span>◌</span>
                <div>
                  <strong>{u.name}</strong>
                  <small>{u.email} · Role: {u.role}</small>
                </div>
                <b>{u.role.toUpperCase()}</b>
                <span style={{ fontSize: 11, color: '#9ab5a1', font: '10px var(--mono)' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))
          ) : (
            [
              { name: 'Encore Admin', email: 'admin@encore.local', role: 'admin' },
              { name: 'Encore Organiser', email: 'organiser@encore.local', role: 'organiser' },
            ].map(u => (
              <div className="event-table-row" key={u.email}>
                <span>◌</span>
                <div>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </div>
                <b>{u.role.toUpperCase()}</b>
                <span>Protected</span>
              </div>
            ))
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
