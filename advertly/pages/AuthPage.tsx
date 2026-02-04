
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck, Phone, AlertCircle, Check } from 'lucide-react';
import PhonePrefixSelector from '../components/PhonePrefixSelector';
import Checkbox from '../components/Checkbox';
import { aiService } from '../services/aiService';

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  phonePrefix?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  phone: string;
  phonePrefix: string;
  password: string;
  confirmPassword: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

const PHONE_PREFIXES = [
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

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const AuthPage: React.FC = () => {
  const { login, showToast } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredUserPhone, setRegisteredUserPhone] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    phone: '',
    phonePrefix: '+420',
    password: '',
    confirmPassword: '',
  });

  const validateRegistration = (): boolean => {
    const newErrors: FormErrors = {};

    if (!registerData.fullName.trim()) {
      newErrors.fullName = 'Jméno je povinné';
    } else if (registerData.fullName.trim().length < 3) {
      newErrors.fullName = 'Jméno musí obsahovat alespoň 3 znaky';
    }

    if (!registerData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      newErrors.email = 'Email není platný';
    }

    if (!registerData.phone.trim()) {
      newErrors.phone = 'Telefonní číslo je povinné';
    } else if (!/^\d{9,}$/.test(registerData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Telefonní číslo musí obsahovat alespoň 9 číslic';
    }

    if (!registerData.password) {
      newErrors.password = 'Heslo je povinné';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Heslo musí mít alespoň 6 znaků';
    } else if (!/\d/.test(registerData.password)) {
      newErrors.password = 'Heslo musí obsahovat alespoň 1 číslo';
    } else if (!/[A-Z]/.test(registerData.password)) {
      newErrors.password = 'Heslo musí obsahovat alespoň 1 velké písmeno';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Potvrzení hesla je povinné';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Hesla se neshodují';
    }

    if (!agreedToTerms) {
      newErrors.password = 'Musíte souhlasit s podmínkami používání';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && agreedToTerms;
  };

  const validateLogin = (): boolean => {
    const newErrors: FormErrors = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Email není platný';
    }

    if (!loginData.password) {
      newErrors.password = 'Heslo je povinné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsVerifyingPhone(false);
    setVerificationCode('');
    setResendCooldown(0);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegistration()) {
      showToast('error', 'Chyba ve formuláři', 'Prosím opravte chyby a zkuste znovu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: registerData.fullName,
          email: registerData.email,
          phone: registerData.phone,
          phonePrefix: registerData.phonePrefix,
          password: registerData.password,
          confirmPassword: registerData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        showToast('error', 'Registrace selhala', data.message || 'Zkuste znovu.');
        return;
      }

      // Clear any old cached data from previous sessions before login
      localStorage.removeItem('advertly_profiles');
      localStorage.removeItem('advertly_strategies');
      localStorage.removeItem('advertly_active_profile');
      localStorage.removeItem('advertly_onboarding_completed');
      localStorage.removeItem('onboarding_progress');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('advertly_onboarding_skipped');
      localStorage.removeItem('advertly_onboarding_expiration');

      // Successfully registered - auto-login
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      aiService.setToken(data.token);
      
      showToast('success', 'Úspěšná registrace!', 'Vítejte v Advertly');
      login({
        email: data.user.email,
        fullName: data.user.fullName,
        phone: data.user.phone,
        phonePrefix: data.user.phonePrefix
      });
      
      // Reset form
      setRegisterData({
        fullName: '',
        email: '',
        phone: '',
        phonePrefix: '+420',
        password: '',
        confirmPassword: '',
      });
      setErrors({});
      setAgreedToTerms(false);
    } catch (error) {
      console.error('Register error:', error);
      showToast('error', 'Chyba připojení', 'Nemůžeme se připojit k serveru. Zkontrolujte připojení.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      showToast('error', 'Chyba', 'Prosím zadejte ověřovací kód.');
      return;
    }

    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      showToast('error', 'Chyba', 'Kód musí obsahovat 6 číslic.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: registerData.phone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast('error', 'Ověření selhalo', data.message || 'Zkuste znovu.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      aiService.setToken(data.token);
      
      showToast('success', 'Telefonní číslo ověřeno!', 'Vítejte v Advertly');
      login({
        email: data.user.email,
        fullName: data.user.fullName,
        phone: data.user.phone,
        phonePrefix: data.user.phonePrefix
      });
      
      // Reset form
      setRegisterData({
        fullName: '',
        email: '',
        phone: '',
        phonePrefix: '+420',
        password: '',
        confirmPassword: '',
      });
      setErrors({});
      setAgreedToTerms(false);
      setIsVerifyingPhone(false);
      setVerificationCode('');
    } catch (error) {
      console.error('Verify error:', error);
      showToast('error', 'Chyba', 'Nepodařilo se ověřit telefonní číslo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: registerData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast('error', 'Chyba', data.message || 'Nepovedlo se odeslat kód.');
        return;
      }

      setResendCooldown(60);
      showToast('success', 'Kód odeslán', 'Nový ověřovací kód byl odeslán na váš telefon.');
      
      // Start countdown timer
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Resend error:', error);
      showToast('error', 'Chyba', 'Nepodařilo se odeslat nový kód.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLogin()) {
      showToast('error', 'Chyba ve formuláři', 'Prosím opravte chyby a zkuste znovu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        setErrors(data.errors || {});
        showToast('error', 'Přihlášení selhalo', data.message || 'Zkuste znovu.');
        return;
      }

      // Clear any old cached data from previous sessions before login
      localStorage.removeItem('advertly_profiles');
      localStorage.removeItem('advertly_strategies');
      localStorage.removeItem('advertly_active_profile');
      localStorage.removeItem('advertly_onboarding_completed');
      localStorage.removeItem('onboarding_progress');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('advertly_onboarding_skipped');
      localStorage.removeItem('advertly_onboarding_expiration');

      // Simulate page load animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      aiService.setToken(data.token);
      
      showToast('success', 'Úspěšné přihlášení!', `Vítejte zpět, ${data.user.fullName}`);
      login({
        email: data.user.email,
        fullName: data.user.fullName,
        phone: data.user.phone,
        phonePrefix: data.user.phonePrefix,
        avatar: data.user.avatar,
        hasStrategies: data.hasStrategies
      });
    } catch (error) {
      console.error('Login error:', error);
      showToast('error', 'Chyba připojení', 'Nemůžeme se připojit k serveru. Zkontrolujte připojení.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Panel: Visual & Branding */}
      <div className="lg:w-[45%] xl:w-[50%] bg-gradient-to-r from-violet-700 to-indigo-800 p-10 md:p-20 text-white flex flex-col justify-between relative overflow-hidden shrink-0 hidden lg:flex">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>
          
          {/* Brain background image */}
          <img 
            src="/Images/Brain.png" 
            alt="" 
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[550px] h-auto opacity-[0.2] pointer-events-none select-none"
          />
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                  <img src="/Brand/LogoWhite.png" alt="Advertly" className="h-20 w-auto" />
              </div>
              
              <h1 className="text-2xl xl:text-3xl font-bold mb-3 leading-[1.1] tracking-tight">
                  Marketingový mozek pro vaše podnikání.
              </h1>
              <p className="text-indigo-200/80 text-sm xl:text-base font-medium leading-relaxed max-w-lg">
                  Advertly využívá nejmodernější AI k analýze konkurence a tvorbě kampaní, které skutečně prodávají.
              </p>
          </div>

          <div className="space-y-4 relative z-10">
              {[
                  { title: 'Analýza trhu během vteřin', desc: 'AI prozkoumá vaše konkurenty a najde jejich slabá místa.' },
                  { title: 'Vizuály, které zastaví scroll', desc: 'Generujte profesionální reklamní obrázky přímo v aplikaci.' },
                  { title: 'Garantovaná strategie', desc: 'Dostanete kompletní plán od ICP až po Landing Page.' }
              ].map((feature, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 ease-out">
                          <CheckCircle2 size={16} className="text-indigo-300 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="group-hover:translate-x-1 transition-transform duration-300 ease-out">
                          <h3 className="font-semibold text-sm mb-0.5 group-hover:text-white transition-colors duration-300">{feature.title}</h3>
                          <p className="text-indigo-200/60 text-xs leading-relaxed group-hover:text-indigo-200/80 transition-colors duration-300">{feature.desc}</p>
                      </div>
                  </div>
              ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-950 bg-indigo-800 flex items-center justify-center text-[8px] font-bold">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full rounded-full object-cover" />
                      </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-950 bg-indigo-600 flex items-center justify-center text-[8px] font-bold">
                      +2k
                  </div>
              </div>
              <p className="text-indigo-300/60 text-xs tracking-wide">
                  Přidejte se k 2,450+ firmám
              </p>
          </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="flex-1 flex flex-col bg-white">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 flex justify-between items-center border-b border-gray-50">
              <img src="/Brand/LogoWhite.png" alt="Advertly" className="h-12 w-auto grayscale brightness-0" />
              <button onClick={handleToggle} className="text-xs font-bold text-primary">
                  {isLogin ? 'Vytvořit účet' : 'Přihlásit se'}
              </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-16 overflow-y-auto">
              <div className="max-w-md w-full">
                  <div className="mb-7 text-center lg:text-left">
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">
                          {isLogin ? 'Přihlášení' : 'Registrace'}
                      </h2>
                      <p className="text-sm text-gray-500">
                          {isLogin 
                            ? 'Přihlaste se ke svému účtu' 
                            : 'Vytvořte si nový účet za 2 minuty'}
                      </p>
                  </div>

                  {/* Login Form */}
                  {isLogin ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div>
                          <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">E-mailová adresa</label>
                          <div className="relative">
                              <input 
                                type="email" 
                                required
                                autoComplete="email"
                                value={loginData.email}
                                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                className={`w-full pl-3.5 pr-3.5 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.email ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="Vaše emailová adresa" 
                              />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.email}
                            </p>
                          )}
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-2 ml-1">
                              <label className="text-sm font-normal text-gray-600 tracking-wide">Heslo</label>
                              <button type="button" className="text-xs font-medium text-primary hover:text-violet-700 transition-all duration-300 ease-out">Zapomenuté heslo?</button>
                          </div>
                          <div className="relative">
                              <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                autoComplete="current-password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                className={`w-full pl-3.5 pr-10 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.password ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="••••••••" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300"
                              >
                                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                          </div>
                          {errors.password && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.password}
                            </p>
                          )}
                      </div>

                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm tracking-wide transition-all duration-300 ease-out flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98] disabled:opacity-70 disabled:hover:shadow-none mt-5"
                      >
                          {isLoading ? (
                              <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Zpracovávám...
                              </>
                          ) : (
                              <>
                                  Přihlásit se
                                  <ArrowRight size={16} />
                              </>
                          )}
                      </button>
                  </form>
                  ) : (
                    <>
                    {/* Phone Verification Form */}
                    {isVerifyingPhone ? (
                      <form onSubmit={handleVerifyPhone} className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">Ověřovací kód</label>
                              <p className="text-xs text-gray-600 mb-2.5 ml-1">
                                  Kód byl odeslán na: <span className="font-medium text-gray-800">{registeredUserPhone}</span>
                              </p>
                              <input 
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-3 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-bold text-xl text-center tracking-widest text-gray-800"
                                placeholder="000000"
                                autoComplete="off"
                              />
                              <p className="text-xs text-gray-500 mt-1.5 ml-1">Zadejte 6-místný kód</p>
                          </div>

                          <button 
                            type="submit" 
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-xs tracking-wide transition-all duration-300 ease-out flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
                          >
                              {isLoading ? (
                                  <>
                                      <Loader2 size={14} className="animate-spin" />
                                      Ověřuji...
                                  </>
                              ) : (
                                  <>
                                      Ověřit kód
                                      <Check size={14} />
                                  </>
                              )}
                          </button>

                          <div className="pt-1.5">
                              <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendCooldown > 0 || isLoading}
                                className="w-full py-1.5 text-primary hover:text-violet-700 font-medium text-xs transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                  {resendCooldown > 0 ? (
                                      `Poslat znovu za ${resendCooldown}s`
                                  ) : (
                                      'Poslat kód znovu'
                                  )}
                              </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsVerifyingPhone(false);
                              setVerificationCode('');
                              setResendCooldown(0);
                              setRegisteredUserPhone('');
                              setRegisterData({
                                fullName: '',
                                email: '',
                                phone: '',
                                phonePrefix: '+420',
                                password: '',
                                confirmPassword: '',
                              });
                              setErrors({});
                            }}
                            className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium text-xs transition-colors"
                          >
                              ← Zpět na registraci
                          </button>
                      </form>
                    ) : (
                    /* Register Form */
                    <form onSubmit={handleRegisterSubmit} className="space-y-3">
                      {/* Full Name */}
                      <div>
                          <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">Jméno a příjmení</label>
                          <div className="relative">
                              <input 
                                type="text" 
                                required
                                autoComplete="name"
                                value={registerData.fullName}
                                onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                                className={`w-full pl-3.5 pr-3.5 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.fullName ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="Jan Novák" 
                              />
                          </div>
                          {errors.fullName && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.fullName}
                            </p>
                          )}
                      </div>

                      {/* Email */}
                      <div>
                          <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">E-mailová adresa</label>
                          <div className="relative">
                              <input 
                                type="email" 
                                required
                                autoComplete="email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                className={`w-full pl-3.5 pr-3.5 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.email ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="vas@email.cz" 
                              />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.email}
                            </p>
                          )}
                      </div>

                      {/* Phone */}
                      <div className="flex gap-2">
                          <div className="w-[140px]">
                              <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">Předvolba</label>
                              <PhonePrefixSelector 
                                value={registerData.phonePrefix}
                                onChange={(value) => setRegisterData({...registerData, phonePrefix: value})}
                                prefixes={PHONE_PREFIXES}
                              />
                          </div>
                          <div className="flex-1">
                              <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">Telefonní číslo</label>
                              <div className="relative">
                                  <input 
                                    type="tel" 
                                    required
                                    autoComplete="tel"
                                    value={registerData.phone}
                                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value.replace(/\D/g, '')})}
                                    className={`w-full pl-3.5 pr-3.5 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.phone ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                    placeholder="720 123 456" 
                                  />
                              </div>
                          </div>
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.phone}
                        </p>
                      )}

                      {/* Password */}
                      <div>
                          <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">Heslo</label>
                          <div className="relative">
                              <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                autoComplete="new-password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                className={`w-full pl-3.5 pr-10 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.password ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="••••••••" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300"
                              >
                                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                          </div>
                          {errors.password && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.password}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2 ml-1">Aspoň 6 znaků, 1 číslo, 1 velké písmeno</p>
                      </div>

                      {/* Confirm Password */}
                      <div>
                          <label className="block text-sm font-normal text-gray-600 tracking-wide mb-2 ml-1">Potvrzení hesla</label>
                          <div className="relative">
                              <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                required
                                autoComplete="new-password"
                                value={registerData.confirmPassword}
                                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                className={`w-full pl-3.5 pr-10 py-2.5 bg-gray-50/50 border rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all duration-300 ease-out font-medium text-sm text-gray-800 placeholder:text-xs ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 hover:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                                placeholder="••••••••" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300"
                              >
                                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {errors.confirmPassword}
                            </p>
                          )}
                      </div>

                      {/* Terms Agreement Checkbox */}
                      <div className="pt-1 pb-0.5">
                          <Checkbox 
                            checked={agreedToTerms}
                            onChange={(e) => {
                              setAgreedToTerms(e.target.checked);
                              if (e.target.checked) {
                                setErrors({...errors, password: undefined});
                              }
                            }}
                            label={
                              <span className="text-xs text-gray-600">
                                Souhlasím s <span className="text-primary font-medium">podmínkami používání</span> a <span className="text-primary font-medium">zásadami ochrany osobních údajů</span>
                              </span>
                            }
                          />
                      </div>

                      {errors.password && agreedToTerms === false && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.password}
                        </p>
                      )}

                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 ease-out flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98] disabled:opacity-70 disabled:hover:shadow-none mt-5"
                      >
                          {isLoading ? (
                              <>
                                  <Loader2 size={18} className="animate-spin" />
                                  Zpracovávám...
                              </>
                          ) : (
                              <>
                                  Vytvořit účet
                                  <ArrowRight size={16} />
                              </>
                          )}
                      </button>
                  </form>
                    )}
                    </>
                  )}

                  <div className="mt-7 text-center hidden lg:block">
                      <p className="text-sm text-gray-500 font-normal">
                          {isLogin ? 'Ještě nemáte účet?' : 'Již máte účet?'}
                          <button 
                            onClick={handleToggle}
                            className="ml-2 text-primary font-medium hover:text-violet-700 transition-colors focus:outline-none"
                          >
                              {isLogin ? 'Zaregistrujte se' : 'Přihlaste se'}
                          </button>
                      </p>
                  </div>
              </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 text-center text-[12px] font-medium text-gray-300 tracking-wider">
              © 2025 Advertly. Všechna práva vyhrazena.
          </div>
      </div>
    </div>
  );
};

export default AuthPage;
