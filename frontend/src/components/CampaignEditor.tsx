import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Circle, Rect, Transformer, Group, Text as KonvaText } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Campaign, Hotspot, HotspotType, FormField } from '../types';
import {
  Save, ArrowLeft, Plus, Settings, Trash2, MousePointer2, Type, Play, Mail,
  ShoppingCart, ChevronRight, Layout, Eye, Sliders, Sun, Contrast, Droplets,
  Palette, Layers, Box, Code, Image as ImageIcon, FileText,
  Smartphone, Music, ShieldCheck, X, Upload, Globe, Search, Info, ExternalLink,
  Phone, CheckCircle, ArrowRight, DollarSign, Euro, PoundSterling,
  Heart, Star, Tag, Zap, Gift, MapPin, Camera, Bookmark, Bell, Award,
  ThumbsUp, Clock, Flame, Video, Hash, ToggleLeft, Minus, Activity,
  Share2, CheckCircle2, MousePointerClick, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { campaignsApi } from '../api/campaigns';
import { uploadsApi } from '../api/services';
import { useToast } from './ui/Toast';
import { HelpTip } from './ui/Tooltip';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { StepIndicator } from './ui/StepIndicator';
import { PublishModal } from './PublishModal';
import { getErrorMessage } from '../lib/errors';
import { MAX_IMAGE_MB, MAX_VIDEO_MB, MAX_PRODUCT_IMAGES, isHttpUrl, validateMediaFile } from '../lib/media';
import { HotspotVideo } from './ui/HotspotVideo';

const MAX_EXTRA_PRODUCT_PHOTOS = MAX_PRODUCT_IMAGES - 1;

const ICON_LIBRARY = [
  { name: 'Info', icon: Info },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Play', icon: Play },
  { name: 'Mail', icon: Mail },
  { name: 'Type', icon: Type },
  { name: 'ImageIcon', icon: ImageIcon },
  { name: 'FileText', icon: FileText },
  { name: 'MousePointer2', icon: MousePointer2 },
  { name: 'Globe', icon: Globe },
  { name: 'ExternalLink', icon: ExternalLink },
  { name: 'Phone', icon: Phone },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'Plus', icon: Plus },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Tag', icon: Tag },
  { name: 'Zap', icon: Zap },
  { name: 'Gift', icon: Gift },
  { name: 'MapPin', icon: MapPin },
  { name: 'Camera', icon: Camera },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Bell', icon: Bell },
  { name: 'Award', icon: Award },
  { name: 'ThumbsUp', icon: ThumbsUp },
  { name: 'Clock', icon: Clock },
  { name: 'Flame', icon: Flame },
  { name: 'Video', icon: Video },
  { name: 'Hash', icon: Hash },
];

const CURRENCIES = [
  { label: 'USD ($)', value: '$', icon: DollarSign },
  { label: 'EUR (€)', value: '€', icon: Euro },
  { label: 'GBP (£)', value: '£', icon: PoundSterling },
  { label: 'JPY (¥)', value: '¥', icon: DollarSign },
  { label: 'NGN (₦)', value: '₦', icon: DollarSign },
  { label: 'INR (₹)', value: '₹', icon: DollarSign },
  { label: 'CAD (C$)', value: 'C$', icon: DollarSign },
  { label: 'AUD (A$)', value: 'A$', icon: DollarSign },
];

const HOTSPOT_TYPE_HELP: Record<string, string> = {
  standard: 'A simple dot with a title, description and optional button.',
  product: 'A product card with price, gallery and a buy button.',
  signup_form: 'Collect names, emails or other answers right on the image.',
  video: 'Open a video in a pop-up card.',
  text: 'A text-only note or label with no media.',
  image: 'Show a second image in a pop-up card.',
};

/** Minimum distance (in image pixels) between two hotspots before they are considered overlapping. */
const MIN_HOTSPOT_GAP = 44;

/** Stable representation of everything that can be saved on this screen. */
function buildSnapshot(campaign: Campaign | null, hotspots: Hotspot[], filters: any) {
  return JSON.stringify({
    name: campaign?.name || '',
    hotspots,
    filters,
    watermarkUrl: campaign?.watermarkUrl || '',
    soundUrl: campaign?.soundUrl || '',
  });
}

export default function CampaignEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [filters, setFilters] = useState({
    brightness: 0, contrast: 0, blur: 0, grayscale: false, sepia: false,
    invert: false, hue: 0, saturation: 0, opacity: 1, noise: 0, pixelSize: 1, vignette: 0
  });
  const [activeTab, setActiveTab] = useState<'properties' | 'filters' | 'settings'>('properties');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [image] = useImage(campaign?.imageUrl || '', 'anonymous');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [videoPreview, setVideoPreview] = useState<Hotspot | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hotspotToDelete, setHotspotToDelete] = useState<Hotspot | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const [{ data: campaign }, { data: allCamp }] = await Promise.all([
          campaignsApi.findOne(id),
          campaignsApi.findAll()
        ]);
        const nextFilters = campaign.filters ? { ...filters, ...campaign.filters } : filters;
        const nextHotspots = campaign.hotspots || [];
        setCampaign(campaign);
        setAllCampaigns(allCamp);
        setHotspots(nextHotspots);
        setFilters(nextFilters);
        setSavedSnapshot(buildSnapshot(campaign, nextHotspots, nextFilters));
      } catch (err) {
        toast.error('Could not open this campaign', getErrorMessage(err, 'It may have been deleted or you may not have access.'));
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id, navigate]);

  useEffect(() => { if (imageRef.current) imageRef.current.cache(); }, [image, filters]);

  // Fit the artwork inside the canvas on phones and laptops instead of
  // overflowing it, and keep the fit up to date on rotation / resize.
  useEffect(() => {
    if (loading) return;
    const el = canvasRef.current;
    if (!el) return;
    const update = () => setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, campaign?.id]);

  const fitScale = useMemo(() => {
    if (!image || !canvasSize.width || !canvasSize.height) return 1;
    const padding = canvasSize.width < 640 ? 32 : 96;
    return Math.max(0.05, Math.min(1, (canvasSize.width - padding) / image.width, (canvasSize.height - padding) / image.height));
  }, [image, canvasSize]);

  const displayScale = fitScale * zoom;

  useEffect(() => {
    setStagePos({ x: 0, y: 0 });
  }, [image, canvasSize.width, canvasSize.height]);

  // Escape leaves "click the image to place a hotspot" mode.
  useEffect(() => {
    if (!isAdding) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAdding(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdding]);

  const snapshot = useMemo(() => (campaign ? buildSnapshot(campaign, hotspots, filters) : ''), [campaign, hotspots, filters]);
  const isDirty = Boolean(campaign) && savedSnapshot !== '' && snapshot !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const konvaFilters = useMemo(() => {
    const f: any[] = [];
    if (filters.brightness !== 0) f.push(Konva.Filters.Brighten);
    if (filters.contrast !== 0) f.push(Konva.Filters.Contrast);
    if (filters.blur !== 0) f.push(Konva.Filters.Blur);
    if (filters.grayscale) f.push(Konva.Filters.Grayscale);
    if (filters.sepia) f.push(Konva.Filters.Sepia);
    if (filters.invert) f.push(Konva.Filters.Invert);
    if (filters.hue !== 0 || filters.saturation !== 0) f.push(Konva.Filters.HSL);
    if (filters.noise > 0) f.push(Konva.Filters.Noise);
    if (filters.pixelSize > 1) f.push(Konva.Filters.Pixelate);
    return f;
  }, [filters]);

  const handleStageClick = (e: any) => {
    const clickedBackground = e.target === e.target.getStage() || e.target.name() === 'background-image';
    if (!clickedBackground) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) {
      setSelectedId(null);
      return;
    }

    // Only add on an explicit "add" mode (or when placing the very first dot).
    // Plain background clicks now deselect, so brushing past a dot can never
    // spawn a second hotspot on top of it.
    if (hotspots.length === 0 || isAdding) {
      const relativeX = (pos.x - stage.x()) / displayScale;
      const relativeY = (pos.y - stage.y()) / displayScale;
      addHotspot(relativeX, relativeY);
    } else {
      setSelectedId(null);
      setHoveredId(null);
    }
  };

  const startAdding = () => {
    setHintDismissed(true);
    setSelectedId(null);
    setIsAdding(true);
    toast.info('Click the image to place the hotspot', 'Press Esc or use Cancel above the image to stop.');
  };

  const addHotspot = (x = 100, y = 100) => {
    // Nudge a new dot away from existing ones so accidental double-clicks can
    // never stack two hotspots on exactly the same spot.
    const isFree = (px: number, py: number) =>
      !hotspots.some((h) => Math.hypot((h.x || 0) - px, (h.y || 0) - py) < MIN_HOTSPOT_GAP);

    let px = x;
    let py = y;
    let nudged = false;

    if (!isFree(px, py)) {
      nudged = true;
      let found = false;
      for (let ring = 1; ring <= 5 && !found; ring += 1) {
        const radius = MIN_HOTSPOT_GAP * ring;
        for (let step = 0; step < 12 && !found; step += 1) {
          const angle = (Math.PI * 2 * step) / 12;
          const candidateX = x + Math.cos(angle) * radius;
          const candidateY = y + Math.sin(angle) * radius;
          if (isFree(candidateX, candidateY)) {
            px = candidateX;
            py = candidateY;
            found = true;
          }
        }
      }
    }

    if (image) {
      px = Math.min(Math.max(px, 16), image.width - 16);
      py = Math.min(Math.max(py, 16), image.height - 16);
    }

    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      x: px, y: py, type: 'standard', title: 'New Hotspot',
      action: { type: 'url', value: '' }, currency: '$', triggerType: 'hover',
    };
    setHotspots([...hotspots, newHotspot]);
    setSelectedId(newHotspot.id);
    setActiveTab('properties');
    setHintDismissed(true);
    // Stay in "add" mode so the user can keep clicking objects on the image
    // to place more hotspots. Clicking an existing dot or pressing Esc/Cancel
    // exits the mode.

    if (nudged) {
      toast.info('Placed beside the other dot', 'It was nudged slightly so the two hotspots do not overlap.');
    }
  };

  const updateHotspot = (hid: string | number, updates: Partial<Hotspot>) => {
    setHotspots(hotspots.map(h => h.id === hid ? { ...h, ...updates } : h));
  };

  /** Move a hotspot off a neighbouring dot so both stay easy to click. */
  const separateHotspot = (hotspot: Hotspot, other: Hotspot) => {
    const dx = (hotspot.x || 0) - (other.x || 0);
    const dy = (hotspot.y || 0) - (other.y || 0);
    const distance = Math.hypot(dx, dy);
    const angle = distance < 1 ? -Math.PI / 2 : Math.atan2(dy, dx);
    let nx = (other.x || 0) + Math.cos(angle) * (MIN_HOTSPOT_GAP + 8);
    let ny = (other.y || 0) + Math.sin(angle) * (MIN_HOTSPOT_GAP + 8);
    if (image) {
      nx = Math.min(Math.max(nx, 16), image.width - 16);
      ny = Math.min(Math.max(ny, 16), image.height - 16);
    }
    updateHotspot(hotspot.id, { x: nx, y: ny });
    toast.success('Hotspots spread apart', 'Drag either dot to fine-tune its position.');
  };

  const handleTypeChange = (hid: string | number, newType: HotspotType) => {
    const updates: Partial<Hotspot> = { type: newType };
    if (newType === 'signup_form') {
      const h = hotspots.find(x => x.id === hid);
      if (!h?.formFields?.length) {
        updates.formFields = [
          { id: 'f1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
          { id: 'f2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
        ];
      }
    }
    updateHotspot(hid, updates);
  };

  const deleteHotspot = (hid: string | number) => {
    setHotspots(hotspots.filter(h => h.id !== hid));
    setSelectedId(null);
    setHotspotToDelete(null);
  };

  /**
   * Saves the current draft. Returns the saved campaign, or null on failure.
   * `silent` suppresses the success toast (used by Preview/Publish).
   */
  const saveCampaign = async (options?: { silent?: boolean }): Promise<Campaign | null> => {
    if (!campaign || !id) return null;
    setSaving(true);
    try {
      const { data } = await campaignsApi.update(id, {
        name: campaign.name,
        hotspots,
        filters,
        watermarkUrl: campaign.watermarkUrl,
        soundUrl: campaign.soundUrl,
      });

      const nextHotspots: Hotspot[] = data.hotspots || [];
      const nextFilters = { ...filters, ...(data.filters || {}) };

      setCampaign(data);
      setHotspots(nextHotspots);
      setFilters(nextFilters);
      setSelectedId((previous) => (nextHotspots.some((h) => String(h.id) === String(previous)) ? previous : null));
      setSavedSnapshot(buildSnapshot(data, nextHotspots, nextFilters));

      if (!options?.silent) {
        toast.success('Draft saved', 'Your image, hotspots and styling are up to date.');
      }
      return data;
    } catch (err) {
      toast.error('Could not save your changes', getErrorMessage(err, 'Please check your connection and try again.'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const ensureSaved = async () => {
    if (!isDirty) return true;
    const saved = await saveCampaign({ silent: true });
    return Boolean(saved);
  };

  const handleFileChange = async (hid: string | number, field: 'imageUrl' | 'videoUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const invalid = validateMediaFile(file, field === 'videoUrl' ? 'video' : 'image');
    if (invalid) {
      toast.error('File not uploaded', invalid);
      return;
    }
    try {
      setSaving(true);
      const { data } = await uploadsApi.upload(file);
      updateHotspot(hid, { [field]: data.url });
      toast.success('File uploaded', 'Remember to save or publish to keep it.');
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err, 'Try a smaller file or paste a URL instead.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddProductPhoto = async (hid: string | number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const invalid = validateMediaFile(file, 'image');
    if (invalid) {
      toast.error('Photo not added', invalid);
      return;
    }
    try {
      setSaving(true);
      const { data } = await uploadsApi.upload(file);
      setHotspots(current => current.map(h => h.id === hid
        ? { ...h, additionalImages: [...(h.additionalImages || []), data.url].slice(0, MAX_EXTRA_PRODUCT_PHOTOS) }
        : h));
      toast.success('Photo added', 'Remember to save or publish to keep it.');
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err, 'Try a smaller photo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPreview = async () => {
    if (!(await ensureSaved())) return;
    window.open(`/embed/${id}`, '_blank');
  };

  const handlePublish = async () => {
    if (!(await ensureSaved())) return;
    setPublishOpen(true);
  };

  const leaveEditor = () => {
    if (isDirty) setLeaveOpen(true);
    else navigate('/');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const selectedHotspot = hotspots.find(h => h.id === selectedId);
  const nearbyHotspot = selectedHotspot
    ? hotspots.find((h) => h.id !== selectedHotspot.id && Math.hypot((h.x || 0) - (selectedHotspot.x || 0), (h.y || 0) - (selectedHotspot.y || 0)) < MIN_HOTSPOT_GAP)
    : undefined;
  const activePreviewHotspot = hotspots.find(h => h.id === (hoveredId || selectedId));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans lg:h-screen">
      {/* Header */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 shadow-sm sm:h-20 sm:gap-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={leaveEditor}
            title="Back to campaigns"
            aria-label="Back to campaigns"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-all hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-900 sm:text-xl">{campaign?.name || 'Campaign'}</h1>
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest sm:text-[10px]">
              {saving ? (
                <><Loader2 className="h-3 w-3 animate-spin text-blue-500" /><span className="text-blue-600">Saving…</span></>
              ) : isDirty ? (
                <><span className="h-2 w-2 rounded-full bg-amber-500" /><span className="text-amber-600">Unsaved changes</span></>
              ) : (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /><span className="text-emerald-600">All changes saved</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => (isDirty ? saveCampaign() : toast.info('Already saved', 'There are no unsaved changes right now.'))}
            disabled={saving}
            title={isDirty ? 'Save your draft' : 'Everything is already saved'}
            aria-label="Save draft"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm"
          >
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">{isDirty ? 'Save draft' : 'Saved'}</span>
          </button>
          <button
            onClick={handleSaveAndPreview}
            disabled={saving}
            title="Saves, then opens what your visitors will see"
            aria-label="Preview"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 sm:px-5 sm:text-sm"
          >
            <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            title="Get the link or embed code to share"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 sm:px-6 sm:text-sm"
          >
            <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Publish &amp; share</span><span className="sm:hidden">Share</span>
          </button>
        </div>
      </header>

      {/* Step strip: always tells the user where they are in the flow */}
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/80 px-3 py-2 sm:gap-3 sm:px-8 sm:py-2.5">
        <StepIndicator
          steps={[
            { label: 'Image', done: Boolean(campaign?.imageUrl) },
            { label: 'Hotspots', done: hotspots.length > 0, active: hotspots.length === 0 },
            { label: 'Publish', active: hotspots.length > 0 },
          ]}
        />
        <p className="hidden text-[11px] font-medium text-slate-400 md:block">
          {isAdding
            ? 'Add mode: click anywhere on the image to place hotspots — keep clicking to add more. Esc or Cancel to stop.'
            : hotspots.length === 0
              ? 'Click anywhere on the image to place your first hotspot.'
              : `${hotspots.length} ${hotspots.length === 1 ? 'hotspot' : 'hotspots'} placed · use + to add another, or click a dot to edit it.`}
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Left Sidebar */}
        <aside className="order-2 flex w-full shrink-0 flex-row items-center gap-1.5 overflow-x-auto border-t border-slate-200 bg-white px-2 py-2 lg:order-none lg:w-24 lg:flex-col lg:gap-5 lg:overflow-visible lg:border-r lg:border-t-0 lg:py-8">
          <ToolButton icon={MousePointer2} active label="Select" desc="Click dots to edit" />
          <div className="hidden w-10 h-px shrink-0 bg-slate-100 lg:block"></div>
          <ToolButton icon={Plus} onClick={startAdding} label="Add hotspot" desc="Click image to place dots" />
          <ToolButton icon={Music} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Sound" desc="Background audio" />
          <ToolButton icon={ShieldCheck} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Watermark" desc="Protect your image" />
          <ToolButton icon={Settings} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Settings" desc="Filters & brand extras" />
        </aside>

        {/* Main Canvas */}
        <main ref={canvasRef} className={`relative order-1 flex h-[46vh] min-h-[280px] shrink-0 items-center justify-center overflow-hidden bg-slate-100 p-4 sm:p-10 lg:order-none lg:h-auto lg:flex-1 lg:p-24 ${isAdding ? 'cursor-crosshair' : ''}`}>
          {isAdding && (
            <div className="absolute left-1/2 top-4 z-30 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl sm:top-8">
              <MousePointerClick className="h-4 w-4 shrink-0 text-blue-300" />
              <p className="text-xs font-bold">Add mode — tap objects on the image to place hotspots. Keep tapping to add more.</p>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="ml-auto shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="absolute bottom-3 right-3 z-20 flex flex-row gap-1.5 sm:top-8 sm:bottom-auto sm:right-8 sm:flex-col sm:gap-2">
            <button onClick={() => setZoom((z) => Math.min(4, z * 1.2))} aria-label="Zoom in" className="rounded-xl bg-white p-2.5 text-slate-600 shadow-lg hover:bg-slate-50"><Plus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} aria-label="Zoom out" className="rounded-xl bg-white p-2.5 text-slate-600 shadow-lg hover:bg-slate-50"><Minus className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => { setZoom(1); setStagePos({ x: 0, y: 0 }); }} aria-label="Reset zoom" className="rounded-xl bg-white px-2 py-2.5 text-[10px] font-black text-slate-600 shadow-lg hover:bg-slate-50">{Math.round(displayScale * 100)}%</button>
          </div>

          <div className="relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] bg-white">
            {image && hotspots.length === 0 && !hintDismissed && (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-6">
                <div className="pointer-events-auto relative w-full max-w-sm rounded-3xl border border-blue-100 bg-white/95 p-6 text-center shadow-2xl backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setHintDismissed(true)}
                    aria-label="Dismiss hint"
                    className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <MousePointerClick className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Click the image to add a hotspot</h3>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                    A hotspot is a tappable dot. Place one on a product, a sign or anywhere you want visitors to explore.
                  </p>
                  <button
                    type="button"
                    onClick={() => addHotspot(image.width / 2, image.height / 2)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Or place one in the centre
                  </button>
                </div>
              </div>
            )}
            {image && (
              <div className="relative">
                {/* Image Wrapper for Konva Stage */}
                <div className="rounded-2xl overflow-hidden relative sm:rounded-3xl">
                  <Stage width={image.width * displayScale} height={image.height * displayScale}
                    onClick={handleStageClick}
                    ref={stageRef}
                    draggable
                    x={stagePos.x}
                    y={stagePos.y}
                    onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
                    onDragMove={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
                  >
                    <Layer scaleX={displayScale} scaleY={displayScale}>
                      <KonvaImage image={image} ref={imageRef} filters={konvaFilters} {...filters} name="background-image" />
                    </Layer>
                  </Stage>
                </div>

                {/* HTML Markers Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {hotspots.map((h) => (
                    <EditorHotspotMarker
                      key={h.id}
                      hotspot={h}
                      isSelected={h.id === selectedId}
                      isHovered={h.id === hoveredId}
                      scale={displayScale}
                      stagePos={stagePos}
                      imageWidth={image.width}
                      imageHeight={image.height}
                      onSelect={() => { setSelectedId(h.id); setActiveTab('properties'); setIsAdding(false); }}
                      onHover={() => setHoveredId(h.id)}
                      onUnhover={() => setHoveredId(null)}
                      onChange={(newPos: any) => updateHotspot(h.id, newPos)}
                    />
                  ))}
                </div>

                {/* Live Preview on Hover - Smart Positioning */}
                <AnimatePresence>
                  {activePreviewHotspot && (
                    <motion.div
                      key="active-preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute z-[99999] pointer-events-none select-none"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        left: `${(activePreviewHotspot.x * displayScale) + stagePos.x + (activePreviewHotspot.x * displayScale > (image.width * displayScale) / 2 ? -20 : 20)}px`,
                        top: `${(activePreviewHotspot.y * displayScale) + stagePos.y}px`,
                        transform: `translate(${(activePreviewHotspot.x * displayScale > (image.width * displayScale) / 2) ? '-100%' : '0'}, -50%)`
                      }}
                    >
                      <LivePreviewCard hotspot={activePreviewHotspot} onPlay={() => setVideoPreview(activePreviewHotspot)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="order-3 flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'properties', label: 'Hotspot', desc: 'Edit the selected dot' },
              { id: 'filters', label: 'Image style', desc: 'Restyle the photo' },
              { id: 'settings', label: 'Settings', desc: 'Sound, watermark & more' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-1 py-3 text-center transition-all sm:py-4 ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}>
                <span className="block text-[9px] font-black uppercase tracking-widest sm:text-[10px]">{tab.label}</span>
                <span className={`mt-0.5 block text-[8px] font-medium leading-tight ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-300'}`}>{tab.desc}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {/* Contextual guidance: tells the user what this panel is for */}
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                {activeTab === 'properties'
                  ? (selectedHotspot ? 'Editing this dot' : 'Pick a dot first')
                  : activeTab === 'filters'
                    ? 'Image style'
                    : 'Campaign settings'}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-blue-700/80">
                {activeTab === 'properties'
                  ? (selectedHotspot
                      ? 'Everything below applies to the selected dot — what it shows, when it appears, and how it looks. Scroll to reach every option.'
                      : 'Click a dot on the image (or one in the list below) to edit what it reveals when tapped.')
                  : activeTab === 'filters'
                    ? 'Slide the controls to restyle the whole image — brightness, colour, blur and more. Changes preview live and are saved with the campaign.'
                    : 'Scroll down to add background sound, a watermark and brand extras. Uploads appear here once added.'}
              </p>
            </div>
            {activeTab === 'properties' ? (
              selectedHotspot ? (
                <div className="space-y-8 pb-20">
                  {/* Overlap warning: two dots this close are hard to hover/tap */}
                  {nearbyHotspot && (
                    <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-900">This dot overlaps “{nearbyHotspot.title}”</p>
                          <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-700">
                            Dots this close are hard to hover and tap, in the editor and on your live page. Spread them apart or drag one to a clearer spot.
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => separateHotspot(selectedHotspot, nearbyHotspot)}
                              className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-amber-700"
                            >
                              Spread apart
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedId(nearbyHotspot.id)}
                              className="rounded-lg border border-amber-300 bg-white/70 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-800 transition-colors hover:bg-white"
                            >
                              Select the other dot
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type Selection */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">What opens on tap?</label>
                      <HelpTip text="Choose the card visitors see when this dot is opened. You can change it any time." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'standard', icon: MousePointer2, label: 'Standard' },
                        { id: 'product', icon: ShoppingCart, label: 'Product' },
                        { id: 'signup_form', icon: Mail, label: 'Form' },
                        { id: 'video', icon: Play, label: 'Video' },
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'image', icon: ImageIcon, label: 'Image' },
                      ].map(type => (
                        <TypeButton key={type.id} active={selectedHotspot.type === type.id}
                          onClick={() => handleTypeChange(selectedHotspot.id, type.id as any)} icon={type.icon} label={type.label}
                          title={HOTSPOT_TYPE_HELP[type.id]} />
                      ))}
                    </div>
                    <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-medium leading-relaxed text-blue-700">
                      {HOTSPOT_TYPE_HELP[selectedHotspot.type] || HOTSPOT_TYPE_HELP.standard}
                    </p>
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Icon on the dot</label>
                      <HelpTip text="The small symbol drawn inside the dot on the image. Pick something that hints at what opens." />
                    </div>
                    <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl max-h-40 overflow-y-auto">
                      {ICON_LIBRARY.map((item) => (
                        <button key={item.name} onClick={() => updateHotspot(selectedHotspot.id, { iconName: item.name })}
                          title={item.name}
                          aria-label={`Use ${item.name} icon`}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedHotspot.iconName === item.name ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>
                          <item.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trigger */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-3 flex items-center gap-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opens on</label>
                        <HelpTip text="Hover opens the card when a mouse moves over the dot. Click waits for a tap — the safer choice if most visitors are on phones." />
                      </div>
                      <div className="flex bg-slate-50 p-1 rounded-2xl">
                        <button onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'click' })}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'click' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Click</button>
                        <button onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'hover' })}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'hover' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Hover</button>
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center gap-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dot animation</label>
                        <HelpTip text="How the dot itself moves so visitors notice it. Pulse and Ping draw the eye without being distracting." />
                      </div>
                      <select value={selectedHotspot.animationType || 'pulse'} onChange={e => updateHotspot(selectedHotspot.id, { animationType: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-[10px] uppercase tracking-wider">
                        <option value="none">None</option>
                        <option value="pulse">Pulse</option>
                        <option value="ping">Ping</option>
                        <option value="bounce">Bounce</option>
                        <option value="float">Float</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <InputField label="Title" value={selectedHotspot.title} onChange={v => updateHotspot(selectedHotspot.id, { title: v })} />
                    <TextAreaField label="Description" value={selectedHotspot.description || ''} onChange={v => updateHotspot(selectedHotspot.id, { description: v })} />

                    {/* Product Fields */}
                    {selectedHotspot.type === 'product' && (
                      <>
                        <TextAreaField label="Product details" value={selectedHotspot.productInfo || ''} onChange={v => updateHotspot(selectedHotspot.id, { productInfo: v })} />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                            <select value={selectedHotspot.currency || '$'} onChange={e => updateHotspot(selectedHotspot.id, { currency: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                              {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </div>
                          <InputField label="Price" value={selectedHotspot.price || ''} onChange={v => updateHotspot(selectedHotspot.id, { price: v })} placeholder="0.00" />
                        </div>

                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <label id="offer-type-label" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">What are you selling?</label>
                            <HelpTip text="Product-led shows the item and its price. Service-led focuses on booking a service. Bundle shows a product and a service together." />
                          </div>
                          <select aria-labelledby="offer-type-label" value={selectedHotspot.offerType || 'product-first'} onChange={e => updateHotspot(selectedHotspot.id, { offerType: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                            <option value="product-first">Product-led</option>
                            <option value="service-first">Service-led</option>
                            <option value="bundle">Product + Service Bundle</option>
                          </select>
                        </div>

                        <FileUploadField label="Main product image" onUpload={(e: any) => handleFileChange(selectedHotspot.id, 'imageUrl', e)} preview={selectedHotspot.imageUrl} />

                        <div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">More photos</label>
                            <HelpTip text="Optional extra product photos. Visitors can browse through them on the product card." />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(selectedHotspot.additionalImages || []).map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => {
                                  const images = [...(selectedHotspot.additionalImages || [])];
                                  images.splice(idx, 1);
                                  updateHotspot(selectedHotspot.id, { additionalImages: images });
                                }} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white shadow-sm">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {(selectedHotspot.additionalImages || []).length < MAX_EXTRA_PRODUCT_PHOTOS && (
                              <label aria-label="Add photo" className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-all cursor-pointer">
                                <Plus className="w-4 h-4" />
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleAddProductPhoto(selectedHotspot.id, e)} />
                              </label>
                            )}
                          </div>
                          <p className="mt-2 text-[10px] font-medium text-slate-400">
                            Up to {MAX_PRODUCT_IMAGES} images per product, including the main image. {MAX_IMAGE_MB} MB each.
                          </p>
                        </div>
                      </>
                    )}

                    {/* Video Fields */}
                    {selectedHotspot.type === 'video' && (
                      <VideoField key={selectedHotspot.id} value={selectedHotspot.videoUrl || ''}
                        onUpload={e => handleFileChange(selectedHotspot.id, 'videoUrl', e)} />
                    )}

                    {/* Image Fields */}
                    {selectedHotspot.type === 'image' && (
                      <FileUploadField label="Image to show" onUpload={(e: any) => handleFileChange(selectedHotspot.id, 'imageUrl', e)} preview={selectedHotspot.imageUrl} />
                    )}

                    {/* Form Builder */}
                    {selectedHotspot.type === 'signup_form' && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What do you want to ask?</label>
                              <HelpTip text="Rows here become the form fields visitors fill in. Name and email are pre-filled — add, rename or remove anything." />
                            </div>
                            <button onClick={() => {
                              const newField: FormField = { id: Math.random().toString(36).substr(2, 9), type: 'text', label: 'New Field', placeholder: '', required: false };
                              updateHotspot(selectedHotspot.id, { formFields: [...(selectedHotspot.formFields || []), newField] });
                            }} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:text-blue-700 transition-colors">
                              <Plus className="w-3 h-3" /> Add field
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(selectedHotspot.formFields || []).map((field, idx) => (
                              <FormFieldEditor key={field.id} field={field}
                                onUpdate={(updates) => {
                                  const fields = [...(selectedHotspot.formFields || [])];
                                  fields[idx] = { ...fields[idx], ...updates };
                                  updateHotspot(selectedHotspot.id, { formFields: fields });
                                }}
                                onDelete={() => {
                                  const fields = (selectedHotspot.formFields || []).filter(f => f.id !== field.id);
                                  updateHotspot(selectedHotspot.id, { formFields: fields });
                                }} />
                            ))}
                          </div>
                        </div>
                        <InputField label="Button text" value={selectedHotspot.ctaText || ''} onChange={v => updateHotspot(selectedHotspot.id, { ctaText: v })} placeholder="Subscribe" />
                        <InputField label="Send visitors here after submitting (optional)" value={selectedHotspot.redirectUrl || ''} onChange={v => updateHotspot(selectedHotspot.id, { redirectUrl: v })} placeholder="https://..." />
                      </>
                    )}

                    {selectedHotspot.type !== 'signup_form' && (
                      <>
                        <InputField label="Button text (optional)" value={selectedHotspot.ctaText || ''} onChange={v => updateHotspot(selectedHotspot.id, { ctaText: v })} placeholder="Shop now" />

                        <div className="space-y-4 pt-2">
                          <div>
                            <div className="mb-2 flex items-center gap-1.5">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">What does the button do?</label>
                              <HelpTip text="Link sends visitors to a web page. Scene jumps to another campaign image. Email opens their mail app. Call starts a phone call." />
                            </div>
                            <div className="flex bg-slate-50 p-1 rounded-2xl">
                              {[
                                { id: 'url', label: 'Link', icon: Globe },
                                { id: 'scene', label: 'Scene', icon: ImageIcon },
                                { id: 'email', label: 'Email', icon: Mail },
                                { id: 'phone', label: 'Call', icon: Phone },
                              ].map(action => (
                                <button key={action.id}
                                  onClick={() => updateHotspot(selectedHotspot.id, { action: { type: action.id as any, value: '' } })}
                                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.action.type === action.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <action.icon className="w-3 h-3" /> {action.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {selectedHotspot.action.type === 'scene' ? (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Open which campaign?</label>
                              <select
                                value={selectedHotspot.action.value}
                                onChange={e => updateHotspot(selectedHotspot.id, { action: { ...selectedHotspot.action, value: e.target.value } })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                              >
                                <option value="">Choose a campaign</option>
                                {allCampaigns.filter(c => String(c.id) !== String(id)).map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                                Lets visitors jump to another one of your campaign images.
                              </p>
                            </div>
                          ) : (
                            <InputField
                              label={selectedHotspot.action.type === 'email' ? 'Email address' : selectedHotspot.action.type === 'phone' ? 'Phone number' : 'Where should the button go?'}
                              value={selectedHotspot.action.value}
                              onChange={v => updateHotspot(selectedHotspot.id, { action: { ...selectedHotspot.action, value: v } })}
                              placeholder={selectedHotspot.action.type === 'email' ? 'hello@example.com' : selectedHotspot.action.type === 'phone' ? '+1234567890' : 'https://...'}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Styling */}
                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Look &amp; feel <HelpTip text="These styles apply to the dot on the image. The card content follows the same colours." />
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker label="Dot colour" value={selectedHotspot.backgroundColor || '#2563eb'} onChange={v => updateHotspot(selectedHotspot.id, { backgroundColor: v })} />
                      <ColorPicker label="Icon colour" value={selectedHotspot.iconColor || '#ffffff'} onChange={v => updateHotspot(selectedHotspot.id, { iconColor: v })} />
                    </div>
                    <SliderField label="Dot size" value={selectedHotspot.width || 12} min={5} max={50} onChange={v => updateHotspot(selectedHotspot.id, { width: v, height: v })} />
                    <SliderField label="Corner roundness" value={selectedHotspot.roundness || 100} min={0} max={100} onChange={v => updateHotspot(selectedHotspot.id, { roundness: v })} />
                  </div>

                  <button onClick={() => setHotspotToDelete(selectedHotspot)} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                    <Trash2 className="w-5 h-5" /> Delete hotspot
                  </button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                    <MousePointer2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {hotspots.length === 0 ? 'No hotspots yet' : 'Select a hotspot'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-slate-500">
                    {hotspots.length === 0
                      ? 'Click anywhere on your image to place a dot. Then choose what it reveals: a product, form, video or note.'
                      : 'Click a dot on the image — or pick one below — to edit its content, trigger and styling.'}
                  </p>
                  {hotspots.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => addHotspot(image ? image.width / 2 : 100, image ? image.height / 2 : 100)}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Place a hotspot in the centre
                    </button>
                  ) : (
                    <div className="mt-6 w-full space-y-2">
                      {hotspots.map((h, index) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setSelectedId(h.id)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-slate-400 shadow-sm">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-slate-800">{h.title || 'Untitled hotspot'}</span>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {(h.type || 'standard').replace('_', ' ')}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : activeTab === 'filters' ? (
              <FilterPanel filters={filters} setFilters={setFilters} />
            ) : (
              <SettingsPanel campaign={campaign} setCampaign={setCampaign} />
            )}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {videoPreview?.videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setVideoPreview(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={videoPreview.title || 'Video'}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:rounded-[2rem]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video overflow-hidden rounded-t-[1.5rem] bg-slate-900 sm:rounded-t-[2rem]">
                <button
                  type="button"
                  onClick={() => setVideoPreview(null)}
                  aria-label="Close video"
                  className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
                <HotspotVideo key={videoPreview.id} url={videoPreview.videoUrl} className="h-full w-full" autoPlay />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-black text-slate-900 sm:text-xl">{videoPreview.title}</h3>
                {videoPreview.description && <p className="mt-1 text-sm text-slate-500">{videoPreview.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        campaignId={id || ''}
        campaignName={campaign?.name || 'Your campaign'}
      />

      <ConfirmDialog
        open={leaveOpen}
        title="Leave without saving?"
        description="You have changes that are not saved yet. Save them, discard them, or stay here and keep editing."
        confirmLabel="Save & leave"
        cancelLabel="Keep editing"
        discardLabel="Discard changes"
        loading={saving}
        onConfirm={async () => {
          const saved = await saveCampaign({ silent: true });
          if (saved) {
            setLeaveOpen(false);
            navigate('/');
          }
        }}
        onCancel={() => setLeaveOpen(false)}
        onDiscard={() => {
          setLeaveOpen(false);
          navigate('/');
        }}
      />

      <ConfirmDialog
        open={Boolean(hotspotToDelete)}
        title="Delete this hotspot?"
        description={hotspotToDelete ? `“${hotspotToDelete.title || 'Untitled hotspot'}” will be removed from the image. This cannot be undone.` : ''}
        confirmLabel="Delete hotspot"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => hotspotToDelete && deleteHotspot(hotspotToDelete.id)}
        onCancel={() => setHotspotToDelete(null)}
      />
    </div>
  );
}

/* ─── Live Preview Card ─── */
function LivePreviewCard({ hotspot, onPlay }: { hotspot: Hotspot; onPlay?: () => void }) {
  const Icon = ICON_LIBRARY.find(i => i.name === hotspot.iconName)?.icon || Info;

  if (hotspot.type === 'product') {
    return (
      <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
          {hotspot.imageUrl ? (
            <img src={hotspot.imageUrl} alt="Product" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200"><ShoppingCart className="w-12 h-12" /></div>
          )}
          {hotspot.price && (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-black rounded-lg shadow-lg">
              {hotspot.currency || '$'}{hotspot.price}
            </div>
          )}
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 shadow-sm">
            <Heart className="w-4 h-4" />
          </div>
        </div>
        <div className="p-5">
          <h4 className="font-black text-slate-900 leading-tight mb-1 truncate">{hotspot.title}</h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 line-clamp-2">{hotspot.description}</p>
          <button className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-600 transition-all">
            {hotspot.ctaText || 'Buy Now'}
          </button>
        </div>
      </div>
    );
  }

  if (hotspot.type === 'video') {
    return (
      <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay?.(); }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={`Play ${hotspot.title || 'video'}`}
          className="group/video relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden block pointer-events-auto cursor-pointer"
        >
          {hotspot.videoUrl ? (
            <HotspotVideo url={hotspot.videoUrl} className="w-full h-full rounded-2xl pointer-events-none" autoPlay muted controls={false} />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-white/20"><Play className="w-10 h-10" /></span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover/video:bg-black/45">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white shadow-lg backdrop-blur-md transition-transform group-hover/video:scale-110">
              <Play className="w-5 h-5 fill-current" />
            </span>
          </span>
        </button>
        <div className="p-4">
          <h4 className="font-black text-slate-900 text-xs truncate">{hotspot.title}</h4>
          {hotspot.description && <p className="text-slate-400 text-[10px] mt-1 line-clamp-2 font-medium">{hotspot.description}</p>}
          {hotspot.ctaText && (
            <button className="w-full mt-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
              {hotspot.ctaText}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (hotspot.type === 'signup_form') {
    return (
      <div className="w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Mail className="w-5 h-5" /></div>
        <h4 className="font-black text-slate-900 mb-1">{hotspot.title}</h4>
        <p className="text-slate-400 text-[10px] font-bold mb-4">{hotspot.description || 'Join our list!'}</p>
        <div className="space-y-2 mb-4">
          {(hotspot.formFields || [{ label: 'Email' }]).slice(0, 3).map((f, i) => (
            <div key={i} className="h-9 bg-slate-50 border border-slate-100 rounded-xl px-3 flex items-center text-[10px] text-slate-300 font-bold">{f.label}</div>
          ))}
        </div>
        <button className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
          {hotspot.ctaText || 'Subscribe'}
        </button>
      </div>
    );
  }

  if (hotspot.type === 'image') {
    return (
      <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="aspect-video bg-slate-50 relative overflow-hidden">
          {hotspot.imageUrl ? (
            <img src={hotspot.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon className="w-10 h-10" /></div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-black text-slate-900 text-xs truncate">{hotspot.title}</h4>
          {hotspot.description && <p className="text-slate-400 text-[10px] mt-1">{hotspot.description}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icon className="w-4 h-4" /></div>
        <h4 className="font-black text-slate-900 text-xs truncate">{hotspot.title}</h4>
      </div>
      {hotspot.description && <p className="text-slate-400 text-[10px] font-medium leading-relaxed">{hotspot.description}</p>}
    </div>
  );
}

/* ─── Editor Hotspot Marker (HTML) ─── */
function EditorHotspotMarker({ hotspot, isSelected, isHovered, scale, stagePos, imageWidth, imageHeight, onSelect, onHover, onUnhover, onChange }: any) {
  const size = hotspot.width || 12;
  const cornerRadius = (size * (hotspot.roundness || 100)) / 100;
  const HotspotIcon = hotspot.iconName ? (ICON_LIBRARY.find(i => i.name === hotspot.iconName)?.icon || Info) : null;
  const animType = hotspot.animationType || 'pulse';

  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  // Keep the invisible tap target honest: big enough to grab, small enough that
  // two neighbouring dots do not fight over the same pixels.
  const displaySize = Math.max(22, size * 2 * scale);
  const iconSize = Math.max(10, size * scale);
  const hitSize = Math.max(40, displaySize + 16);

  const clamp = (x: number, y: number) => ({
    x: imageWidth ? Math.min(Math.max(x, 16), imageWidth - 16) : x,
    y: imageHeight ? Math.min(Math.max(y, 16), imageHeight - 16) : y,
  });

  const handlePointerDown = (e: any) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: hotspot.x || 0,
      originY: hotspot.y || 0,
      moved: false,
    };
    setDragging(true);
    onSelect();
  };

  const handlePointerMove = (e: any) => {
    if (!dragging) return;
    e.stopPropagation();
    const dx = (e.clientX - dragRef.current.startX) / scale;
    const dy = (e.clientY - dragRef.current.startY) / scale;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < 2 / scale) return;
    dragRef.current.moved = true;
    const next = clamp(dragRef.current.originX + dx, dragRef.current.originY + dy);
    onChange(next);
  };

  const handlePointerUp = (e: any) => {
    if (!dragging) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
    // The pointer may have been released outside the dot; drop hover so the
    // editor preview does not stay pinned to a marker you already let go of.
    onUnhover();
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
      return;
    }
    const step = e.shiftKey ? 10 : 2;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation();
    const next = clamp((hotspot.x || 0) + delta[0], (hotspot.y || 0) + delta[1]);
    onChange(next);
    onSelect();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${hotspot.title || 'Hotspot'}. Drag to move, or use the arrow keys to nudge.`}
      title={`${hotspot.title || 'Hotspot'} — drag to move`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDragStart={(e) => e.preventDefault()}
      onMouseEnter={onHover}
      onMouseLeave={() => { if (!dragging) onUnhover(); }}
      className="absolute flex items-center justify-center group outline-none pointer-events-auto focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full"
      style={{
        left: `${(hotspot.x * scale) + stagePos.x}px`,
        top: `${(hotspot.y * scale) + stagePos.y}px`,
        width: `${hitSize}px`,
        height: `${hitSize}px`,
        transform: 'translate(-50%, -50%)',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        zIndex: isSelected ? 100 : isHovered ? 50 : 10,
      }}
    >
      {/* Visual Animation Rings */}
      {animType === 'ping' && (
        <div className="absolute inset-0 animate-ping opacity-30"
          style={{ backgroundColor: hotspot.backgroundColor || '#2563eb', borderRadius: `${Math.max(4, cornerRadius * 1.25 * scale)}px` }} />
      )}

      {animType === 'pulse' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0"
          style={{ backgroundColor: hotspot.backgroundColor || '#2563eb', borderRadius: `${Math.max(4, cornerRadius * 1.25 * scale)}px` }} />
      )}

      {/* Main Marker Body */}
      <motion.div
        className={`relative flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-red-500 scale-110' : 'border-white'}`}
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          backgroundColor: hotspot.backgroundColor || '#2563eb',
          color: hotspot.iconColor || '#ffffff',
          borderRadius: `${Math.max(4, cornerRadius * scale)}px`
        }}
        animate={
          animType === 'bounce' ? { y: [0, -10, 0] } :
            animType === 'float' ? { y: [0, -5, 0], x: [0, 2, -2, 0] } : {}
        }
        transition={
          animType === 'bounce' ? { repeat: Infinity, duration: 1, ease: "easeInOut" } :
            animType === 'float' ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {}
        }
      >
        {HotspotIcon ? (
          <HotspotIcon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
        ) : (
          <div className="font-black" style={{ fontSize: `${Math.max(9, size * 0.8 * scale)}px` }}>
            {hotspot.type === 'product' ? <ShoppingCart className="w-full h-full" /> : <Info className="w-full h-full" />}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Form Field Editor ─── */
function FormFieldEditor({ field, onUpdate, onDelete }: { field: FormField; onUpdate: (u: Partial<FormField>) => void; onDelete: () => void }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 space-y-3 relative group border border-slate-100">
      <button onClick={onDelete} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Label</label>
          <input type="text" value={field.label} onChange={e => onUpdate({ label: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</label>
          <select value={field.type} onChange={e => onUpdate({ type: e.target.value as any })} className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="number">Number</option>
            <option value="textarea">Textarea</option>
            <option value="select">Dropdown</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Placeholder</label>
        <input type="text" value={field.placeholder || ''} onChange={e => onUpdate({ placeholder: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {field.type === 'select' && (
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Options (comma separated)</label>
          <input type="text" value={(field.options || []).join(', ')} onChange={e => onUpdate({ options: e.target.value.split(',').map(s => s.trim()) })} className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={field.required || false} onChange={e => onUpdate({ required: e.target.checked })} className="w-4 h-4 rounded accent-blue-600" />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Required</span>
      </label>
    </div>
  );
}

/* ─── Filter Panel ─── */
function FilterPanel({ filters, setFilters }: any) {
  return (
    <div className="space-y-8 pb-20">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
          Image style <HelpTip text="These effects change how the whole image looks. They do not change the hotspots — use them to match your brand or fix a dull photo." />
        </p>
        <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-blue-700/80">
          Adjust the photo behind your hotspots. Changes preview instantly and are saved with the campaign.
        </p>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Adjustments</label>
        <div className="space-y-6">
          <SliderField label="Brightness" value={filters.brightness} min={-1} max={1} step={0.05} onChange={(v: number) => setFilters({ ...filters, brightness: v })} />
          <SliderField label="Contrast" value={filters.contrast} min={-100} max={100} step={5} onChange={(v: number) => setFilters({ ...filters, contrast: v })} />
          <SliderField label="Blur" value={filters.blur} min={0} max={20} step={0.5} onChange={(v: number) => setFilters({ ...filters, blur: v })} />
          <SliderField label="Hue Rotation" value={filters.hue} min={-180} max={180} step={5} onChange={(v: number) => setFilters({ ...filters, hue: v })} />
          <SliderField label="Saturation" value={filters.saturation} min={-2} max={2} step={0.1} onChange={(v: number) => setFilters({ ...filters, saturation: v })} />
          <SliderField label="Opacity" value={filters.opacity} min={0} max={1} step={0.05} onChange={(v: number) => setFilters({ ...filters, opacity: v })} />
          <SliderField label="Noise" value={filters.noise} min={0} max={1} step={0.05} onChange={(v: number) => setFilters({ ...filters, noise: v })} />
          <SliderField label="Pixel Size" value={filters.pixelSize} min={1} max={20} step={1} onChange={(v: number) => setFilters({ ...filters, pixelSize: v })} />
          <SliderField label="Vignette" value={filters.vignette} min={0} max={1} step={0.05} onChange={(v: number) => setFilters({ ...filters, vignette: v })} />
        </div>
      </div>
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick looks</label>
        <ToggleField label="Black & white" checked={filters.grayscale} onChange={(v: boolean) => setFilters({ ...filters, grayscale: v })} />
        <ToggleField label="Warm / sepia" checked={filters.sepia} onChange={(v: boolean) => setFilters({ ...filters, sepia: v })} />
        <ToggleField label="Invert colours" checked={filters.invert} onChange={(v: boolean) => setFilters({ ...filters, invert: v })} />
      </div>
      <button onClick={() => setFilters({ brightness: 0, contrast: 0, blur: 0, grayscale: false, sepia: false, invert: false, hue: 0, saturation: 0, opacity: 1, noise: 0, pixelSize: 1, vignette: 0 })}
        className="w-full py-3 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">
        Reset all filters
      </button>
    </div>
  );
}

/* ─── UI Primitives ─── */
function ToolButton({ icon: Icon, active, onClick, label, desc, className }: any) {
  return (
    <button onClick={onClick} className={`group relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all lg:w-full lg:px-1 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'} ${className}`}>
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className={`text-[8px] font-black uppercase tracking-wide leading-tight text-center ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{label}</span>
      {desc && <span className={`hidden text-[7px] font-medium leading-tight text-center lg:block ${active ? 'text-blue-100' : 'text-slate-300 group-hover:text-slate-400'}`}>{desc}</span>}
      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 hidden -translate-y-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">{desc ? `${label} — ${desc}` : label}</div>
    </button>
  );
}

function TypeButton({ active, onClick, icon: Icon, label, title }: any) {
  return (
    <button onClick={onClick} title={title} aria-pressed={active} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">{label}</span>
    </button>
  );
}

function InputField({ label, value, onChange, placeholder }: any) {
  const id = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: any) {
  const id = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <textarea id={id} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-24" />
    </div>
  );
}

function FileUploadField({ label, onUpload, preview, type = 'image' }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  const getAcceptType = () => {
    if (type === 'video') return 'video/*';
    if (type === 'sound') return 'audio/*';
    return 'image/*';
  };

  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <div onClick={() => inputRef.current?.click()} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group">
        {preview ? (
          type === 'video' ? <div className="text-blue-600 font-bold text-[10px] flex flex-col items-center gap-2"><Video className="w-6 h-6" /> Video Uploaded</div> :
            type === 'sound' ? <div className="text-blue-600 font-bold text-[10px] flex flex-col items-center gap-2"><Music className="w-6 h-6" /> Sound Uploaded</div> :
              <img src={preview} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300"><Upload className="w-6 h-6" /><span className="text-[10px] font-bold">Click to upload</span></div>
        )}
        <input type="file" ref={inputRef} onChange={onUpload} accept={getAcceptType()} className="hidden" />
      </div>
      <p className="mt-2 text-[10px] font-medium text-slate-400">Up to {type === 'image' ? MAX_IMAGE_MB : MAX_VIDEO_MB} MB.</p>
    </div>
  );
}

function VideoField({ value, onUpload }: {
  value: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isUploadedFile = value.startsWith('/uploads/');

  return (
    <div className="space-y-3">
      <FileUploadField label="Video file" onUpload={onUpload} preview={isUploadedFile ? value : ''} type="video" />
      {(isUploadedFile || isHttpUrl(value)) && (
        <HotspotVideo url={value} className="aspect-video w-full rounded-2xl bg-slate-900" />
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent" />
        <span className="text-[10px] font-mono text-slate-400 uppercase">{value}</span>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, onChange, step }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between">{label} <span className="text-blue-600">{typeof value === 'number' ? Math.round(value * 100) / 100 : value}</span></label>
      <input type="range" min={min} max={max} step={step || 1} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
    </div>
  );
}

function ToggleField({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className={`w-10 h-6 rounded-full transition-all relative ${checked ? 'bg-blue-600' : 'bg-slate-200'}`} onClick={() => onChange(!checked)}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${checked ? 'left-5' : 'left-1'}`} />
      </div>
    </label>
  );
}

function SettingsPanel({ campaign, setCampaign }: any) {
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleFileUpload = async (field: 'watermarkUrl' | 'soundUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const invalid = file && validateMediaFile(file, field === 'watermarkUrl' ? 'image' : 'sound');
    if (invalid) {
      toast.error('File not uploaded', invalid);
      return;
    }
    if (file && campaign) {
      try {
        setSaving(true);
        const { data } = await uploadsApi.upload(file);
        setCampaign({ ...campaign, [field]: data.url });
        toast.success(field === 'watermarkUrl' ? 'Watermark added' : 'Sound added', 'Save the draft to keep this change.');
      } catch (err) {
        toast.error('Upload failed', getErrorMessage(err, 'Try a smaller file and make sure it is the right type.'));
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Brand extras</p>
        <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-blue-700/80">
          Optional touches that show alongside your image and hotspots. Both are saved with the campaign.
        </p>
      </div>
      <div>
        <div className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Watermark
          <HelpTip text="A small logo placed on the bottom-right of your image. Use a transparent PNG for the best result." />
        </div>
        <FileUploadField
          label="Upload watermark image"
          onUpload={(e: any) => handleFileUpload('watermarkUrl', e)}
          preview={campaign?.watermarkUrl}
        />
        <div className="mt-2 text-[10px] text-slate-400 font-medium">Shows on the bottom right of the image.</div>
      </div>
      <div>
        <div className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Music className="w-4 h-4" /> Click sound
          <HelpTip text="A short sound that plays when a visitor opens a hotspot. Keep it brief and quiet — some browsers block autoplay until the first tap." />
        </div>
        <FileUploadField
          label="Upload UI sound"
          onUpload={(e: any) => handleFileUpload('soundUrl', e)}
          preview={campaign?.soundUrl}
          type="sound"
        />
        <div className="mt-2 text-[10px] text-slate-400 font-medium">Plays when hotspots are opened.</div>
      </div>
    </div>
  );
}
