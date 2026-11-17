import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnalyticsEvent, Lead, Campaign } from '../types';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Calendar, Download, ExternalLink, Globe, Mail,
  MousePointer2, PlusCircle, RefreshCw, TrendingUp, Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { campaignsApi } from '../api/campaigns';
import { analyticsApi, leadsApi } from '../api/services';
import { EmptyState } from './ui/EmptyState';
import { HelpTip } from './ui/Tooltip';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/errors';

interface SummaryRow {
  eventType: string;
  _count: number;
}

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, statsRes, leadsRes] = await Promise.all([
        campaignsApi.findOne(id),
        analyticsApi.getStats(id),
        leadsApi.findAll(id),
      ]);

      setCampaign(campaignRes.data);
      setSummary(statsRes.data?.summary || []);
      setEvents(statsRes.data?.events || []);
      setLeads(leadsRes.data);
      setLeadCount(statsRes.data?.leads ?? leadsRes.data.length);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load analytics for this campaign.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const countOf = (type: string) =>
    summary.find((row) => row.eventType === type)?._count ?? events.filter((event) => event.eventType === type).length;

  const views = countOf('view');
  const clicks = countOf('click');
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';

  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; view: number; click: number }> = {};
    [...events]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach((event) => {
        const date = new Date(event.timestamp);
        if (Number.isNaN(date.getTime())) return;
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!days[key]) days[key] = { date: key, view: 0, click: 0 };
        if (event.eventType === 'view') days[key].view += 1;
        if (event.eventType === 'click') days[key].click += 1;
      });
    return Object.values(days).slice(-7);
  }, [events]);

  const topDomains = useMemo(() => {
    const counts: Record<string, number> = {};
    events
      .filter((event) => event.eventType === 'view')
      .forEach((event) => {
        const domain = event.domain || 'Direct / unknown';
        counts[domain] = (counts[domain] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);

  const exportLeads = () => {
    if (leads.length === 0) {
      toast.info('Nothing to export yet', 'Leads appear here after someone submits a form hotspot.');
      return;
    }
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Campaign', 'Date'],
      ...leads.map((lead) => [
        lead.name || 'Anonymous',
        lead.email,
        campaign?.name || `Campaign ${lead.campaignId}`,
        new Date(lead.createdAt || (lead as any).timestamp || Date.now()).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((row) => row.map(cell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', `leads_campaign_${id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    toast.success('Leads exported', `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'} saved as a CSV file.`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Crunching the numbers</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Analytics unavailable</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{error}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back to campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 sm:p-6 lg:p-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to campaigns"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">{campaign?.name} · Analytics</h1>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Calendar className="h-4 w-4" /> All-time performance
                <HelpTip text="Views, clicks and leads start counting as soon as your embed link is opened. There is no date filter yet." />
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/embed/${id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
            <button
              type="button"
              onClick={exportLeads}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> Export leads
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-10 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Views"
            value={views}
            icon={Users}
            color="blue"
            subtitle="Embed opened"
            help="One view is recorded each time someone opens your campaign page."
          />
          <StatCard
            title="Clicks"
            value={clicks}
            icon={MousePointer2}
            color="indigo"
            subtitle="Hotspot opened"
            help="Recorded when a visitor opens a hotspot card or modal."
          />
          <StatCard
            title="CTR"
            value={`${ctr}%`}
            icon={TrendingUp}
            color="emerald"
            subtitle="Clicks ÷ views"
            help="Click-through rate. Higher means your hotspots invite curiosity."
          />
          <StatCard
            title="Leads"
            value={leadCount}
            icon={Mail}
            color="rose"
            subtitle="Form submissions"
            help="Total form submissions captured on this campaign."
          />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Chart Section */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-100/40 lg:col-span-2 lg:p-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black text-slate-900">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> Engagement
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-400">Views and hotspot clicks by day (last 7 active days).</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="h-3 w-3 rounded-full bg-blue-500" /> Views
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" /> Clicks
                </div>
              </div>
            </div>
            <div className="h-60 sm:h-72">
              {dailyData.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No activity yet"
                  description="Open your preview link once — views and clicks will start appearing here within seconds."
                  className="h-full py-0"
                >
                  <a
                    href={`/embed/${id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open preview
                  </a>
                </EmptyState>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="view" name="Views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorView)" />
                    <Area type="monotone" dataKey="click" name="Clicks" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClick)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Domains Section */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-100/40 lg:p-8">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <Globe className="h-5 w-5 text-blue-600" /> Top domains
                <HelpTip text="The websites where your campaign was opened. 'Direct' means the link was opened without a referring site." />
              </h3>
            </div>
            <div className="space-y-5">
              {topDomains.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-medium leading-relaxed text-slate-500">
                  No domain data yet. Once your embed is opened on a site, it will show up here.
                </p>
              )}
              {topDomains.map(([domain, count]) => (
                <div key={domain}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold text-slate-700">{domain}</span>
                    <span className="shrink-0 text-xs font-black text-blue-600">
                      {count} {count === 1 ? 'view' : 'views'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${views > 0 ? (count / views) * 100 : 0}%` }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-100/40 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900">Recent leads</h3>
              <p className="mt-1 text-xs font-medium text-slate-400">The latest form submissions from this campaign.</p>
            </div>
            <Link
              to="/leads"
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 transition-colors hover:text-blue-700"
            >
              View all leads <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {leads.slice(0, 6).map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-black text-blue-600 shadow-sm">
                  {(lead.name || lead.email || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-900">{lead.name || 'Anonymous'}</div>
                  <div className="truncate text-xs font-medium text-slate-400">{lead.email}</div>
                </div>
                <div className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {new Date(lead.createdAt || (lead as any).timestamp || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </motion.div>
            ))}

            {leads.length === 0 && (
              <EmptyState
                icon={Mail}
                title="No leads yet"
                description="Leads are captured when a visitor submits a form hotspot. Add a Form hotspot to this campaign to start collecting names and emails."
              >
                <Link
                  to={`/campaigns/${id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add a form hotspot
                </Link>
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  help,
}: {
  title: string;
  value: any;
  icon: any;
  color: string;
  subtitle: string;
  help?: string;
}) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 sm:p-6 lg:rounded-[2rem] lg:p-8">
      <div className="mb-3 flex items-center justify-between sm:mb-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl ${colors[color]} transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        {help && <HelpTip text={help} />}
      </div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="text-3xl font-black text-slate-900 lg:text-4xl">{value}</div>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>
    </div>
  );
}
