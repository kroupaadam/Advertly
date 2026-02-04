
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Megaphone, PieChart, UserCircle, Settings, Bell, Menu, X, LogOut, User, Check, AlertTriangle, ChevronDown, Lightbulb, Info, HelpCircle, MessageSquare, Moon, Trash2, Zap } from 'lucide-react';
import { useApp } from '../AppContext';
import ButtonColorful from './ButtonColorful';
import { ThemeToggle } from './ui/theme-toggle';
import { isValidNavItem } from '../navigationUtils';
import type { NavItemId } from '../constants';

const Header: React.FC = () => {
  const { currentPage, setPage, profiles, activeProfileId, settings, notifications, markNotificationsAsRead, markNotificationAsRead, deleteNotification, clearAllNotifications, logout, onboardingSkipped, completeOnboarding, credits } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'all' | 'unread'>('all');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  const displayName = settings.fullName || activeProfile?.companyName || settings.email?.split('@')[0] || 'Uživatel';
  const displayEmail = settings.email || 'felix@mojefirma.cz';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  const menuItems = [
    { id: 'dashboard' as NavItemId, label: 'Přehled', icon: LayoutDashboard },
    { id: 'strategy' as NavItemId, label: 'Strategie', icon: Lightbulb },
    { id: 'campaigns' as NavItemId, label: 'Kampaně', icon: Megaphone },
    { id: 'analytics' as NavItemId, label: 'Analytika', icon: PieChart },
    { id: 'profile' as NavItemId, label: 'Profil', icon: UserCircle },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  
  const filteredNotifications = activeNotificationTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.unread);

  // Check if banner should be shown
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('onboardingBannerDismissedUntil');
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil);
      if (Date.now() < dismissedTime) {
        setBannerDismissed(true);
      } else {
        localStorage.removeItem('onboardingBannerDismissedUntil');
        setBannerDismissed(false);
      }
    }
  }, []);

  const handleDismissBanner = () => {
    // Hide banner for 7 days (604800000 ms)
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('onboardingBannerDismissedUntil', sevenDaysFromNow.toString());
    setBannerDismissed(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = (pageId: string) => {
    if (isValidNavItem(pageId)) {
      setPage(pageId);
      setProfileMenuOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleMobileNav = (pageId: string) => {
    if (isValidNavItem(pageId)) {
      setPage(pageId);
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return Check;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
  };

  return (
    <>
      {/* Onboarding Skipped Reminder Banner */}
      {onboardingSkipped && !bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 text-amber-900 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6 2xl:px-10">
            <div className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Váš marketingový profil ještě není kompletní
                  </p>
                  <p className="text-xs text-amber-800/75 mt-0.5">
                    Dokončete onboarding formulář pro přístup ke všem funkcím aplikace
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setPage('resume-onboarding')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-all duration-300 whitespace-nowrap"
                >
                  Dokončit formulář
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="p-1 hover:bg-amber-200/50 rounded-md transition-colors duration-200 text-amber-600 hover:text-amber-700"
                  title="Skrýt na 7 dní"
                  aria-label="Zavřít oznámení"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
    <header className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white z-50 sticky top-0 border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 2xl:px-10">
        <div className="flex items-center justify-between h-16 2xl:h-20 transition-all">
          <div className="flex items-center gap-8 2xl:gap-12">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleMobileNav('dashboard')}>
              <img 
                src="/Brand/LogoWhite.png" 
                alt="Advertly" 
                className="h-12 2xl:h-14 w-auto object-contain transition-all"
              />
            </div>
            
            <nav className="hidden md:flex gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleProfileClick(item.id)}
                  className={`
                    px-3.5 py-2 text-xs 2xl:text-sm transition-all duration-300 ease-out flex items-center gap-1.5 rounded-lg
                    ${currentPage === item.id 
                      ? 'bg-white/15 text-white font-medium ' 
                      : 'text-indigo-100/80 hover:text-white font-normal'}
                  `}
                >
                  <item.icon size={16} className="2xl:w-4 2xl:h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 2xl:gap-6">
            <ButtonColorful 
                label="Nová strategie" 
                onClick={() => setPage('resume-onboarding')}
                variant="primary"
                className="h-9 px-3 md:h-auto md:px-4 md:py-2 hidden"
                labelClassName="hidden md:inline"
            />

            <div className="hidden md:flex items-center gap-2">
                <div className="relative" ref={notificationRef}>
                  <button 
                    className="p-1.5 rounded-full transition-colors relative"
                    onClick={() => {
                        setNotificationsOpen(!notificationsOpen);
                        setProfileMenuOpen(false);
                    }}
                  >
                    <Bell size={18} className="2xl:w-5 2xl:h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-indigo-600 animate-pulse"></span>
                    )}
                  </button>

                  {/* Notifications Dropdown with Fade Transition */}
                  <div className={`
                    absolute right-0 top-[calc(100%+8px)] w-96 bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden z-50 origin-top-right ring-1 ring-black/5 transition-all duration-200
                    ${notificationsOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[-10px] scale-95 pointer-events-none'}
                  `}>
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between mb-3">
                              <h3 className="text-gray-900 font-bold text-base">Oznámení</h3>
                              <div className="flex items-center gap-2">
                                  <button 
                                      onClick={markNotificationsAsRead}
                                      className="text-xs font-medium text-gray-600 hover:text-primary transition-colors bg-white px-2.5 py-1 rounded-lg hover:border-primary"
                                  >
                                      Označit vše
                                  </button>
                                  {notifications.length > 0 && (
                                      <button 
                                          onClick={clearAllNotifications}
                                          className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors bg-white px-2 py-1 rounded-lg"
                                          title="Smazat všechna oznámení"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  )}
                              </div>
                          </div>
                          
                          <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                              <button 
                                  onClick={() => setActiveNotificationTab('all')}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                      activeNotificationTab === 'all' 
                                      ? 'bg-white text-primary shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                  Vše
                              </button>
                              <button 
                                  onClick={() => setActiveNotificationTab('unread')}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                                      activeNotificationTab === 'unread' 
                                      ? 'bg-white text-primary shadow-sm' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                  Nepřečtené
                                  {unreadCount > 0 && (
                                      <span className="bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                          {unreadCount}
                                      </span>
                                  )}
                              </button>
                          </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                          {filteredNotifications.length > 0 ? (
                              <div className="divide-y divide-gray-100">
                                  {filteredNotifications.map((item) => {
                                      const NotificationIcon = getNotificationIcon(item.type);
                                      const iconColor = getNotificationColor(item.type);
                                      const bgColor = item.type === 'success' ? 'bg-emerald-50' : item.type === 'warning' ? 'bg-orange-50' : 'bg-blue-50';
                                      
                                      return (
                                          <div 
                                              key={item.id} 
                                              onClick={() => markNotificationAsRead(item.id)}
                                              className={`px-4 py-3 transition-all hover:bg-gray-50 cursor-pointer group ${
                                                  item.unread 
                                                  ? `${bgColor}` 
                                                  : ''
                                              }`}
                                          >
                                              <div className="flex gap-3">
                                                  {/* Icon */}
                                                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                                      item.type === 'success' ? 'bg-emerald-100' : 
                                                      item.type === 'warning' ? 'bg-orange-100' : 
                                                      'bg-blue-100'
                                                  }`}>
                                                      <NotificationIcon size={16} className={iconColor} />
                                                  </div>
                                                  
                                                  {/* Content */}
                                                  <div className="flex-1 min-w-0">
                                                      <div className="flex justify-between items-start gap-2">
                                                          <p className={`text-xs font-semibold truncate ${item.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                              {item.title}
                                                          </p>
                                                          <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                                              {item.time}
                                                          </span>
                                                      </div>
                                                      <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5 line-clamp-2">
                                                          {item.description}
                                                      </p>
                                                  </div>
                              
                                                  {/* Unread indicator */}
                                                  {item.unread && (
                                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                                                  )}
                                                  
                                                  {/* Delete button */}
                                                  <button
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          deleteNotification(item.id);
                                                      }}
                                                      className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 rounded transition-all opacity-0 group-hover:opacity-100"
                                                      title="Smazat oznámení"
                                                  >
                                                      <Trash2 size={14} />
                                                  </button>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                      <Bell size={20} className="text-gray-400" />
                                  </div>
                                  <p className="text-gray-900 font-semibold text-sm">Žádná oznámení</p>
                                  <p className="text-gray-500 text-xs mt-1">Všechno je pod kontrolou</p>
                              </div>
                          )}
                      </div>
                  </div>
                </div>
            </div>
            
            <div className="hidden md:flex items-center gap-3 pl-3 relative border-l border-white/10 ml-2" ref={profileMenuRef}>
                <button 
                  onClick={() => {
                      setProfileMenuOpen(!profileMenuOpen);
                      setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                    <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-black/20 flex items-center justify-center text-white font-semibold text-xs overflow-hidden transition-all group-hover:bg-black/30">
                        {settings.avatar ? (
                             <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>

                    <div className="flex flex-col items-start hidden">
                        <p className="text-xs font-semibold text-white leading-tight">{displayName}</p>
                        <p className="text-[10px] text-indigo-200 font-normal">{displayEmail}</p>
                    </div>
                    
                    <ChevronDown size={14} className={`text-indigo-200 transition-transform duration-200 hidden lg:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Menu Dropdown with Fade Transition */}
                <div className={`
                    absolute right-0 top-[calc(100%+8px)] w-72 bg-white rounded-lg border border-gray-200 shadow-xl p-1 z-50 text-gray-700 origin-top-right ring-1 ring-black/5 transition-all duration-200
                    ${profileMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-[-10px] scale-95 pointer-events-none'}
                `}>
                    <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b border-dashed border-gray-100 pb-3">
                         <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden shadow-sm">
                             {settings.avatar ? (
                                 <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                initials
                             )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                             <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                        </div>
                    </div>
                    
                    <div className="px-2 pb-2">
                        <div className="bg-violet-50/80 rounded-lg p-3 border border-violet-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <Zap size={14} className="text-violet-600 fill-violet-600" />
                                    <span className="text-sm font-bold text-violet-700">{credits?.current || 0}</span>
                                    <span className="text-xs font-medium text-gray-700">AI kreditů</span>
                                </div>
                                <button 
                                    className="text-[10px] font-semibold text-violet-700 hover:text-violet-800 bg-white border border-violet-200 hover:border-violet-300 px-2.5 py-1 rounded shadow-sm transition-all"
                                    onClick={() => handleProfileClick('settings')}
                                >
                                    Dokoupit
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <div className="flex items-center gap-1">
                                    <span>Měsíční kredity / workspace</span>
                                    <HelpCircle size={10} className="text-gray-400" />
                                </div>
                                <span className="font-medium text-gray-700">{credits?.current || 0} / {credits?.limit || 2000}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-0.5 py-0.5">
                        <button 
                            onClick={() => handleProfileClick('settings')}
                            className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs font-normal text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                                <span>Nastavení účtu</span>
                            </div>
                        </button>

                        <div className="flex items-center justify-between px-2 py-2 rounded-lg text-xs font-normal text-gray-700 transition-all hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Moon size={16} className="text-gray-400" />
                                <span>Tmavý režim</span>
                            </div>
                            <ThemeToggle className="scale-75 origin-right" />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-0.5 mx-1"></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-normal text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <LogOut size={16} className="text-red-400 group-hover:text-red-600" />
                      Odhlásit se
                    </button>
                </div>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-indigo-100 hover:text-white p-1.5"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-900 border-t border-white/10 absolute w-full left-0 top-16 z-50 animate-slide-down shadow-2xl">
          <div className="px-4 py-3 space-y-1.5 max-h-[calc(100vh-64px)] overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMobileNav(item.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm font-normal flex items-center gap-2 transition-all
                  ${currentPage === item.id 
                    ? 'text-white bg-white/15 ring-1 ring-white/10' 
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}

            {/* Mobile Divider */}
            <div className="h-px bg-white/10 my-3 mx-1"></div>

            {/* Mobile User Profile Section */}
            <div className="px-1 pb-1.5">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white font-semibold text-xs overflow-hidden border border-white/10">
                        {settings.avatar ? (
                             <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white">{displayName}</p>
                        <p className="text-[10px] text-indigo-300">{displayEmail}</p>
                    </div>
                </div>

                <button
                  onClick={() => handleMobileNav('settings')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-normal flex items-center gap-2 transition-all text-indigo-200 hover:text-white hover:bg-white/5"
                >
                  <Settings size={18} />
                  Nastavení
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-normal flex items-center gap-2 transition-all text-red-300 hover:text-red-200 hover:bg-red-500/10"
                >
                  <LogOut size={18} />
                  Odhlásit se
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
};

export default Header;
