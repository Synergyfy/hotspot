import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Campaign, Hotspot, AnalyticsEvent, Lead, Domain, FormField } from '../types';
import { ShoppingCart, Play, Mail, X, ExternalLink, Phone, Info, CheckCircle, ArrowRight, Type, Image as ImageIcon, FileText, MousePointer2, Plus, ShieldAlert, Heart, Star, Tag, Zap, Gift, MapPin, Camera, Bookmark, Bell, Award, ThumbsUp, Clock, Flame, Video, Hash, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

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
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!id) return;
    const allCampaigns = storage.get('campaigns');
    const found = allCampaigns.find((c: any) => c.id === id);
    if (found) {
      setCampaign(found);
      const referrer = document.referrer ? new URL(document.referrer).hostname : '';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocal && referrer) {
        const allDomains = storage.get('domains');
        const userDomains = allDomains.filter((d: Domain) => d.userId === found.userId && d.verified);
        if (!userDomains.some((d: Domain) => d.name === referrer)) { setIsAuthorized(false); return; }
      }
      trackEvent('view', undefined, referrer || window.location.hostname);
    }
    setLoading(false);
  }, [id]);

  const trackEvent = (type: 'view' | 'click' | 'cta', hotspotId?: string, domainName?: string) => {
    if (!id) return;
    const referrer = domainName || (document.referrer ? new URL(document.referrer).hostname : window.location.hostname);
    const event: AnalyticsEvent = {
      id: Math.random().toString(36).substr(2, 9), campaignId: id, eventType: type,
      timestamp: new Date().toISOString(), domain: referrer, metadata: { hotspotId: hotspotId || activeHotspot?.id }
    };
    const allEvents = storage.get('analytics_events');
    storage.set('analytics_events', [...allEvents, event]);
  };

  const hoverTimeoutRef = useRef<any>(null);
  const clearHoverTimeout = () => { if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } };

  const handleHotspotInteraction = (hotspot: Hotspot, interactionType: 'click' | 'hover') => {
    if (interactionType === 'hover') {
      clearHoverTimeout();
      setHoveredHotspot(hotspot);
    } else {
      setActiveHotspot(hotspot);
      setHoveredHotspot(null);
      trackEvent('click', hotspot.id);
    }
    if (campaign?.soundUrl) new Audio(campaign.soundUrl).play().catch(() => {});
  };

  const handleHotspotLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredHotspot(null), 300);
  };

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const hs = activeHotspot || hoveredHotspot;
    if (!hs) return;
    const formData = new FormData(e.currentTarget);
    const lead: Lead = {
      id: Math.random().toString(36).substr(2, 9), campaignId: id,
      email: formData.get('email') as string || '', name: formData.get('name') as string || formData.get('Name') as string || '',
      timestamp: new Date().toISOString()
    };
    const allLeads = storage.get('leads');
    storage.set('leads', [...allLeads, lead]);
    setLeadCaptured(true);
    trackEvent('cta', hs.id);
    if (hs.redirectUrl) {
      setTimeout(() => { window.location.href = hs.redirectUrl!; }, 1500);
    } else {
      setTimeout(() => { setActiveHotspot(null); setHoveredHotspot(null); setLeadCaptured(false); }, 2000);
    }
  };

  const handleAction = (hotspot: Hotspot) => {
    const { type, value } = hotspot.action;
    trackEvent('cta', hotspot.id);
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

  if (loading) return <div className="flex items-center justify-center h-screen bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!isAuthorized) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6"><ShieldAlert className="w-10 h-10 text-red-500" /></div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Unauthorized Domain</h1>
      <p className="text-slate-500 max-w-sm font-medium">This interactive image cannot be displayed on this domain.</p>
    </div>
  );
  if (!campaign) return <div className="p-8 text-center text-slate-500 font-bold">Campaign not found.</div>;

  const getFilterString = (filters: any) => {
    if (!filters) return '';
    return `brightness(${1 + (filters.brightness || 0)}) contrast(${100 + (filters.contrast || 0)}%) blur(${filters.blur || 0}px) hue-rotate(${filters.hue || 0}deg) saturate(${1 + (filters.saturation || 0)}) opacity(${filters.opacity ?? 1}) ${filters.grayscale ? 'grayscale(100%)' : ''} ${filters.sepia ? 'sepia(100%)' : ''} ${filters.invert ? 'invert(100%)' : ''}`.replace(/\s+/g, ' ').trim();
  };

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
        <div className="rounded-[2.5rem] overflow-hidden relative">
          <img src={campaign.imageUrl} alt={campaign.name} className="block" style={{ filter: getFilterString(campaign.filters) }} referrerPolicy="no-referrer" />

          {/* Radius Effects */}
          {campaign.hotspots?.filter(h => h.radius && h.radius > 0).map(h => {
            const hf = getFilterString(h.filters);
            if (!hf) return null;
            return (
              <div key={`r-${h.id}`} className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `circle(${h.radius}px at ${h.x}px ${h.y}px)` }}>
                <img src={campaign.imageUrl} alt="" className="block" style={{ filter: hf }} referrerPolicy="no-referrer" />
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

            return (
              <button key={h.id}
                onClick={(e) => { e.stopPropagation(); handleHotspotInteraction(h, 'click'); }}
                onMouseEnter={() => isHover && handleHotspotInteraction(h, 'hover')}
                onMouseLeave={() => isHover && handleHotspotLeave()}
                className="absolute flex items-center justify-center group transition-transform duration-75 ease-out"
                style={{ left: `${h.x}px`, top: `${h.y}px`, width: `${size * 2.5}px`, height: `${size * 2.5}px`, transform: 'translate(-50%, -50%)' }}>
                
                {/* Animations */}
                {animType === 'ping' && (
                  <div className="absolute inset-0 animate-ping opacity-30"
                    style={{ backgroundColor: h.backgroundColor || '#2563eb', borderRadius: `${cornerRadius * 1.25}px` }} />
                )}
                
                {animType === 'pulse' && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0"
                    style={{ backgroundColor: h.backgroundColor || '#2563eb', borderRadius: `${cornerRadius * 1.25}px` }} />
                )}

                <motion.div 
                  className="relative flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ width: `${size * 2}px`, height: `${size * 2}px`, backgroundColor: h.backgroundColor || '#2563eb', color: h.iconColor || '#ffffff', borderRadius: `${cornerRadius}px` }}
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
                  {HotspotIcon ? <HotspotIcon className="w-3 h-3" /> : <DefaultIcon type={h.type} />}
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
              initial={{ opacity: 0, scale: 0.9, x: (hoveredHotspot.x > (containerRef.current?.offsetWidth || 800) / 2) ? 10 : -10 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }} 
              onMouseEnter={clearHoverTimeout}
              onMouseLeave={handleHotspotLeave}
              className="absolute z-[99999] pointer-events-auto"
              style={{ 
                // Determine if we should show card on left or right of the hotspot
                left: (hoveredHotspot.x > (containerRef.current?.offsetWidth || 800) / 2) 
                  ? `${hoveredHotspot.x - 30}px` 
                  : `${hoveredHotspot.x + 30}px`, 
                top: `${hoveredHotspot.y}px`, 
                transformOrigin: (hoveredHotspot.x > (containerRef.current?.offsetWidth || 800) / 2) ? 'right' : 'left',
                transform: `translate(${ (hoveredHotspot.x > (containerRef.current?.offsetWidth || 800) / 2) ? '-100%' : '0' }, -50%)` 
              }}>
              <InlineCard hotspot={hoveredHotspot} onAction={handleAction} onSubmit={handleLeadSubmit} leadCaptured={leadCaptured} />
            </motion.div>
          )}
        </AnimatePresence>

        {campaign.watermarkUrl && (
          <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
            <img src={campaign.watermarkUrl} alt="Watermark" className="h-6 object-contain" />
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/50">
        <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 1))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><X className="w-4 h-4 rotate-45" /></button>
        <span className="text-[10px] font-black text-slate-400 w-12 text-center uppercase tracking-widest">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Plus className="w-4 h-4" /></button>
      </div>

      {/* Full Modal (Click Trigger) - Fixed at Root for Interactions */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-[999999]"
            onClick={() => { setActiveHotspot(null); setLeadCaptured(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <ModalContent hotspot={activeHotspot} onClose={() => { setActiveHotspot(null); setLeadCaptured(false); }}
                onAction={handleAction} onSubmit={handleLeadSubmit} leadCaptured={leadCaptured} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Inline Hover Card ─── */
function InlineCard({ hotspot, onAction, onSubmit, leadCaptured }: { hotspot: Hotspot; onAction: (h: Hotspot) => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; leadCaptured: boolean }) {
  if (hotspot.type === 'product') {
    return (
      <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/80 backdrop-blur-xl">
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          {hotspot.imageUrl ? <img src={hotspot.imageUrl} alt="" className="w-full h-full object-cover" /> :
            <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-16 h-16 text-slate-100" /></div>}
          {hotspot.price && (
            <div className="absolute bottom-3 left-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-200/50">
              {hotspot.currency || '$'}{hotspot.price}
            </div>
          )}
          <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
            <Heart className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-black text-slate-900 leading-tight truncate text-sm">{hotspot.title}</h4>
            <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
          </div>
          {hotspot.description && <p className="text-slate-400 text-[10px] mb-4 line-clamp-2 leading-relaxed">{hotspot.description}</p>}
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
        <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative">
          {hotspot.videoUrl ? (
            <video src={hotspot.videoUrl} className="w-full h-full object-cover" controls autoPlay muted />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Play className="w-10 h-10 text-white/20" /></div>
          )}
          {!hotspot.videoUrl && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-all">
                <Play className="w-6 h-6 fill-current" />
              </div>
            </div>
          )}
        </div>
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
            <div className="font-black text-xs uppercase tracking-widest">Success!</div>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {(hotspot.formFields || [{ id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true }, { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true }]).map((field: FormField) => (
              <DynamicField key={field.id} field={field} />
            ))}
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200/50 hover:shadow-xl transition-all active:scale-[0.98]">
              {hotspot.ctaText || 'Submit'}
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
function ModalContent({ hotspot, onClose, onAction, onSubmit, leadCaptured }: any) {
  if (hotspot.type === 'product') {
    return (
      <>
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
            {hotspot.imageUrl ? <img src={hotspot.imageUrl} alt="" className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-20 h-20 text-slate-100" /></div>}
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm"><X className="w-4 h-4 text-slate-500" /></button>
          <button className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-4 h-4" /></button>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-1 text-amber-400 mb-2">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}<span className="text-slate-400 text-[10px] font-bold ml-1">(128)</span></div>
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-2xl font-black text-slate-900">{hotspot.title}</h3>
            {hotspot.price && <span className="text-xl font-black text-blue-600">{hotspot.currency || '$'}{hotspot.price}</span>}
          </div>
          {hotspot.description && <p className="text-slate-500 font-medium mb-6 leading-relaxed text-sm">{hotspot.description}</p>}
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
          <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-colors shadow-sm"><X className="w-4 h-4 text-slate-500" /></button>
          <div className="aspect-video bg-slate-900 overflow-hidden rounded-t-[2rem]">
            {hotspot.videoUrl ? <video src={hotspot.videoUrl} className="w-full h-full object-cover" controls autoPlay /> :
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
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">{hotspot.title}</h3>
      {hotspot.description && <p className="text-slate-500 font-medium mb-8 leading-relaxed">{hotspot.description}</p>}

      {hotspot.type === 'signup_form' || hotspot.type === 'email_signup_image' ? (
        leadCaptured ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 text-emerald-600 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
            <CheckCircle className="w-10 h-10" /><div className="font-black uppercase tracking-widest text-xs">Success!</div><p className="font-bold">You're on the list.</p>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {(hotspot.formFields || [{ id: '1', type: 'text', label: 'Name', placeholder: 'Your name', required: true }, { id: '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true }]).map((field: FormField) => (
              <DynamicField key={field.id} field={field} />
            ))}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              {hotspot.ctaText || 'Subscribe Now'} <ArrowRight className="w-4 h-4" />
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
  if (field.type === 'textarea') {
    return <textarea name={field.label} required={field.required} placeholder={field.placeholder || field.label} className={`${baseClass} h-24 resize-none`} />;
  }
  if (field.type === 'select') {
    return (
      <select name={field.label} required={field.required} className={baseClass}>
        <option value="">{field.placeholder || `Select ${field.label}`}</option>
        {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return <input type={field.type} name={field.label} required={field.required} placeholder={field.placeholder || field.label} className={baseClass} />;
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
