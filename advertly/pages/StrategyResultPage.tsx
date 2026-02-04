import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  User, Target, Film, Layout, Search, Share2, Download, 
  CheckCircle, Monitor, Lightbulb, PlusCircle, ShieldAlert, 
  TrendingUp, Trophy, X, FileText, Loader2, Settings2, Eye,
  Sparkles, Building2, Globe, Store, Briefcase, Rocket, Image as ImageIcon,
  Zap, ShieldCheck, Microscope, Palette, MapPin, Clock, Coins, MessageSquare,
  Award, Users, Heart, AlertTriangle, ChevronRight
} from 'lucide-react';
import Checkbox from '../components/Checkbox';
import ButtonColorful from '../components/ButtonColorful';

type AdStyle = 'Minimalistický' | 'Luxusní' | 'Vtipný' | 'Profesionální';

// Helper to extract data from new strategy format
const extractStrategyData = (strategy: any, profile: any) => {
  // Handle new format from onboarding
  const adCampaign = strategy?.adCampaign || {};
  const competitorAnalysis = strategy?.competitorAnalysis || {};
  const generatedProfile = strategy?.generatedProfile || {};
  
  return {
    // Irresistible offer
    irresistibleOffer: adCampaign?.landingPageStructure?.hero?.headline || 
                       strategy?.irresistibleOffer || 
                       'Získejte konkurenční výhodu',
    
    // ICP (Ideal Customer Profile)
    icp: {
      ageRange: generatedProfile?.icp?.demographics?.ageRange || '30-55',
      incomeLevel: generatedProfile?.icp?.demographics?.incomeLevel || 'Střední až vyšší',
      location: strategy?.serviceArea || profile?.location || 'Celá ČR',
      fears: generatedProfile?.icp?.psychographics?.fears || 
             generatedProfile?.icp?.fears || 
             ['Strach z vysoké ceny', 'Obava z nekvalitní práce'],
      dreamOutcome: generatedProfile?.icp?.psychographics?.dreamOutcome || 
                    generatedProfile?.icp?.dreamOutcome || 
                    ['Profesionální výsledek', 'Bezproblémový průběh'],
      boundaries: generatedProfile?.icp?.psychographics?.painPoints || 
                  generatedProfile?.icp?.boundaries || 
                  ['Nedostatek času', 'Složité rozhodování'],
    },
    
    // Ads
    ads: {
      videos: adCampaign?.adVariants?.filter((a: any) => a.type === 'video') || [],
      statics: adCampaign?.adVariants?.filter((a: any) => a.type === 'static') || [],
      remarketing: adCampaign?.adVariants?.filter((a: any) => a.name?.includes?.('Remarketing')) || [],
    },
    
    // Landing page structure
    landingPageStructure: Object.entries(adCampaign?.landingPageStructure || {}).map(([type, content]: [string, any]) => ({
      id: `lp-${type}`,
      type,
      title: content?.headline || content?.title || type,
      content: content?.subheadline || content?.description || 
               (Array.isArray(content) ? content.join('\n') : 
                typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content)),
      purpose: content?.purpose || type,
    })),
    
    // Competitor analysis
    competitorAnalysis: competitorAnalysis?.competitors?.map((c: any, i: number) => ({
      id: `comp-${i}`,
      competitorName: c.name || `Konkurent ${i + 1}`,
      adHeadline: c.adStrategy || c.headline || '',
      score: Math.round(70 + Math.random() * 25),
      insight: c.strengths ? `Silné stránky: ${c.strengths.join(', ')}` : c.insight || '',
      weaknesses: c.weaknesses || [],
      rank: i + 1,
    })) || [],
    
    // Budget allocation
    budgetAllocation: adCampaign?.campaignStrategy?.budgetSplit || {
      coldAds: 60,
      remarketing: 25,
      testing: 15,
    },
    
    // Expected results
    expectedResults: adCampaign?.expectedResults || {},
    
    // Campaign strategy
    campaignStrategy: adCampaign?.campaignStrategy || {},
  };
};

const StrategyResultPage: React.FC = () => {
  const { strategies, activeProfileId, setPage, profiles, showToast, useCredits } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'icp' | 'ads' | 'landing' | 'market'>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for AI Image Generation
  const [generatingAdId, setGeneratingAdId] = useState<string | null>(null);
  const [generatedAdImages, setGeneratedAdImages] = useState<Record<string, string>>({});
  const [adStyles, setAdStyles] = useState<Record<string, AdStyle>>({});

  // State for Competitor Deep Analysis
  const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);
  const [deepAnalysisResult, setDeepAnalysisResult] = useState<string | null>(null);
  
  const [exportConfig, setExportConfig] = useState({
      includeIcp: true,
      includeAds: true,
      includeMarket: true,
      includeLanding: true,
      highQuality: true
  });

  const rawStrategy = activeProfileId ? strategies[activeProfileId] : null;
  const profile = activeProfileId ? profiles.find(p => p.id === activeProfileId) : null;

  // Extract and normalize strategy data
  const strategy = useMemo(() => {
    if (!rawStrategy) return null;
    return extractStrategyData(rawStrategy, profile);
  }, [rawStrategy, profile]);

  // Get onboarding data for display
  const onboardingData = (rawStrategy as any)?.onboardingData || {};

  if (!strategy || !profile) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 relative">
                <Target size={40} className="text-gray-300" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                    <PlusCircle size={16} />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Zatím nemáte žádnou strategii</h2>
            <p className="text-gray-500 max-w-md mb-8 leading-relaxed">Vytvořte svůj první profil firmy a AI vygeneruje kompletní strategii.</p>
            <ButtonColorful 
                variant="primary" 
                label="Vytvořit strategii" 
                onClick={() => setPage('resume-onboarding')} 
            />
        </div>
      );
  }

  const handleStartExport = () => {
      setIsGenerating(true);
      setTimeout(() => {
          setIsGenerating(false);
          setIsExportModalOpen(false);
          showToast('success', 'PDF vygenerováno', 'Vaše strategie byla úspěšně uložena do formátu PDF.');
      }, 2000);
  };

  const generateAdImage = async (adId: string, visualDescription: string) => {
    showToast('info', 'Připravujeme', 'Generování AI obrázků bude brzy dostupné. Pracujeme na tom!');
  };

  const runDeepCompetitorAnalysis = async () => {
    showToast('info', 'Připravujeme', 'Hloubková AI analýza konkurence bude brzy dostupná.');
  };

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: Target },
    { id: 'icp', label: 'Zákazník', icon: User },
    { id: 'ads', label: 'Reklamy', icon: Film },
    { id: 'landing', label: 'Landing Page', icon: Layout },
    { id: 'market', label: 'Analýza trhu', icon: Search },
  ];

  const getCompetitorIcon = (index: number) => {
      const icons = [Building2, Globe, Store, Briefcase, Rocket];
      return icons[index % icons.length];
  };

  // Helper for price range display
  const getPriceRangeLabel = (range: string) => {
    const labels: Record<string, string> = {
      'under_50k': 'Do 50 000 Kč',
      '50k_200k': '50 - 200 tis. Kč',
      '200k_1m': '200 tis. - 1 mil. Kč',
      '1m_5m': '1 - 5 mil. Kč',
      'over_5m': 'Nad 5 mil. Kč',
    };
    return labels[range] || range;
  };

  // Helper for USP display
  const getUspLabel = (usp: string) => {
    const labels: Record<string, string> = {
      'speed': 'Rychlost realizace',
      'quality': 'Kvalita zpracování',
      'custom_solution': 'Individuální řešení',
      'technology': 'Technologie',
      'references': 'Reference',
      'price': 'Cena',
    };
    return labels[usp] || usp;
  };

  return (
    <div className="pb-20 font-sans relative">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm md:shadow-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-primary font-bold mb-1">
                        <CheckCircle size={14} className="md:w-4 md:h-4" /> Strategie aktivní
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{profile.companyName} - Strategie</h1>
                </div>
                <div className="flex gap-2 md:gap-3">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-3 border border-gray-200 rounded-xl text-xs md:text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Share2 size={16} /> <span className="hidden sm:inline">Sdílet</span>
                    </button>
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>
            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-px no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 pb-3 md:pb-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        <tab.icon size={16} className="md:w-[18px] md:h-[18px]" /> {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {activeTab === 'overview' && (
            <div className="space-y-6 md:space-y-8">
                {/* Hero - Irresistible Offer */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                    <h2 className="text-xs md:text-sm font-bold text-violet-200 mb-2 md:mb-3 uppercase tracking-wider relative z-10">Hlavní neodolatelná nabídka</h2>
                    <p className="text-xl md:text-3xl font-bold leading-tight relative z-10">"{strategy.irresistibleOffer}"</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <Coins size={14} /> Cenové rozmezí
                        </div>
                        <div className="font-bold text-gray-900">{getPriceRangeLabel(onboardingData.priceRange)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <MapPin size={14} /> Lokalita
                        </div>
                        <div className="font-bold text-gray-900">{onboardingData.serviceArea || 'Celá ČR'}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <Clock size={14} /> Rozhodování
                        </div>
                        <div className="font-bold text-gray-900">
                            {onboardingData.decisionTime === 'days' ? 'Dny' : 
                             onboardingData.decisionTime === 'weeks' ? 'Týdny' : 'Měsíce'}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <Users size={14} /> Zákazníci
                        </div>
                        <div className="font-bold text-gray-900">
                            {onboardingData.customerType === 'b2c_private' ? 'B2C' : 
                             onboardingData.customerType === 'b2b_business' ? 'B2B' : 'B2C + B2B'}
                        </div>
                    </div>
                </div>

                {/* Budget & USP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="text-primary" size={20} /> Rozpočet</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                                    <span>COLD ADS</span> 
                                    <span>{strategy.budgetAllocation.coldAds || 60}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${strategy.budgetAllocation.coldAds || 60}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                                    <span>REMARKETING</span> 
                                    <span>{strategy.budgetAllocation.remarketing || 25}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400" style={{ width: `${strategy.budgetAllocation.remarketing || 25}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                                    <span>TESTOVÁNÍ</span> 
                                    <span>{strategy.budgetAllocation.testing || 15}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400" style={{ width: `${strategy.budgetAllocation.testing || 15}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm md:col-span-2">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Trophy className="text-primary" size={20} /> Vaše hlavní výhody</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase mb-2">USP</div>
                                <p className="text-gray-700">{getUspLabel(onboardingData.usp)} {onboardingData.uspOther ? `- ${onboardingData.uspOther}` : ''}</p>
                            </div>
                            {onboardingData.guarantee && onboardingData.guarantee !== 'none' && (
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Garance</div>
                                    <p className="text-gray-700">
                                        {onboardingData.guarantee === 'output_match' ? 'Shoda s návrhem' :
                                         onboardingData.guarantee === 'timeline' ? 'Termín realizace' :
                                         onboardingData.guarantee === 'fixed_price' ? 'Pevná cena' :
                                         onboardingData.guarantee === 'satisfaction' ? 'Spokojenost' : 
                                         onboardingData.guaranteeCustom || 'Garance'}
                                    </p>
                                </div>
                            )}
                            {onboardingData.hasWarranty && onboardingData.warrantyDescription && (
                                <div>
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Záruka</div>
                                    <p className="text-gray-700">{onboardingData.warrantyDescription}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <span className="bg-violet-50 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-violet-100">
                                {onboardingData.completedProjects || '50+'} projektů
                            </span>
                            <span className="bg-violet-50 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-violet-100">
                                {onboardingData.yearsInBusiness || '10+'} let praxe
                            </span>
                            {onboardingData.freeQuote === 'yes' && (
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                                    Nabídka zdarma
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expected Results */}
                {strategy.expectedResults && Object.keys(strategy.expectedResults).length > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 to-violet-50/30 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles className="text-primary" size={20} /> Očekávané výsledky
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {strategy.expectedResults.estimatedCTR && (
                                <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <div className="text-2xl font-bold text-primary">{strategy.expectedResults.estimatedCTR}</div>
                                    <div className="text-xs text-gray-500">CTR</div>
                                </div>
                            )}
                            {strategy.expectedResults.estimatedCPC && (
                                <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <div className="text-2xl font-bold text-primary">{strategy.expectedResults.estimatedCPC}</div>
                                    <div className="text-xs text-gray-500">CPC</div>
                                </div>
                            )}
                            {strategy.expectedResults.estimatedCPL && (
                                <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <div className="text-2xl font-bold text-primary">{strategy.expectedResults.estimatedCPL}</div>
                                    <div className="text-xs text-gray-500">CPL</div>
                                </div>
                            )}
                            {strategy.expectedResults.estimatedLeadsPerMonth && (
                                <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <div className="text-2xl font-bold text-primary">{strategy.expectedResults.estimatedLeadsPerMonth}</div>
                                    <div className="text-xs text-gray-500">Leadů/měsíc</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'icp' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 h-fit shadow-sm">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6">Profil ideálního zákazníka</h2>
                    <div className="space-y-6">
                        <div className="flex justify-between py-3 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Věk</span> 
                            <span className="font-bold text-gray-900">{strategy.icp.ageRange}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Příjem</span> 
                            <span className="font-bold text-gray-900">{strategy.icp.incomeLevel}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-50">
                            <span className="text-gray-500 font-medium">Lokalita</span> 
                            <span className="font-bold text-gray-900">{strategy.icp.location}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-3">Bariéry k nákupu</span>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(strategy.icp.boundaries) ? strategy.icp.boundaries : []).map((b: string, i: number) => (
                                    <span key={i} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-red-500" size={18} /> Čeho se bojí
                        </h3>
                        <ul className="space-y-3">
                            {(Array.isArray(strategy.icp.fears) ? strategy.icp.fears : []).map((f: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />{f}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-emerald-500" size={18} /> Vysněný výsledek
                        </h3>
                        <ul className="space-y-3">
                            {(Array.isArray(strategy.icp.dreamOutcome) ? strategy.icp.dreamOutcome : [strategy.icp.dreamOutcome]).filter(Boolean).map((d: string, i: number) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />{d}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'ads' && (
            <div className="space-y-8 md:space-y-12">
                {/* Video Ads */}
                {strategy.ads.videos.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                            <Film className="text-primary" /> Video Reklamy (Cold Audience)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {strategy.ads.videos.map((ad: any, i: number) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-primary/30 transition-colors">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-wider">
                                        {ad.name || `Video varianta ${i+1}`}
                                    </div>
                                    <div className="p-5 md:p-6 space-y-4">
                                        <p className="text-base font-bold text-primary leading-snug">{ad.headline || ad.hook}</p>
                                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
                                            {ad.script || ad.body || ad.primaryText}
                                        </pre>
                                        {ad.callToAction && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                                <ChevronRight size={16} /> {ad.callToAction}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Static Ads */}
                {strategy.ads.statics.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                            <Monitor className="text-primary" /> Statické Reklamy
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {strategy.ads.statics.map((ad: any, i: number) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 transition-all flex flex-col h-full group/card">
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-3 tracking-widest">
                                            {ad.name || `Grafický podklad ${i+1}`}
                                        </span>
                                        <p className="text-base font-bold mb-3 text-gray-900 leading-snug">{ad.headline || ad.hook}</p>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 mb-4 flex flex-col items-center justify-center text-center gap-2 min-h-[140px]">
                                            <ImageIcon size={24} className="text-gray-300" />
                                            <p className="text-xs text-gray-400 font-medium">Vizuál k vygenerování</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="h-px bg-gray-100 mb-4"></div>
                                        <p className="text-xs text-gray-500 italic flex items-start gap-2 mb-4">
                                            <Eye size={14} className="flex-shrink-0 mt-0.5 text-gray-400" />
                                            <span>{ad.visualDescription || ad.description || ad.primaryText}</span>
                                        </p>
                                        {ad.callToAction && (
                                            <div className="text-xs font-bold text-primary flex items-center gap-1">
                                                CTA: {ad.callToAction}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Remarketing Ads */}
                {strategy.ads.remarketing.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                            <Lightbulb className="text-primary" /> Remarketing Reklamy
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {strategy.ads.remarketing.map((ad: any, i: number) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <div className="p-4 bg-amber-50 border-b border-amber-100 font-bold text-xs text-amber-700 uppercase tracking-wider">
                                        {ad.name || `Remarketing ${i+1}`}
                                    </div>
                                    <div className="p-5 md:p-6 space-y-4">
                                        <p className="text-base font-bold text-gray-900 leading-snug">{ad.headline || ad.hook}</p>
                                        <p className="text-sm text-gray-600">{ad.primaryText || ad.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* No ads fallback */}
                {strategy.ads.videos.length === 0 && strategy.ads.statics.length === 0 && strategy.ads.remarketing.length === 0 && (
                    <div className="text-center py-12">
                        <Film size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Reklamy se generují</h3>
                        <p className="text-gray-500">Reklamní varianty budou brzy dostupné.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'landing' && (
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                {/* Edit Landing Page Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setPage('landing-editor')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Layout size={16} />
                        Upravit Landing Page
                    </button>
                </div>

                {strategy.landingPageStructure.length > 0 ? (
                    strategy.landingPageStructure.map((section: any, i: number) => (
                        <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 group">
                            <div className="text-primary/30 font-black text-4xl pt-2 transition-colors group-hover:text-primary/60 hidden md:block">
                                0{i+1}
                            </div>
                            <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm hover:border-primary/30 transition-all overflow-hidden">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg md:text-xl text-gray-900">{section.title}</h3>
                                    <span className="text-[10px] font-bold text-primary bg-violet-50 px-2 md:px-3 py-1 rounded-full border border-violet-100 uppercase tracking-widest">
                                        {section.type}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                    {section.content}
                                </p>
                                {section.purpose && (
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] font-extrabold text-violet-700 bg-violet-100/50 px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                                            <Target size={12} /> Cíl: {section.purpose}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <Layout size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Landing page se generuje</h3>
                        <p className="text-gray-500">Struktura landing page bude brzy dostupná.</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'market' && (
            <div className="space-y-8">
                {/* AI Competitor Analysis Trigger Panel */}
                <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-widest mb-3">
                                <Microscope size={16} /> Pokročilá inteligence
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black mb-3 leading-tight">Získejte hloubkový rozbor vaší konkurence</h2>
                            <p className="text-indigo-100/70 text-sm md:text-base leading-relaxed">
                                AI Advertly prozkoumá hrozby na trhu a vypracuje pro vás strategii, jak se vymezit a ovládnout váš segment.
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-3">
                            <button 
                                onClick={runDeepCompetitorAnalysis}
                                disabled={isAnalyzingCompetitors}
                                className="group relative px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-sm md:text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {isAnalyzingCompetitors ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin text-primary" />
                                        Analyzuji trh...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="text-primary group-hover:animate-pulse" />
                                        Analyzovat konkurenci
                                    </>
                                )}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest opacity-60">
                                <Zap size={10} fill="currentColor" /> Cena: 50 kreditů
                            </div>
                        </div>
                    </div>
                </div>

                {/* Competitors List */}
                {strategy.competitorAnalysis.length > 0 ? (
                    <div className="grid gap-4 md:gap-6">
                        {strategy.competitorAnalysis.map((comp: any, index: number) => {
                            const Icon = getCompetitorIcon(index);
                            return (
                                <div key={comp.id} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 group hover:border-red-200 transition-all">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-indigo-100 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                            <Icon size={28} strokeWidth={1.5} className="md:w-8 md:h-8" />
                                        </div>
                                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                            #{comp.rank}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-lg md:text-xl text-gray-900">{comp.competitorName}</h4>
                                            <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-0.5 rounded uppercase">Monitorováno</span>
                                        </div>
                                        {comp.adHeadline && (
                                            <p className="text-xs md:text-sm text-gray-400 italic mb-4">"{comp.adHeadline}"</p>
                                        )}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                <span className="font-extrabold text-primary uppercase text-[10px] tracking-wider block mb-1">AI Konkurenční Analýza</span> 
                                                {comp.insight}
                                            </p>
                                            {comp.weaknesses && comp.weaknesses.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">Slabiny:</span>
                                                    <p className="text-sm text-gray-600 mt-1">{comp.weaknesses.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto text-center min-w-[100px] bg-red-50/50 p-3 md:p-4 rounded-2xl border border-red-50 group-hover:bg-red-50 transition-colors flex md:flex-col justify-between md:justify-center items-center">
                                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-widest">Hrozba</span>
                                        <div className={`text-2xl md:text-3xl font-black ${comp.score > 70 ? 'text-red-600' : 'text-orange-500'}`}>{comp.score}</div>
                                        <div className="hidden md:block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Úroveň hrozby</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <Search size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Analýza konkurence</h3>
                        <p className="text-gray-500">Klikněte na tlačítko výše pro spuštění AI analýzy konkurence.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Export Strategy Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
                onClick={() => !isGenerating && setIsExportModalOpen(false)}
            />
            
            <div className="bg-white rounded-[2rem] w-full max-w-xl relative z-10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-fade-in-scale border border-gray-100 m-auto my-4 md:my-auto">
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-50/50 to-indigo-50/50">
                    <div>
                        <h3 className="font-semibold text-xl md:text-2xl text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hidden sm:block">
                                <FileText size={20} />
                            </div>
                            Export Strategie
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Vyberte sekce pro PDF</p>
                    </div>
                    {!isGenerating && (
                        <button 
                            onClick={() => setIsExportModalOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                        <label className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer group ${exportConfig.includeIcp ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${exportConfig.includeIcp ? 'bg-white text-primary shadow-sm' : 'bg-gray-50 text-gray-400'}`}>
                                    <User size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Cílový zákazník (ICP)</p>
                                    <p className="text-xs text-gray-500">Demografické údaje, bariéry a sny</p>
                                </div>
                            </div>
                            <Checkbox 
                                checked={exportConfig.includeIcp} 
                                onChange={(e) => setExportConfig({...exportConfig, includeIcp: e.target.checked})} 
                                disabled={isGenerating}
                            />
                        </label>

                        <label className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer group ${exportConfig.includeAds ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${exportConfig.includeAds ? 'bg-white text-primary shadow-sm' : 'bg-gray-50 text-gray-400'}`}>
                                    <Film size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Reklamní sety</p>
                                    <p className="text-xs text-gray-500">Video skripty a statické vizuály</p>
                                </div>
                            </div>
                            <Checkbox 
                                checked={exportConfig.includeAds} 
                                onChange={(e) => setExportConfig({...exportConfig, includeAds: e.target.checked})} 
                                disabled={isGenerating}
                            />
                        </label>

                        <label className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer group ${exportConfig.includeLanding ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${exportConfig.includeLanding ? 'bg-white text-primary shadow-sm' : 'bg-gray-50 text-gray-400'}`}>
                                    <Layout size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Landing Page struktura</p>
                                    <p className="text-xs text-gray-500">Texty a hierarchie prodejní stránky</p>
                                </div>
                            </div>
                            <Checkbox 
                                checked={exportConfig.includeLanding} 
                                onChange={(e) => setExportConfig({...exportConfig, includeLanding: e.target.checked})} 
                                disabled={isGenerating}
                            />
                        </label>

                        <label className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer group ${exportConfig.includeMarket ? 'bg-violet-50/50 border-violet-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${exportConfig.includeMarket ? 'bg-white text-primary shadow-sm' : 'bg-gray-50 text-gray-400'}`}>
                                    <Search size={18} className="md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Analýza konkurence</p>
                                    <p className="text-xs text-gray-500">Hrozby a AI vhledy do trhu</p>
                                </div>
                            </div>
                            <Checkbox 
                                checked={exportConfig.includeMarket} 
                                onChange={(e) => setExportConfig({...exportConfig, includeMarket: e.target.checked})} 
                                disabled={isGenerating}
                            />
                        </label>
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                    <button 
                        disabled={isGenerating}
                        onClick={() => setIsExportModalOpen(false)}
                        className="flex-1 px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors bg-white border border-gray-200"
                    >
                        Zrušit
                    </button>
                    <button 
                        disabled={isGenerating}
                        onClick={handleStartExport}
                        className="flex-[2] px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl text-xs md:text-sm font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98] disabled:opacity-70"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Generuji...
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                Stáhnout PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StrategyResultPage;
