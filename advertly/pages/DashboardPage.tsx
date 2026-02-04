import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import MetricCard from '../components/MetricCard';
import { 
  Search, Sparkles, Megaphone, Lightbulb, 
  ArrowRight, TrendingUp, PlayCircle, 
  Layout, MessageSquare, Check,
  Target, Film, Users, Eye, MousePointer, Coins,
  ShieldCheck, Award, Zap, ChevronRight, PlusCircle,
  BarChart3, Building2, MapPin, FileText
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { 
    metrics, credits, setPage, profiles, strategies, activeProfileId,
    showToast, hasCompletedOnboarding, onboardingSkipped, backgroundGenerationInProgress
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const hasStrategy = profiles.length > 0 && activeProfileId && strategies[activeProfileId];
  const needsOnboarding = !hasCompletedOnboarding && !onboardingSkipped;
  
  // Get current profile and strategy
  const currentProfile = activeProfileId ? profiles.find(p => p.id === activeProfileId) : null;
  const currentStrategy = activeProfileId ? strategies[activeProfileId] : null;

  // Extract data from strategy
  const strategyData = useMemo(() => {
    if (!currentStrategy) return null;
    
    const adCampaign = (currentStrategy as any)?.adCampaign || {};
    const competitorAnalysis = (currentStrategy as any)?.competitorAnalysis || {};
    const generatedProfile = (currentStrategy as any)?.generatedProfile || {};
    const onboardingData = (currentStrategy as any)?.onboardingData || {};
    
    // Get ads
    const ads = {
      videos: adCampaign?.adVariants?.filter((a: any) => a.type === 'video') || [],
      statics: adCampaign?.adVariants?.filter((a: any) => a.type === 'static') || [],
      total: adCampaign?.adVariants?.length || 0,
    };

    // Get landing page sections count
    const landingPageSections = Object.keys(adCampaign?.landingPageStructure || {}).length;

    // Get competitor count
    const competitors = competitorAnalysis?.competitors?.length || 0;

    // Get expected results
    const expectedResults = adCampaign?.expectedResults || {};

    return {
      ads,
      landingPageSections,
      competitors,
      expectedResults,
      onboardingData,
      irresistibleOffer: adCampaign?.landingPageStructure?.hero?.headline || 
                         (currentStrategy as any)?.irresistibleOffer || '',
      budgetSplit: adCampaign?.campaignStrategy?.budgetSplit || { coldAds: 60, remarketing: 25, testing: 15 },
    };
  }, [currentStrategy]);

  const handleAskAI = async () => {
    if (!searchQuery.trim()) {
      showToast('info', 'Prázdný dotaz', 'Prosím zadejte otázku nebo příkaz pro AI.');
      return;
    }

    if (!currentProfile || !currentStrategy) {
      showToast('info', 'Nejdřív vytvořte strategii', 'Prosím vytvořte si marketingovou strategii, abychom mohli AI pracovat s vašimi daty.');
      return;
    }

    setIsAskingAI(true);
    setAiModalOpen(true);

    try {
      const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          question: searchQuery,
          profileId: activeProfileId,
          strategyData: currentStrategy,
          profileData: currentProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při komunikaci s AI');
      }

      const data = await response.json();
      setAiResponse(data.answer || data.response || 'Omlouvám se, nemůžu odpovědět na tuto otázku.');
      setSearchQuery('');
    } catch (error) {
      console.error('AI Ask error:', error);
      setAiResponse('Omlouvám se, nastala chyba při komunikaci s AI. Zkuste to prosím znovu.');
      showToast('error', 'Chyba', 'Nepodařilo se komunikovat s AI.');
    } finally {
      setIsAskingAI(false);
    }
  };

  // No strategy - show CTA to create one
  if (!hasStrategy) {
    return (
      <div className="pb-12 font-sans bg-[#f8fafc]">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 py-16 md:py-24 mx-4 md:mx-0 rounded-b-3xl md:rounded-none">
          <div className="max-w-screen-xl mx-auto px-4 md:px-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6">
              <Sparkles size={16} />
              AI-powered marketing
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Vytvořte svou první<br />marketingovou strategii
            </h1>
            <p className="text-indigo-100 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Advertly analyzuje váš byznys, konkurenci a vytvoří kompletní marketingovou strategii včetně reklam a landing page.
            </p>
            <button
              onClick={() => setPage('resume-onboarding')}
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-bold text-base shadow-2xl shadow-black/20 hover:shadow-xl transition-all"
            >
              <PlusCircle size={20} />
              Začít nyní
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 -mt-8 md:-mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <Target size={24} className="text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Analýza ICP</h3>
              <p className="text-gray-500 text-sm">AI identifikuje vašeho ideálního zákazníka a jeho bolesti.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Film size={24} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Reklamní sety</h3>
              <p className="text-gray-500 text-sm">Připravené texty pro video i statické reklamy.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Layout size={24} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Landing Page</h3>
              <p className="text-gray-500 text-sm">Kompletní struktura prodejní stránky připravená k použití.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 font-sans bg-white">
      {/* Background Generation Indicator */}
      {backgroundGenerationInProgress && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-b-2 border-violet-200 px-4 md:px-6 py-4 animate-in slide-in-from-top duration-300">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              <div>
                <p className="text-sm font-bold text-violet-900">Generuji vaši strategii v pozadí</p>
                <p className="text-xs text-violet-700 mt-0.5">Jakmile bude hotovo, budete upozorněni</p>
              </div>
            </div>
            <button
              onClick={() => {
                const scrollElement = document.querySelector('[role="region"]');
                scrollElement?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Zvětšit
            </button>
          </div>
        </div>
      )}
      {/* Header with Strategy Info */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 py-16 md:py-24 mx-4 md:mx-0 relative overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-10 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 md:gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-bold mb-2">
                <Building2 size={14} />
                {currentProfile?.companyName}
              </div>
              <h1 className="text-xl md:text-3xl font-black text-white mb-2 md:mb-3 leading-tight">
                {strategyData?.irresistibleOffer || 'Vaše marketingová strategie je připravena'}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm font-medium opacity-90 leading-relaxed">
                AI vytvořila {strategyData?.ads.total || 0} reklamních variant, {strategyData?.landingPageSections || 0} sekcí landing page a analyzovala {strategyData?.competitors || 0} konkurentů.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-white">{strategyData?.ads.videos.length || 0}</div>
                <div className="text-[10px] text-slate-300 font-medium uppercase">Video reklam</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-white">{strategyData?.ads.statics.length || 0}</div>
                <div className="text-[10px] text-slate-300 font-medium uppercase">Statických</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                <div className="text-2xl font-black text-white">{strategyData?.landingPageSections || 0}</div>
                <div className="text-[10px] text-slate-300 font-medium uppercase">LP sekcí</div>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
            <button 
              onClick={() => setPage('strategy')}
              className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 md:p-4 rounded-xl md:rounded-[1.25rem] transition-all cursor-pointer group text-left"
            >
              <div className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center mb-2.5">
                <Target size={16} />
              </div>
              <h3 className="text-white font-bold text-sm md:text-base mb-1.5">Zobrazit strategii</h3>
              <p className="text-indigo-100/70 text-xs mb-4">Kompletní přehled ICP, reklam a landing page.</p>
              <span className="flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-2 transition-all">
                Otevřít <ArrowRight size={14} />
              </span>
            </button>

            <button 
              onClick={() => setPage('landing-editor')}
              className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 md:p-4 rounded-xl md:rounded-[1.25rem] transition-all cursor-pointer group text-left"
            >
              <div className="bg-emerald-500 text-white w-8 h-8 rounded-lg flex items-center justify-center mb-2.5">
                <Layout size={16} />
              </div>
              <h3 className="text-white font-bold text-sm md:text-base mb-1.5">Upravit Landing Page</h3>
              <p className="text-indigo-100/70 text-xs mb-4">{strategyData?.landingPageSections || 0} sekcí připravených k editaci.</p>
              <span className="flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-2 transition-all">
                Editovat <ArrowRight size={14} />
              </span>
            </button>

            <button 
              onClick={() => setPage('profile')}
              className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 md:p-4 rounded-xl md:rounded-[1.25rem] transition-all cursor-pointer group text-left col-span-1 sm:col-span-2 md:col-span-1"
            >
              <div className="bg-orange-500 text-white w-8 h-8 rounded-lg flex items-center justify-center mb-2.5">
                <FileText size={16} />
              </div>
              <h3 className="text-white font-bold text-sm md:text-base mb-1.5">Můj profil firmy</h3>
              <p className="text-indigo-100/70 text-xs mb-4">Upravte informace o firmě a onboarding data.</p>
              <span className="flex items-center gap-1.5 text-white text-xs font-bold group-hover:gap-2 transition-all">
                Zobrazit <ArrowRight size={14} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-10 space-y-6 md:space-y-8">
        {/* Smart Search Bar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Jak zlepšit moje reklamy? Vygeneruj nový hook..."
              className="w-full pl-10 pr-3 py-2 md:py-3 rounded-lg bg-white text-gray-800 border-none outline-none focus:ring-0 text-sm md:text-base placeholder:text-gray-400"
            />
          </div>
          <button 
            onClick={handleAskAI}
            disabled={isAskingAI}
            className="bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold flex items-center justify-center gap-1.5 hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} /> <span className="sm:hidden lg:inline">{isAskingAI ? 'Čekám...' : 'Zeptat se AI'}</span> <span className="hidden sm:inline lg:hidden">{isAskingAI ? 'Čekám...' : 'AI'}</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Strategy Overview */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            {/* Expected Results */}
            {strategyData?.expectedResults && Object.keys(strategyData.expectedResults).length > 0 && (
              <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-[1.25rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-black text-gray-900">Očekávané výsledky</h2>
                  <span className="text-xs text-gray-400 font-medium">Odhad AI</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {strategyData.expectedResults.estimatedCTR && (
                    <MetricCard 
                      title="CTR" 
                      value={strategyData.expectedResults.estimatedCTR} 
                      icon={MousePointer} 
                      color="#7c3aed" 
                    />
                  )}
                  {strategyData.expectedResults.estimatedCPC && (
                    <MetricCard 
                      title="CPC" 
                      value={strategyData.expectedResults.estimatedCPC} 
                      icon={Coins} 
                      color="#10b981" 
                    />
                  )}
                  {strategyData.expectedResults.estimatedCPL && (
                    <MetricCard 
                      title="CPL" 
                      value={strategyData.expectedResults.estimatedCPL} 
                      icon={Users} 
                      color="#f59e0b" 
                    />
                  )}
                  {strategyData.expectedResults.estimatedLeadsPerMonth && (
                    <MetricCard 
                      title="Leadů/měsíc" 
                      value={strategyData.expectedResults.estimatedLeadsPerMonth} 
                      icon={TrendingUp} 
                      color="#3b82f6" 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Budget Allocation */}
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-[1.25rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-base md:text-lg font-black text-gray-900">Rozložení rozpočtu</h2>
                  <p className="text-gray-500 text-xs md:text-sm">Doporučené AI na základě vašeho byznysu</p>
                </div>
                <button onClick={() => setPage('strategy')} className="text-primary font-bold text-xs hover:underline">
                  Upravit
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      Cold Ads (nová publika)
                    </span>
                    <span>{strategyData?.budgetSplit.coldAds || 60}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${strategyData?.budgetSplit.coldAds || 60}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                      Remarketing
                    </span>
                    <span>{strategyData?.budgetSplit.remarketing || 25}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${strategyData?.budgetSplit.remarketing || 25}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      Testování
                    </span>
                    <span>{strategyData?.budgetSplit.testing || 15}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${strategyData?.budgetSplit.testing || 15}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-4">
            {/* Credits */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-5 rounded-xl border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-violet-600">Dostupné kredity</span>
                <Zap size={16} className="text-yellow-500" />
              </div>
              <div className="text-3xl font-black mb-1 text-gray-900">{credits?.current?.toLocaleString?.() || 0}</div>
              <div className="text-xs text-violet-600">z {(credits?.total || credits?.current || 0)?.toLocaleString?.()} kreditů</div>
              <div className="mt-3 w-full h-2 bg-violet-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                  style={{ width: `${((credits?.current || 0) / (credits?.total || credits?.current || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-1.5 text-sm">
                <Lightbulb size={16} className="text-yellow-500" /> Rychlé akce
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setPage('strategy')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100 bg-gray-50/50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Target size={16} className="text-primary" />
                    <span className="text-xs font-semibold text-gray-700">Moje strategie</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                </button>
                <button 
                  onClick={() => setPage('landing-editor')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100 bg-gray-50/50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Layout size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-700">Landing Page Editor</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                </button>
                <button 
                  onClick={() => setPage('profile')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100 bg-gray-50/50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700">Profil firmy</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                </button>
                <button 
                  onClick={() => setPage('analytics')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 transition-all border border-transparent hover:border-violet-100 bg-gray-50/50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <BarChart3 size={16} className="text-blue-500" />
                    <span className="text-xs font-semibold text-gray-700">Analytika</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>

            {/* Onboarding Summary */}
            {strategyData?.onboardingData && Object.keys(strategyData.onboardingData).length > 0 && (
              <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Váš byznys</h3>
                <div className="space-y-3">
                  {strategyData.onboardingData.serviceArea && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-gray-600">{strategyData.onboardingData.serviceArea}</span>
                    </div>
                  )}
                  {strategyData.onboardingData.priceRange && (
                    <div className="flex items-center gap-2 text-xs">
                      <Coins size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        {strategyData.onboardingData.priceRange === 'under_50k' ? 'Do 50 tis. Kč' :
                         strategyData.onboardingData.priceRange === '50k_200k' ? '50-200 tis. Kč' :
                         strategyData.onboardingData.priceRange === '200k_1m' ? '200 tis. - 1 mil. Kč' :
                         strategyData.onboardingData.priceRange === '1m_5m' ? '1-5 mil. Kč' : 'Nad 5 mil. Kč'}
                      </span>
                    </div>
                  )}
                  {(strategyData.onboardingData.yearsInBusiness || strategyData.onboardingData.completedProjects) && (
                    <div className="flex items-center gap-2 text-xs">
                      <Award size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        {strategyData.onboardingData.yearsInBusiness || '?'} let, {strategyData.onboardingData.completedProjects || '?'} projektů
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={24} />
                AI Odpověď
              </h2>
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  setAiResponse(null);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isAskingAI ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-600">AI připravuje odpověď...</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  setAiResponse(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Zavřít
              </button>
              {aiResponse && (
                <button
                  onClick={() => {
                    showToast('success', 'Zkopírováno', 'Odpověď byla zkopírována do schránky.');
                    navigator.clipboard.writeText(aiResponse);
                  }}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
                >
                  Kopírovat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
