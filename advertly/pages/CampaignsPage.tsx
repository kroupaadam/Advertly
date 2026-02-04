import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import ButtonColorful from '../components/ButtonColorful';
import { Megaphone, PlusCircle, Layout, List, LayoutGrid } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types for ads from strategy
interface VideoAd {
  id: string;
  name: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  script: string;
  duration: string;
  format: string;
}

interface StaticAd {
  id: string;
  name: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  visualDescription: string;
  format: string;
}

interface RemarketingAd {
  id: string;
  name: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  targetAudience: string;
}

type AdType = 'all' | 'video' | 'static' | 'remarketing';
type Platform = 'all' | 'Facebook' | 'Instagram' | 'Google Ads';

const CampaignsPage: React.FC = () => {
  const { strategies, activeProfileId, profiles, navigateTo, setPage } = useApp();
  const [selectedType, setSelectedType] = useState<AdType>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get current strategy and profile
  const currentProfile = useMemo(() => {
    return activeProfileId ? profiles.find(p => p.id === activeProfileId) : undefined;
  }, [profiles, activeProfileId]);

  const currentStrategy = useMemo(() => {
    return activeProfileId ? strategies[activeProfileId] : undefined;
  }, [strategies, activeProfileId]);

  // Extract ads from strategy
  const ads = useMemo(() => {
    if (!currentStrategy) return { videos: [], statics: [], remarketing: [] };

    const result = currentStrategy.result || currentStrategy;
    
    // Try to extract ads from different possible structures
    let adData = result.ads || result.adCampaign?.ads || {};
    
    // If adCampaign has adVariants, transform them
    if (result.adCampaign?.adVariants) {
      const variants = result.adCampaign.adVariants;
      return {
        videos: variants
          .filter((v: any) => v.type === 'video')
          .map((v: any, i: number) => ({
            id: `video-${i}`,
            name: v.name || `Video reklama ${i + 1}`,
            headline: v.headline || '',
            primaryText: v.primaryText || '',
            callToAction: v.callToAction || 'Zjistit více',
            script: v.script || '',
            duration: '30s',
            format: '1080x1920 (9:16)'
          })),
        statics: variants
          .filter((v: any) => v.type === 'static')
          .map((v: any, i: number) => ({
            id: `static-${i}`,
            name: v.name || `Statická reklama ${i + 1}`,
            headline: v.headline || '',
            primaryText: v.primaryText || '',
            callToAction: v.callToAction || 'Zjistit více',
            visualDescription: v.visualDescription || '',
            format: '1080x1080 (1:1)'
          })),
        remarketing: []
      };
    }

    return {
      videos: (adData.videos || []).map((v: any, i: number) => ({ ...v, id: v.id || `video-${i}` })),
      statics: (adData.statics || []).map((s: any, i: number) => ({ ...s, id: s.id || `static-${i}` })),
      remarketing: (adData.remarketing || []).map((r: any, i: number) => ({ ...r, id: r.id || `remarketing-${i}` }))
    };
  }, [currentStrategy]);

  // Filter ads based on selection
  const filteredAds = useMemo(() => {
    let allAds: Array<{ type: AdType; ad: VideoAd | StaticAd | RemarketingAd; platform: Platform }> = [];

    // Add videos
    if (selectedType === 'all' || selectedType === 'video') {
      ads.videos.forEach((ad: VideoAd) => {
        allAds.push({ type: 'video', ad, platform: 'Facebook' });
        allAds.push({ type: 'video', ad: { ...ad, id: `${ad.id}-ig` }, platform: 'Instagram' });
      });
    }

    // Add statics
    if (selectedType === 'all' || selectedType === 'static') {
      ads.statics.forEach((ad: StaticAd) => {
        allAds.push({ type: 'static', ad, platform: 'Facebook' });
        allAds.push({ type: 'static', ad: { ...ad, id: `${ad.id}-ig` }, platform: 'Instagram' });
        allAds.push({ type: 'static', ad: { ...ad, id: `${ad.id}-google` }, platform: 'Google Ads' });
      });
    }

    // Add remarketing
    if (selectedType === 'all' || selectedType === 'remarketing') {
      ads.remarketing.forEach((ad: RemarketingAd) => {
        allAds.push({ type: 'remarketing', ad, platform: 'Facebook' });
      });
    }

    // Filter by platform
    if (selectedPlatform !== 'all') {
      allAds = allAds.filter(item => item.platform === selectedPlatform);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allAds = allAds.filter(item => 
        item.ad.name.toLowerCase().includes(query) ||
        item.ad.headline.toLowerCase().includes(query) ||
        item.ad.primaryText.toLowerCase().includes(query)
      );
    }

    return allAds;
  }, [ads, selectedType, selectedPlatform, searchQuery]);

  // Get type badge color
  const getTypeBadge = (type: AdType) => {
    switch (type) {
      case 'video':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Video' };
      case 'static':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Statická' };
      case 'remarketing':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Remarketing' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Ostatní' };
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'Facebook':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'Instagram':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'Google Ads':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // No strategy case
  if (!currentStrategy || !currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 relative">
            <Megaphone size={40} className="text-gray-300" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                <PlusCircle size={16} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zatím nemáte žádné reklamy</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
          Nejprve vytvořte strategii pomocí onboarding průvodce. Na základě vaší strategie vám vygenerujeme reklamní kampaně.
        </p>
        <ButtonColorful 
          variant="primary" 
          label="Vytvořit strategii" 
          onClick={() => setPage('resume-onboarding')}
          className="h-12 md:h-12"
        />
      </div>
    );
  }

  // No ads case
  const totalAds = ads.videos.length + ads.statics.length + ads.remarketing.length;
  if (totalAds === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 relative">
            <Layout size={40} className="text-gray-300" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                <PlusCircle size={16} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reklamy se generují</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
          Vaše strategie zatím neobsahuje vygenerované reklamy. Zkuste zobrazit výsledky strategie.
        </p>
        <ButtonColorful 
          variant="primary" 
          label="Zobrazit strategii" 
          onClick={() => setPage('strategy')}
          className="h-12 md:h-12"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reklamní kampaně</h1>
          <p className="text-gray-600">
            Spravujte své reklamy vygenerované na základě vaší strategie
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{totalAds}</div>
            <div className="text-gray-600 text-sm">Celkem reklam</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{ads.videos.length}</div>
            <div className="text-gray-600 text-sm">Video reklam</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{ads.statics.length}</div>
            <div className="text-gray-600 text-sm">Statických reklam</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{ads.remarketing.length}</div>
            <div className="text-gray-600 text-sm">Remarketing</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Hledat reklamy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(['all', 'video', 'static', 'remarketing'] as AdType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {type === 'all' ? 'Vše' : type === 'video' ? 'Video' : type === 'static' ? 'Statické' : 'Remarketing'}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="all">Všechny platformy</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Google Ads">Google Ads</option>
          </select>
          
          {/* View Toggle */}
           <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Mřížka"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Tabulka"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Ads Content */}
        {filteredAds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Žádné reklamy neodpovídají vašemu filtru</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="w-[250px] font-semibold text-gray-600">Reklama</TableHead>
                  <TableHead className="font-semibold text-gray-600">Typ</TableHead>
                  <TableHead className="font-semibold text-gray-600">Platforma</TableHead>
                  <TableHead className="font-semibold text-gray-600">Titulek</TableHead>
                  <TableHead className="font-semibold text-gray-600">CTA</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((item, index) => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <TableRow key={`${item.ad.id}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                         <div className="flex flex-col">
                            <span>{item.ad.name}</span>
                            <span className="text-xs text-gray-400 font-normal mt-0.5 max-w-[200px] truncate">{item.ad.headline}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <span className={`${badge.bg} ${badge.text} text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${badge.text.replace('text-', 'bg-')}`}></div>
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          {getPlatformIcon(item.platform)}
                          <span>{item.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-500" title={item.ad.primaryText}>{item.ad.primaryText}</TableCell>
                      <TableCell className="text-purple-600 font-medium text-xs bg-purple-50 px-2 py-1 rounded inline-block">{item.ad.callToAction}</TableCell>
                      <TableCell className="text-right">
                        <button 
                            onClick={() => {
                                setExpandedAd(`${item.ad.id}-${index}`);
                                setViewMode('grid');
                        // Quick hack to show details: switch to grid and expand. 
                        // ideally we would have a drawer or modal.
                            }}
                            className="text-sm text-gray-500 hover:text-purple-700 font-medium px-3 py-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          Zobrazit
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((item, index) => {
              const badge = getTypeBadge(item.type);
              const isExpanded = expandedAd === `${item.ad.id}-${index}`;

              return (
                <div
                  key={`${item.ad.id}-${index}`}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-500 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Ad Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`${badge.bg} ${badge.text} text-xs font-medium px-2 py-1 rounded-full`}>
                          {badge.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                          {getPlatformIcon(item.platform)}
                          {item.platform}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Připraveno
                      </span>
                    </div>
                    <h3 className="text-gray-900 font-semibold">{item.ad.name}</h3>
                  </div>

                  {/* Ad Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Titulek</div>
                      <div className="text-gray-900 text-sm">{item.ad.headline}</div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Text reklamy</div>
                      <div className={`text-gray-700 text-sm ${!isExpanded && 'line-clamp-3'}`}>
                        {item.ad.primaryText}
                      </div>
                    </div>

                    {/* Type specific content */}
                    {item.type === 'video' && (item.ad as VideoAd).script && (
                      <div className={`mb-3 ${!isExpanded && 'hidden'}`}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Scénář</div>
                        <div className="text-gray-700 text-sm bg-gray-100 p-3 rounded-lg">
                          {(item.ad as VideoAd).script}
                        </div>
                      </div>
                    )}

                    {item.type === 'static' && (item.ad as StaticAd).visualDescription && (
                      <div className={`mb-3 ${!isExpanded && 'hidden'}`}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vizuální popis</div>
                        <div className="text-gray-700 text-sm bg-gray-100 p-3 rounded-lg">
                          {(item.ad as StaticAd).visualDescription}
                        </div>
                      </div>
                    )}

                    {item.type === 'remarketing' && (item.ad as RemarketingAd).targetAudience && (
                      <div className={`mb-3 ${!isExpanded && 'hidden'}`}>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cílové publikum</div>
                        <div className="text-gray-700 text-sm bg-gray-100 p-3 rounded-lg">
                          {(item.ad as RemarketingAd).targetAudience}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-600">
                        CTA: <span className="text-purple-600">{item.ad.callToAction}</span>
                      </span>
                      <button
                        onClick={() => setExpandedAd(isExpanded ? null : `${item.ad.id}-${index}`)}
                        className="text-purple-600 text-sm hover:text-purple-700 transition-colors"
                      >
                        {isExpanded ? 'Méně' : 'Více'}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                      <button className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Exportovat
                      </button>
                      <button className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-lg transition-colors">
                        Upravit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigateTo('strategy-result')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-xl transition-colors"
          >
            Zobrazit celou strategii
          </button>
          <button
            onClick={() => navigateTo('landing-editor')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Upravit landing page
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
