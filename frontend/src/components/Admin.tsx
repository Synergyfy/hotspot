import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Users, LayoutGrid, Mail, Globe, Activity, ArrowLeft, Trash2, RefreshCw,
  AlertTriangle, Search, Crown, UserCheck
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/errors';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';

type Tab = 'overview' | 'users' | 'campaigns' | 'leads' | 'domains';

export default function Admin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'campaign' | 'lead' | 'domain'; id: number | string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, u, c, l, d] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getUsers(),
        adminApi.getCampaigns(),
        adminApi.getLeads(),
        adminApi.getDomains(),
      ]);
      setOverview(o.data);
      setUsers(u.data);
      setCampaigns(c.data);
      setLeads(l.data);
      setDomains(d.data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) setError('Admin access required. Your account role is not admin. Set role=admin in DB and log in again.');
      else setError(getErrorMessage(e, 'Failed to load admin data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const roleFor = (id: number | string) => users.find((u) => String(u.id) === String(id))?.role;
  const setRole = async (id: number | string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => String(u.id) === String(id) ? { ...u, role } : u));
      toast.success('Role updated', `User is now ${role}.`);
    } catch (e) {
      toast.error('Could not update role', getErrorMessage(e));
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === 'campaign') { await adminApi.deleteCampaign(confirm.id); setCampaigns((p) => p.filter((x) => String(x.id) !== String(confirm.id))); }
      if (confirm.type === 'lead') { await adminApi.deleteLead(confirm.id); setLeads((p) => p.filter((x) => String(x.id) !== String(confirm.id))); }
      if (confirm.type === 'domain') { await adminApi.deleteDomain(confirm.id); setDomains((p) => p.filter((x) => String(x.id) !== String(confirm.id))); }
      toast.success('Deleted', confirm.label);
      setConfirm(null);
      load();
    } catch (e) {
      toast.error('Delete failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const ql = q.toLowerCase();
  const fUsers = users.filter((u) => !ql || [u.email, u.name, u.role, u.companyName].join(' ').toLowerCase().includes(ql));
  const fCampaigns = campaigns.filter((c) => !ql || [c.name, c.user?.email, c.user?.name].join(' ').toLowerCase().includes(ql));
  const fLeads = leads.filter((l) => !ql || [l.email, l.name, l.campaign?.name, l.campaign?.user?.email].join(' ').toLowerCase().includes(ql));
  const fDomains = domains.filter((d) => !ql || [d.name, d.user?.email, d.user?.name].join(' ').toLowerCase().includes(ql));

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><Shield className="h-5 w-5" /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Admin</h1>
              <p className="text-xs font-medium text-slate-500">Oversee users, campaigns, leads, domains</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" /><span className="flex-1">{error}</span>
            <button onClick={load} className="font-bold underline">Retry</button>
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          {[
            { label: 'Users', value: overview?.totals?.users, icon: Users },
            { label: 'Campaigns', value: overview?.totals?.campaigns, icon: LayoutGrid },
            { label: 'Leads', value: overview?.totals?.leads, icon: Mail },
            { label: 'Domains', value: overview?.totals?.domains, icon: Globe },
            { label: 'Events', value: overview?.totals?.events, icon: Activity },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-slate-400"><span className="text-[11px] font-black uppercase tracking-widest">{s.label}</span><s.icon className="h-4 w-4" /></div>
              <div className="mt-2 text-2xl font-black text-slate-900">{s.value ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['overview', 'users', 'campaigns', 'leads', 'domains'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-3 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t}</button>
            ))}
          </div>
          {tab !== 'overview' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" />
            </div>
          )}
        </div>

        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Recent users">
              {overview?.recentUsers?.length ? overview.recentUsers.map((u: any) => (
                <Row key={u.id} title={u.email} sub={`${u.role} · ${new Date(u.createdAt).toLocaleDateString()}`} />
              )) : <EmptyState icon={Users} title="No users" description="Users will appear here." />}
            </Panel>
            <Panel title="Recent campaigns">
              {overview?.recentCampaigns?.length ? overview.recentCampaigns.map((c: any) => (
                <Row key={c.id} title={c.name} sub={`${c.user?.email || 'unknown'} · ${c._count?.hotspots || 0} hotspots · ${c._count?.leads || 0} leads`} />
              )) : <EmptyState icon={LayoutGrid} title="No campaigns" description="Campaigns will appear here." />}
            </Panel>
            <Panel title="Recent leads" className="lg:col-span-2">
              {overview?.recentLeads?.length ? overview.recentLeads.map((l: any) => (
                <Row key={l.id} title={l.email} sub={`${l.campaign?.name || 'Campaign'} · ${new Date(l.createdAt).toLocaleString()}`} />
              )) : <EmptyState icon={Mail} title="No leads" description="Leads will appear here." />}
            </Panel>
          </div>
        )}

        {tab === 'users' && <Table headers={['User', 'Role', 'MCOM', 'Counts', 'Joined', 'Action']}>
          {fUsers.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <Td><div className="font-bold text-slate-900">{u.email}</div><div className="text-xs text-slate-500">{u.name || '—'} {u.companyName ? `· ${u.companyName}` : ''}</div></Td>
              <Td><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role || 'agent'}</span></Td>
              <Td><div className="text-xs text-slate-600">{u.mcomUserId ? `ID ${u.mcomUserId}` : '—'}</div><div className="text-xs text-slate-400">{u.mcomMembershipStatus || ''}</div></Td>
              <Td><div className="text-xs text-slate-600">{u._count?.campaigns || 0} campaigns · {u._count?.domains || 0} domains</div></Td>
              <Td><div className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</div></Td>
              <Td>
                {u.role === 'admin'
                  ? <button onClick={() => setRole(u.id, 'agent')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"><UserCheck className="h-3.5 w-3.5" />Make agent</button>
                  : <button onClick={() => setRole(u.id, 'admin')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50"><Crown className="h-3.5 w-3.5" />Make admin</button>}
              </Td>
            </tr>
          ))}
          {!fUsers.length && <tr><td colSpan={6}><EmptyState icon={Users} title="No users found" description="Try a different search." /></td></tr>}
        </Table>}

        {tab === 'campaigns' && <Table headers={['Campaign', 'Owner', 'Stats', 'Created', 'Action']}>
          {fCampaigns.map((c) => (
            <tr key={c.id} className="border-t border-slate-100">
              <Td><div className="font-bold">{c.name}</div><div className="text-xs text-slate-400">ID {c.id}</div></Td>
              <Td><div className="text-sm">{c.user?.email}</div><div className="text-xs text-slate-400">{c.user?.name || ''}</div></Td>
              <Td><div className="text-xs text-slate-600">{c._count?.hotspots || 0} hotspots · {c._count?.leads || 0} leads · {c._count?.analytics || 0} events</div></Td>
              <Td><div className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</div></Td>
              <Td><button onClick={() => setConfirm({ type: 'campaign', id: c.id, label: c.name })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></Td>
            </tr>
          ))}
          {!fCampaigns.length && <tr><td colSpan={5}><EmptyState icon={LayoutGrid} title="No campaigns found" description="Try a different search." /></td></tr>}
        </Table>}

        {tab === 'leads' && <Table headers={['Lead', 'Campaign', 'Owner', 'Created', 'Action']}>
          {fLeads.map((l) => (
            <tr key={l.id} className="border-t border-slate-100">
              <Td><div className="font-bold">{l.email}</div><div className="text-xs text-slate-400">{l.name || '—'}</div></Td>
              <Td><div className="text-sm">{l.campaign?.name || '—'}</div></Td>
              <Td><div className="text-xs text-slate-500">{l.campaign?.user?.email || '—'}</div></Td>
              <Td><div className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()}</div></Td>
              <Td><button onClick={() => setConfirm({ type: 'lead', id: l.id, label: l.email })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></Td>
            </tr>
          ))}
          {!fLeads.length && <tr><td colSpan={5}><EmptyState icon={Mail} title="No leads found" description="Try a different search." /></td></tr>}
        </Table>}

        {tab === 'domains' && <Table headers={['Domain', 'Owner', 'Verified', 'Created', 'Action']}>
          {fDomains.map((d) => (
            <tr key={d.id} className="border-t border-slate-100">
              <Td><div className="font-bold">{d.name}</div></Td>
              <Td><div className="text-sm">{d.user?.email || '—'}</div></Td>
              <Td><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-black uppercase ${d.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{d.verified ? 'verified' : 'pending'}</span></Td>
              <Td><div className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</div></Td>
              <Td><button onClick={() => setConfirm({ type: 'domain', id: d.id, label: d.name })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></Td>
            </tr>
          ))}
          {!fDomains.length && <tr><td colSpan={5}><EmptyState icon={Globe} title="No domains found" description="Try a different search." /></td></tr>}
        </Table>}
      </main>

      <ConfirmDialog
        open={!!confirm}
        title={`Delete ${confirm?.type || ''}?`}
        description={confirm ? `This will permanently delete "${confirm.label}".` : ''}
        confirmLabel={busy ? 'Deleting...' : 'Delete'}
        destructive
        onCancel={() => !busy && setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}

function Panel({ title, children, className = '' }: any) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}><h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">{title}</h2><div className="space-y-3">{children}</div></div>;
}
function Row({ title, sub }: any) {
  return <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"><div className="text-sm font-bold text-slate-900">{title}</div><div className="text-xs text-slate-500">{sub}</div></div>;
}
function Table({ headers, children }: any) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-left"><thead className="bg-slate-50"><tr>{headers.map((h: string) => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Td({ children }: any) { return <td className="px-4 py-3 align-top">{children}</td>; }
