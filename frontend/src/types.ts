export type HotspotType = 
  | 'standard' 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'signup_form' 
  | 'product'
  | 'image_description'
  | 'description_only'
  | 'video_cta'
  | 'email_signup_image';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface Hotspot {
  id: string;
  type: HotspotType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  description?: string;
  price?: string;
  ctaText?: string;
  icon?: string;
  backgroundColor?: string;
  iconColor?: string;
  iconName?: string;
  animationType?: 'pulse' | 'bounce' | 'ping' | 'float' | 'none';
  triggerType?: 'click' | 'hover';
  roundness?: number;
  redirectUrl?: string;
  currency?: string;
  imageUrl?: string;
  videoUrl?: string;
  formFields?: FormField[];
  action: {
    type: 'url' | 'email' | 'phone' | 'video' | 'form' | 'scene';
    value: string;
  };
  radius?: number;
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
    hue?: number;
    saturation?: number;
    opacity?: number;
    noise?: number;
    pixelSize?: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  hotspots: Hotspot[];
  watermarkUrl?: string;
  soundUrl?: string;
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
    invert?: boolean;
    hue?: number;
    saturation?: number;
    opacity?: number;
    noise?: number;
    pixelSize?: number;
    vignette?: number;
  };
}

export interface Domain {
  id: string;
  userId: string;
  name: string;
  verified: boolean;
}

export interface Lead {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  timestamp: string;
  data?: Record<string, string>;
}

export interface AnalyticsEvent {
  id: string;
  campaignId: string;
  eventType: 'view' | 'click' | 'cta';
  timestamp: string;
  domain?: string;
  metadata?: any;
}
