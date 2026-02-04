
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Industry, MarketingProfile } from '../types';
import { 
  ArrowRight, ArrowLeft, Check, Loader2, 
  ShoppingBag, Laptop, BarChart3, Users, HardHat, GraduationCap, 
  HeartPulse, LayoutGrid, Sparkles, Target, Zap, ChevronDown, Briefcase, X
} from 'lucide-react';

const StrategyWizard: React.FC = () => {
  const { saveProfile, isAnalyzing, analysisStep, setPage, profiles, activeProfileId } = useApp();
  const [step, setStep] = useState(1);
  const [customIndustry, setCustomIndustry] = useState('');
  const [customPricing, setCustomPricing] = useState('');
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any>({
    id: `profile-${Date.now()}`,
    createdAt: new Date(),
    companyName: '',
    industry: Industry.Services,
    realizedProjects: 0,
    yearsOfExperience: 1,
    location: '',
    productDescription: '',
    pricingModel: 'free_quote',
    warranty: '',
    guarantee: '',
    usp: '',
    targetInvestAmount: 15000,
    strategyPreference: 'quality_leads',
    toneOfVoice: 'professional',
    culture: 'Profesionální a důvěryhodná',
  });

  // Pre-fill form with active profile data if available
  useEffect(() => {
    if (activeProfileId && profiles.length > 0) {
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        setFormData((prev: any) => ({
          ...prev,
          ...activeProfile,
          // Keep new ID and Date, or maybe we want to keep them? 
          // If we want to create a NEW strategy based on OLD profile, new ID is good.
          id: `profile-${Date.now()}`,
          createdAt: new Date(),
        }));
        
        // Handle custom industry if needed
        if (activeProfile.industry && !Object.values(Industry).includes(activeProfile.industry as Industry)) {
           // If industry is not in enum, it might be custom or mapped differently. 
           // For simplicity let's assume it matches or user can fix it.
        }
      }
    }
  }, [activeProfileId, profiles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(event.target as Node)) {
        setIsIndustryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const selectIndustry = (industry: string) => {
    setFormData((prev: any) => ({ ...prev, industry }));
    setIsIndustryOpen(false);
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    const finalProfile = {
        ...formData,
        industry: formData.industry === 'Other' ? customIndustry : formData.industry,
        pricingModel: formData.pricingModel === 'other' ? customPricing : formData.pricingModel
    };
    await saveProfile(finalProfile);
  };

  // Optimized inputClass
  const inputClass = "w-full px-4 py-2.5 md:px-4 md:py-3 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm font-medium";
  const labelClass = "block text-xs font-bold text-gray-900 mb-1.5";

  if (isAnalyzing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 space-y-8 text-center bg-white fixed inset-0 z-[60]">
        <div className="w-24 h-24 border-4 border-violet-100 border-t-primary rounded-full animate-spin"></div>
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900">{analysisStep}</h2>
            <p className="text-gray-400 font-medium">Naše AI právě konstruuje váš budoucí úspěch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col lg:flex-row overflow-hidden h-screen w-full">
      {/* Sidebar Progress - Full height on desktop */}
      <div className="lg:w-[350px] xl:w-[420px] bg-indigo-950 p-8 md:p-12 text-white flex flex-col justify-between shrink-0 h-auto lg:h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="relative z-10">
              <button 
                onClick={() => setPage('dashboard')}
                className="mb-12 flex items-center gap-2 text-indigo-300 hover:text-white transition-colors text-sm font-bold group"
              >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Zrušit a vrátit se
              </button>
              <h1 className="text-2xl md:text-4xl font-black mb-6 leading-tight">Stavíme vaši marketingovou základnu.</h1>
              <p className="text-indigo-200/70 text-sm md:text-lg font-medium leading-relaxed">AI potřebuje vědět, co vás dělá výjimečnými. Nepospíchejte, přemýšlejte nad odpověďmi.</p>
          </div>

          <div className="space-y-6 mt-12 lg:mt-0 relative z-10">
              {[1, 2, 3].map(s => (
                  <div key={s} className={`flex items-center gap-5 transition-all duration-500 ${step === s ? 'opacity-100 translate-x-2' : 'opacity-40'}`}>
                      <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${step === s ? 'border-white bg-white text-indigo-950 shadow-lg shadow-white/10' : 'border-white/20'}`}>
                        {step > s ? <Check size={18} strokeWidth={3} /> : s}
                      </div>
                      <div className="flex flex-col">
                          <span className="font-black uppercase text-[10px] tracking-[0.25em] text-indigo-400 mb-0.5">Krok {s}</span>
                          <span className="font-bold text-sm md:text-base">{s === 1 ? 'Kdo jste?' : s === 2 ? 'Váš produkt' : 'Cíle a USP'}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Form Content - Full height internal scroll */}
      <div className="flex-1 h-full overflow-y-auto bg-[#fafafa] flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20">
            <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-1">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Základní informace</h2>
                            <p className="text-sm text-gray-500 mt-0.5 font-medium">Řekněte nám něco o své firmě.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Název firmy</label>
                                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="Např. Truhlářství Novák" />
                            </div>
                            
                            <div ref={industryRef} className="relative">
                                <label className={labelClass}>Obor podnikání</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsIndustryOpen(!isIndustryOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none outline-none transition-all duration-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={18} className="text-gray-400" />
                                        <span className="font-semibold text-sm">{formData.industry === 'Other' ? 'Ostatní' : formData.industry}</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isIndustryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`
                                    absolute left-0 bottom-[calc(100%+8px)] w-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 origin-bottom transition-all duration-200
                                    ${isIndustryOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[10px] scale-95 pointer-events-none'}
                                `}>
                                    <div className="p-2 space-y-0.5 max-h-[350px] overflow-y-auto no-scrollbar">
                                        {[...Object.values(Industry), 'Other'].map((i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => selectIndustry(i)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all
                                                    ${formData.industry === i ? 'bg-violet-50 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}
                                                `}
                                            >
                                                <span className={formData.industry === i ? 'font-semibold text-sm' : 'font-medium text-sm'}>{i === 'Other' ? 'Ostatní...' : i}</span>
                                                {formData.industry === i && <Check size={18} strokeWidth={3} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {formData.industry === 'Other' && (
                                    <input 
                                        type="text" 
                                        value={customIndustry} 
                                        onChange={(e) => setCustomIndustry(e.target.value)} 
                                        className={`${inputClass} mt-4 animate-in slide-in-from-top-2 duration-300`} 
                                        placeholder="Vypište váš obor..." 
                                    />
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button onClick={nextStep} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 transition-all active:scale-[0.98]">
                                Pokračovat <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-1">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Co nabízíte</h2>
                            <p className="text-sm text-gray-500 mt-0.5 font-medium">Popište hodnotu, kterou přinášíte.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Detailní popis vašeho produktu / služby</label>
                                <p className="text-xs text-gray-400 mb-2 font-medium">Zkuste popsat, jaký problém zákazníkovi řešíte (max 300 znaků).</p>
                                <textarea name="productDescription" value={formData.productDescription} onChange={handleChange} className={`${inputClass} h-32 resize-none`} placeholder="Např. Nestavíme jen domy, vytváříme bezpečný domov s důrazem na energetickou úsporu..." />
                            </div>
                            <div>
                                <label className={labelClass}>Cenový model</label>
                                <div className="relative">
                                    <select name="pricingModel" value={formData.pricingModel} onChange={handleChange} className={`${inputClass} appearance-none pr-10 bg-white cursor-pointer font-bold`}>
                                        <option value="free_quote">Cena na poptávku</option>
                                        <option value="upfront_price">Pevná cena</option>
                                        <option value="other">Ostatní...</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                </div>
                                {formData.pricingModel === 'other' && (
                                    <input type="text" value={customPricing} onChange={(e) => setCustomPricing(e.target.value)} className={`${inputClass} mt-4 animate-in slide-in-from-top-2 duration-300`} placeholder="Jak fungují vaše ceny?" />
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={prevStep} className="flex-1 border-2 border-gray-100 py-3 rounded-xl font-bold text-gray-600 text-sm hover:bg-gray-50 transition-all active:scale-[0.98] bg-white">Zpět</button>
                            <button onClick={nextStep} className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-sm md:text-base shadow-xl shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 transition-all active:scale-[0.98]">Pokračovat</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-1">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Vaše výjimečnost</h2>
                            <p className="text-sm text-gray-500 mt-0.5 font-medium">Poslední krok k vaší nové strategii.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Unikátní prodejní argument (USP)</label>
                                <p className="text-xs text-gray-400 mb-2 font-medium">V čem jste objektivně lepší než ostatní?</p>
                                <textarea name="usp" value={formData.usp} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Např. Jako jediní v regionu používáme technologii X, která zkracuje čas dodání o 40 %." />
                            </div>
                            <div>
                                <label className={labelClass}>Hlavní garance pro zákazníka</label>
                                <input type="text" name="guarantee" value={formData.guarantee} onChange={handleChange} className={inputClass} placeholder="Např. Hotovo do 30 dnů nebo sleva 10 %" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={prevStep} className="flex-1 border-2 border-gray-100 py-3 rounded-xl font-bold text-gray-600 text-sm hover:bg-gray-50 transition-all active:scale-[0.98] bg-white">Zpět</button>
                            <button onClick={handleSubmit} className="flex-[2] bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:scale-95">
                                <Sparkles size={16} className="animate-pulse" /> Generovat strategii
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyWizard;
