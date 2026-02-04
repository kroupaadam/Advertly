
export enum Industry {
    SaaS = 'SaaS',
    Ecommerce = 'E-commerce',
    Marketing = 'Marketing',
    Finance = 'Finance',
    Services = 'Služby (B2C/B2B)',
    Construction = 'Stavebnictví',
    Education = 'Vzdělávání',
    Health = 'Zdraví a krása',
    Other = 'Ostatní'
}

export interface MarketingProfile {
    id: string;
    createdAt: Date;
    companyName: string;
    industry: Industry;
    realizedProjects: number;
    yearsOfExperience: number;
    location: string;
    productDescription: string;
    pricingModel: 'free_quote' | 'upfront_price' | 'freemium' | 'custom' | 'other';
    warranty: string;
    guarantee: string;
    usp: string;
    currentMarketingBudget: number;
    targetMonthlySales: number;
    targetInvestAmount: number;
    strategyPreference: 'quality_leads' | 'quantity_scale';
    toneOfVoice: 'professional' | 'friendly' | 'relaxed' | 'authoritative' | 'luxury' | 'profesional';
    culture: string;
    additionalInfo?: string;
    avatarUrl?: string;
}

export interface AppNotification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'success' | 'warning' | 'info';
    unread: boolean;
    timestamp: Date;
}

export interface IdealCustomerProfile {
    ageRange: string;
    incomeLevel: string;
    location: string;
    fears: string[];
    dreamOutcome: string[];
    boundaries: string[];
}

export interface AdVariant {
    id: string;
    type: 'video_cold' | 'static_cold' | 'remarketing';
    hook: string;
    body: string;
    cta: string;
    visualDescription: string;
    script?: string; // Jen pro video
    imageUrl?: string; // URL vygenerovaného obrázku
}

export interface LandingPageSection {
    id: string;
    type: 'hero' | 'social_proof' | 'features' | 'guarantee' | 'faq' | 'cta';
    title: string;
    content: string;
    purpose: string;
    imageUrl?: string;
}

export interface CompetitorAdAnalysis {
    id: string;
    competitorName: string;
    adHeadline: string;
    score: number; // 1-100
    insight: string;
    rank: number;
}

export interface MarketingStrategy {
    profileId: string;
    irresistibleOffer: string;
    icp: IdealCustomerProfile;
    ads: {
        videos: AdVariant[];
        statics: AdVariant[];
        remarketing: AdVariant[];
    };
    landingPageStructure: LandingPageSection[];
    competitorAnalysis: CompetitorAdAnalysis[];
    budgetAllocation: {
        coldAds: number;
        remarketing: number;
        testing: number;
    };
    // Přidáno pro AnalyticsPage
    result?: any; // Výsledky ze serveru
    onboardingData?: any; // Původní onboarding data
    marketingApproach?: string;
    primaryChannel?: string;
    secondaryChannels?: string[];
    keyMessages?: string[];
    expectedOutcomes?: string;
}

export interface UserSettings {
    fullName: string;
    email: string;
    phone: string;
    phonePrefix: string;
    language: string;
    timezone: string;
    avatar?: string; // Base64 encoded avatar image
    notifications: {
        marketing_emails: boolean;
        security_alerts: boolean;
        weekly_report: boolean;
        budget_alerts: boolean;
        new_leads: boolean;
    };
    integrations: {
        google: boolean;
        facebook: boolean;
        linkedin: boolean;
        instagram: boolean;
        tiktok: boolean;
    };
}

export interface DashboardMetrics {
    ctr: number;
    ctrTrend: number;
    totalLeads: number;
    leadsTrend: number;
    interestRate: number;
    interestTrend: number;
    roi: number;
    roiTrend: number;
}

export interface ChartDataPoint {
    name: string;
    clicks: number;
    leads: number;
    cost: number;
}
  
export interface CampaignIdea {
    id: string;
    name: string;
    platform: 'Facebook' | 'Instagram' | 'Google Ads' | 'LinkedIn';
    targeting: string;
    headline: string;
    adText: string;
    estimatedCTR: number;
    estimatedLeads: number;
    estimatedROI: number;
    budgetAllocation: number;
    status: 'Active' | 'Draft' | 'Paused';
}

export interface AppState {
    isAuthenticated?: boolean;
    hasCompletedOnboarding?: boolean;
    onboardingSkipped?: boolean;
    currentPage: 'dashboard' | 'campaigns' | 'analytics' | 'strategy' | 'settings' | 'new-strategy' | 'profile';
    profiles: MarketingProfile[];
    activeProfileId: string | null;
    strategies: Record<string, MarketingStrategy>;
    isAnalyzing: boolean;
    analysisStep?: string;
    settings: UserSettings;
    metrics: DashboardMetrics;
    chartData: ChartDataPoint[];
    campaigns: CampaignIdea[];
    notifications: AppNotification[];
}

export interface AppContextType extends AppState {
    login: (userData: { email: string; fullName?: string; phone?: string; phonePrefix?: string; avatar?: string; hasStrategies?: boolean }) => void;
    logout: () => void;
    setPage: (page: AppState['currentPage']) => void;
    saveProfile: (profile: MarketingProfile) => Promise<void>;
    updateProfile: (profile: MarketingProfile) => void;
    deleteProfile: (profileId: string) => Promise<void>;
    setActiveProfile: (id: string) => void;
    generateSuggestions: (type: 'usp' | 'guarantee', context: Partial<MarketingProfile>) => string[];
    updateSettings: (settings: UserSettings) => void;
    showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'unread' | 'time'>) => void;
    markNotificationsAsRead: () => void;
    markNotificationAsRead: (notificationId: string) => void;
    deleteNotification: (notificationId: string) => void;
    clearAllNotifications: () => void;
    completeOnboarding: (onboardingData: any) => Promise<void>;
    skipOnboarding: () => void;
}
