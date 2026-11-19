import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Campaign, Hotspot, AnalyticsEvent, Lead, Domain, FormField } from '../types';
import { ShoppingCart, Play, Mail, X, ExternalLink, Phone, Info, CheckCircle, ArrowRight, Type, Image as ImageIcon, FileText, MousePointer2, Plus, Minus, ShieldAlert, Heart, Star, Tag, Zap, Gift, MapPin, Camera, Bookmark, Bell, Award, ThumbsUp, Clock, Flame, Video, Hash, Globe, ChevronLeft, ChevronRight, Loader2, RefreshCw, Home, AlertCircle, MousePointerClick } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { publicApi, analyticsApi, leadsApi, domainsApi } from '../api/services';
import { getErrorMessage } from '../lib/errors';
import { onboarding, viewerHint } from '../lib/onboarding';
import { HotspotVideo } from './ui/HotspotVideo';

const ICON_MAP: Record<string, any> = {
  Info, ShoppingCart, Play, Mail, Type, ImageIcon, FileText, MousePointer2, Globe, ExternalLink,
  Phone, CheckCircle, Plus, Heart, Star, Tag, Zap, Gift, MapPin, Camera, Bookmark, Bell,
  Award, ThumbsUp, Clock, Flame, Video, Hash,
};

export default function HotspotRenderer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const viewTracked = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const [imageBoxWidth, setImageBoxWidth] = useState(0);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchCampaign = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { data: found } = await publicApi.getCampaign(id);
        if (cancelled) return;
        setCampaign(found);

        onboarding.markPreviewed();

        let referrer = '';
        try {
          referrer = document.referrer ? new URL(document.referrer).hostname : '';
        } catch {
          referrer = '';
        }
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!isLocal && referrer && localStorage.getItem('token')) {
          try {
            const { data: allDomains } = await domainsApi.findAll();
            const userDomains = allDomains.filter((d: Domain) => d.userId === found.userId && d.verified);
            if (!userDomains.some((d: Domain) => d.name === referrer)) {
              if (!cancelled) setIsAuthorized(false);
              return;
            }
          } catch (err) {
            console.error('Failed to verify domain', err);
          }
        }

        if (cancelled) return;

        // Show the "tap the dots" hint once per campaign per browser.
        if ((found.hotspots?.length || 0) > 0 && !viewerHint.isDismissed(found.id)) {
          setShowHint(true);
        }

        // One view per page load, even in React StrictMode double-renders.
        if (!viewTracked.current) {
          viewTracked.current = true;
          trackEvent(found.id, 'view', undefined, referrer || window.location.hostname);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, 'This campaign could not be loaded. The link may be wrong, or the campaign was deleted.'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCampaign();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (!showHint) return;
    const timer = window.setTimeout(() => setShowHint(false), 9000);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  // Measure the image itself (not the whole browser window) so hover cards
  // open on the side that actually has room.
  useEffect(() => {
    const el = imageWrapRef.current;
    if (!el) return;
    const update = () => setImageBoxWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [campaign?.imageUrl]);

  // Size the artwork to the viewport so phones see the whole scene instead of
  // the middle of a wide image. Hotspot positions are multiplied by the same
  // scale so they stay pinned to the right spots.
  useEffect(() => {
    setNaturalSize(null);
  }, [campaign?.imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setViewport({ width: el.clientWidth, height: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [campaign?.imageUrl]);

  const fitScale = naturalSize && viewport.width > 0 && viewport.height > 0
    ? Math.min(
        1,
        Math.max(0.05, (viewport.width - (viewport.width < 640 ? 24 : 96)) / naturalSize.width),
        Math.max(0.05, (viewport.height - (viewport.width < 640 ? 120 : 96)) / naturalSize.height),
      )
    : 1;

  const trackEvent = async (campaignId: string | number, type: 'view' | 'click' | 'cta', hotspotId?: string | number, domainName?: string) => {
    let fallbackDomain = window.location.hostname;
    try {
      fallbackDomain = document.referrer ? new URL(document.referrer).hostname : fallbackDomain;
    } catch {
      // Keep the current hostname when the referrer is malformed.
    }
    try {
      await analyticsApi.logEvent(campaignId, {
        eventType: type,
        domain: domainName || fallbackDomain,
        metadata: { hotspotId: hotspotId || activeHotspot?.id }
      });
    } catch (err) {
      console.error('Failed to log event', err);
    }
  };

  const dismissHint = () => {
    setShowHint(false);
    if (id) viewerHint.dismiss(id);
  };

  const hoverTimeoutRef = useRef<any>(null);
  const clearHoverTimeout = () => { if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } };

  const handleHotspotInteraction = (hotspot: Hotspot, interactionType: 'click' | 'hover') => {
    setFormError(null);
    dismissHint();
    if (interactionType === 'hover') {
      clearHoverTimeout();
      setHoveredHotspot(hotspot);
    } else {
      setActiveHotspot(hotspot);
      setHoveredHotspot(null);
      if (campaign) trackEvent(campaign.id, 'click', hotspot.id);
    }
    if (campaign?.soundUrl) new Audio(campaign.soundUrl).play().catch(() => { });
  };

  const handleHotspotLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredHotspot(null), 300);
  };

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !campaign) return;
    const hs = activeHotspot || hoveredHotspot;
    if (!hs) return;

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const email = data.email || data.Email || '';
    if (!email.trim()) {
      setFormError('Please enter your email so we can get back to you.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('That email address does not look right. Please check it and try again.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await leadsApi.create({
        campaignId: +id,
        email: email.trim(),
        name: data.name || data.Name || 'Anonymous',
        data
      });

      setLeadCaptured(true);
      trackEvent(campaign.id, 'cta', hs.id);

      if (hs.redirectUrl) {
        setTimeout(() => { window.location.href = hs.redirectUrl!; }, 1500);
      } else {
        setTimeout(() => { setActiveHotspot(null); setHoveredHotspot(null); setLeadCaptured(false); }, 2500);
      }
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not send that just now. Please try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = (hotspot: Hotspot) => {
    const { type, value } = hotspot.action;
    if (campaign) trackEvent(campaign.id, 'cta', hotspot.id);
    if (type === 'url') window.open(value, '_blank');
    else if (type === 'email') window.location.href = `mailto:${value}`;
    else if (type === 'phone') window.location.href = `tel:${value}`;
    else if (type === 'video') window.open(value, '_blank');
    else if (type === 'scene') navigate(`/embed/${value}`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && zoom > 1) { setIsDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); }
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(prev => Math.min(Math.max(prev * (e.deltaY > 0 ? 0.9 : 1.1), 1), 5));
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Opening campaign</p>
    </div>
  );

  if (!isAuthorized) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
        <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="mb-2 text-2xl font-black text-slate-900">This image is not available on this site</h1>
      <p className="max-w-sm font-medium leading-relaxed text-slate-500">
        The owner has not allowed this website to show the campaign. If this is your campaign, add and verify this domain in
        Domains, or open the preview link directly.
      </p>
      <button
        type="button"
        onClick={() => navigate('/domains')}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
      >
        <Globe className="h-4 w-4" /> Manage domains
      </button>
    </div>
  );

  if (loadError) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50">
        <AlertCircle className="h-10 w-10 text-amber-500" />
      </div>
      <h1 className="mb-2 text-2xl font-black text-slate-900">We could not open this campaign</h1>
      <p className="max-w-md font-medium leading-relaxed text-slate-500">{loadError}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Home className="h-4 w-4" /> Go to ClickSIP
        </button>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
        <ImageIcon className="h-10 w-10 text-slate-300" />
      </div>
      <h1 className="mb-2 text-2xl font-black text-slate-900">Campaign not found</h1>
      <p className="max-w-sm font-medium leading-relaxed text-slate-500">
        This link may be old or the campaign may have been deleted. Ask the sender for a fresh link.
      </p>
    </div>
  );

  const getFilterString = (filters: any) => {
    if (!filters) return '';
    return `brightness(${1 + (filters.brightness || 0)}) contrast(${100 + (filters.contrast || 0)}%) blur(${filters.blur || 0}px) hue-rotate(${filters.hue || 0}deg) saturate(${1 + (filters.saturation || 0)}) opacity(${filters.opacity ?? 1}) ${filters.grayscale ? 'grayscale(100%)' : ''} ${filters.sepia ? 'sepia(100%)' : ''} ${filters.invert ? 'invert(100%)' : ''}`.replace(/\s+/g, ' ').trim();
  };

  const hoverCardOnRight = !!hoveredHotspot && imageBoxWidth > 0 && hoveredHotspot.x * fitScale > imageBoxWidth / 2;

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden flex items-center justify-center font-sans cursor-default select-none"
      ref={containerRef} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
      {/* 
        Removed 'overflow-hidden' from this wrapper so preview cards don't get clipped.
        The image itself and filter layers retain rounding via separate classes if needed.
      */}
      <div className="relative inline-block shadow-2xl transition-transform duration-75 ease-out"
        style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`, cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}>

        {/* Wrapper for image and built-in filters to keep rounded corners without clipping hotspots */}
        <div
          ref={imageWrapRef}
          className="rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative bg-slate-100/40"
          style={naturalSize ? { width: naturalSize.width * fitScale, height: naturalSize.height * fitScale } : undefined}
        >
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className={naturalSize ? 'block h-full w-full' : 'block max-h-[80vh] max-w-[calc(100vw-1.5rem)] object-contain'}
            style={{ filter: getFilterString(campaign.filters) }}
            referrerPolicy="no-referrer"
            onLoad={(event) => {
              const el = event.currentTarget;
              if (el.naturalWidth && el.naturalHeight) {
                setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
              }
            }}
          />

          {/* Radius Effects */}
          {naturalSize && campaign.hotspots?.filter(h => h.radius && h.radius > 0).map(h => {
            const hf = getFilterString(h.filters);
            if (!hf) return null;
            return (
              <div key={`r-${h.id}`} className="absolute left-0 top-0 pointer-events-none"
                style={{
                  width: naturalSize.width,
                  height: naturalSize.height,
                  transform: `scale(${fitScale})`,
                  transformOrigin: 'top left',
                  clipPath: `circle(${h.radius}px at ${h.x}px ${h.y}px)`,
                }}>
                <img src={campaign.imageUrl} alt="" className="block" width={naturalSize.width} height={naturalSize.height} style={{ filter: hf }} referrerPolicy="no-referrer" />
              </div>
            );
          })}

          {campaign.filters?.vignette && campaign.filters.vignette > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent ${100 - (campaign.filters.vignette * 100)}%, rgba(0,0,0,${campaign.filters.vignette}) 100%)` }} />
          )}
        </div>

        {/* Hotspot Markers - Elevated Z-Index */}
        <div className="absolute inset-0 z-[100]">
          {campaign.hotspots?.map((h) => {
            const size = h.width || 12;
            const cornerRadius = (size * (h.roundness || 100)) / 100;
            const isHover = h.triggerType === 'hover';
            const HotspotIcon = h.iconName ? (ICON_MAP[h.iconName] || Info) : null;
            const animType = h.animationType || ((h as any).pulseAnimation === false ? 'none' : 'pulse');
            // Keep the visual dot usable on a phone even when a large photo
            // is scaled down, and give it a finger-sized tap target.
            const dotSize = Math.max(28, size * 2 * fitScale);
            const tapSize = Math.max(44, dotSize + 16);
            const ringRadius = Math.max(4, cornerRadius * 1.25 * fitScale);

            return (
              <button key={h.id}
                type="button"
                aria-label={h.title ? `Open ${h.title}` : 'Open hotspot'}
                title={h.title || 'Open'}
                onClick={(e) => { e.stopPropagation(); handleHotspotInteraction(h, 'click'); }}
                onMouseEnter={() => isHover && handleHotspotInteraction(h, 'hover')}
                onMouseLeave={() => isHover && handleHotspotLeave()}
                onFocus={() => setHoveredHotspot(h)}
                onBlur={() => setHoveredHotspot(null)}
                className="absolute flex items-center justify-center group transition-transform duration-75 ease-out rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/60"
                style={{
                  left: `${h.x * fitScale}px`,
                  top: `${h.y * fitScale}px`,
                  width: `${tapSize}px`,
                  height: `${tapSize}px`,
                  transform: 'translate(-50%, -50%)',
                  // The dot you are hovering or have open always wins over a
                  // neighbour it happens to overlap.
                  zIndex: activeHotspot?.id === h.id ? 30 : hoveredHotspot?.id === h.id ? 20 : 10,
                }}>

                {/* Animations */}
                {animType === 'ping' && (
                  <div className="absolute inset-0 animate-ping opacity-30"
                    style={{ backgroundColor: h.backgroundColor || '#2563eb', borderRadius: `${ringRadius}px` }} />
                )}

                {animType === 'pulse' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0"
                    style={{ backgroundColor: h.backgroundColor || '#2563eb', borderRadius: `${ringRadius}px` }} />
                )}

                <motion.div
                  className="relative flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ width: `${dotSize}px`, height: `${dotSize}px`, backgroundColor: h.backgroundColor || '#2563eb', color: h.iconColor || '#ffffff', borderRadius: `${Math.max(4, cornerRadius * fitScale)}px` }}
                  animate={
                    animType === 'bounce' ? { y: [0, -10, 0] } :
                      animType === 'float' ? { y: [0, -5, 0], x: [0, 2, -2, 0] } : {}
                  }
                  transition={
                    animType === 'bounce' ? { repeat: Infinity, duration: 1, ease: "easeInOut" } :
                      animType === 'float' ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {}
                  }
                  whileHover={{ scale: 1.1 }}
                >
                  {HotspotIcon ? <HotspotIcon className="w-3.5 h-3.5" /> : <DefaultIcon type={h.type} />}
                </motion.div>
                {/* Title Tooltip */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0 z-10">
                  <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">{h.title}</div>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Hover Inline Preview Cards - Smart Positioning Logic */}
        <AnimatePresence>
          {hoveredHotspot && !activeHotspot && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: hoverCardOnRight ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={clearHoverTimeout}
              onMouseLeave={handleHotspotLeave}
              className="absolute z-[99999] pointer-events-auto"
              style={{
                // Open on the side of the dot that has room inside the image.
                left: hoverCardOnRight ? `${hoveredHotspot.x * fitScale - 30}px` : `${hoveredHotspot.x * fitScale + 30}px`,
                top: `${hoveredHotspot.y * fitScale}px`,
                transformOrigin: hoverCardOnRight ? 'right' : 'left',
                transform: `translate(${hoverCardOnRight ? '-100%' : '0'}, -50%)`
              }}>
              <InlineCard hotspot={hoveredHotspot} onAction={handleAction} onOpen={(hotspot) => handleHotspotInteraction(hotspot, 'click')} onSubmit={handleLeadSubmit} leadCaptured={leadCaptured} formError={formError} submitting={submitting} />
            </motion.div>
          )}
        </AnimatePresence>

        {campaign.watermarkUrl && (
          <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
            <img src={campaign.watermarkUrl} alt="Watermark" className="h-6 object-contain" />
          </div>
        )}
      </div>

      {/* First-visit hint so visitors know the dots are tappable */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute left-1/2 top-6 z-[1000000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MousePointerClick className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">Tap the dots to explore</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
                  Each dot opens a product, video, note or form.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissHint}
                aria-label="Dismiss hint"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!campaign.hotspots?.length && (
        <div className="absolute left-1/2 top-6 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-center shadow-lg backdrop-blur">
          <p className="text-xs font-black text-amber-900">Nothing to explore here yet</p>
          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-amber-800">
            The owner has not added hotspots to this image.
          </p>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-white/50 bg-white/80 p-2 shadow-xl backdrop-blur-md">
        <button type="button" onClick={() => setZoom(prev => Math.max(prev - 0.2, 1))} aria-label="Zoom out" title="Zoom out" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Minus className="w-4 h-4" /></button>
        <span className="text-[10px] font-black text-slate-400 w-12 text-center uppercase tracking-widest">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))} aria-label="Zoom in" title="Zoom in" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Plus className="w-4 h-4" /></button>
      </div>

      {/* Full Modal (Click Trigger) - Fixed at Root for Interactions */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] sm:p-6"
            onClick={() => { setActiveHotspot(null); setLeadCaptured(false); setFormError(null); }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={activeHotspot.title || 'Hotspot details'}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className={`max-h-[92vh] w-full overflow-y-auto rounded-[1.5rem] bg-white shadow-2xl sm:rounded-[2rem] ${activeHotspot.type === 'video' ? 'max-w-2xl' : 'max-w-sm'}`}
              onClick={e => e.stopPropagation()}>
              <ModalContent hotspot={activeHotspot} onClose={() => { setActiveHotspot(null); setLeadCaptured(false); setFormError(null); }}
                onAction={handleAction} onSubmit={handleLeadSubmit} leadCaptured={leadCaptured} formError={formError} submitting={submitting} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Inline Hover Card ─── */
function InlineCard({ hotspot, onAction, onOpen, onSubmit, leadCaptured, formError, submitting }: { hotspot: Hotspot; onAction: (h: Hotspot) => void; onOpen: (h: Hotspot) => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; leadCaptured: boolean; formError?: string | null; submitting?: boolean }) {
  if (hotspot.type === 'product') {
    const isServiceFirst = hotspot.offerType === 'service-first';
    const isBundle = hotspot.offerType === 'bundle';

    return (
      <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/80 backdrop-blur-xl">
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          <ProductImageGallery images={[hotspot.imageUrl || '', ...(hotspot.additionalImages || [])].filter(Boolean)} />
          {hotspot.price && (
            <div className="absolute bottom-3 left-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-200/50 z-10">
              {hotspot.currency || '$'}{hotspot.price}
            </div>
          )}
          {isBundle && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg z-10">
              Bundle Deal
            </div>
          )}
          <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm z-10">
            <Heart className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              {isServiceFirst && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-1">Service-Led Offer</span>}
              <h4 className="font-black text-slate-900 leading-tight truncate text-sm">{hotspot.title}</h4>
            </div>
            <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
          </div>
          {hotspot.description && <p className="text-slate-400 text-[10px] mb-2 line-clamp-2 leading-relaxed">{hotspot.description}</p>}
          {hotspot.productInfo && <p className="text-slate-500 text-[9px] mb-4 line-clamp-2 font-medium italic border-l-2 border-slate-100 pl-2">{hotspot.productInfo}</p>}
          <button onClick={() => onAction(hotspot)}
            className="w-full py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> {hotspot.ctaText || 'Add to Cart'}
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
          onClick={() => onOpen(hotspot)}
          aria-label={`Play ${hotspot.title || 'video'}`}
          className="group/video relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden block cursor-pointer"
        >
          {hotspot.videoUrl ? (
            <HotspotVideo url={hotspot.videoUrl} className="w-full h-full pointer-events-none" autoPlay muted controls={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Play className="w-10 h-10 text-white/20" /></div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover/video:bg-black/45">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-white shadow-lg backdrop-blur-md transition-transform group-hover/video:scale-110">
              <Play className="w-6 h-6 fill-current" />
            </span>
          </span>
        </button>
        <div className="p-4">
          <h4 className="font-black text-slate-900 text-xs truncate">{hotspot.title}</h4>
          {hotspot.description && <p className="text-slate-400 text-[10px] mt-1 line-clamp-2">{hotspot.description}</p>}
          {hotspot.ctaText && (
            <button onClick={() => onAction(hotspot)} className="w-full mt-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all">
              {hotspot.ctaText}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (hotspot.type === 'signup_form') {
    return (
      <div className="w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200/50">
          <Mail className="w-5 h-5" />
        </div>
        <h4 className="font-black text-slate-900 mb-1">{hotspot.title}</h4>
        <p className="text-slate-400 text-[10px] font-bold mb-4">{hotspot.description || 'Fill out the form below'}</p>
        {leadCaptured ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 text-emerald-600 p-5 rounded-2xl flex flex-col items-center text-center gap-2">
            <CheckCircle className="w-8 h-8" />
            <div className="font-black text-xs uppercase tracking-widest">You're on the list</div>
            <p className="text-[11px] font-medium text-emerald-700">Thanks — check your inbox soon.</p>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {(hotspot.formFields || [{ id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true }, { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true }]).map((field: FormField) => (
              <DynamicField key={field.id} field={field} />
            ))}
            {formError && (
              <p role="alert" className="flex items-start gap-1.5 rounded-xl border border-red-100 bg-red-50 p-2.5 text-[11px] font-bold leading-snug text-red-700">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {formError}
              </p>
            )}
            <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200/50 hover:shadow-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Sending…' : hotspot.ctaText || 'Submit'}
            </button>
          </form>
        )}
      </div>
    );
  }

  if (hotspot.type === 'image') {
    return (
      <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="aspect-video bg-slate-50 overflow-hidden">
          {hotspot.imageUrl ? <img src={hotspot.imageUrl} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-slate-200" /></div>}
        </div>
        <div className="p-5">
          <h4 className="font-black text-slate-900 text-sm">{hotspot.title}</h4>
          {hotspot.description && <p className="text-slate-400 text-[10px] mt-2 leading-relaxed">{hotspot.description}</p>}
          {hotspot.ctaText && <button onClick={() => onAction(hotspot)} className="mt-3 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">{hotspot.ctaText} <ArrowRight className="w-3 h-3" /></button>}
        </div>
      </div>
    );
  }

  // Default: standard/text
  const HIcon = hotspot.iconName ? (ICON_MAP[hotspot.iconName] || Info) : Info;
  return (
    <div className="w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${hotspot.backgroundColor || '#2563eb'}15`, color: hotspot.backgroundColor || '#2563eb' }}>
          <HIcon className="w-5 h-5" />
        </div>
        <h4 className="font-black text-slate-900 text-sm truncate">{hotspot.title}</h4>
      </div>
      {hotspot.description && <p className="text-slate-400 text-[10px] font-medium leading-relaxed mb-3">{hotspot.description}</p>}
      {hotspot.ctaText && (
        <button onClick={() => onAction(hotspot)} className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all">
          {hotspot.ctaText}
        </button>
      )}
    </div>
  );
}

/* ─── Full Modal Content ─── */
function ModalContent({ hotspot, onClose, onAction, onSubmit, leadCaptured, formError, submitting }: any) {
  if (hotspot.type === 'product') {
    const isServiceFirst = hotspot.offerType === 'service-first';
    const isBundle = hotspot.offerType === 'bundle';

    return (
      <>
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
            <ProductImageGallery images={[hotspot.imageUrl || '', ...(hotspot.additionalImages || [])].filter(Boolean)} />
          </div>
          <button onClick={onClose} aria-label="Close details" className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm z-10"><X className="w-4 h-4 text-slate-500" /></button>
          <button className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors z-10"><Heart className="w-4 h-4" /></button>
          {isBundle && (
            <div className="absolute bottom-4 left-4 px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg z-10">
              Product + Service Bundle
            </div>
          )}
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {isServiceFirst && <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">Service-Led Experience</span>}
          <div className="flex items-center gap-1 text-amber-400 mb-2">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}<span className="text-slate-400 text-[10px] font-bold ml-1">(128 reviews)</span></div>
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-2xl font-black text-slate-900 leading-tight">{hotspot.title}</h3>
            {hotspot.price && <span className="text-xl font-black text-blue-600">{hotspot.currency || '$'}{hotspot.price}</span>}
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Description</h5>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">{hotspot.description}</p>
            </div>

            {hotspot.productInfo && (
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Product Info & Specs</h5>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-slate-600 font-medium leading-relaxed text-xs whitespace-pre-wrap">{hotspot.productInfo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-8 pt-0">
          <button onClick={() => onAction(hotspot)}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            <ShoppingCart className="w-4 h-4" /> {hotspot.ctaText || 'Add to Cart'}
          </button>
        </div>
      </>
    );
  }

  if (hotspot.type === 'video') {
    return (
      <>
        <div className="relative">
          <button onClick={onClose} aria-label="Close video" className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm"><X className="w-4 h-4 text-slate-500" /></button>
          <div className="aspect-video bg-slate-900 overflow-hidden rounded-t-[2rem]">
            {hotspot.videoUrl ? <HotspotVideo url={hotspot.videoUrl} className="w-full h-full" autoPlay /> :
              <div className="w-full h-full flex items-center justify-center"><Play className="w-16 h-16 text-white/20" /></div>}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-black text-slate-900 mb-1">{hotspot.title}</h3>
          {hotspot.description && <p className="text-slate-500 text-sm mb-4">{hotspot.description}</p>}
          {hotspot.ctaText && (
            <button onClick={() => onAction(hotspot)} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
              {hotspot.ctaText}
            </button>
          )}
        </div>
      </>
    );
  }

  // Form / default modal
  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${hotspot.backgroundColor || '#2563eb'}15`, color: hotspot.backgroundColor || '#2563eb' }}>
          <ModalIcon type={hotspot.type} />
        </div>
        <button onClick={onClose} aria-label="Close details" className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{hotspot.title}</h3>
      {hotspot.description && <p className="text-slate-500 font-medium mb-8 leading-relaxed">{hotspot.description}</p>}

      {hotspot.type === 'signup_form' || hotspot.type === 'email_signup_image' ? (
        leadCaptured ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 text-emerald-600 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-10 h-10" /><div className="font-black uppercase tracking-widest text-xs">You're on the list</div><p className="font-bold">Thanks — check your inbox soon.</p>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {(hotspot.formFields || [{ id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true }, { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true }]).map((field: FormField) => (
              <DynamicField key={field.id} field={field} />
            ))}
            {formError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-snug text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
              </p>
            )}
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Sending…' : hotspot.ctaText || 'Subscribe now'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )
      ) : (
        <button onClick={() => onAction(hotspot)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
          {hotspot.ctaText || 'Learn More'}
          {hotspot.action.type === 'phone' ? <Phone className="w-4 h-4" /> : hotspot.action.type === 'email' ? <Mail className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

/* ─── Dynamic Form Field ─── */
function DynamicField({ field }: { field: FormField }) {
  const baseClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm";
  const label = field.label || 'Field';
  const autoComplete =
    field.type === 'email' ? 'email' :
      field.type === 'tel' ? 'tel' :
        /name/i.test(label) ? 'name' : undefined;

  if (field.type === 'textarea') {
    return <textarea name={field.label} aria-label={label} required={field.required} placeholder={field.placeholder || field.label} className={`${baseClass} h-24 resize-none`} />;
  }
  if (field.type === 'select') {
    return (
      <select name={field.label} aria-label={label} required={field.required} className={baseClass} defaultValue="">
        <option value="">{field.placeholder || `Select ${field.label}`}</option>
        {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return <input type={field.type} name={field.label} aria-label={label} autoComplete={autoComplete} required={field.required} placeholder={field.placeholder || field.label} className={baseClass} />;
}

/* ─── Product Image Gallery ─── */
function ProductImageGallery({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <ShoppingCart className="w-16 h-16 text-slate-100" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIdx}
          src={images[currentIdx]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev - 1 + images.length) % images.length); }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => (prev + 1) % images.length); }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Icon Helpers ─── */
function DefaultIcon({ type }: { type: string }) {
  switch (type) {
    case 'video': case 'video_cta': return <Play className="w-3 h-3 fill-current" />;
    case 'signup_form': case 'email_signup_image': return <Mail className="w-3 h-3" />;
    case 'product': return <ShoppingCart className="w-3 h-3" />;
    case 'text': return <Type className="w-3 h-3" />;
    case 'image': case 'image_description': return <ImageIcon className="w-3 h-3" />;
    case 'description_only': return <FileText className="w-3 h-3" />;
    default: return <MousePointer2 className="w-3 h-3" />;
  }
}

function ModalIcon({ type }: { type: string }) {
  switch (type) {
    case 'product': return <ShoppingCart className="w-6 h-6" />;
    case 'video': case 'video_cta': return <Play className="w-6 h-6 fill-current" />;
    case 'signup_form': case 'email_signup_image': return <Mail className="w-6 h-6" />;
    case 'text': return <Type className="w-6 h-6" />;
    case 'image': case 'image_description': return <ImageIcon className="w-6 h-6" />;
    default: return <Info className="w-6 h-6" />;
  }
}
