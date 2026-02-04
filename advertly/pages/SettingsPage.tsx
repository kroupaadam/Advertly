
import React, { useState, useEffect, useRef } from 'react';
import {
  User, Lock, Bell, CreditCard, Link as LinkIcon, 
  ShieldCheck, Mail, Check, AlertCircle, Download, RefreshCw, ChevronDown, Loader2,
  ExternalLink, Trash2, Power, Info, Eye, EyeOff, Search, Globe, Clock, Receipt, Building2, Zap,
  Calendar, MoreVertical, Pencil, Plus, Sparkles, FileText, ExternalLink as OpenIcon, X, Upload, Megaphone, TrendingUp
} from 'lucide-react';
import Checkbox from '../components/Checkbox';
import PhonePrefixSelector from '../components/PhonePrefixSelector';
import { useApp } from '../AppContext';
import { UserSettings } from '../types';

type SettingsTab = 'general' | 'security' | 'notifications' | 'billing' | 'integrations';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  // Custom dropdown states
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  const languageRef = useRef<HTMLDivElement>(null);
  const timezoneRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize local form state from context settings
  const [generalForm, setGeneralForm] = useState({
    fullName: settings.fullName,
    email: settings.email,
    phone: settings.phone,
    phonePrefix: settings.phonePrefix || '+420',
    language: settings.language,
    timezone: settings.timezone,
    avatar: settings.avatar || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState(settings.notifications);
  const [integrations, setIntegrations] = useState(settings.integrations);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (timezoneRef.current && !timezoneRef.current.contains(event.target as Node)) {
        setIsTimezoneOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [languageRef, timezoneRef, avatarRef]);

  // Sync local state if context settings change externally
  useEffect(() => {
    setGeneralForm({
      fullName: settings.fullName,
      email: settings.email,
      phone: settings.phone,
      phonePrefix: settings.phonePrefix || '+420',
      language: settings.language,
      timezone: settings.timezone,
      avatar: settings.avatar || ''
    });
    setNotifications(settings.notifications);
    setIntegrations(settings.integrations);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Handle password change for security tab
      if (activeTab === 'security') {
        // Only process if trying to change password (at least one field is filled)
        const hasPasswordFields = passwordForm.current || passwordForm.new || passwordForm.confirm;
        
        if (hasPasswordFields) {
          // Validate all password fields are filled
          if (!passwordForm.current) {
            showToast('error', 'Chyba', 'Prosím zadejte současné heslo');
            setIsSaving(false);
            return;
          }
          if (!passwordForm.new) {
            showToast('error', 'Chyba', 'Prosím zadejte nové heslo');
            setIsSaving(false);
            return;
          }
          if (!passwordForm.confirm) {
            showToast('error', 'Chyba', 'Prosím potvrďte nové heslo');
            setIsSaving(false);
            return;
          }
          if (passwordForm.new !== passwordForm.confirm) {
            showToast('error', 'Chyba', 'Nová hesla se neshodují');
            setIsSaving(false);
            return;
          }

          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              currentPassword: passwordForm.current,
              newPassword: passwordForm.new,
              confirmPassword: passwordForm.confirm
            })
          });

          const data = await response.json();

          if (!response.ok) {
            showToast('error', 'Chyba', data.message || 'Nepodařilo se změnit heslo');
            setIsSaving(false);
            return;
          }

          showToast('success', 'Heslo změněno', 'Vaše heslo bylo úspěšně změněno');
          setPasswordForm({ current: '', new: '', confirm: '' });
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }
      } else {
        // Handle general settings save
        const newSettings: UserSettings = {
          ...generalForm,
          notifications: notifications,
          integrations: integrations
        };

        updateSettings(newSettings);
        showToast('success', 'Změny uloženy', 'Vaše nastavení bylo úspěšně aktualizováno a uloženo.');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('error', 'Chyba', 'Nepodařilo se uložit změny');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Soubor příliš velký', 'Maximální velikost je 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Neplatný formát', 'Prosím vyberte obrázek (JPG, PNG, atd.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setGeneralForm({ ...generalForm, avatar: base64 });
      showToast('success', 'Avatar načten', 'Obrázek je připraven k uložení.');
    };
    reader.readAsDataURL(file);
  };

  const handleToggleIntegration = async (id: keyof typeof integrations, name: string) => {
    const isCurrentlyConnected = integrations[id];
    
    if (!isCurrentlyConnected) {
        setConnectingId(id as string);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newIntegrations = { ...integrations, [id]: true };
        setIntegrations(newIntegrations);
        
        // Update global state immediately for seamless experience
        updateSettings({ ...settings, integrations: newIntegrations });
        
        showToast('success', 'Platforma propojena', `${name} byl úspěšně autorizován.`);
        addNotification({
            title: `Propojeno: ${name}`,
            description: `Reklamní účet ${name} je nyní připraven pro generování kampaní.`,
            type: 'success'
        });
        setConnectingId(null);
    } else {
        const newIntegrations = { ...integrations, [id]: false };
        setIntegrations(newIntegrations);
        updateSettings({ ...settings, integrations: newIntegrations });
        showToast('info', 'Platforma odpojena', `Propojení s ${name} bylo ukončeno.`);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm hover:border-primary/40 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 placeholder:text-gray-400";
  const labelClasses = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2";

  const renderTabs = () => {
    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
      { id: 'general', label: 'Můj profil', icon: User },
      { id: 'security', label: 'Heslo a zabezpečení', icon: Lock },
      { id: 'notifications', label: 'Notifikace', icon: Bell },
      { id: 'billing', label: 'Předplatné', icon: CreditCard },
      { id: 'integrations', label: 'Integrace', icon: LinkIcon },
    ];

    return (
      <div className="mb-10 overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg outline-none focus:outline-none focus:ring-0 transition-all
                ${activeTab === tab.id
                  ? 'bg-violet-50 text-primary shadow-sm ring-1 ring-primary/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const prefixes = [
    { code: '+420', country: 'Česká republika', countryCode: 'CZ' },
    { code: '+421', country: 'Slovensko', countryCode: 'SK' },
    { code: '+43', country: 'Rakousko', countryCode: 'AT' },
    { code: '+49', country: 'Německo', countryCode: 'DE' },
    { code: '+33', country: 'Francie', countryCode: 'FR' },
    { code: '+39', country: 'Itálie', countryCode: 'IT' },
    { code: '+44', country: 'Velká Británie', countryCode: 'GB' },
    { code: '+48', country: 'Polsko', countryCode: 'PL' },
    { code: '+36', country: 'Maďarsko', countryCode: 'HU' },
  ];

  const languages = [
    { code: 'cs', name: 'Čeština' },
    { code: 'en', name: 'English' },
  ];

  const timezones = [
    { code: 'Europe/Prague', name: 'Europe/Prague (GMT+1)' },
    { code: 'Europe/London', name: 'Europe/London (GMT+0)' },
  ];

  const currentLanguage = languages.find(l => l.code === generalForm.language) || languages[0];
  const currentTimezone = timezones.find(t => t.code === generalForm.timezone) || timezones[0];

  const renderSaveButton = () => (
    <div className="mt-12 flex justify-start">
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className={`
          flex items-center justify-center gap-2.5 px-10 py-[15px] rounded-xl text-sm font-bold text-white transition-all duration-300 active:scale-[0.98] shadow-lg
          ${isSaving 
            ? 'bg-primary opacity-70 cursor-wait' 
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-600/30 shadow-primary/20'}
        `}
      >
        {isSaving && <Loader2 size={18} className="animate-spin" />}
        {isSaving ? 'Ukládám...' : 'Uložit změny'}
      </button>
    </div>
  );

  const renderGeneral = () => (
    <div className="space-y-6">
      {/* Profilová fotka section */}
      <div className="py-2">
        
        {/* Hidden file input - must be outside menu to persist */}
        <input 
          type="file"
          id="avatar-input"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="sr-only"
        />
        
        <div className="flex items-center gap-4 relative" ref={avatarRef}>
          <div 
            className="relative flex-shrink-0 cursor-pointer group"
            onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 border-4 border-violet-100 overflow-hidden flex items-center justify-center relative transition-transform">
              {generalForm.avatar ? (
                <img src={generalForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-white relative z-10">
                  <User size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className={`
              absolute left-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 ring-1 ring-black/5 origin-top transition-all duration-200
              ${isAvatarMenuOpen ? 'opacity-100 translate-y-0 scale-100 visible' : 'opacity-0 -translate-y-[10px] scale-95 invisible'}
            `}>
              <div className="p-1 space-y-0.5">
                  <button 
                    type="button"
                    onClick={() => {
                      const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
                      fileInput?.click();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-normal text-gray-700 hover:bg-violet-50 hover:text-primary rounded transition-colors"
                  >
                    <Upload size={14} />
                    Nahrát fotku
                  </button>
                  {generalForm.avatar && (
                    <button 
                      type="button"
                      onClick={() => {
                        setGeneralForm({ ...generalForm, avatar: '' });
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-normal text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                      Odebrat
                    </button>
                  )}
                </div>
              </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Profilová fotka</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Maximální velikost souboru: 5 MB</p>
          </div>
        </div>
      </div>

      <div className=" pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Osobní údaje</h2>
        <p className="text-xs text-gray-500 mb-6 font-medium">Spravujte své základní informace a kontaktní údaje.</p>
        
        <div className="space-y-6 mb-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Jméno a příjmení</label>
                  <input 
                    type="text" 
                    value={generalForm.fullName}
                    onChange={(e) => setGeneralForm({...generalForm, fullName: e.target.value})}
                    className={inputClasses}
                    placeholder="Např. Jan Novák"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Telefon</label>
                  <div className="flex gap-2">
                      <div className="w-36 flex-shrink-0">
                          <PhonePrefixSelector 
                            value={generalForm.phonePrefix}
                            onChange={(value) => setGeneralForm({...generalForm, phonePrefix: value})}
                            prefixes={prefixes}
                          />
                      </div>
                      <input 
                        type="tel" 
                        value={generalForm.phone}
                        disabled
                        className={`${inputClasses} opacity-70 cursor-not-allowed`}
                        placeholder="605 404 924"
                      />
                  </div>
                </div>
             </div>
             <div>
                <label className={labelClasses}>Email</label>
                <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="email" 
                        value={generalForm.email}
                        onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})}
                        className={`${inputClasses} pl-12`}
                        placeholder="vas@email.cz"
                    />
                </div>
             </div>
        </div>

        <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div ref={languageRef} className="relative">
              <label className={labelClasses}>Jazyk aplikace</label>
              <button 
                type="button"
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 focus:outline-none outline-none transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <span className="font-medium">{currentLanguage.name}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`
                absolute left-0 bottom-[calc(100%+8px)] w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-50 origin-bottom transition-all duration-200
                ${isLanguageOpen ? 'opacity-100 translate-y-0 scale-100 visible' : 'opacity-0 translate-y-[10px] scale-95 invisible'}
              `}>
                  <div className="p-2 space-y-0.5">
                      {languages.map((l) => (
                          <button
                              key={l.code}
                              type="button"
                              onClick={() => {
                                  setGeneralForm({...generalForm, language: l.code});
                                  setIsLanguageOpen(false);
                              }}
                              className={`
                                w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm
                                ${generalForm.language === l.code ? 'bg-violet-50 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}
                              `}
                          >
                              <span>{l.name}</span>
                              {generalForm.language === l.code && <Check size={14} strokeWidth={3} />}
                          </button>
                      ))}
                  </div>
              </div>
           </div>
        </div>
      </div>
      {renderSaveButton()}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <div className="py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-0.5">Změna hesla</h2>
        <p className="text-xs text-gray-500 mb-6 font-small">Pro maximální bezpečnost doporučujeme používat silné heslo.</p>
        
        <div className="space-y-5 max-w-md">
            <div>
                <label className={labelClasses}>Současné heslo</label>
                <div className="relative">
                    <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} className={`${inputClasses} pr-12`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div>
                <label className={labelClasses}>Nové heslo</label>
                <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} className={`${inputClasses} pr-12`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
            <div>
                <label className={labelClasses}>Potvrzení hesla</label>
                <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} className={`${inputClasses} pr-12`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
        </div>
      </div>
      {renderSaveButton()}
    </div>
  );

  const renderNotifications = () => (
    <div className="overflow-hidden">
       <div className="py-3">
          <h2 className="text-base font-semibold text-gray-900 mb-0.5">Předvolby notifikací</h2>
          <p className="text-xs text-gray-500 font-normal">Vyberte, jak a kdy vás máme kontaktovat.</p>
       </div>
       
       <div className="divide-y divide-gray-200 mt-4">
          {[
              { id: 'new_leads', label: 'Nové leady', desc: 'Upozornění ihned, když získáte nového potenciálního klienta.', icon: User },
              { id: 'new_campaigns', label: 'Nová kampaň', desc: 'Upozornění když jsou vaše nové kampaně připraveny nebo nasazeny.', icon: Megaphone },
              { id: 'budget_alerts', label: 'Čerpání rozpočtu', desc: 'Varování při dosažení 80% a 100% rozpočtu kampaně.', icon: CreditCard },
              { id: 'performance_alerts', label: 'Výkon kampaně', desc: 'Upozornění na změny v klíčových metrikách a výkonnosti.', icon: TrendingUp },
          ].map((item) => (
             <div key={item.id} className="py-3 flex items-start gap-3">
                <div className="bg-gray-100 p-1.5 rounded-lg text-gray-500 flex-shrink-0"><item.icon size={16} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                        <label htmlFor={item.id} className="font-medium text-gray-900 cursor-pointer text-xs">{item.label}</label>
                        <button 
                            id={item.id}
                            onClick={() => setNotifications(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof notifications]}))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ${notifications[item.id as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ${notifications[item.id as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 font-normal leading-relaxed mt-0.5">{item.desc}</p>
                </div>
             </div>
          ))}
       </div>
       {renderSaveButton()}
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-lg font-bold text-gray-900">Předplatné a platby</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Správa vašeho tarifu a platebních metod.</p>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                Spravovat platby <OpenIcon size={12} />
            </button>
        </div>
        
        <div className="p-6 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase">Aktuální plán</span>
                <span className="px-2.5 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded uppercase border border-violet-700">Premium</span>
            </div>
            <div className="text-3xl font-black text-gray-900">947 Kč <span className="text-sm font-medium text-gray-500">/ měsíčně</span></div>
            <p className="text-xs text-gray-600 font-medium">Máte přístup ke všem prémiovým funkcím a podporu 24/7.</p>
            <div className="pt-2 flex gap-3">
                <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    Změnit plán
                </button>
                <button className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors">
                    Faktura
                </button>
            </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Další dostupné plány</h3>
            <p className="text-xs text-gray-500 mb-4">Všechny plány jsou stejné, máte přístup k plné funkcionalitě aplikace.</p>
        </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-3">
         {[
            { name: 'Google Ads', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg', id: 'google' },
            { name: 'Facebook Ads', logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg', id: 'facebook' },
            { name: 'LinkedIn Ads', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg', id: 'linkedin' },
            { name: 'TikTok Ads', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg', id: 'tiktok' },
         ].map((platform) => {
             const isConnected = integrations[platform.id as keyof typeof integrations];
             const isLoading = connectingId === platform.id;
             return (
                 <div key={platform.id} className="py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center p-2 border border-gray-100 bg-white shadow-sm">
                            <img src={platform.logo} alt={platform.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{platform.name}</h3>
                            <p className={`text-xs font-semibold flex items-center gap-1.5 mt-0.5 ${isConnected ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {isConnected ? 'Aktivní propojení' : 'Čeká na propojení'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleToggleIntegration(platform.id as any, platform.name)}
                        className={`py-1.5 px-3 text-xs font-semibold ${isConnected ? 'text-gray-400 hover:text-rose-600' : 'text-gray-900 hover:text-primary'}`}
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : isConnected ? 'Odpojit' : 'Propojit účet'}
                    </button>
                 </div>
             );
         })}
    </div>
  );

  return (
    <div className="flex flex-col font-sans max-w-5xl mx-auto">
      {renderTabs()}
      <div className="w-full">
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'billing' && renderBilling()}
        {activeTab === 'integrations' && renderIntegrations()}
      </div>
    </div>
  );
};

export default SettingsPage;
