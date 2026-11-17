import { useEffect, useState } from 'react';
import type { Lead, Campaign } from '../types';
import {
  AlertTriangle, ArrowLeft, Calendar, ChevronRight, Download, FileText, Inbox, Mail, PlusCircle, RefreshCw, Search, Tag, Trash2, User, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { leadsApi } from '../api/services';
import { campaignsApi } from '../api/campaigns';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import { HelpTip } from './ui/Tooltip';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/errors';

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchData = async () => {
    setLoadError(null);
    try {
      const [leadsRes, campaignsRes] = await Promise.all([leadsApi.findAll(), campaignsApi.findAll()]);
      setLeads(leadsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load your leads.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (lead.email || '').toLowerCase().includes(term) ||
      (lead.name || '').toLowerCase().includes(term);
    const matchesCampaign = selectedCampaignId === 'all' || String(lead.campaignId) === String(selectedCampaignId);
    return matchesSearch && matchesCampaign;
  });

  const getCampaignName = (id: string | number) => campaigns.find((campaign) => String(campaign.id) === String(id))?.name || 'Unknown campaign';

  const formatDate = (lead: Lead) => {
    const value = lead.createdAt || (lead as any).timestamp;
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  };

  const exportLeads = () => {
    if (filteredLeads.length === 0) {
      toast.info('Nothing to export', 'Adjust your filters or wait for the first form submission.');
      return;
    }
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Campaign', 'Date'],
      ...filteredLeads.map((lead) => {
        const date = formatDate(lead);
        return [lead.name || 'Anonymous', lead.email, getCampaignName(lead.campaignId), date ? date.toLocaleDateString() : '—'];
      }),
    ];
    const csv = rows.map((row) => row.map(cell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Leads exported', `${filteredLeads.length} ${filteredLeads.length === 1 ? 'lead' : 'leads'} saved as a CSV file.`);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      setDeleting(true);
      await leadsApi.remove(leadToDelete.id);
      setLeads((previous) => previous.filter((lead) => lead.id !== leadToDelete.id));
      if (selectedLead?.id === leadToDelete.id) setSelectedLead(null);
      toast.success('Lead deleted', 'That submission has been removed.');
      setLeadToDelete(null);
    } catch (err) {
      toast.error('Could not delete the lead', getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  const hasAnyLeads = leads.length > 0;
  const firstCampaign = campaigns[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to campaigns"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-all hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-slate-900">
                Leads
                <HelpTip text="Everyone who submitted a form hotspot on one of your campaigns. Their answers are saved automatically." />
              </h1>
              <p className="text-xs font-medium text-slate-500">Form submissions captured from your campaigns.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportLeads}
            disabled={filteredLeads.length === 0}
            title={filteredLeads.length === 0 ? 'Leads appear here after a form submission' : 'Download the filtered leads as a CSV'}
            className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {loadError && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Leads did not load</p>
              <p className="mt-0.5 text-xs font-medium text-red-700">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search leads by name or email"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-medium text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            aria-label="Filter leads by campaign"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} shown
        </p>

        {hasAnyLeads ? (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
            {/* Phones: stacked cards instead of a sideways-scrolling table */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredLeads.map((lead) => {
                const date = formatDate(lead);
                return (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedLead(lead)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLead(lead);
                      }
                    }}
                    className="flex cursor-pointer items-start gap-3 p-4 text-left transition-colors active:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                      {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{lead.name || 'Anonymous'}</p>
                          <p className="truncate text-xs font-medium text-slate-400">{lead.email || 'No email provided'}</p>
                        </div>
                        <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                        <Tag className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">{getCampaignName(lead.campaignId)}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadToDelete(lead);
                        }}
                        aria-label={`Delete lead from ${lead.email}`}
                        className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Campaign</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Captured</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const date = formatDate(lead);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                              {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{lead.name || 'Anonymous'}</p>
                              <p className="truncate text-sm font-medium text-slate-400">{lead.email || 'No email provided'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                            <Tag className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-xs font-bold text-slate-600">{getCampaignName(lead.campaignId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <Calendar className="h-4 w-4" />
                            {date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-blue-500" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadToDelete(lead);
                              }}
                              aria-label={`Delete lead from ${lead.email}`}
                              className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLeads.length === 0 && (
              <EmptyState
                icon={Search}
                title="No leads match those filters"
                description="Try a different search term or choose “All campaigns”."
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCampaignId('all');
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </EmptyState>
            )}
          </div>
        ) : (
          !loadError && (
            <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/60">
              <EmptyState
                icon={Inbox}
                title="No leads yet"
                description="Leads are captured when a visitor submits a form hotspot. Add a Form hotspot to any campaign — name and email fields are pre-filled for you."
              >
                {firstCampaign ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/campaigns/${firstCampaign.id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add a form to “{firstCampaign.name}”
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Create a campaign first
                  </button>
                )}
              </EmptyState>
            </div>
          )
        )}
      </main>

      {/* Lead detail modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLead(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Lead details"
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black leading-tight text-slate-900">Lead details</h2>
                    <p className="text-sm font-medium text-slate-500">Captured from {getCampaignName(selectedLead.campaignId)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  aria-label="Close lead details"
                  className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-slate-100 hover:bg-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
                    <p className="truncate text-sm font-bold text-slate-900">{selectedLead.email || 'Not provided'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Captured</p>
                    <p className="text-sm font-bold text-slate-900">
                      {(() => {
                        const date = formatDate(selectedLead);
                        return date ? date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
                      })()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Form answers</h3>
                    <HelpTip text="Exactly what the visitor typed into the form hotspot." />
                  </div>

                  <div className="grid gap-3">
                    {selectedLead.data && Object.keys(selectedLead.data).length > 0 ? (
                      Object.entries(selectedLead.data).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:border-blue-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</span>
                          <span className="text-sm font-bold text-slate-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value || '—')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-500">
                        This lead was captured without extra answers — only the email and name fields were submitted.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 p-5">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(selectedLead)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 rounded-2xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(leadToDelete)}
        title="Delete this lead?"
        description={leadToDelete ? `${leadToDelete.name || leadToDelete.email} will be permanently removed from this campaign.` : ''}
        confirmLabel="Delete lead"
        cancelLabel="Keep it"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setLeadToDelete(null)}
      />
    </div>
  );
}
