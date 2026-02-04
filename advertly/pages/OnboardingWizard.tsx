import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  ChevronRight, ArrowLeft, Check, Loader2, ChevronDown, X
} from 'lucide-react';

export interface OnboardingData {
  // KROK 1: Identita
  companyName: string;
  
  // KROK 2: Co prodáváte
  whatYouSell: string; // jednou větou - NE obor
  
  // KROK 3: Popis služby/produktu (5 vět)
  serviceDescription: string;
  
  // KROK 4: Typ zákazníka
  customerType: 'b2c_private' | 'b2b_business' | 'mixed';
  
  // KROK 5: CENA (POVINNÁ)
  priceRange: 'under_50k' | '50k_200k' | '200k_1m' | '1m_5m' | 'over_5m';
  
  // KROK 6: Zkušenosti
  completedProjects: string; // kolik zrealizovaných zakázek
  yearsInBusiness: string; // kolik let praxe
  
  // KROK 7: Lokalita
  serviceArea: string; // kde doručuje službu
  
  // KROK 8: Doba rozhodování
  decisionTime: 'days' | 'weeks' | 'months';
  
  // KROK 9: Hlavní strach zákazníka
  mainFear: 'price_roi' | 'result_quality' | 'technical_issues' | 'time_disruption' | 'other';
  mainFearOther?: string;
  
  // KROK 10: Cenové nabídky
  freeQuote: 'yes' | 'no'; // dělá cenové nabídky zdarma?
  
  // KROK 11: Garance
  hasGuarantee: boolean;
  guarantee: 'output_match' | 'timeline' | 'fixed_price' | 'satisfaction' | 'none';
  guaranteeCustom?: string; // pokud má vlastní garanci
  
  // KROK 12: Záruka
  hasWarranty: boolean;
  warrantyDescription?: string; // popis záruky
  
  // KROK 13: USP
  usp: 'speed' | 'quality' | 'custom_solution' | 'technology' | 'references' | 'price' | 'other';
  uspOther?: string;
  
  // KROK 14: Kvalita vs objem poptávek
  leadQualityVsVolume: 'quality_over_quantity' | 'volume_over_quality';
  
  // KROK 15: První krok/zdarma
  firstStep: 'consultation' | 'assessment' | 'price_estimate' | 'checklist' | 'none';
  
  // KROK 16: Marketing budget
  currentMarketingBudget: 'nothing' | 'under_10k' | '10k_30k' | '30k_100k' | 'over_100k';
  targetMonthlySales: string; // kolik prodejů měsíčně chce
  plannedMarketingBudget: 'under_10k' | '10k_30k' | '30k_50k' | '50k_100k' | 'over_100k';
  
  // KROK 17: Tone of Voice
  toneOfVoice: 'professional' | 'friendly' | 'casual' | 'luxury' | 'technical';
  
  // KROK 18: CTA
  cta: 'request_consultation' | 'book_meeting' | 'send_info' | 'other';
  ctaOther?: string;
  
  // KROK 19: Dodatečné informace (dobrovolné)
  additionalInfo?: string;
  
  // Metadata
  createdAt: Date;
  id: string;
}

const defaultOnboardingData: OnboardingData = {
  companyName: '',
  whatYouSell: '',
  serviceDescription: '',
  customerType: 'b2c_private',
  priceRange: '200k_1m',
  completedProjects: '',
  yearsInBusiness: '',
  serviceArea: '',
  decisionTime: 'weeks',
  mainFear: 'result_quality',
  freeQuote: 'yes',
  hasGuarantee: false,
  guarantee: 'none',
  guaranteeCustom: '',
  hasWarranty: false,
  warrantyDescription: '',
  usp: 'custom_solution',
  leadQualityVsVolume: 'quality_over_quantity',
  firstStep: 'consultation',
  currentMarketingBudget: 'nothing',
  targetMonthlySales: '',
  plannedMarketingBudget: 'under_10k',
  toneOfVoice: 'professional',
  cta: 'request_consultation',
  additionalInfo: '',
  createdAt: new Date(),
  id: `onboarding-${Date.now()}`,
};

const TOTAL_STEPS = 11;

const OnboardingWizard: React.FC = () => {
  const { completeOnboarding, isAnalyzing, analysisStep, skipOnboarding, setPage } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(defaultOnboardingData);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isNewOnboarding, setIsNewOnboarding] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(false);

  // Check if this is a new onboarding session
  useEffect(() => {
    const sessionFlag = sessionStorage.getItem('onboarding_new_session');
    if (sessionFlag === 'true') {
      // Clear old data and start fresh
      localStorage.removeItem('onboarding_progress');
      localStorage.removeItem('onboarding_step');
      sessionStorage.removeItem('onboarding_new_session');
      setStep(1);
      setFormData(defaultOnboardingData);
      setIsNewOnboarding(true);
    }
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    // Only load if this is NOT a new session
    if (isNewOnboarding) return;
    
    const savedProgress = localStorage.getItem('onboarding_progress');
    const savedStep = localStorage.getItem('onboarding_step');
    if (savedProgress) {
      try {
        setFormData(JSON.parse(savedProgress));
        if (savedStep) {
          setStep(parseInt(savedStep));
        }
      } catch (e) {
        console.log('Could not restore progress');
      }
    }
  }, []);

  // Auto-save progress to localStorage whenever formData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding_progress', JSON.stringify(formData));
      localStorage.setItem('onboarding_step', step.toString());
    }, 500); // Debounce to avoid excessive saves
    
    return () => clearTimeout(timer);
  }, [formData, step]);

  // Save progress to localStorage
  const saveProgress = () => {
    localStorage.setItem('onboarding_progress', JSON.stringify(formData));
    localStorage.setItem('onboarding_step', step.toString());
  };

  // Clear saved progress (used after successful completion)
  const clearSavedProgress = () => {
    localStorage.removeItem('onboarding_progress');
    localStorage.removeItem('onboarding_step');
  };

  const handleChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const newStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(newStep);
    saveProgress();
  };
  const prevStep = () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
    saveProgress();
  };

  const handleSaveAndExit = () => {
    saveProgress();
    setShowSaveConfirm(false);
    skipOnboarding();
    setPage('dashboard');
  };

  const handleRestart = () => {
    // Reset form data
    setFormData(defaultOnboardingData);
    // Reset step
    setStep(1);
    // Clear localStorage
    localStorage.removeItem('onboarding_progress');
    localStorage.removeItem('onboarding_step');
    // Close dialog
    setShowSaveConfirm(false);
  };

  // Validation per step
  const isStepValid = (): boolean => {
    switch (step) {
      case 1: return formData.companyName.trim().length > 0;
      case 2: return formData.whatYouSell.trim().length > 0;
      case 3: return formData.serviceDescription.trim().length > 20;
      case 4: return !!formData.customerType;
      case 5: return !!formData.priceRange;
      case 6: return formData.completedProjects.trim().length > 0 && formData.yearsInBusiness.trim().length > 0 && formData.serviceArea.trim().length > 0;
      case 7: return !!formData.decisionTime && !!formData.mainFear && !!formData.freeQuote;
      case 8: return !!formData.guarantee && !!formData.usp;
      case 9: return !!formData.leadQualityVsVolume;
      case 10: return !!formData.currentMarketingBudget && formData.targetMonthlySales.trim().length > 0 && !!formData.plannedMarketingBudget && !!formData.toneOfVoice && !!formData.cta;
      case 11: return true; // Dodatečné informace nejsou povinné
      default: return false;
    }
  };

  const handleSubmit = async () => {
    await completeOnboarding(formData as any);
    // Clear saved progress after successful submission
    clearSavedProgress();
  };

  // Loading state - with progress and steps
  if (isAnalyzing) {
    // Steps that match the backend strategyGenerator.js
    const steps = [
      { label: 'Ověření formuláře', status: 'Ověřuji vaše odpovědi a formulář...' },
      { label: 'Scrapování konkurence', status: 'Scrapuji konkurenci a analyzuji trh...' },
      { label: 'Analýza odpovědí', status: 'Analyzuji vaše odpovědi...' },
      { label: 'Profil zákazníka', status: 'Generuji profil ideálního zákazníka...' },
      { label: 'Reklamní kampaň', status: 'Generuji reklamní kampaň...' },
      { label: 'Finalizace', status: 'Připravuji váš dashboard...' },
    ];
    
    // Find current step based on analysisStep text (fuzzy match)
    let currentStepIndex = steps.findIndex(s => 
      analysisStep?.toLowerCase().includes(s.status.toLowerCase().split('...')[0].substring(0, 15))
    );
    
    // Fallback to checking specific keywords
    if (currentStepIndex === -1) {
      if (analysisStep?.includes('Ověřuji') || analysisStep?.includes('formulář')) {
        currentStepIndex = 0;
      } else if (analysisStep?.includes('Scrapuji') || analysisStep?.includes('konkurenci') || analysisStep?.includes('Hledám reklamy')) {
        currentStepIndex = 1;
      } else if (analysisStep?.includes('Analyzuji') && analysisStep?.includes('odpovědi')) {
        currentStepIndex = 2;
      } else if (analysisStep?.includes('profil') || analysisStep?.includes('zákazníka') || analysisStep?.includes('ICP')) {
        currentStepIndex = 3;
      } else if (analysisStep?.includes('kampaň') || analysisStep?.includes('reklam')) {
        currentStepIndex = 4;
      } else if (analysisStep?.includes('dashboard') || analysisStep?.includes('Připravuji')) {
        currentStepIndex = 5;
      } else if (analysisStep?.includes('připravena') || analysisStep?.includes('Děkujeme')) {
        currentStepIndex = 6;
      } else {
        currentStepIndex = 0;
      }
    }
    
    // Calculate progress (0-100)
    const progress = Math.min(Math.round((currentStepIndex / steps.length) * 100), 100);
    const isComplete = analysisStep?.includes('připravena') || analysisStep?.includes('Děkujeme');
    
    // Show background notification instead of full screen
    if (backgroundMode && !isComplete) {
      return null; // Let the app continue, notification will show elsewhere
    }
    
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 fixed inset-0 z-[60] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        {!isComplete ? (
          <div className="space-y-8 max-w-lg w-full relative z-10">
            {/* Logo */}
            <div className="text-center">
              <img src="/Brand/LogoWhite.png" alt="Advertly" className="h-10 w-auto mx-auto mb-6 opacity-90" />
            </div>
            
            {/* Animated Spinner */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-white/60 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                <div className="absolute inset-4 flex items-center justify-center text-white font-bold text-sm">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
            
            {/* Step text */}
            <div className="space-y-3 text-center">
              <h2 className="text-4xl font-black text-white">Generujeme vaši strategii</h2>
              <p className="text-white/80 font-medium text-lg">{analysisStep || 'Připravujeme váš účet...'}</p>
            </div>
            
            {/* Progress bar - larger and more visible */}
            <div className="space-y-3 px-4">
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/30">
                <div 
                  className="bg-gradient-to-r from-white via-blue-200 to-white h-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/70 text-center font-semibold">{Math.round(progress)}% Hotovo</p>
            </div>
            
            {/* Steps indicator */}
            <div className="space-y-3 px-4">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${
                  idx <= currentStepIndex ? 'opacity-100' : 'opacity-50'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    idx <= currentStepIndex 
                      ? 'bg-white text-violet-600 shadow-lg shadow-white/20' 
                      : 'bg-white/20 text-white'
                  }`}>
                    {idx < currentStepIndex ? '✓' : idx + 1}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    idx <= currentStepIndex 
                      ? 'text-white' 
                      : 'text-white/60'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Background mode button */}
            <div className="pt-4">
              <button
                onClick={() => {
                  setBackgroundMode(true);
                  sessionStorage.setItem('onboarding_background_mode', 'true');
                  setPage('dashboard');
                }}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm border border-white/30 transition-all duration-300"
              >
                Nechat běžet v pozadí
              </button>
            </div>
            
            <p className="text-xs text-white/60 text-center">Tato operace trvá obvykle 2-3 minuty</p>
          </div>
        ) : (
          // Success screen with animation
          <div className="space-y-8 max-w-md w-full text-center relative z-10 animate-in fade-in duration-500">
            <div className="text-center">
              <img src="/Brand/LogoWhite.png" alt="Advertly" className="h-10 w-auto mx-auto mb-6 opacity-90" />
            </div>
            
            <div className="space-y-6">
              {/* Animated success checkmark */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40 animate-pulse">
                  <svg className="w-12 h-12 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-white">Hotovo! 🎉</h2>
                <p className="text-white/90 text-lg leading-relaxed">Vaše marketingová strategie je připravena. Přesunujeme vás na váš dashboard, kde si ji můžete projít v detailu.</p>
              </div>
            </div>
            
            <p className="text-xs text-white/60">Budeme pokračovat za chvíli...</p>
          </div>
        )}
      </div>
    );
  }

  const stepData = [
    { title: 'Název firmy', subtitle: 'Jak se jmenuje vaše firma?' },
    { title: 'Co prodáváte', subtitle: 'Co si zákazník u vás kupuje?' },
    { title: 'Popis služby', subtitle: 'Popište svou službu/produkt' },
    { title: 'Typ zákazníka', subtitle: 'Komu prodáváte?' },
    { title: 'Cena zakázky', subtitle: 'V jakém rozmezí se pohybuje?' },
    { title: 'Zkušenosti', subtitle: 'Kolik máte za sebou a kde působíte?' },
    { title: 'Prodejní proces', subtitle: 'Jak se rozhodují, co nabízíte?' },
    { title: 'Důvěra zákazníka', subtitle: 'Garance, záruka, USP, výhoda' },
    { title: 'Strategie leadů', subtitle: 'Kvalita nebo objem?' },
    { title: 'Marketing strategie', subtitle: 'Rozpočet, komunikace a CTA' },
    { title: 'Dodatečné info', subtitle: 'Něco, co jsme zapomněli?' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col lg:flex-row overflow-hidden h-screen w-full">
      {/* Sidebar */}
      <div className="lg:w-[380px] xl:w-[450px] bg-violet-900 p-8 md:p-12 text-white flex flex-col justify-between shrink-0 h-auto lg:h-full">
        {/* Logo */}
        <div>
          <div className="mb-12">
            <img src="/Brand/LogoWhite.png" alt="Advertly Logo" className="h-10 w-auto object-contain" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
            Vytvoříme vám strategii
          </h1>
          <p className="text-violet-200 text-base font-normal leading-relaxed">
            Odpovězte na {TOTAL_STEPS} klíčových otázek a získáte personalizovanou strategii. Stačí jen to nejdůležitější.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 mt-12 lg:mt-0">
          {stepData.map((s, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            
            return (
              <div 
                key={num}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'
                }`}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-violet-900' 
                    : isCompleted 
                      ? 'bg-violet-700 text-white' 
                      : 'bg-violet-800 text-violet-300'
                }`}>
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : num}
                </div>
                <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-violet-200'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8 lg:mt-0">
          <div className="flex justify-between text-xs font-medium text-violet-200 mb-2">
            <span>Krok {step} z {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-2 bg-violet-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setShowSaveConfirm(true)}
            className="mt-6 w-full px-4 py-2 text-xs font-medium text-violet-200 hover:text-white transition-colors text-center"
          >
            Dokončit později
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 h-full overflow-y-auto bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
          <div className="max-w-2xl w-full">
            
            {/* STEP 1: Jméno firmy */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Jak se jmenuje vaše firma?</h2>
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">Název firmy</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value.slice(0, 50))}
                      maxLength="50"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-gray-800 text-sm"
                      placeholder="Např. Advertly"
                      autoFocus
                    />
                    {formData.companyName.length > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {formData.companyName.length}/50
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Co prodáváte */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Co si zákazník u vás kupuje?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Jednou větou. Ne obor - konkrétní produkt/službu, kterou si kupuje.</p>
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">Co prodáváte</label>
                  <textarea 
                    value={formData.whatYouSell}
                    onChange={(e) => handleChange('whatYouSell', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-gray-800 text-sm resize-none h-24"
                    placeholder="Např. Zimní zahrady na míru"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Popis služby/produktu */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Popište svou službu/produkt</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">3-5 vět. Co přesně děláte, jak to probíhá, co zákazník dostane.</p>
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">Podrobný popis</label>
                  <textarea 
                    value={formData.serviceDescription}
                    onChange={(e) => handleChange('serviceDescription', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-gray-800 text-sm resize-none h-40"
                    placeholder="Např. Navrhujeme a stavíme zimní zahrady na míru. Nejdřív přijedeme na bezplatné zaměření, připravíme 3D vizualizaci a nabídku. Používáme německé hliníkové profily s 10letou zárukou. Realizace trvá typicky 4-6 týdnů."
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Typ zákazníka */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Komu prodáváte?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Bez toho nejde dělat reklama.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'b2c_private', label: 'B2C – Soukromí lidé (domácnosti)' },
                    { id: 'b2b_business', label: 'B2B – Firmy a komerční objekty' },
                    { id: 'mixed', label: 'Obojí, ale jeden typ převažuje' },
                  ].map((opt: any) => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                      <input 
                        type="radio" 
                        name="customerType"
                        value={opt.id}
                        checked={formData.customerType === opt.id}
                        onChange={(e) => handleChange('customerType', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-normal text-gray-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Cena (POVINNÁ) */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">V jakém rozmezí se pohybuje typická zakázka?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Toto je klíčové. Bez ceny nejde navrhnout nic.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'under_50k', label: 'Do 50 000 Kč' },
                    { id: '50k_200k', label: '50 000 – 200 000 Kč' },
                    { id: '200k_1m', label: '200 000 Kč – 1 milion Kč' },
                    { id: '1m_5m', label: '1 – 5 milionů Kč' },
                    { id: 'over_5m', label: 'Nad 5 milionů Kč' },
                  ].map((opt: any) => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                      <input 
                        type="radio" 
                        name="priceRange"
                        value={opt.id}
                        checked={formData.priceRange === opt.id}
                        onChange={(e) => handleChange('priceRange', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-normal text-gray-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Zkušenosti */}
            {step === 6 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Vaše zkušenosti a terén</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Zkušenosti budují důvěru.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Počet zakázek</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Do 10', '10-50', '50-200', 'Nad 200'].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleChange('completedProjects', option)}
                          className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all ${
                            formData.completedProjects === option
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Roky praxe</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Do 2 let', '2-5 let', '5-10 let', '10+ let'].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleChange('yearsInBusiness', option)}
                          className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all ${
                            formData.yearsInBusiness === option
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">Kde působíte? (oblast doručení)</label>
                    <input 
                      type="text" 
                      value={formData.serviceArea}
                      onChange={(e) => handleChange('serviceArea', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-gray-800 text-sm"
                      placeholder="Např. Celá ČR, Praha a Středočeský kraj"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Prodejní proces */}
            {step === 7 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Jak probíhá prodejní proces?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Jak dlouho se rozhodují a co je brzdí?</p>
                </div>
                <div className="space-y-4">
                  {/* Doba rozhodování */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jak dlouho se zákazník rozhoduje?</label>
                    <div className="space-y-2">
                      {[
                        { id: 'days', label: 'Dny (impulsivní nákup)' },
                        { id: 'weeks', label: 'Týdny (normální rozhodování)' },
                        { id: 'months', label: 'Měsíce (komplexní rozhodování)' },
                      ].map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                          <input 
                            type="radio" 
                            name="decisionTime"
                            value={opt.id}
                            checked={formData.decisionTime === opt.id}
                            onChange={(e) => handleChange('decisionTime', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Hlavní strach */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jaký je hlavní strach zákazníka?</label>
                    <div className="space-y-2">
                      {[
                        { id: 'price_roi', label: 'Cena a návratnost' },
                        { id: 'result_quality', label: 'Kvalita výsledku' },
                        { id: 'technical_issues', label: 'Technické problémy' },
                        { id: 'time_disruption', label: 'Doba realizace' },
                      ].map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                          <input 
                            type="radio" 
                            name="mainFear"
                            value={opt.id}
                            checked={formData.mainFear === opt.id}
                            onChange={(e) => handleChange('mainFear', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cenové nabídky */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Děláte cenové nabídky zdarma?</label>
                    <div className="space-y-2">
                      {[
                        { id: 'yes', label: 'Ano, zdarma' },
                        { id: 'no', label: 'Ne, jsou placené' },
                      ].map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                          <input 
                            type="radio" 
                            name="freeQuote"
                            value={opt.id}
                            checked={formData.freeQuote === opt.id}
                            onChange={(e) => handleChange('freeQuote', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Důvěra a garance */}
            {step === 8 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Jak budujete důvěru?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Garance, záruka, USP - co vám dává výhodu?</p>
                </div>
                <div className="space-y-4">
                  {/* USP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">V čem jste nejsilnější?</label>
                    <div className="space-y-2">
                      {[
                        { id: 'speed', label: 'Rychlost' },
                        { id: 'quality', label: 'Kvalita' },
                        { id: 'custom_solution', label: 'Vlastní design' },
                        { id: 'technology', label: 'Technologie' },
                        { id: 'references', label: 'Reference' },
                        { id: 'price', label: 'Cena' },
                      ].map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                          <input 
                            type="radio" 
                            name="usp"
                            value={opt.id}
                            checked={formData.usp === opt.id}
                            onChange={(e) => handleChange('usp', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Garance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Co garantujete?</label>
                    <div className="space-y-2">
                      {[
                        { id: 'output_match', label: 'Shodu s návrhem' },
                        { id: 'timeline', label: 'Termín' },
                        { id: 'fixed_price', label: 'Pevnou cenu' },
                        { id: 'satisfaction', label: 'Spokojenost' },
                        { id: 'none', label: 'Žádnou' },
                      ].map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                          <input 
                            type="radio" 
                            name="guarantee"
                            value={opt.id}
                            checked={formData.guarantee === opt.id}
                            onChange={(e) => handleChange('guarantee', e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Záruka */}
                  <div>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={formData.hasWarranty}
                        onChange={(e) => handleChange('hasWarranty', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-800">Máme záruku (např. 2 roky)</span>
                    </label>
                    {formData.hasWarranty && (
                      <textarea 
                        value={formData.warrantyDescription || ''}
                        onChange={(e) => handleChange('warrantyDescription', e.target.value)}
                        className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        placeholder="Např. 10 let na hliník, 2 roky na práci"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Strategie leadů */}
            {step === 9 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Kvalita nebo objem?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Co je pro vás priorita?</p>
                </div>
                <div className="space-y-4">
                  {[
                    { 
                      id: 'quality_over_quantity', 
                      title: 'Kvalita nad kvantitou',
                      desc: 'Méně poptávek od opravdových zájemců',
                    },
                    { 
                      id: 'volume_over_quality', 
                      title: 'Objem nad kvalitou',
                      desc: 'Více poptávek, i od zvědavců',
                    },
                  ].map((opt: any) => (
                    <label key={opt.id} className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg hover:border-violet-600 cursor-pointer transition-all">
                      <input 
                        type="radio" 
                        name="leadQualityVsVolume"
                        value={opt.id}
                        checked={formData.leadQualityVsVolume === opt.id}
                        onChange={(e) => handleChange('leadQualityVsVolume', e.target.value)}
                        className="w-4 h-4 mt-1 flex-shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{opt.title}</div>
                        <div className="text-gray-600 text-sm mt-1">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 10: Marketing strategie */}
            {step === 10 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Marketingová strategie</h2>
                  <p className="text-gray-600 mt-4 text-sm font-normal">Rozpočet, komunikace, Call-To-Action</p>
                </div>
                <div className="space-y-5">
                  {/* Rozpočet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kolik investujete měsíčně do marketingu?</label>
                    <select 
                      value={formData.currentMarketingBudget}
                      onChange={(e) => handleChange('currentMarketingBudget', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                    >
                      <option value="">Vyberte...</option>
                      <option value="nothing">Nic</option>
                      <option value="under_10k">Do 10 000 Kč</option>
                      <option value="10k_30k">10-30 000 Kč</option>
                      <option value="30k_100k">30-100 000 Kč</option>
                      <option value="over_100k">Nad 100 000 Kč</option>
                    </select>
                  </div>

                  {/* Cíl */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Měsíční prodeje</label>
                    <select 
                      value={formData.targetMonthlySales}
                      onChange={(e) => handleChange('targetMonthlySales', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                    >
                      <option value="">Vyberte...</option>
                      <option value="Do 5">Do 5</option>
                      <option value="5-15">5-15</option>
                      <option value="15-50">15-50</option>
                      <option value="Nad 50">Nad 50</option>
                    </select>
                  </div>

                  {/* Plánovaný rozpočet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kolik plánujete na reklamu měsíčně?</label>
                    <select 
                      value={formData.plannedMarketingBudget}
                      onChange={(e) => handleChange('plannedMarketingBudget', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                    >
                      <option value="">Vyberte...</option>
                      <option value="under_10k">Do 10 000 Kč</option>
                      <option value="10k_30k">10-30 000 Kč</option>
                      <option value="30k_50k">30-50 000 Kč</option>
                      <option value="50k_100k">50-100 000 Kč</option>
                      <option value="over_100k">Nad 100 000 Kč</option>
                    </select>
                  </div>

                  {/* Tone of Voice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jak komunikujete?</label>
                    <select 
                      value={formData.toneOfVoice}
                      onChange={(e) => handleChange('toneOfVoice', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                    >
                      <option value="professional">Profesionální</option>
                      <option value="friendly">Přátelský</option>
                      <option value="casual">Neformální</option>
                      <option value="luxury">Luxusní</option>
                      <option value="technical">Technický</option>
                    </select>
                  </div>
                  {/* CTA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Call-To-Action?</label>
                    <select 
                      value={formData.cta}
                      onChange={(e) => handleChange('cta', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                    >
                      <option value="request_consultation">Požádat o konzultaci</option>
                      <option value="book_meeting">Domluvit schůzku</option>
                      <option value="send_info">Poslat informace</option>
                      <option value="other">Jiné</option>
                    </select>
                    {formData.cta === 'other' && (
                      <input 
                        type="text"
                        value={formData.ctaOther || ''}
                        onChange={(e) => handleChange('ctaOther', e.target.value)}
                        className="w-full mt-2 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
                        placeholder="Jaký krok..."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 11: Dodatečné informace */}
            {step === 11 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-[2.5rem] font-black text-gray-900 leading-tight">Něco navíc?</h2>
                  <p className="text-gray-600 mt-4 text-base font-normal">Povedí nás to k lepší strategii. Dejte nám vědět, co je pro vás důležité.</p>
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">Dodatečné informace</label>
                  <textarea 
                    value={formData.additionalInfo || ''}
                    onChange={(e) => handleChange('additionalInfo', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-violet-600 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-gray-800 text-sm resize-none h-32"
                    placeholder="Např. Máme silnou značku v regionu, ale chceme expandovat. Nedávno jsme redesignovali web. Máme hodně pozitivních recenzí na Google..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex justify-between gap-4">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  <ArrowLeft size={16} /> Zpět
                </button>
              )}
              
              {step < TOTAL_STEPS ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all ml-auto"
                >
                  Pokračovat <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all ml-auto"
                >
                  <Check size={16} /> Vytvořit strategii
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save progress modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-fade-in-scale">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Uložit progres?</h3>
            <p className="text-gray-600 text-sm mb-6">Uloží se vám krok {step} z {TOTAL_STEPS}. Můžete se vrátit a pokračovat kdykoli.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Pokračovat
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Začít od znovu
              </button>
              <button
                onClick={handleSaveAndExit}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
              >
                Opustit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-fade-in-scale">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Přeskočit formulář?</h3>
            <p className="text-gray-600 text-sm mb-6">Bez těchto informací nebudeme schopní vytvořit kvalitní strategii. Opravdu chceš pokračovat bez nich?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Pokračovat dál
              </button>
              <button
                onClick={() => skipOnboarding()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Přeskočit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
