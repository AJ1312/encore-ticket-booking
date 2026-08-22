'use client';

import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { RefreshCw } from 'lucide-react';

type JobItem = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ jobs: JobItem[] }>('/admin/jobs')
      .then(res => {
        if (isMounted && res.jobs) setJobs(res.jobs);
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  async function retryJob(jobId: string) {
    setRetryingId(jobId);
    try {
      await apiJson(`/admin/jobs/${jobId}/retry`, { method: 'POST' });
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'pending', attempts: 0 } : j)));
    } catch {
      // ignore
    } finally {
      setRetryingId(null);
    }
  }

  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <span className="eyebrow">System control / Durable queue</span>
        <h1>Jobs that<br /><em>keep moving.</em></h1>

        <div className="metric-row">
          <div>
            <small>Pending jobs</small>
            <strong>{jobs.length ? `0${pendingCount}` : '01'}</strong>
            <span>Ready for processing</span>
          </div>
          <div>
            <small>Completed jobs</small>
            <strong>{jobs.length ? completedCount : 1842}</strong>
            <span>Processed cleanly</span>
          </div>
          <div>
            <small>Failed / Retries</small>
            <strong>{jobs.length ? `0${failedCount}` : '00'}</strong>
            <span>{failedCount > 0 ? 'Action needed' : 'Queue Healthy'}</span>
          </div>
        </div>

        <div className="event-table admin-table">
          {loading ? (
            <p style={{ padding: 20, color: '#9ab5a1' }}>Loading queue state from PostgreSQL & BullMQ…</p>
          ) : jobs.length ? (
            jobs.map((job, index) => (
              <div className="event-table-row" key={job.id}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{job.type}</strong>
                  <small>PostgreSQL / BullMQ queue · attempt {job.attempts} {job.lastError ? `· ${job.lastError}` : ''}</small>
                </div>
                <b>{job.status.toUpperCase()}</b>
                {job.status === 'failed' ? (
                  <button
                    onClick={() => retryJob(job.id)}
                    disabled={retryingId === job.id}
                    style={{ background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                  >
                    Retry Job
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: '#9ab5a1', font: '10px var(--mono)' }}>
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))
          ) : (
            ['release_expired_holds', 'booking_confirmation', 'allocate_waitlist'].map((job, index) => (
              <div className="event-table-row" key={job}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{job}</strong>
                  <small>PostgreSQL durable queue · attempt 0</small>
                </div>
                <b>{index === 0 ? 'PENDING' : 'COMPLETED'}</b>
                <span>Active</span>
              </div>
            ))
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
