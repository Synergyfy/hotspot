import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Eye, Image as ImageIcon, Link2, MousePointerClick, PartyPopper, Rocket, Share2, X } from 'lucide-react';
import type { Campaign } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import { onboarding } from '../lib/onboarding';
import { useToast } from './ui/Toast';

interface Props {
  campaigns: Campaign[];
  onNewCampaign: () => void;
  onHelp: () => void;
}

export function OnboardingChecklist({ campaigns, onNewCampaign, onHelp }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(onboarding.isDismissed());
  const [previewed, setPreviewed] = useState(onboarding.hasPreviewed());
  const [shared, setShared] = useState(onboarding.hasShared());

  const firstCampaign = campaigns[0];
  const hasCampaign = campaigns.length > 0;
  const hasHotspots = campaigns.some((campaign) => (campaign.hotspots?.length || 0) > 0);

  if (dismissed) return null;

  const dismiss = () => {
    onboarding.dismiss();
    setDismissed(true);
  };

  const openEditor = () => {
    if (firstCampaign) navigate(`/campaigns/${firstCampaign.id}/edit`);
    else onNewCampaign();
  };

  const preview = () => {
    if (!firstCampaign) return;
    window.open(`/embed/${firstCampaign.id}`, '_blank');
    onboarding.markPreviewed();
    setPreviewed(true);
  };

  const share = async () => {
    if (!firstCampaign) return;
    const copied = await copyToClipboard(`${window.location.origin}/embed/${firstCampaign.id}`);
    if (copied) {
      onboarding.markShared();
      setShared(true);
      toast.success('Campaign link copied', 'Paste it into a post, email or message. Anyone with the link can open it.');
    } else {
      toast.error('Could not copy the link', 'Open the editor and use Publish & share to copy it manually.');
    }
  };

  const steps = [
    {
      label: 'Create your first campaign',
      hint: 'Pick one image as your scene.',
      done: hasCampaign,
      action: hasCampaign ? { label: 'Open editor', onClick: openEditor, icon: ArrowRight } : { label: 'New campaign', onClick: onNewCampaign, icon: ImageIcon },
    },
    {
      label: 'Place hotspots on the image',
      hint: 'Click the image, then choose product, form, video or text.',
      done: hasHotspots,
      action: { label: hasCampaign ? 'Add hotspots' : 'Create first', onClick: hasCampaign ? openEditor : onNewCampaign, icon: MousePointerClick },
    },
    {
      label: 'Preview the live experience',
      hint: 'See exactly what your audience will see.',
      done: previewed,
      action: { label: 'Preview', onClick: hasCampaign ? preview : onNewCampaign, icon: Eye },
    },
    {
      label: 'Share your campaign link',
      hint: 'One link or iframe works on any site.',
      done: shared,
      action: { label: shared ? 'Copy again' : 'Copy link', onClick: hasCampaign ? share : onNewCampaign, icon: Link2 },
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  const allDone = completed === steps.length;

  if (allDone) {
    return (
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
          <PartyPopper className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-black text-emerald-900">You’re live — nice work.</h2>
          <p className="mt-0.5 text-sm font-medium text-emerald-700">
            Your campaign is published. Check Analytics after a little traffic to see views, clicks and leads.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={preview}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            View campaign
          </button>
          <button type="button" onClick={dismiss} aria-label="Dismiss checklist" className="rounded-xl p-2 text-emerald-700/70 hover:bg-emerald-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Get your first campaign live</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-500">Four short steps. This card disappears when you’re done.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-black uppercase tracking-widest text-slate-400 sm:inline">
            {completed} of {steps.length}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss getting started checklist"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-slate-100">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <ul className="divide-y divide-slate-100">
        {steps.map((step) => (
          <li key={step.label} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                step.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${step.done ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'}`}>
                {step.label}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{step.hint}</p>
            </div>
            {!step.done && (
              <button
                type="button"
                onClick={step.action.onClick}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:self-auto"
              >
                {step.action.label} <step.action.icon className="h-3.5 w-3.5" />
              </button>
            )}
            {step.done && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <Share2 className="h-4 w-4 text-slate-400" />
        <p className="text-xs font-medium text-slate-500">Not sure where to start?</p>
        <button type="button" onClick={onHelp} className="text-xs font-black text-blue-600 hover:text-blue-700">
          Read the 2-minute guide
        </button>
      </div>
    </div>
  );
}
