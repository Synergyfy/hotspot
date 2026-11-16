import { useEffect, useRef, useState } from 'react';
import type { Domain } from '../types';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Globe, Info, Loader2, Plus, RefreshCw, Search, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { domainsApi } from '../api/services';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { EmptyState } from './ui/EmptyState';
import { HelpTip } from './ui/Tooltip';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/errors';

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

const HOSTNAME_PATTERN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | number | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchDomains = async () => {
    setLoadError(null);
    try {
      const { data } = await domainsApi.findAll();
      setDomains(data);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load your domains.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const verifiedCount = domains.filter((domain) => domain.verified).length;

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const name = normalizeDomain(newDomain);

    if (!name) {
      setAddError('Enter a domain, for example shop.example.com.');
      return;
    }
    if (!HOSTNAME_PATTERN.test(name)) {
      setAddError('That does not look like a domain. Use a hostname like example.com or shop.example.com (no https:// or paths).');
      return;
    }
    if (domains.some((domain) => domain.name === name)) {
      setAddError('That domain is already on your list.');
      return;
    }

    try {
      setAdding(true);
      const { data } = await domainsApi.create({ name });
      setDomains((previous) => [...previous, data]);
      setNewDomain('');
      toast.success('Domain added', 'Now verify it so it can embed your campaigns.');
    } catch (err) {
      setAddError(getErrorMessage(err, 'We could not add that domain. Please try again.'));
    } finally {
      setAdding(false);
    }
  };

  const verifyDomain = async (domain: Domain) => {
    try {
      setVerifyingId(domain.id);
      const { data } = await domainsApi.verify(domain.id);
      setDomains((previous) => previous.map((item) => (item.id === domain.id ? data : item)));
      toast.success('Domain verified', `${domain.name} can now embed your campaigns.`);
    } catch (err) {
      toast.error('Could not verify the domain', getErrorMessage(err));
    } finally {
      setVerifyingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;
    try {
      setDeleting(true);
      await domainsApi.remove(domainToDelete.id);
      setDomains((previous) => previous.filter((domain) => domain.id !== domainToDelete.id));
      toast.success('Domain removed', `${domainToDelete.name} can no longer embed your campaigns.`);
      setDomainToDelete(null);
    } catch (err) {
      toast.error('Could not remove the domain', getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filteredDomains = domains.filter((domain) => domain.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 sm:p-6 lg:p-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
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
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
                Domains
                <HelpTip text="Domains decide which websites are allowed to embed your campaigns. Your ClickSIP preview link always works, whatever is on this page." />
              </h1>
              <p className="text-sm font-medium text-slate-500">Choose which websites can show your interactive images.</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
              verifiedCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {verifiedCount} of {domains.length} verified
            </span>
          </div>
        </header>

        {loadError && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Domains did not load</p>
              <p className="mt-0.5 text-xs font-medium text-red-700">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchDomains();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Add Domain */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-100/40 lg:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Plus className="h-5 w-5 text-blue-600" /> Add a domain
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                Enter the hostname of the site where you want to embed a campaign.
              </p>

              <form onSubmit={addDomain} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="domain-name" className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Domain name
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                    <input
                      id="domain-name"
                      ref={inputRef}
                      type="text"
                      value={newDomain}
                      onChange={(e) => {
                        setNewDomain(e.target.value);
                        setAddError(null);
                      }}
                      placeholder="shop.example.com"
                      aria-invalid={Boolean(addError)}
                      aria-describedby={addError ? 'domain-error' : 'domain-help'}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {addError ? (
                    <p id="domain-error" className="mt-2 flex items-start gap-1.5 text-[11px] font-bold text-red-600">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {addError}
                    </p>
                  ) : (
                    <p id="domain-help" className="mt-2 text-[11px] font-medium text-slate-400">
                      Hostname only — no https:// and no page paths.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  {adding ? 'Adding…' : 'Add domain'}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Info className="h-3.5 w-3.5" /> How verification works
                </p>
                <ol className="mt-3 space-y-2 text-[11px] font-medium leading-relaxed text-slate-500">
                  <li>1. Add the site’s hostname.</li>
                  <li>2. Press “Verify domain” to approve it.</li>
                  <li>3. Only verified domains can embed your campaigns.</li>
                </ol>
                <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] font-medium leading-relaxed text-slate-400">
                  Your campaign preview link works everywhere, even before a domain is verified.
                </p>
              </div>
            </div>
          </div>

          {/* Domain list */}
          <div className="space-y-5 lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your domains…"
                aria-label="Search your domains"
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredDomains.map((domain) => (
                  <motion.div
                    key={domain.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          domain.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-black text-lg text-slate-900">{domain.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          {domain.verified ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified · may embed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <XCircle className="h-3.5 w-3.5" /> Not verified · cannot embed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      {!domain.verified && (
                        <button
                          type="button"
                          onClick={() => verifyDomain(domain)}
                          disabled={verifyingId === domain.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
                        >
                          {verifyingId === domain.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {verifyingId === domain.id ? 'Verifying…' : 'Verify domain'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDomainToDelete(domain)}
                        aria-label={`Remove ${domain.name}`}
                        className="rounded-xl p-2.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {domains.length === 0 && !loadError && (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/60">
                  <EmptyState
                    icon={Globe}
                    title="No domains yet"
                    description="Embedding on your own website? Add its hostname here and verify it. Sharing the ClickSIP link never requires a domain."
                  >
                    <button
                      type="button"
                      onClick={() => inputRef.current?.focus()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add your first domain
                    </button>
                  </EmptyState>
                </div>
              )}

              {domains.length > 0 && filteredDomains.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No matching domains"
                  description={`Nothing matches “${searchQuery}”. Try a shorter search or add a new domain.`}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(domainToDelete)}
        title={domainToDelete ? `Remove ${domainToDelete.name}?` : 'Remove domain?'}
        description="Campaigns will no longer be allowed to embed on this site. You can add it again later."
        confirmLabel="Remove domain"
        cancelLabel="Keep it"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDomainToDelete(null)}
      />
    </div>
  );
}
