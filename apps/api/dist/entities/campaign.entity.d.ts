import { User } from './user.entity';
import { Hotspot } from './hotspot.entity';
import { Lead } from './lead.entity';
import { AnalyticsEvent } from './analytics-event.entity';
export declare class Campaign {
    id: number;
    userId: number;
    user: User;
    name: string;
    imageUrl: string;
    watermarkUrl: string;
    soundUrl: string;
    filters: any;
    hotspots: Hotspot[];
    leads: Lead[];
    analytics: AnalyticsEvent[];
    createdAt: Date;
    updatedAt: Date;
}
