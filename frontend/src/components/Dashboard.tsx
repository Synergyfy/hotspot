import { useCallback, useEffect, useRef, useState } from 'react';
import type { Campaign, Domain } from '../types';
import {
  Plus, Globe, Image as ImageIcon, BarChart3, Trash2, ExternalLink, Settings, LogOut, X, Upload,
  Link as LinkIcon, Loader2, Users, HelpCircle, CheckCircle2, ArrowRight, Sparkles, AlertTriangle,
  MousePointerClick, Share2, RefreshCw, ScanSearch,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { campaignsApi } from '../api/campaigns';
import { domainsApi, uploadsApi, leadsApi } from '../api/services';
import { HelpModal } from './HelpModal';
import { OnboardingChecklist } from './OnboardingChecklist';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { HelpTip } from './ui/Tooltip';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/errors';
import { copyToClipboard } from '../lib/clipboard';
import { onboarding } from '../lib/onboarding';

const DEMO_IMAGE = '/demo-scene.svg';

const DEMO_HOTSPOTS = [
  {
    type: 'product',
    x: 318,
    y: 480,
    width: 14,
    title: 'Linen overshirt',
    description: 'A lightweight layer for cool evenings. Available in three washes.',
    price: '89',
    currency: '$',
    ctaText: 'Shop the overshirt',
    iconName: 'ShoppingCart',
    backgroundColor: '#2563eb',
    triggerType: 'hover',
    roundness: 100,
    action: { type: 'url', value: 'https://example.com' },
  },
  {
    type: 'signup_form',
    x: 840,
    y: 240,
    width: 14,
    title: 'Get 10% off your first order',
    description: 'Join the list for early access to new drops.',
    ctaText: 'Send my code',
    iconName: 'Mail',
    backgroundColor: '#0f172a',
    triggerType: 'hover',
    roundness: 100,
    formFields: [
      { id: 'f1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
      { id: 'f2', type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
    ],
    action: { type: 'email', value: '' },
  },
  {
    type: 'standard',
    x: 968,
    y: 520,
    width: 12,
    title: 'New season, new shelf',
    description: 'Fresh pieces land every Friday. Tap to browse the edit.',
    ctaText: 'Browse new arrivals',
    iconName: 'Star',
    backgroundColor: '#0f172a',
    triggerType: 'hover',
    roundness: 100,
    action: { type: 'url', value: 'https://example.com' },
  },
];

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', imageUrl: '' });
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoadError(null);
    try {
      const [campaignsRes, domainsRes, leadsRes] = await Promise.all([
        campaignsApi.findAll(),
        domainsApi.findAll(),
        leadsApi.findAll(),
      ]);
      setCampaigns(campaignsRes.data);
      setDomains(domainsRes.data);
      setLeadsCount(leadsRes.data.length);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'We could not load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const verifiedDomains = domains.filter((domain) => domain.verified).length;
  const totalHotspots = campaigns.reduce((count, campaign) => count + (campaign.hotspots?.length || 0), 0);

  const openCreateModal = () => {
    setCreateError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('That file is not an image. Choose a PNG, JPG or WebP file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('That image is larger than 10MB. Please compress it and try again.');
      return;
    }

    try {
      setSubmitting(true);
      setUploadError(null);
      const { data } = await uploadsApi.upload(file);
      setNewCampaign((previous) => ({ ...previous, imageUrl: data.url }));
    } catch (err) {
      setUploadError(getErrorMessage(err, 'The image upload failed. Try a smaller file or paste an image URL instead.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newCampaign.name.trim()) {
      setCreateError('Give your campaign a name so you can find it later.');
      return;
    }
    if (!newCampaign.imageUrl) {
      setCreateError('Add an image — it is the background your hotspots sit on.');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await campaignsApi.create({ ...newCampaign, name: newCampaign.name.trim() });
      setIsModalOpen(false);
      setNewCampaign({ name: '', imageUrl: '' });
      toast.success('Campaign created', 'Click anywhere on the image to place your first hotspot.');
      navigate(`/campaigns/${data.id}/edit`);
    } catch (err) {
      setCreateError(getErrorMessage(err, 'We could not create the campaign. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const createDemo = async () => {
    try {
      setCreatingDemo(true);
      const { data } = await campaignsApi.create({
        name: 'Demo — Summer Collection',
        imageUrl: DEMO_IMAGE,
        hotspots: DEMO_HOTSPOTS,
      });
      toast.success('Demo campaign ready', 'Everything is pre-built — edit hotspots, change the image or publish it as-is.');
      navigate(`/campaigns/${data.id}/edit`);
    } catch (err) {
      toast.error('Could not create the demo', getErrorMessage(err));
    } finally {
      setCreatingDemo(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleting(true);
      await campaignsApi.remove(campaignToDelete.id);
      setCampaigns((previous) => previous.filter((campaign) => campaign.id !== campaignToDelete.id));
      toast.success('Campaign deleted', `“${campaignToDelete.name}” and its hotspots, leads and analytics were removed.`);
      setCampaignToDelete(null);
    } catch (err) {
      toast.error('Could not delete the campaign', getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const copyCampaignLink = async (campaign: Campaign) => {
    const ok = await copyToClipboard(`${window.location.origin}/embed/${campaign.id}`);
    if (ok) {
      onboarding.markShared();
      toast.success('Link copied', 'Anyone with the link can open this campaign.');
    } else {
      toast.error('Could not copy the link', 'Open the editor and use Publish & share instead.');
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">ClickSIP</span>
              <span className="ml-2 hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:inline">
                Interactive images
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">How it works</span>
              </button>
              <Link
                to="/domains"
                className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 sm:flex"
                title="Control which websites can embed your campaigns"
              >
                <Globe className="h-4 w-4" /> Domains
              </Link>
              <Link
                to="/leads"
                className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600 sm:flex"
                title="Everyone who submitted a form on your campaigns"
              >
                <Users className="h-4 w-4" /> Leads
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md sm:px-4"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Campaign</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {loadError && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Your dashboard did not load</p>
              <p className="mt-0.5 text-xs font-medium text-red-700">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchDashboard();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        <OnboardingChecklist campaigns={campaigns} onNewCampaign={openCreateModal} onHelp={() => setHelpOpen(true)} />

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Campaigns"
            value={campaigns.length}
            icon={ImageIcon}
            color="indigo"
            subtitle="One image + hotspots each"
            help="A campaign is a single image with tappable hotspots placed on it."
          />
          <StatCard
            title="Hotspots"
            value={totalHotspots}
            icon={MousePointerClick}
            color="blue"
            subtitle="Dots your visitors can open"
            help="Hotspots are the tappable dots. Each one can show a product, form, video, image or note."
          />
          <StatCard
            title="Leads"
            value={leadsCount}
            icon={Users}
            color="emerald"
            subtitle="Captured from forms"
            help="Every time a visitor submits a form hotspot, their details are saved under Leads."
          />
          <StatCard
            title="Verified domains"
            value={`${verifiedDomains}/${domains.length}`}
            icon={Globe}
            color="rose"
            subtitle="Allowed to embed"
            help="Only verified domains may embed your campaigns on their website. Your preview link always works."
          />
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your campaigns</h2>
            <p className="mt-1 text-slate-500">Open one to place hotspots, style it and publish.</p>
          </div>
          {campaigns.length > 0 && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700"
            >
              <Sparkles className="h-3.5 w-3.5" /> New to hotspots? Read the guide
            </button>
          )}
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {campaigns.map((campaign) => {
            const hotspotCount = campaign.hotspots?.length || 0;
            return (
              <motion.div
                key={campaign.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      to={`/campaigns/${campaign.id}/edit`}
                      className="rounded-xl bg-white p-3 text-slate-900 shadow-lg transition-all hover:bg-blue-50 hover:text-blue-600"
                      title="Edit hotspots and styling"
                      aria-label={`Edit ${campaign.name}`}
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/campaigns/${campaign.id}/analytics`}
                      className="rounded-xl bg-white p-3 text-slate-900 shadow-lg transition-all hover:bg-blue-50 hover:text-blue-600"
                      title="Views, clicks and leads"
                      aria-label={`Analytics for ${campaign.name}`}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </Link>
                    <a
                      href={`/embed/${campaign.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-white p-3 text-slate-900 shadow-lg transition-all hover:bg-blue-50 hover:text-blue-600"
                      title="Open the live experience"
                      aria-label={`Preview ${campaign.name}`}
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyCampaignLink(campaign)}
                      className="rounded-xl bg-white p-3 text-slate-900 shadow-lg transition-all hover:bg-blue-50 hover:text-blue-600"
                      title="Copy the shareable link"
                      aria-label={`Copy link for ${campaign.name}`}
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                  {hotspotCount === 0 && (
                    <span className="absolute left-3 top-3 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                      Needs hotspots
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">{campaign.name}</h3>
                      <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span>{hotspotCount} {hotspotCount === 1 ? 'hotspot' : 'hotspots'}</span>
                        <span aria-hidden="true">·</span>
                        <span>ID {campaign.id}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCampaignToDelete(campaign)}
                      className="rounded-lg p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                      title="Delete campaign"
                      aria-label={`Delete ${campaign.name}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/campaigns/${campaign.id}/edit`}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-colors ${
                        hotspotCount === 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      <MousePointerClick className="h-3.5 w-3.5" />
                      {hotspotCount === 0 ? 'Add hotspots' : 'Edit campaign'}
                    </Link>
                    <Link
                      to={`/campaigns/${campaign.id}/analytics`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-700"
                      title="Analytics"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {campaigns.length === 0 && !loadError && (
            <div className="col-span-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
              <div className="grid gap-8 p-8 lg:grid-cols-[1.05fr_1fr] lg:p-10">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                    <Sparkles className="h-3 w-3" /> Start here
                  </span>
                  <h3 className="mt-4 text-2xl font-black leading-tight text-slate-900">
                    Turn one image into a shoppable experience
                  </h3>
                  <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                    A campaign is a single image with tappable hotspots. Place a dot on a product to sell it, on a form to collect emails,
                    or anywhere to tell a story. Then share one link — no coding required.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4" /> Create your first campaign
                    </button>
                    <button
                      type="button"
                      onClick={createDemo}
                      disabled={creatingDemo}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700 disabled:opacity-60"
                    >
                      {creatingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                      {creatingDemo ? 'Building demo…' : 'Try a demo campaign'}
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-slate-400">The demo comes pre-built and can be deleted at any time.</p>
                </div>
                <ol className="space-y-4 self-center">
                  {[
                    { icon: ImageIcon, title: 'Pick your image', body: 'A product shot, lifestyle photo or catalogue page.' },
                    { icon: MousePointerClick, title: 'Drop hotspots', body: 'Click the image, choose product, form, video or text.' },
                    { icon: Share2, title: 'Share one link', body: 'Paste it anywhere, or embed it on your site.' },
                  ].map(({ icon: Icon, title, body }, index) => (
                    <li key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {index + 1}. {title}
                        </p>
                        <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500">{body}</p>
                      </div>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => setHelpOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                      Read the full guide <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-label="Create a new campaign"
              className="relative my-8 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-7 sm:p-8">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">New campaign</h2>
                    <p className="mt-1 text-xs font-medium text-slate-500">Name it, choose an image, then add hotspots.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    aria-label="Close"
                    className="rounded-full p-2 transition-colors hover:bg-slate-100 disabled:opacity-50"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                {createError && (
                  <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateCampaign} className="space-y-6">
                  <div>
                    <label htmlFor="campaign-name" className="mb-2 block text-sm font-semibold text-slate-700">
                      1. Campaign name
                    </label>
                    <input
                      id="campaign-name"
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Summer Collection 2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">Only you will see this — it is not shown to visitors.</p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <label className="text-sm font-semibold text-slate-700">2. Background image</label>
                      <HelpTip text="This is the scene visitors explore. Use a clear product photo, a flat-lay or a catalogue page. You can change it later." />
                    </div>

                    <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setUploadMethod('upload')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                          uploadMethod === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Upload className="h-4 w-4" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMethod('url')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all ${
                          uploadMethod === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <LinkIcon className="h-4 w-4" /> URL
                      </button>
                    </div>

                    {uploadError && (
                      <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[11px] font-bold text-red-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {uploadMethod === 'upload' ? (
                      <div>
                        <div
                          onClick={() => !submitting && fileInputRef.current?.click()}
                          className={`group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-400 hover:bg-blue-50/30 ${
                            submitting ? 'cursor-wait opacity-70' : ''
                          }`}
                        >
                          {newCampaign.imageUrl ? (
                            <>
                              <img src={newCampaign.imageUrl} alt="Campaign preview" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="text-sm font-bold text-white">Change image</span>
                              </div>
                            </>
                          ) : (
                            <>
                              {submitting ? (
                                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                              ) : (
                                <>
                                  <Upload className="mb-2 h-8 w-8 text-slate-300" />
                                  <span className="text-sm font-bold text-slate-400">Click to upload an image</span>
                                  <span className="mt-1 text-[10px] uppercase tracking-widest text-slate-300">PNG, JPG or WebP · up to 10MB</span>
                                </>
                              )}
                            </>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">Wide images (landscape) look best in the viewer.</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={newCampaign.imageUrl}
                          onChange={(e) => setNewCampaign({ ...newCampaign, imageUrl: e.target.value })}
                          placeholder="https://images.example.com/product.jpg"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          The image must be publicly accessible. If it does not load, upload it instead.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !newCampaign.name.trim() || !newCampaign.imageUrl}
                    className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {submitting ? 'Creating…' : 'Create & add hotspots'}
                  </button>
                  <p className="text-center text-[11px] font-medium text-slate-400">
                    Next: click the image in the editor to place your first hotspot.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ConfirmDialog
        open={Boolean(campaignToDelete)}
        title={campaignToDelete ? `Delete “${campaignToDelete.name}”?` : 'Delete campaign?'}
        description="This permanently removes the campaign, its hotspots, captured leads and analytics. This cannot be undone."
        confirmLabel="Delete campaign"
        cancelLabel="Keep it"
        destructive
        loading={deleting}
        onConfirm={confirmDeleteCampaign}
        onCancel={() => setCampaignToDelete(null)}
      />
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
  subtitle?: string;
  help?: string;
}) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md lg:rounded-3xl lg:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
          {help && <HelpTip text={help} />}
        </span>
      </div>
      <div className="text-3xl font-black text-slate-900 lg:text-4xl">{value}</div>
      {subtitle && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>}
    </div>
  );
}
