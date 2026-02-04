
import React from 'react';
import { LayoutDashboard, Megaphone, PieChart, Settings, Lightbulb, UserCircle } from 'lucide-react';
import { useApp } from '../AppContext';
import { isValidNavItem } from '../navigationUtils';
import type { NavItemId } from '../constants';

const Sidebar: React.FC = () => {
  const { currentPage, setPage } = useApp();

  const menuItems: Array<{ id: NavItemId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = [
    { id: 'strategy', label: 'Moje Strategie', icon: Lightbulb },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Kampaně', icon: Megaphone },
    { id: 'analytics', label: 'Analytika', icon: PieChart },
    { id: 'profile', label: 'Můj profil', icon: UserCircle },
    { id: 'settings', label: 'Nastavení', icon: Settings },
  ];

  const handleNav = (pageId: string) => {
    if (isValidNavItem(pageId)) {
      setPage(pageId);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-20 2xl:top-24 z-40 shadow-sm md:shadow-none transition-all">
      <div className="max-w-screen-2xl mx-auto px-0 md:px-10 2xl:px-14">
        <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar px-4 md:px-0 scroll-smooth">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                flex flex-shrink-0 items-center gap-2 px-3 py-4 md:px-5 md:py-5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 select-none
                ${currentPage === item.id 
                  ? 'border-primary text-primary bg-violet-50/50 md:bg-transparent' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              <item.icon size={18} strokeWidth={currentPage === item.id ? 2.5 : 2} className="flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
          {/* Spacer to ensure the last item is not flush with the screen edge on mobile */}
          <div className="w-2 md:hidden flex-shrink-0"></div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
