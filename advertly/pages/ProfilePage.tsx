import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  Camera, Upload, Trash2, MapPin, Briefcase, Globe, Award, DollarSign, 
  Lightbulb, Check, Edit3, X, Save, ChevronDown, Building2, Users, 
  Clock, ShieldCheck, Target, MessageSquare, Coins, TrendingUp, Zap,
  FileText, Phone, Mail, Calendar, Star, BadgeCheck, MoreVertical, PlusCircle
} from 'lucide-react';
import ButtonColorful from '../components/ButtonColorful';
import { Industry, MarketingProfile } from '../types';
import { aiService } from '../services/aiService';

const ProfilePage: React.FC = () => {
  const { 
    profiles, activeProfileId, updateProfile, showToast, setPage, 
    hasCompletedOnboarding, onboardingSkipped, settings, updateSettings,
    strategies, deleteProfile
  } = useApp();
  
  const profile = profiles.find(p => p.id === activeProfileId);
  const strategy = activeProfileId ? strategies[activeProfileId] : null;
  const needsOnboarding = !hasCompletedOnboarding && !onboardingSkipped;
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<MarketingProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Avatar state
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actions menu state
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Initialize edited profile when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setEditedProfile({ ...profile });
    }
  }, [isEditing, profile]);

  // Close avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarContainerRef.current && !avatarContainerRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get onboarding data from strategy
  const onboardingData = (strategy as any)?.onboardingData || {};

  // Helper functions for labels
  const getPriceRangeLabel = (range: string) => {
    const labels: Record<string, string> = {
      'under_50k': 'Do 50 000 Kč',
      '50k_200k': '50 - 200 tis. Kč',
      '200k_1m': '200 tis. - 1 mil. Kč',
      '1m_5m': '1 - 5 mil. Kč',
      'over_5m': 'Nad 5 mil. Kč',
    };
    return labels[range] || range || 'Neuvedeno';
  };

  const getCustomerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'b2c_private': 'B2C - Soukromé osoby',
      'b2b_business': 'B2B - Firmy',
      'both': 'B2C i B2B',
    };
    return labels[type] || type || 'Neuvedeno';
  };

  const getDecisionTimeLabel = (time: string) => {
    const labels: Record<string, string> = {
      'days': 'Dny',
      'weeks': 'Týdny',
      'months': 'Měsíce',
    };
    return labels[time] || time || 'Neuvedeno';
  };

  const getUspLabel = (usp: string) => {
    const labels: Record<string, string> = {
      'speed': 'Rychlost realizace',
      'quality': 'Kvalita zpracování',
      'custom_solution': 'Individuální řešení',
      'technology': 'Technologie',
      'references': 'Reference',
      'price': 'Cena',
    };
    return labels[usp] || usp || 'Neuvedeno';
  };

  const getGuaranteeLabel = (guarantee: string) => {
    const labels: Record<string, string> = {
      'output_match': 'Shoda s návrhem',
      'timeline': 'Termín realizace',
      'fixed_price': 'Pevná cena',
      'satisfaction': 'Spokojenost',
      'none': 'Žádná',
    };
    return labels[guarantee] || guarantee || 'Neuvedeno';
  };

  const getToneLabel = (tone: string) => {
    const labels: Record<string, string> = {
      'professional': 'Profesionální',
      'friendly': 'Přátelský',
      'relaxed': 'Uvolněný',
      'authoritative': 'Autoritativní',
      'luxury': 'Luxusní',
    };
    return labels[tone] || tone || 'Neuvedeno';
  };

  // Show placeholder if no profile and needs onboarding
  if (needsOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in font-sans">
        <div className="max-w-md">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Lightbulb size={40} className="text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">Spravujte svůj profil</h2>
          <p className="text-gray-600 font-medium mb-8">
            Vyplňte formulář a pak si budete moct plně upravit svůj profesionální profil.
          </p>
          <div className="space-y-3 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-3 justify-center">
              <Check size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Sdílení informací o firmě</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Check size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Editace portfolia</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Check size={18} className="text-emerald-500 flex-shrink-0" />
              <span>Správa údajů</span>
            </div>
          </div>
          <button
            onClick={() => setPage('resume-onboarding')}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-600/30"
          >
            Vyplnit formulář
          </button>
        </div>
      </div>
    );
  }

  // Show error if no profile exists
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 relative">
            <Building2 size={40} className="text-gray-300" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                <PlusCircle size={16} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil nenalezen</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
           Všechno začíná dobrým profilem. Vytvořte si profil vaší firmy a nastartujte marketing.
        </p>
        <ButtonColorful 
          variant="primary" 
          label="Vytvořit moji první strategii" 
          onClick={() => setPage('resume-onboarding')}
          className="h-12 md:h-12"
        />
      </div>
    );
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newUrl = reader.result as string;
        updateSettings({ ...settings, avatar: newUrl });
        showToast('success', 'Profilový obrázek aktualizován', 'Váš nový avatar byl úspěšně nahrán.');
        setAvatarMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    updateSettings({ ...settings, avatar: '' });
    showToast('info', 'Profilový obrázek odstraněn', 'Byl nastaven výchozí avatar.');
    setAvatarMenuOpen(false);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile || !activeProfileId) return;
    
    setIsSaving(true);
    try {
      // Create update payload without internal fields
      const updatePayload = {
        companyName: editedProfile.companyName,
        industry: editedProfile.industry,
        location: editedProfile.location,
        productDescription: editedProfile.productDescription,
        usp: editedProfile.usp,
        guarantee: editedProfile.guarantee,
        warranty: editedProfile.warranty,
        hasWarranty: editedProfile.hasWarranty,
        yearsOfExperience: editedProfile.yearsOfExperience,
        realizedProjects: editedProfile.realizedProjects,
        toneOfVoice: editedProfile.toneOfVoice,
        currentMarketingBudget: editedProfile.currentMarketingBudget,
        targetMonthlySales: editedProfile.targetMonthlySales,
        targetInvestAmount: editedProfile.targetInvestAmount,
        strategyPreference: editedProfile.strategyPreference,
        additionalInfo: editedProfile.additionalInfo,
      };
      
      console.log('[ProfilePage] Saving profile:', { activeProfileId, updatePayload });
      
      // Update local state first for immediate feedback
      updateProfile(editedProfile);
      
      // Call API to persist changes
      try {
        console.log('[ProfilePage] Calling API updateProfile...');
        const response = await aiService.updateProfile(activeProfileId, updatePayload);
        console.log('[ProfilePage] API response:', response);
      } catch (apiError) {
        console.error('[ProfilePage] API update failed:', apiError);
        throw apiError;
      }
      
      showToast('success', 'Profil uložen', 'Změny byly úspěšně uloženy.');
      setIsEditing(false);
    } catch (error) {
      console.error('[ProfilePage] Error saving profile:', error);
      showToast('error', 'Chyba při ukládání', error instanceof Error ? error.message : 'Nepodařilo se uložit změny. Zkuste to znovu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(null);
    setIsEditing(false);
  };

  const handleDeleteProfile = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteProfile = async () => {
    if (!activeProfileId || !profile) return;
    
    setIsDeleting(true);
    
    try {
      await deleteProfile(activeProfileId);
      setShowDeleteDialog(false);
      setPage('dashboard');
    } catch (error) {
      console.error('Error deleting profile:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteProfile = () => {
    setShowDeleteDialog(false);
    setIsDeleting(false);
  };

  const handleInputChange = (field: keyof MarketingProfile, value: any) => {
    if (!editedProfile) return;
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  // Edit Form Component
  const EditForm = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="text-primary" size={20} /> Základní informace
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Název firmy</label>
            <input
              type="text"
              value={editedProfile?.companyName || ''}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Obor podnikání</label>
            <select
              value={editedProfile?.industry || ''}
              onChange={(e) => handleInputChange('industry', e.target.value as Industry)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
            >
              {Object.values(Industry).map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Lokalita</label>
            <input
              type="text"
              value={editedProfile?.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tón komunikace</label>
            <select
              value={editedProfile?.toneOfVoice || 'professional'}
              onChange={(e) => handleInputChange('toneOfVoice', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
            >
              <option value="professional">Profesionální</option>
              <option value="friendly">Přátelský</option>
              <option value="relaxed">Uvolněný</option>
              <option value="authoritative">Autoritativní</option>
              <option value="luxury">Luxusní</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product/Service Description */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="text-primary" size={20} /> Popis služeb
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Popis produktu/služby</label>
            <textarea
              value={editedProfile?.productDescription || ''}
              onChange={(e) => handleInputChange('productDescription', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">USP (Konkurenční výhoda)</label>
              <input
                type="text"
                value={editedProfile?.usp || ''}
                onChange={(e) => handleInputChange('usp', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Garance</label>
              <input
                type="text"
                value={editedProfile?.guarantee || ''}
                onChange={(e) => handleInputChange('guarantee', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Firemní kultura</label>
            <input
              type="text"
              value={editedProfile?.culture || ''}
              onChange={(e) => handleInputChange('culture', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Např. Profesionální a důvěryhodná"
            />
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Award className="text-primary" size={20} /> Zkušenosti
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Let na trhu</label>
            <input
              type="number"
              min="0"
              value={editedProfile?.yearsOfExperience || 0}
              onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Počet realizovaných projektů</label>
            <input
              type="number"
              min="0"
              value={editedProfile?.realizedProjects || 0}
              onChange={(e) => handleInputChange('realizedProjects', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Budget & Goals */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="text-primary" size={20} /> Rozpočet a cíle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Současný marketingový rozpočet (Kč/měsíc)</label>
            <input
              type="number"
              min="0"
              value={editedProfile?.currentMarketingBudget || 0}
              onChange={(e) => handleInputChange('currentMarketingBudget', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Cílový měsíční obrat (Kč)</label>
            <input
              type="number"
              min="0"
              value={editedProfile?.targetMonthlySales || 0}
              onChange={(e) => handleInputChange('targetMonthlySales', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Plánovaná investice do reklamy (Kč)</label>
            <input
              type="number"
              min="0"
              value={editedProfile?.targetInvestAmount || 0}
              onChange={(e) => handleInputChange('targetInvestAmount', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Preference strategie</label>
            <select
              value={editedProfile?.strategyPreference || 'quality_leads'}
              onChange={(e) => handleInputChange('strategyPreference', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
            >
              <option value="quality_leads">Kvalita leadů</option>
              <option value="quantity_scale">Kvantita a škálování</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="text-primary" size={20} /> Další informace
        </h3>
        <textarea
          value={editedProfile?.additionalInfo || ''}
          onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
          rows={4}
          placeholder="Jakékoliv další důležité informace o vaší firmě..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={handleCancelEdit}
          disabled={isSaving}
          className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Zrušit
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ukládám...
            </>
          ) : (
            <>
              <Save size={18} />
              Uložit změny
            </>
          )}
        </button>
      </div>
    </div>
  );

  // View Mode Component
  const ViewMode = () => (
    <>
      {/* Header / Banner Area with Overlap */}
      <div className="relative mb-20 md:mb-28"> 
        {/* Banner Background */}
        <div className="h-40 md:h-64 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 relative overflow-visible shadow-lg shadow-indigo-200/50">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          </div>

{/* Actions Menu */}
            <div className="absolute top-4 right-4 z-20" ref={actionsMenuRef}>
              <button
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <MoreVertical size={20} />
              </button>

              {actionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden py-1">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setActionsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Edit3 size={16} className="text-gray-400" />
                    Upravit profil
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteProfile();
                      setActionsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
                  >
                    <Trash2 size={16} />
                    Smazat profil
                  </button>
                </div>
              )}
          </div>

          {/* Content Container inside Banner */}
          <div className="absolute inset-0 px-4 md:px-10 pb-6 md:pb-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 justify-center md:justify-start">
            
            {/* Profile Info Text */}
            <div className="flex-1 text-center md:text-left z-10 min-w-0 pt-8 md:pt-0">
              <h1 className="text-xl md:text-4xl font-bold text-gray-900 md:text-white md:drop-shadow-sm truncate pr-0 md:pr-4">{profile.companyName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-gray-500 md:text-indigo-100 text-xs md:text-sm font-medium mt-1 md:mt-2">
                <span className="flex items-center gap-1.5"><Briefcase size={14} className="md:w-4 md:h-4" /> {profile.industry}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="md:w-4 md:h-4" /> {profile.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4 md:pt-0">
        
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* About Company */}
          <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <Globe className="text-gray-400" size={20} /> O společnosti
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Popis produktu/služby</label>
                <p className="text-gray-800 leading-relaxed text-sm md:text-base">{profile.productDescription || onboardingData.serviceDescription || 'Neuvedeno'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">USP (Konkurenční výhoda)</label>
                  <p className="text-gray-800 text-sm font-medium">{profile.usp || getUspLabel(onboardingData.usp)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Garance</label>
                  <p className="text-gray-800 text-sm font-medium">{profile.guarantee || getGuaranteeLabel(onboardingData.guarantee)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <Award className="text-gray-400" size={20} /> Zkušenosti a kultura
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{profile.yearsOfExperience || onboardingData.yearsInBusiness || 0}</div>
                <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Let na trhu</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{profile.realizedProjects || onboardingData.completedProjects || 0}+</div>
                <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Projektů</div>
              </div>
              <div className="col-span-2 p-4 bg-gray-50 rounded-xl flex flex-col justify-center">
                <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-1">Tón komunikace</div>
                <div className="font-bold text-gray-900 text-base md:text-lg capitalize mb-1">{getToneLabel(profile.toneOfVoice || onboardingData.toneOfVoice)}</div>
                <div className="text-xs text-gray-400 truncate">{profile.culture || 'Profesionální a důvěryhodná'}</div>
              </div>
            </div>
          </div>

          {/* Onboarding Data Details */}
          {onboardingData && Object.keys(onboardingData).length > 0 && (
            <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <Target className="text-gray-400" size={20} /> Detaily z onboardingu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Typ zákazníků</div>
                    <div className="font-bold text-gray-900 text-sm">{getCustomerTypeLabel(onboardingData.customerType)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Coins size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Cenové rozmezí</div>
                    <div className="font-bold text-gray-900 text-sm">{getPriceRangeLabel(onboardingData.priceRange)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Oblast působení</div>
                    <div className="font-bold text-gray-900 text-sm">{onboardingData.serviceArea || 'Neuvedeno'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Doba rozhodování</div>
                    <div className="font-bold text-gray-900 text-sm">{getDecisionTimeLabel(onboardingData.decisionTime)}</div>
                  </div>
                </div>
                {onboardingData.hasWarranty && onboardingData.warrantyDescription && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl md:col-span-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Záruka</div>
                      <div className="font-bold text-gray-900 text-sm">{onboardingData.warrantyDescription}</div>
                    </div>
                  </div>
                )}
                {onboardingData.freeQuote === 'yes' && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BadgeCheck size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Nabídka zdarma</div>
                      <div className="font-bold text-gray-900 text-sm">Ano, poskytujeme</div>
                    </div>
                  </div>
                )}
              </div>
              
              {onboardingData.mainFear && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-xs text-red-600 font-bold uppercase mb-1">Hlavní obava zákazníků</div>
                  <p className="text-gray-800 text-sm">{onboardingData.mainFear}</p>
                </div>
              )}

              {onboardingData.firstStep && (
                <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="text-xs text-primary font-bold uppercase mb-1">První krok spolupráce</div>
                  <p className="text-gray-800 text-sm">{onboardingData.firstStep}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-200 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <DollarSign className="text-gray-400" size={20} /> Cíle a rozpočet
            </h3>
            <div className="space-y-4 md:space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Současný rozpočet</span>
                <span className="font-bold text-gray-900 text-base md:text-lg">
                  {(profile.currentMarketingBudget || onboardingData.currentMarketingBudget || 0).toLocaleString()} Kč
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Cíl. obrat</span>
                <span className="font-bold text-gray-900 text-base md:text-lg">
                  {(onboardingData.targetMonthlySales || profile.targetMonthlySales * 15000 || 0).toLocaleString()} Kč
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-medium">Plánovaná investice</span>
                <span className="font-bold text-gray-900 text-base md:text-lg">
                  {(onboardingData.plannedMarketingBudget || profile.targetInvestAmount || 0).toLocaleString()} Kč
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 font-medium">Strategie</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">
                  {profile.strategyPreference === 'quality_leads' || onboardingData.leadQualityVsVolume === 'quality_over_quantity' 
                    ? 'Kvalita' 
                    : 'Kvantita'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Rychlé akce</h4>
            <div className="space-y-2">
              <button 
                onClick={() => setPage('strategy')}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-violet-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Target size={16} className="text-primary group-hover:text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Zobrazit strategii</span>
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-violet-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Edit3 size={16} className="text-primary group-hover:text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Upravit profil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isEditing ? (
        <div className="max-w-4xl mx-auto">
          {/* Edit Mode Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Upravit profil</h1>
              <p className="text-gray-500 mt-1">Upravte informace o vaší firmě</p>
            </div>
            <button
              onClick={handleCancelEdit}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <EditForm />
        </div>
      ) : (
        <ViewMode />
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
            isDeleting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Smazat profil?</h2>
                <p className="text-red-100 text-sm mt-1">Tato akce je nevratná</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-white">
              <p className="text-slate-600 mb-6">
                Opravdu chcete smazat profil <span className="font-semibold text-slate-900">"{profile?.companyName}"</span>? 
                <br /><br />
                Budou smazány také:
              </p>
              <ul className="space-y-2 mb-6 ml-4">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  Všechny přidružené strategie
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  Všechny údaje o kampani
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  Všechny analytické údaje
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteProfile}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zrušit
                </button>
                <button
                  onClick={confirmDeleteProfile}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Mazání...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Smazat
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Deletion Animation (when isDeleting is true) */}
            {isDeleting && (
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent pointer-events-none animate-pulse"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
