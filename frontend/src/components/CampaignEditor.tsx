import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Circle, Rect, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Campaign, Hotspot, HotspotType, FormField } from '../types';
import { 
  Save, ArrowLeft, Plus, Settings, Trash2, MousePointer2, Type, Play, Mail, 
  ShoppingCart, ChevronRight, Layout, Eye, Sliders, Sun, Contrast, Droplets, 
  Palette, Sparkles, Layers, Box, Code, Image as ImageIcon, FileText, 
  Smartphone, Music, ShieldCheck, X, Upload, Globe, Search, Info, ExternalLink, 
  Phone, CheckCircle, ArrowRight, DollarSign, Euro, PoundSterling,
  Heart, Star, Tag, Zap, Gift, MapPin, Camera, Bookmark, Bell, Award, 
  ThumbsUp, Clock, Flame, Video, Hash, ToggleLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

import { campaignsApi } from '../api/campaigns';
import { uploadsApi } from '../api/services';

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
  const [filterScope, setFilterScope] = useState<'global' | 'hotspot'>('global');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [image] = useImage(campaign?.imageUrl || '', 'anonymous');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const { data } = await campaignsApi.findOne(id);
        setCampaign(data);
        setHotspots(data.hotspots || []);
        if (data.filters) setFilters({ ...filters, ...data.filters });
      } catch (err) {
        console.error('Failed to fetch campaign', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id, navigate]);

  useEffect(() => { if (imageRef.current) imageRef.current.cache(); }, [image, filters]);

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
    if (e.target === e.target.getStage() || e.target.name() === 'background-image') { 
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) {
        // Correct calculation: (pointerPos - stagePosition) / stageScale
        const relativeX = (pos.x - stage.x()) / stage.scaleX();
        const relativeY = (pos.y - stage.y()) / stage.scaleY();
        addHotspot(relativeX, relativeY);
      } else {
        setSelectedId(null); 
      }
    } 
  };

  const addHotspot = (x = 100, y = 100) => {
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      x, y, type: 'standard', title: 'New Hotspot',
      action: { type: 'url', value: '' }, currency: '$', triggerType: 'hover',
    };
    setHotspots([...hotspots, newHotspot]);
    setSelectedId(newHotspot.id);
    setActiveTab('properties');
  };

  const updateHotspot = (hid: string, updates: Partial<Hotspot>) => {
    setHotspots(hotspots.map(h => h.id === hid ? { ...h, ...updates } : h));
  };

  const handleTypeChange = (hid: string, newType: HotspotType) => {
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

  const deleteHotspot = (hid: string) => { setHotspots(hotspots.filter(h => h.id !== hid)); setSelectedId(null); };

  const saveCampaign = async () => {
    if (!campaign || !id) return;
    setSaving(true);
    try {
      await campaignsApi.update(id, {
        name: campaign.name,
        hotspots,
        filters,
        watermarkUrl: campaign.watermarkUrl,
        soundUrl: campaign.soundUrl,
      });
    } catch (err) {
      alert('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (hid: string, field: 'imageUrl' | 'videoUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setSaving(true);
        const { data } = await uploadsApi.upload(file);
        updateHotspot(hid, { [field]: data.url });
      } catch (err) {
        alert('Failed to upload asset');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveAndPreview = async () => { await saveCampaign(); window.open(`/embed/${id}`, '_blank'); };
  const embedCode = `<iframe src="${window.location.origin}/embed/${id}" width="100%" height="600" frameborder="0"></iframe>`;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const selectedHotspot = hotspots.find(h => h.id === selectedId);
  const activePreviewHotspot = hotspots.find(h => h.id === (hoveredId || selectedId));

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">{campaign?.name}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editor Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowEmbedModal(true)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Code className="w-4 h-4" /> Embed
          </button>
          <button onClick={handleSaveAndPreview} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={() => saveCampaign().then(() => alert('Campaign saved successfully!'))} disabled={saving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-6 z-10">
          <ToolButton icon={MousePointer2} active label="Select" />
          <div className="w-10 h-px bg-slate-100"></div>
          <ToolButton icon={Plus} onClick={addHotspot} label="Add Hotspot" />
          <ToolButton icon={Sparkles} onClick={() => alert("Magic scan running...")} label={isScanning ? "Scanning..." : "AI Magic Scan"} className={isScanning ? "animate-pulse text-blue-600" : ""} />
          <ToolButton icon={Music} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Sound" />
          <ToolButton icon={ShieldCheck} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Watermark" />
          <ToolButton icon={Settings} onClick={() => { setActiveTab('settings'); setSelectedId(null); }} label="Settings" />
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden flex items-center justify-center p-24 mt-8">
          <div className="absolute top-8 right-8 flex flex-col gap-2 z-20">
            <button onClick={() => setScale(s => s * 1.2)} className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600"><Plus className="w-5 h-5" /></button>
            <button onClick={() => setScale(s => s / 1.2)} className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600"><X className="w-5 h-5 rotate-45" /></button>
            <button onClick={() => { setScale(1); if (stageRef.current) stageRef.current.position({ x: 0, y: 0 }); }} className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600 text-[10px] font-black">100%</button>
          </div>

          <div className="relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] bg-white">
            {image && (
              <div className="relative">
                {/* Image Wrapper to keep rounded corners without clipping the preview cards */}
                <div className="rounded-3xl overflow-hidden relative">
                  <Stage width={image.width} height={image.height} onClick={handleStageClick} scaleX={scale} scaleY={scale} ref={stageRef} draggable>
                    <Layer>
                      <KonvaImage image={image} ref={imageRef} filters={konvaFilters} {...filters} name="background-image" />
                      {hotspots.map((h) => (
                        <HotspotMarker key={h.id} hotspot={h} isSelected={h.id === selectedId}
                          onSelect={() => { setSelectedId(h.id); setActiveTab(filterScope === 'hotspot' ? 'filters' : 'properties'); }}
                          onHover={() => setHoveredId(h.id)} onUnhover={() => setHoveredId(null)}
                          onChange={(newAttrs: any) => updateHotspot(h.id, newAttrs)} image={image} />
                      ))}
                    </Layer>
                  </Stage>
                </div>

                {/* Live Preview on Hover - Smart Positioning */}
                <AnimatePresence>
                  {activePreviewHotspot && (
                    <motion.div 
                      key="active-preview"
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute z-[99999] pointer-events-none"
                      style={{ 
                        left: (activePreviewHotspot.x * scale > (image.width * scale) / 2)
                          ? `${(activePreviewHotspot.x * scale) - 20}px` 
                          : `${(activePreviewHotspot.x * scale) + 20}px`, 
                        top: `${activePreviewHotspot.y * scale}px`,
                        transform: `translate(${ (activePreviewHotspot.x * scale > (image.width * scale) / 2) ? '-100%' : '0' }, -50%)`
                      }}
                    >
                      <LivePreviewCard hotspot={activePreviewHotspot} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col z-10">
          <div className="flex border-b border-slate-100">
            {['properties', 'filters', 'settings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'properties' ? (
              selectedHotspot ? (
                <div className="space-y-8 pb-20">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hotspot Type</label>
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
                          onClick={() => handleTypeChange(selectedHotspot.id, type.id as any)} icon={type.icon} label={type.label} />
                      ))}
                    </div>
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hotspot Icon</label>
                    <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl max-h-40 overflow-y-auto">
                      {ICON_LIBRARY.map((item) => (
                        <button key={item.name} onClick={() => updateHotspot(selectedHotspot.id, { iconName: item.name })}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedHotspot.iconName === item.name ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>
                          <item.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trigger */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trigger Type</label>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                      <button onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'click' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'click' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Click</button>
                      <button onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'hover' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'hover' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Hover</button>
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <InputField label="Title" value={selectedHotspot.title} onChange={v => updateHotspot(selectedHotspot.id, { title: v })} />
                    <TextAreaField label="Description" value={selectedHotspot.description || ''} onChange={v => updateHotspot(selectedHotspot.id, { description: v })} />

                    {/* Product Fields */}
                    {selectedHotspot.type === 'product' && (
                      <>
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
                        <FileUploadField label="Product Image" onUpload={(e: any) => handleFileChange(selectedHotspot.id, 'imageUrl', e)} preview={selectedHotspot.imageUrl} />
                      </>
                    )}

                    {/* Video Fields */}
                    {selectedHotspot.type === 'video' && (
                      <FileUploadField label="Video Content" onUpload={(e: any) => handleFileChange(selectedHotspot.id, 'videoUrl', e)} preview={selectedHotspot.videoUrl} type="video" />
                    )}

                    {/* Image Fields */}
                    {selectedHotspot.type === 'image' && (
                      <FileUploadField label="Image Content" onUpload={(e: any) => handleFileChange(selectedHotspot.id, 'imageUrl', e)} preview={selectedHotspot.imageUrl} />
                    )}

                    {/* Form Builder */}
                    {selectedHotspot.type === 'signup_form' && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Form Fields</label>
                            <button onClick={() => {
                              const newField: FormField = { id: Math.random().toString(36).substr(2, 9), type: 'text', label: 'New Field', placeholder: '', required: false };
                              updateHotspot(selectedHotspot.id, { formFields: [...(selectedHotspot.formFields || []), newField] });
                            }} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:text-blue-700 transition-colors">
                              <Plus className="w-3 h-3" /> Add Field
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
                        <InputField label="Submit Button Text" value={selectedHotspot.ctaText || ''} onChange={v => updateHotspot(selectedHotspot.id, { ctaText: v })} placeholder="Subscribe" />
                        <InputField label="Redirect URL (After Submit)" value={selectedHotspot.redirectUrl || ''} onChange={v => updateHotspot(selectedHotspot.id, { redirectUrl: v })} placeholder="https://..." />
                      </>
                    )}

                    {selectedHotspot.type !== 'signup_form' && (
                      <>
                        <InputField label="CTA Text" value={selectedHotspot.ctaText || ''} onChange={v => updateHotspot(selectedHotspot.id, { ctaText: v })} placeholder="Shop Now" />
                        
                        <div className="space-y-4 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Action Type</label>
                            <div className="flex bg-slate-50 p-1 rounded-2xl">
                              {[
                                { id: 'url', label: 'Link', icon: Globe },
                                { id: 'email', label: 'Email', icon: Mail },
                                { id: 'phone', label: 'Call', icon: Phone },
                              ].map(action => (
                                <button key={action.id} 
                                  onClick={() => updateHotspot(selectedHotspot.id, { action: { ...selectedHotspot.action, type: action.id as any } })}
                                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.action.type === action.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <action.icon className="w-3 h-3" /> {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <InputField 
                            label={selectedHotspot.action.type === 'email' ? 'Email Address' : selectedHotspot.action.type === 'phone' ? 'Phone Number' : 'Action URL'} 
                            value={selectedHotspot.action.value} 
                            onChange={v => updateHotspot(selectedHotspot.id, { action: { ...selectedHotspot.action, value: v } })} 
                            placeholder={selectedHotspot.action.type === 'email' ? 'hello@example.com' : selectedHotspot.action.type === 'phone' ? '+1234567890' : 'https://...'} 
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Styling */}
                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker label="Background" value={selectedHotspot.backgroundColor || '#2563eb'} onChange={v => updateHotspot(selectedHotspot.id, { backgroundColor: v })} />
                      <ColorPicker label="Icon Color" value={selectedHotspot.iconColor || '#ffffff'} onChange={v => updateHotspot(selectedHotspot.id, { iconColor: v })} />
                    </div>
                    <SliderField label="Size" value={selectedHotspot.width || 12} min={5} max={50} onChange={v => updateHotspot(selectedHotspot.id, { width: v, height: v })} />
                    <SliderField label="Roundness" value={selectedHotspot.roundness || 100} min={0} max={100} onChange={v => updateHotspot(selectedHotspot.id, { roundness: v })} />
                  </div>

                  <button onClick={() => deleteHotspot(selectedHotspot.id)} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                    <Trash2 className="w-5 h-5" /> Delete Hotspot
                  </button>
                </div>
              ) : (
                <EmptyState />
              )
            ) : activeTab === 'filters' ? (
              <FilterPanel filters={filters} setFilters={setFilters} selectedHotspot={selectedHotspot} updateHotspot={updateHotspot} />
            ) : (
              <SettingsPanel campaign={campaign} setCampaign={setCampaign} />
            )}
          </div>
        </aside>
      </div>

      <EmbedModal show={showEmbedModal} onClose={() => setShowEmbedModal(false)} code={embedCode} navigate={navigate} />
    </div>
  );
}

/* ─── Live Preview Card ─── */
function LivePreviewCard({ hotspot }: { hotspot: Hotspot }) {
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
        <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative">
          {hotspot.videoUrl ? (
            <video src={hotspot.videoUrl} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Play className="w-8 h-8 text-white/20" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"><Play className="w-5 h-5 fill-current" /></div>
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-black text-slate-900 text-xs truncate">{hotspot.title}</h4>
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

/* ─── Hotspot Marker (Canvas) ─── */
function HotspotMarker({ hotspot, isSelected, onSelect, onHover, onUnhover, onChange }: any) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const size = hotspot.width || 12;
  const cornerRadius = (size * (hotspot.roundness || 100)) / 100;

  useEffect(() => {
    if (isSelected) { trRef.current?.nodes([shapeRef.current]); trRef.current?.getLayer().batchDraw(); }
  }, [isSelected]);

  return (
    <Group onMouseEnter={onHover} onMouseLeave={onUnhover} onClick={onSelect}>
      {hotspot.pulseAnimation !== false && (
        <Rect x={hotspot.x} y={hotspot.y} width={size * 2.5} height={size * 2.5} offsetX={size * 1.25} offsetY={size * 1.25}
          fill={hotspot.backgroundColor || '#2563eb'} opacity={0.2} listening={false} cornerRadius={cornerRadius * 1.25} />
      )}
      <Rect ref={shapeRef} x={hotspot.x} y={hotspot.y} width={size * 2} height={size * 2} offsetX={size} offsetY={size}
        cornerRadius={cornerRadius} fill={hotspot.backgroundColor || '#2563eb'}
        stroke={isSelected ? '#ffffff' : (hotspot.iconColor || '#ffffff')} strokeWidth={3}
        draggable onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        shadowBlur={10} shadowColor="rgba(0,0,0,0.2)" />
    </Group>
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
function FilterPanel({ filters, setFilters, selectedHotspot, updateHotspot }: any) {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Image Filters</label>
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
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Toggle Filters</label>
        <ToggleField label="Grayscale" checked={filters.grayscale} onChange={(v: boolean) => setFilters({ ...filters, grayscale: v })} />
        <ToggleField label="Sepia" checked={filters.sepia} onChange={(v: boolean) => setFilters({ ...filters, sepia: v })} />
        <ToggleField label="Invert" checked={filters.invert} onChange={(v: boolean) => setFilters({ ...filters, invert: v })} />
      </div>
      <button onClick={() => setFilters({ brightness: 0, contrast: 0, blur: 0, grayscale: false, sepia: false, invert: false, hue: 0, saturation: 0, opacity: 1, noise: 0, pixelSize: 1, vignette: 0 })}
        className="w-full py-3 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">
        Reset All Filters
      </button>
    </div>
  );
}

/* ─── UI Primitives ─── */
function ToolButton({ icon: Icon, active, onClick, label, className }: any) {
  return (
    <button onClick={onClick} className={`relative group p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'} ${className}`}>
      <Icon className="w-6 h-6" />
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap uppercase tracking-widest z-50">{label}</div>
    </button>
  );
}

function TypeButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">{label}</span>
    </button>
  );
}

function InputField({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-24" />
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

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4"><MousePointer2 className="w-8 h-8 text-slate-200" /></div>
      <h3 className="text-lg font-bold text-slate-900">Select a hotspot</h3>
      <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-2">Add or click a hotspot to start configuring.</p>
    </div>
  );
}

function SettingsPanel({ campaign, setCampaign }: any) {
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (field: 'watermarkUrl' | 'soundUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && campaign) {
      try {
        setSaving(true);
        const { data } = await uploadsApi.upload(file);
        setCampaign({ ...campaign, [field]: data.url });
      } catch (err) {
        alert('Failed to upload asset');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Watermark
        </label>
        <FileUploadField 
          label="Upload Watermark" 
          onUpload={(e: any) => handleFileUpload('watermarkUrl', e)} 
          preview={campaign?.watermarkUrl} 
        />
        <div className="mt-2 text-[10px] text-slate-400 font-medium">Shows on the bottom right of the image.</div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Music className="w-4 h-4" /> Sound
        </label>
        <FileUploadField 
          label="Upload UI Sound" 
          onUpload={(e: any) => handleFileUpload('soundUrl', e)} 
          preview={campaign?.soundUrl} 
          type="sound" 
        />
        <div className="mt-2 text-[10px] text-slate-400 font-medium">Plays when hotspots are interacted with.</div>
      </div>
    </div>
  );
}

function EmbedModal({ show, onClose, code, navigate }: any) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Embed Code</h2>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 font-mono text-xs text-slate-600 mb-6 break-all">{code}</div>
            <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl">Close</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
