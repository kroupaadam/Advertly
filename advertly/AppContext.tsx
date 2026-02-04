
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, AppState, MarketingProfile, MarketingStrategy, DashboardMetrics, ChartDataPoint, CampaignIdea, Industry, UserSettings, AppNotification } from './types';
import { generateStrategy, getSuggestions } from './utils';
import Toast, { ToastType } from './components/Toast';
import { STORAGE_KEYS, CREDITS_CONFIG } from './constants';
import { OnboardingData } from './pages/OnboardingWizard';
import { aiService } from './services/aiService';

// Constants
const STRATEGY_GENERATION_TIMEOUT_MS = 90000;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper: Transform API response to MarketingStrategy
const transformStrategyData = (strategyData: any): MarketingStrategy => ({
  profileId: strategyData.profileId,
  irresistibleOffer: strategyData.irresistibleOffer,
  marketingApproach: strategyData.marketingApproach,
  primaryChannel: strategyData.primaryChannel,
  secondaryChannels: strategyData.secondaryChannels,
  keyMessages: strategyData.keyMessages,
  expectedOutcomes: strategyData.expectedOutcomes,
  budgetAllocation: strategyData.budgetAllocation,
  icp: strategyData.idealCustomerProfile,
  ads: {
    videos: strategyData.adVariants?.filter((a: any) => a.type === 'cold_video') || [],
    statics: strategyData.adVariants?.filter((a: any) => a.type === 'cold_static') || [],
    remarketing: strategyData.adVariants?.filter((a: any) => a.type === 'remarketing') || [],
  },
  landingPageStructure: strategyData.landingPageStructure || [],
  competitorAnalysis: strategyData.marketAnalysis?.topCompetitors?.map((c: any, i: number) => ({
    id: `comp-${i}`,
    competitorName: c.name,
    adHeadline: c.marketingApproach,
    score: 75 + Math.random() * 25,
    insight: `Silné stránky: ${c.strengths?.join(', ')}`,
    rank: i + 1
  })) || []
});

// Helper: Generate strategy with timeout
const generateStrategyWithTimeout = async (profile: MarketingProfile): Promise<any> => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Generování strategie trvá příliš dlouho. Zkuste to prosím znovu.')), STRATEGY_GENERATION_TIMEOUT_MS)
  );
  
  return Promise.race([
    aiService.generateCompleteStrategy(profile),
    timeoutPromise
  ]);
};

const parseJsonSafe = <T,>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    console.error('JSON parse error:', json);
    return fallback;
  }
};

const defaultMetrics: DashboardMetrics = {
  ctr: 2.4,
  ctrTrend: 12,
  totalLeads: 148,
  leadsTrend: 8,
  interestRate: 64,
  interestTrend: -2,
  roi: 320,
  roiTrend: 15,
};

const defaultSettings: UserSettings = {
  fullName: '',
  email: '',
  phone: '',
  phonePrefix: '+420',
  language: 'cs',
  timezone: 'Europe/Prague',
  avatar: '',
  notifications: {
    marketing_emails: true,
    security_alerts: true,
    weekly_report: true,
    budget_alerts: true,
    new_leads: true
  },
  integrations: {
    google: false,
    facebook: false,
    linkedin: false,
    instagram: false,
    tiktok: false
  }
};

const initialChartData: ChartDataPoint[] = [
  { name: 'Po', clicks: 400, leads: 24, cost: 2400 },
  { name: 'Út', clicks: 300, leads: 13, cost: 2210 },
  { name: 'St', clicks: 200, leads: 98, cost: 2290 },
  { name: 'Čt', clicks: 278, leads: 39, cost: 2000 },
  { name: 'Pá', clicks: 189, leads: 48, cost: 2181 },
  { name: 'So', clicks: 239, leads: 38, cost: 2500 },
  { name: 'Ne', clicks: 349, leads: 43, cost: 2100 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const savedSettings = parseJsonSafe(localStorage.getItem(STORAGE_KEYS.SETTINGS), defaultSettings);
    const savedProfiles = parseJsonSafe<MarketingProfile[]>(localStorage.getItem(STORAGE_KEYS.PROFILES), []);
    const savedStrategies = parseJsonSafe<Record<string, MarketingStrategy>>(localStorage.getItem(STORAGE_KEYS.STRATEGIES), {});
    const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
    const defaultCredits = { 
      current: CREDITS_CONFIG.INITIAL, 
      total: CREDITS_CONFIG.INITIAL,
      dailyBonusClaimed: new Date().toDateString() 
    };
    const savedCredits = parseJsonSafe(localStorage.getItem(STORAGE_KEYS.CREDITS), defaultCredits);
    // Ensure credits always has the total property
    if (!savedCredits.total) {
      savedCredits.total = CREDITS_CONFIG.INITIAL;
    }
    const savedNotifications = parseJsonSafe<AppNotification[]>(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), []);
    const savedCurrentPage = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE) || 'dashboard';
    let isAuthenticated = localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    let hasCompletedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    let onboardingSkipped = localStorage.getItem('advertly_onboarding_skipped') === 'true';

    // Check if onboarding data has expired (30 days)
    if (hasCompletedOnboarding) {
      const expirationTime = localStorage.getItem('advertly_onboarding_expiration');
      if (expirationTime) {
        const expTime = parseInt(expirationTime);
        const currentTime = Date.now();
        
        if (currentTime > expTime) {
          // Onboarding data has expired - reset them
          hasCompletedOnboarding = false;
          localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
          localStorage.removeItem('advertly_onboarding_expiration');
        }
      }
    }

    // Check if login has expired (7 days = 168 hours)
    if (isAuthenticated) {
      const loginTimestamp = localStorage.getItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
      if (loginTimestamp) {
        const loginTime = parseInt(loginTimestamp);
        const currentTime = Date.now();
        const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (currentTime - loginTime > SEVEN_DAYS_IN_MS) {
          // Session expired - clear authentication
          isAuthenticated = false;
          hasCompletedOnboarding = false;
          localStorage.removeItem(STORAGE_KEYS.AUTH);
          localStorage.removeItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
          localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        }
      }
    }

    const activeProfileId = savedActiveId || (savedProfiles.length > 0 ? savedProfiles[0].id : null);

    return {
      isAuthenticated,
      hasCompletedOnboarding,
      onboardingSkipped,
      currentPage: savedCurrentPage,
      profiles: savedProfiles,
      activeProfileId: activeProfileId,
      strategies: savedStrategies,
      isAnalyzing: false,
      backgroundGenerationInProgress: false,
      settings: savedSettings,
      metrics: defaultMetrics,
      chartData: initialChartData,
      campaigns: [],
      credits: savedCredits,
      notifications: savedNotifications
    };
  });

  const [toast, setToast] = useState<{ type: ToastType; title: string; message: string; isVisible: boolean } | null>(null);

  const safeSetStorage = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage error:', error);
    }
  };

  // Consolidated persistence effect with debounce to prevent excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      safeSetStorage(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
      safeSetStorage(STORAGE_KEYS.PROFILES, JSON.stringify(state.profiles));
      safeSetStorage(STORAGE_KEYS.STRATEGIES, JSON.stringify(state.strategies));
      safeSetStorage(STORAGE_KEYS.CREDITS, JSON.stringify(state.credits));
      safeSetStorage(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));
      safeSetStorage(STORAGE_KEYS.AUTH, state.isAuthenticated ? 'true' : 'false');
      safeSetStorage(STORAGE_KEYS.ONBOARDING_COMPLETED, state.hasCompletedOnboarding ? 'true' : 'false');
      safeSetStorage(STORAGE_KEYS.CURRENT_PAGE, state.currentPage);
      safeSetStorage('advertly_onboarding_skipped', state.onboardingSkipped ? 'true' : 'false');
      
      if (state.activeProfileId) {
        safeSetStorage(STORAGE_KEYS.ACTIVE_PROFILE, state.activeProfileId);
      } else {
        // Pokud není žádný aktivní profil, odstraň z localStorage
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    state.settings,
    state.profiles,
    state.strategies,
    state.credits,
    state.notifications,
    state.isAuthenticated,
    state.hasCompletedOnboarding,
    state.onboardingSkipped,
    state.currentPage,
    state.activeProfileId
  ]);

  // Load strategies from database when user is authenticated
  useEffect(() => {
    // Always try to restore token from localStorage
    const savedToken = localStorage.getItem('token');
    console.log('[AppContext] useEffect triggered for isAuthenticated');
    console.log('[AppContext] Saved token in localStorage:', savedToken ? `YES (length: ${savedToken.length})` : 'NO');
    console.log('[AppContext] Current isAuthenticated state:', state.isAuthenticated);
    
    if (savedToken) {
      console.log('[AppContext] Setting token in aiService');
      aiService.setToken(savedToken);
    } else if (state.isAuthenticated) {
      console.warn('[AppContext] WARNING: User is authenticated but no token found in localStorage');
    }
    
    if (state.isAuthenticated && savedToken) {
      console.log('[AppContext] User is authenticated with token, loading strategies...');
      // Load fresh data from database (overwrite any cached data)
      loadStrategiesFromDatabase();
      loadNotificationSettings();
    } else if (!state.isAuthenticated) {
      // User logged out - clear strategies
      setState((prev: any) => ({
        ...prev,
        profiles: [],
        strategies: {},
        activeProfileId: null
      }));
    }
  }, [state.isAuthenticated]);

  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/notifications/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success && data.settings) {
        setState((prev: any) => ({
          ...prev,
          settings: {
            ...prev.settings,
            notifications: {
               ...prev.settings.notifications,
               ...data.settings
            }
          }
        }));
      }
    } catch (error) {
       console.error("Failed to load notification settings", error);
    }
  };

  const loadStrategiesFromDatabase = async () => {
    try {
      const response = await aiService.getStrategies();
      if (response.data && response.data.length > 0) {
        // Transform database strategies to our format
        const strategiesMap: Record<string, MarketingStrategy> = {};
        const profiles: MarketingProfile[] = [];

        response.data.forEach((dbStrategy: any) => {
          // Create strategy object
          strategiesMap[dbStrategy.profileId] = {
            profileId: dbStrategy.profileId,
            irresistibleOffer: dbStrategy.irresistibleOffer,
            marketingApproach: dbStrategy.marketingApproach,
            primaryChannel: dbStrategy.primaryChannel,
            secondaryChannels: dbStrategy.secondaryChannels,
            keyMessages: dbStrategy.keyMessages,
            expectedOutcomes: dbStrategy.expectedOutcomes,
            budgetAllocation: dbStrategy.budgetAllocation,
            icp: dbStrategy.idealCustomerProfile,
            ads: {
              videos: dbStrategy.adVariants?.filter((a: any) => a.type === 'cold_video') || [],
              statics: dbStrategy.adVariants?.filter((a: any) => a.type === 'cold_static') || [],
              remarketing: dbStrategy.adVariants?.filter((a: any) => a.type === 'remarketing') || [],
            },
            landingPageStructure: dbStrategy.landingPageStructure,
            competitorAnalysis: dbStrategy.marketAnalysis?.topCompetitors?.map((c: any, i: number) => ({
              id: `comp-${i}`,
              competitorName: c.name,
              adHeadline: c.marketingApproach,
              score: 75 + Math.random() * 25,
              insight: `Silné stránky: ${c.strengths?.join(', ')}`,
              rank: i + 1
            })) || []
          };

          // Create profile object
          profiles.push({
            id: dbStrategy.profileId,
            createdAt: new Date(dbStrategy.createdAt),
            companyName: dbStrategy.companyName,
            industry: dbStrategy.industry as Industry,
            realizedProjects: 0,
            yearsOfExperience: 0,
            location: '',
            productDescription: '',
            pricingModel: 'custom',
            warranty: '',
            guarantee: '',
            usp: '',
            currentMarketingBudget: 0,
            targetMonthlySales: 0,
            targetInvestAmount: 0,
            strategyPreference: 'quality_leads',
            toneOfVoice: 'profesional',
            culture: 'Profesionální a důvěryhodná',
            additionalInfo: ''
          });
        });

        setState((prev: any) => ({
          ...prev,
          profiles: profiles,
          strategies: strategiesMap,
          activeProfileId: profiles.length > 0 ? profiles[0].id : null,
          // If user has strategies, mark onboarding as completed
          hasCompletedOnboarding: response.data.length > 0
        }));
      }
    } catch (error) {
      console.error('Error loading strategies from database:', error);
      // Don't show error toast to not annoy user
    }
  };

  const showToast = (type: ToastType, title: string, message: string) => {
      setToast({ type, title, message, isVisible: true });
  };

  const hideToast = () => {
      if (toast) setToast({ ...toast, isVisible: false });
  };

  const login = (userData: { email: string; fullName?: string; phone?: string; phonePrefix?: string; avatar?: string; hasStrategies?: boolean }) => {
    const timestamp = Date.now();
    
    // Clear any cached profiles/strategies from previous sessions
    // These will be reloaded from database
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.STRATEGIES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
    
    // Handle onboarding state based on server response
    if (userData.hasStrategies) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    }
    
    // Ensure token is available and set it in aiService
    const token = localStorage.getItem('token');
    if (token) {
      aiService.setToken(token);
      console.log('[AppContext] Token set in aiService during login');
    }
    
    setState((prev: any) => ({
      ...prev,
      isAuthenticated: true,
      currentPage: 'dashboard',
      profiles: [],
      strategies: {},
      activeProfileId: null,
      hasCompletedOnboarding: userData.hasStrategies === true,
      settings: {
        ...prev.settings,
        email: userData.email,
        ...(userData.fullName && { fullName: userData.fullName }),
        ...(userData.phone && { phone: userData.phone }),
        ...(userData.phonePrefix && { phonePrefix: userData.phonePrefix }),
        ...(userData.avatar && { avatar: userData.avatar })
      }
    }));
    safeSetStorage(STORAGE_KEYS.LOGIN_TIMESTAMP, timestamp.toString());
    safeSetStorage(STORAGE_KEYS.AUTH, 'true');
    safeSetStorage(STORAGE_KEYS.CURRENT_PAGE, 'dashboard');
    showToast('success', 'Vítejte zpět', 'Byli jste úspěšně přihlášeni do svého účtu.');
  };

  const logout = () => {
    // Clear all user-specific data from localStorage
    localStorage.removeItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PAGE);
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.STRATEGIES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('advertly_onboarding_skipped');
    localStorage.removeItem('advertly_onboarding_expiration');
    
    setState((prev: any) => ({ 
      ...prev, 
      isAuthenticated: false, 
      currentPage: 'dashboard',
      profiles: [],
      strategies: {},
      activeProfileId: null,
      hasCompletedOnboarding: false,
      onboardingSkipped: false
    }));
    showToast('info', 'Odhlášeno', 'Byli jste odhlášeni ze svého účtu.');
  };

  const completeOnboarding = async (onboardingData: OnboardingData) => {
    setState((prev: any) => ({ 
      ...prev, 
      isAnalyzing: true, 
      analysisStep: 'Ověřuji vaše odpovědi a formulář...',
      analysisProgress: 0
    }));

    try {
      // Check if token is set before making request
      const savedToken = localStorage.getItem('token');
      console.log('[AppContext] Saved token:', savedToken ? 'YES (length: ' + savedToken.length + ')' : 'NO');
      
      if (!savedToken) {
        throw new Error('Autentizační token nebyl nalezen. Prosím přihlaste se znovu.');
      }
      
      // Ensure token is set in aiService
      aiService.setToken(savedToken);
      
      // Progress callback for real-time updates
      const onProgress = (step: number, progress: number, message: string) => {
        console.log(`[AppContext] Progress: Step ${step}, ${progress}%, ${message}`);
        setState((prev: any) => ({ 
          ...prev, 
          analysisStep: message,
          analysisProgress: progress
        }));
      };

      // Try SSE stream first, fallback to regular POST
      let response;
      try {
        response = await aiService.generateFromOnboardingWithProgress(onboardingData, onProgress);
      } catch (streamError) {
        console.warn('[AppContext] SSE stream failed, falling back to POST:', streamError);
        // Fallback to regular POST endpoint
        setState((prev: any) => ({ ...prev, analysisStep: 'Scrapuji konkurenci a analyzuji trh...' }));
        response = await aiService.generateFromOnboarding(onboardingData);
      }
      
      const strategyData = response.strategy;
      const result = response.result;

      // Ensure we have a valid profile ID
      const profileId = strategyData?.profileId || `profile-${Date.now()}`;
      
      // Create profile from onboarding data
      const profile: MarketingProfile = {
        id: profileId,
        createdAt: new Date(),
        companyName: onboardingData.companyName,
        industry: onboardingData.whatYouSell as Industry,
        realizedProjects: 0,
        yearsOfExperience: 1,
        location: 'Česká republika',
        productDescription: onboardingData.whatYouSell,
        pricingModel: 'free_quote',
        warranty: '',
        guarantee: result?.profile?.guarantee || '',
        usp: result?.profile?.usp || '',
        currentMarketingBudget: 0,
        targetMonthlySales: 0,
        targetInvestAmount: 15000,
        strategyPreference: onboardingData.leadQualityVsVolume === 'quality_over_quantity' ? 'quality_leads' : 'quantity_scale',
        toneOfVoice: 'professional',
        culture: 'Profesionální a důvěryhodná',
        additionalInfo: '',
      };

      // Build strategy from new response
      const strategy: MarketingStrategy = {
        profileId: profileId,
        irresistibleOffer: result?.landingPage?.hero?.headline || result?.adCampaign?.campaignStrategy?.objective || 'Vaše nabídka',
        marketingApproach: result?.adCampaign?.campaignStrategy?.objective || '',
        primaryChannel: result?.adCampaign?.campaignStrategy?.channels?.[0] || 'Facebook',
        secondaryChannels: result?.adCampaign?.campaignStrategy?.channels?.slice(1) || [],
        keyMessages: result?.adCampaign?.adVariants?.map((a: any) => a.headline).filter(Boolean) || [],
        expectedOutcomes: result?.adCampaign?.campaignStrategy?.objective || '',
        budgetAllocation: result?.adCampaign?.campaignStrategy?.budgetSplit || { coldAds: 50, remarketing: 30, testing: 20 },
        icp: result?.icp || {
          demographics: { ageRange: '30-55', gender: 'Mixed', incomeLevel: 'Střední+', education: 'SŠ/VŠ' },
          psychographics: { values: [], lifestyle: '', painPoints: [] },
          behaviors: { purchasingBehavior: '', onlineActivity: '', mediaConsumption: [] },
          dreamOutcome: '',
          fears: [],
          boundaries: [],
        },
        ads: {
          videos: result?.adCampaign?.adVariants?.filter((a: any) => a.type === 'video') || [],
          statics: result?.adCampaign?.adVariants?.filter((a: any) => a.type === 'static') || [],
          remarketing: result?.adCampaign?.adVariants?.filter((a: any) => a.name?.toLowerCase().includes('remarketing') || a.name?.toLowerCase().includes('retargeting')) || [],
        },
        landingPageStructure: result?.landingPage ? Object.entries(result.landingPage).map(([type, content]: [string, any]) => ({
          type,
          title: content?.headline || content?.title || type,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          purpose: '',
        })) : [],
        competitorAnalysis: result?.competitorAnalysis?.competitors?.map((c: any, i: number) => ({
          id: `comp-${i}`,
          competitorName: c.name,
          adHeadline: c.adApproach || '',
          score: 70 + Math.random() * 30,
          insight: `Silné stránky: ${c.strengths?.join(', ')}`,
          rank: i + 1
        })) || [],
        result, // Uložit výsledky ze serveru do strategie
        onboardingData, // Uložit onboarding data pro referenci
      } as any;

      setState((prev: any) => ({
        ...prev,
        profiles: [...prev.profiles, profile],
        activeProfileId: profileId,
        strategies: { ...prev.strategies, [profileId]: strategy },
        analysisStep: 'Děkujeme! Vaše strategie je připravena.',
        analysisProgress: 100
      }));

      // Wait 3 seconds then navigate to dashboard and show completion toast
      // Check if in background mode BEFORE setTimeout
      const backgroundMode = sessionStorage.getItem('onboarding_background_mode') === 'true';
      
      // If background mode, set flag immediately
      if (backgroundMode) {
        setState((prev: any) => ({
          ...prev,
          backgroundGenerationInProgress: true
        }));
      }

      setTimeout(() => {
        setState((prev: any) => ({
          ...prev,
          isAnalyzing: false,
          hasCompletedOnboarding: true,
          onboardingSkipped: false,
          currentPage: 'dashboard'
        }));
        
        // Uložíme čas vytvoření strategie pro expiraci onboarding dat (30 dní)
        const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
        localStorage.setItem('advertly_onboarding_expiration', expirationTime.toString());
        
        // Check if in background mode
        const backgroundMode = sessionStorage.getItem('onboarding_background_mode') === 'true';
        if (backgroundMode) {
          // Turn off background generation flag and show notification
          setState((p: any) => ({
            ...p,
            backgroundGenerationInProgress: false
          }));
          // Show notification instead of full screen
          addNotification({
            id: `strategy-ready-${Date.now()}`,
            type: 'success',
            title: 'Strategie je připravena',
            description: 'Vaše marketingová strategie a reklamní kampaň jsou připraveny.',
            link: { label: 'Zobrazit', action: () => setState((p: any) => ({ ...p, currentPage: 'dashboard' })) }
          });
          sessionStorage.removeItem('onboarding_background_mode');
        } else {
          showToast('success', 'Strategie je připravena', 'Vaše marketingová strategie a reklamní kampaň jsou připraveny.');
        }
      }, 3000);

    } catch (error) {
      console.error(error);
      // Even if AI fails, complete onboarding so user can access the app
      setState((prev: any) => ({ 
        ...prev, 
        isAnalyzing: false,
        hasCompletedOnboarding: true,
        onboardingSkipped: false,
        currentPage: 'dashboard'
      }));
      showToast('error', 'Chyba při generování', (error instanceof Error ? error.message : 'Strategii můžete vygenerovat později v aplikaci.'));
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('advertly_onboarding_skipped', 'true');
    setState((prev: any) => ({ 
      ...prev, 
      onboardingSkipped: true,
      hasCompletedOnboarding: false,
      currentPage: 'dashboard'
    }));
    showToast('info', 'Onboarding přeskočen', 'Můžete ho doplnit později v nastavení.');
  };

  const setPage = (page: string) => {
    setState((prev: any) => ({ ...prev, currentPage: page }));
  };

  const updateSettings = async (newSettings: UserSettings) => {
    // Update local state
    setState((prev: any) => ({ ...prev, settings: newSettings }));
    
    // Also save avatar to backend if it was changed
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      if (token) {
        // Save avatar
        await fetch(`${apiUrl}/api/auth/update-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: newSettings.avatar || null })
        });

        // Save notification settings
        await fetch(`${apiUrl}/api/notifications/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSettings.notifications)
        });
      }
    } catch (error) {
      console.error('Error saving settings to backend:', error);
    }
  };

  const updateProfile = (profile: MarketingProfile) => {
    setState((prev: any) => ({
      ...prev,
      profiles: prev.profiles.map((p: any) => p.id === profile.id ? profile : p)
    }));
  };

  const deleteProfile = async (profileId: string) => {
    try {
      // Call API to delete from database
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/profiles/${profileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Nepodařilo se smazat profil');
        }
      }
      
      // Update local state immediately
      setState((prev: any) => {
        const updatedProfiles = prev.profiles.filter((p: any) => p.id !== profileId);
        const updatedStrategies = { ...prev.strategies };
        delete updatedStrategies[profileId];
        
        // If deleting active profile, switch to first remaining profile or dashboard
        let newActiveProfileId = prev.activeProfileId;
        if (prev.activeProfileId === profileId) {
          newActiveProfileId = updatedProfiles.length > 0 ? updatedProfiles[0].id : null;
        }
        
        return {
          ...prev,
          profiles: updatedProfiles,
          strategies: updatedStrategies,
          activeProfileId: newActiveProfileId,
          currentPage: 'dashboard'
        };
      });
      
      // Force reload from database to ensure sync
      await loadStrategiesFromDatabase();
      
      showToast('success', 'Profil odstraněn', 'Profil a jeho strategie byly odstraněny.');
    } catch (error) {
      console.error('Error deleting profile:', error);
      showToast('error', 'Chyba při mazání', error instanceof Error ? error.message : 'Nepodařilo se smazat profil');
    }
  };

  const updateStrategy = (profileId: string, strategy: any) => {
    setState((prev: any) => ({
      ...prev,
      strategies: { ...prev.strategies, [profileId]: strategy }
    }));
  };

  const useCredits = (amount: number) => {
    if (state.credits.current >= amount) {
        setState((prev: any) => ({
            ...prev,
            credits: { ...prev.credits, current: prev.credits.current - amount }
        }));
        return true;
    }
    showToast('error', 'Nedostatek kreditů', 'Pro tuto akci nemáte dostatek kreditů. Prosím, dokupte si balíček.');
    return false;
  };

  const saveProfile = async (profile: MarketingProfile) => {
    if (state.profiles.length >= 3) {
        showToast('error', 'Limit strategií dosažen', 'V základním tarifu můžete mít maximálně 3 strategie najednou.');
        return;
    }

    setState((prev: any) => ({ 
        ...prev, 
        isAnalyzing: true, 
        analysisStep: 'Analyzuji trh a konkurenci...' 
    }));

    try {
        const response = await generateStrategyWithTimeout(profile);
        const strategyData = response.strategy;
        
        setState((prev: any) => ({ ...prev, analysisStep: 'Připravuji váš plán...' }));

        const strategy = transformStrategyData(strategyData);

        setState((prev: any) => ({
            ...prev,
            profiles: [...prev.profiles, profile],
            activeProfileId: strategyData.profileId,
            strategies: { ...prev.strategies, [strategyData.profileId]: strategy },
            isAnalyzing: false,
            currentPage: 'strategy-result'
        }));

        showToast('success', 'Strategie připravena', 'AI úspěšně vytvořila váš marketingový plán.');

    } catch (error) {
        console.error(error);
        setState((prev: any) => ({ ...prev, isAnalyzing: false }));
        showToast('error', 'Chyba analýzy', (error instanceof Error ? error.message : 'Nepodařilo se vygenerovat strategii. Zkuste to prosím znovu.'));
    }
  };

  const addNotification = (notif: any) => {
    const newNotif = {
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        unread: true,
        time: 'Nyní',
        ...notif
    };
    setState((prev: any) => ({
        ...prev,
        notifications: [newNotif, ...prev.notifications]
    }));
  };

  const markNotificationsAsRead = () => {
    setState((prev: any) => ({
        ...prev,
        notifications: prev.notifications.map((n: any) => ({ ...n, unread: false }))
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setState((prev: any) => ({
        ...prev,
        notifications: prev.notifications.map((n: any) => 
            n.id === notificationId ? { ...n, unread: false } : n
        )
    }));
  };

  const deleteNotification = (notificationId: string) => {
    setState((prev: any) => ({
        ...prev,
        notifications: prev.notifications.filter((n: any) => n.id !== notificationId)
    }));
  };

  const clearAllNotifications = () => {
    setState((prev: any) => ({
        ...prev,
        notifications: []
    }));
  };

  return (
    <AppContext.Provider value={{ 
        ...state, 
        login,
        logout,
        setPage, 
        saveProfile, 
        updateProfile,
        deleteProfile,
        updateStrategy,
        updateSettings,
        useCredits, 
        showToast,
        addNotification,
        markNotificationsAsRead,
        markNotificationAsRead,
        deleteNotification,
        clearAllNotifications,
        completeOnboarding,
        skipOnboarding
    }}>
      {children}
      {toast && <Toast {...toast} onClose={hideToast} />}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
