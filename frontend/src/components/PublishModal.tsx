import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, CheckCircle2, Code, Copy, ExternalLink, Globe, Link2, Share2, ShieldAlert, X } from 'lucide-react';
import { domainsApi } from '../api/services';
import { copyToClipboard } from '../lib/clipboard';
import { onboarding } from '../lib/onboarding';
import { StepIndicator } from './ui/StepIndicator';
import { useToast } from './ui/Toast';

type Tab = 'link' | 'embed' | 'html';

export function PublishModal({
  open,
  onClose,
  campaignId,
  campaignName,
}: {
  open: boolean;
  onClose: () => void;
  campaignId: string | number;
  campaignName: string;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('link');
  const [copied, setCopied] = useState<Tab | null>(null);
  const [domains, setDomains] = useState<{ verified: boolean }[] | null>(null);

  const url = `${window.location.origin}/embed/${campaignId}`;
  const safeName = campaignName.replace(/"/g, '&quot;');

  const snippets = useMemo(
    () => ({
      link: url,
      embed: `<iframe\n  src="${url}"\n  width="100%"\n  height="600"\n  style="border:0;border-radius:16px"\n  allow="fullscreen"\n  title="${safeName}"\n></iframe>`,
      html: `<a href="${url}" target="_blank" rel="noopener">${campaignName}</a>`,
    }),
    [url, safeName, campaignName],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    domainsApi
      .findAll()
      .then(({ data }) => {
        if (!cancelled) setDomains(data);
      })
      .catch(() => {
        if (!cancelled) setDomains([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const verifiedCount = domains?.filter((domain) => domain.verified).length ?? 0;

  const copy = async (value: string, kind: Tab) => {
    const success = await copyToClipboard(value);
    if (!success) {
      toast.error('Could not copy', 'Select the text manually and copy it.');
      return;
    }
    setCopied(kind);
    onboarding.markShared();
    if (kind === 'link') {
      toast.success('Link copied', 'Anyone with this link can open your campaign — no app needed.');
    } else {
      toast.success(kind === 'embed' ? 'Embed code copied' : 'HTML link copied', 'Paste it into your website or page builder.');
    }
    window.setTimeout(() => setCopied(null), 2000);
  };

  const openPreview = () => {
    window.open(url, '_blank');
    onboarding.markPreviewed();
  };

  const tabs: { id: Tab; label: string; icon: typeof Link2 }[] = [
    { id: 'link', label: 'Share link', icon: Link2 },
    { id: 'embed', label: 'Embed code', icon: Code },
    { id: 'html', label: 'HTML link', icon: Globe },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Publish and share"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative my-8 w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Publish &amp; share</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    “{campaignName}” is ready. Share the link, or embed it where your audience already is.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close publish dialog"
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <StepIndicator
                steps={[
                  { label: 'Save campaign', done: true },
                  { label: 'Preview', done: false },
                  { label: 'Share', active: true },
                ]}
                className="mb-6"
              />

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3">
                  <EyeIcon />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Step 1</p>
                    <p className="text-sm font-bold text-slate-900">Check what your visitors will see</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openPreview}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open preview
                </button>
              </div>

              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Step 2 · Choose how to share</p>
              <div className="mb-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                      tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {tab === 'link' ? (
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-600">{url}</div>
                      <button
                        type="button"
                        onClick={() => copy(snippets.link, 'link')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                      >
                        {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied === 'link' ? 'Copied' : 'Copy link'}
                      </button>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Paste it in a post, email, bio or QR code. The page opens full-screen with your image and hotspots.
                    </p>
                  </div>
                ) : (
                  <div>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-600">
                      {snippets[tab]}
                    </pre>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">
                        {tab === 'embed'
                          ? 'Paste into your CMS or page builder. Height 600px suits most layouts.'
                          : 'Use this when you want a plain text link inside a page.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => copy(snippets[tab], tab)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-slate-800"
                      >
                        {copied === tab ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === tab ? 'Copied' : 'Copy code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {domains !== null && verifiedCount === 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-xs font-medium leading-relaxed">
                    <p className="font-black">Embedding on a website?</p>
                    <p className="mt-1">
                      Add and verify that site’s domain first, otherwise visitors on that site may see an access error. Your preview link
                      always works.
                    </p>
                    <a href="/domains" className="mt-2 inline-flex items-center gap-1 font-black text-amber-900 underline">
                      Manage domains <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {verifiedCount > 0 && (
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {verifiedCount} verified {verifiedCount === 1 ? 'domain' : 'domains'} can embed this campaign.
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { title: 'Views', body: 'Recorded each time the page opens.' },
                  { title: 'Clicks', body: 'Recorded when a hotspot is opened.' },
                  { title: 'Leads', body: 'Captured when a form is submitted.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-100 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.title}</p>
                    <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-[0.99]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function EyeIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
      <ExternalLink className="h-4 w-4" />
    </span>
  );
}
