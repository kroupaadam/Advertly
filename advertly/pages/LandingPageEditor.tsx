import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import {
  Layout, Eye, Edit3, Save, X, ChevronUp, ChevronDown, Plus, Trash2,
  Target, Star, Shield, HelpCircle, MousePointer, Users, Award,
  MessageSquare, Sparkles, ArrowLeft, Copy, ExternalLink, Loader2,
  Type, AlignLeft, Image as ImageIcon, Grip, Check, RefreshCw
} from 'lucide-react';
import ButtonColorful from '../components/ButtonColorful';
import { aiService } from '../services/aiService';

interface LandingSection {
  id: string;
  type: 'hero' | 'benefits' | 'social_proof' | 'features' | 'guarantee' | 'faq' | 'cta' | 'custom';
  title: string;
  content: string;
  purpose?: string;
  imageUrl?: string;
  items?: string[];
}

const sectionTypes = [
  { type: 'hero', label: 'Hero sekce', icon: Star, description: 'Hlavní nadpis a výzva k akci' },
  { type: 'benefits', label: 'Výhody', icon: Award, description: 'Seznam hlavních benefitů' },
  { type: 'social_proof', label: 'Social Proof', icon: Users, description: 'Reference a důkazy' },
  { type: 'features', label: 'Vlastnosti', icon: Target, description: 'Detailní popis funkcí' },
  { type: 'guarantee', label: 'Garance', icon: Shield, description: 'Záruka a jistoty' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Často kladené otázky' },
  { type: 'cta', label: 'Call to Action', icon: MousePointer, description: 'Výzva k akci' },
  { type: 'custom', label: 'Vlastní sekce', icon: Layout, description: 'Libovolný obsah' },
];

const LandingPageEditor: React.FC = () => {
  const { strategies, activeProfileId, setPage, profiles, showToast, updateStrategy } = useApp();
  
  const rawStrategy = activeProfileId ? strategies[activeProfileId] : null;
  const profile = activeProfileId ? profiles.find(p => p.id === activeProfileId) : null;

  // Extract landing page sections from strategy
  const extractSections = (): LandingSection[] => {
    if (!rawStrategy) return [];
    
    const adCampaign = (rawStrategy as any)?.adCampaign || {};
    const landingPageStructure = adCampaign?.landingPageStructure || {};
    
    return Object.entries(landingPageStructure).map(([type, content]: [string, any], i) => ({
      id: `section-${i}-${Date.now()}`,
      type: type as LandingSection['type'],
      title: content?.headline || content?.title || type,
      content: content?.subheadline || content?.description || 
               (Array.isArray(content) ? content.join('\n') : 
                typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content || '')),
      purpose: content?.purpose || '',
      items: Array.isArray(content?.items) ? content.items : 
             Array.isArray(content) ? content : undefined,
    }));
  };

  const [sections, setSections] = useState<LandingSection[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  // Initialize sections from strategy
  useEffect(() => {
    const initialSections = extractSections();
    if (initialSections.length === 0) {
      // Add default sections if none exist
      setSections([
        { id: 'default-hero', type: 'hero', title: 'Hlavní nadpis', content: 'Popis vaší nabídky', purpose: 'Zaujmout návštěvníka' },
        { id: 'default-benefits', type: 'benefits', title: 'Proč si vybrat nás', content: 'Seznam výhod', purpose: 'Ukázat hodnotu' },
        { id: 'default-cta', type: 'cta', title: 'Začněte ještě dnes', content: 'Výzva k akci', purpose: 'Konverze' },
      ]);
    } else {
      setSections(initialSections);
    }
  }, [rawStrategy]);

  if (!rawStrategy || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
        <Layout size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nejprve vytvořte strategii</h2>
        <p className="text-gray-500 max-w-md mb-8">Pro úpravu landing page potřebujete nejprve vygenerovat marketingovou strategii.</p>
        <ButtonColorful 
          variant="primary" 
          label="Vytvořit strategii" 
          onClick={() => setPage('resume-onboarding')} 
        />
      </div>
    );
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
    setHasChanges(true);
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    setHasChanges(true);
    showToast('info', 'Sekce odstraněna', 'Změny se projeví po uložení.');
  };

  const handleDuplicateSection = (section: LandingSection) => {
    const newSection = {
      ...section,
      id: `section-${Date.now()}`,
      title: `${section.title} (kopie)`,
    };
    const index = sections.findIndex(s => s.id === section.id);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSection);
    setSections(newSections);
    setHasChanges(true);
  };

  const handleAddSection = (type: LandingSection['type']) => {
    const typeInfo = sectionTypes.find(t => t.type === type);
    const newSection: LandingSection = {
      id: `section-${Date.now()}`,
      type,
      title: typeInfo?.label || 'Nová sekce',
      content: '',
      purpose: typeInfo?.description || '',
    };
    setSections([...sections, newSection]);
    setIsAddingSection(false);
    setEditingSection(newSection.id);
    setHasChanges(true);
  };

  const handleUpdateSection = (id: string, updates: Partial<LandingSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert sections back to landing page structure format
      const landingPageStructure: Record<string, any> = {};
      sections.forEach((section, i) => {
        landingPageStructure[section.type] = {
          headline: section.title,
          subheadline: section.content,
          description: section.content,
          purpose: section.purpose,
          items: section.items,
          order: i,
        };
      });

      // Update strategy with new landing page structure
      if (rawStrategy && activeProfileId) {
        const updatedStrategy = {
          ...rawStrategy,
          adCampaign: {
            ...(rawStrategy as any).adCampaign,
            landingPageStructure,
          },
        };
        
        // Update local state
        updateStrategy(activeProfileId, updatedStrategy);

        // Try to save to backend
        try {
          const strategyId = (rawStrategy as any)._id || (rawStrategy as any).id;
          if (strategyId) {
            await aiService.updateStrategy(strategyId, { 
              'adCampaign.landingPageStructure': landingPageStructure 
            });
          }
        } catch (apiError) {
          console.warn('API save failed, changes saved locally:', apiError);
        }
      }

      setHasChanges(false);
      showToast('success', 'Landing page uložena', 'Všechny změny byly úspěšně uloženy.');
    } catch (error) {
      showToast('error', 'Chyba při ukládání', 'Nepodařilo se uložit změny.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    setIsRegenerating(sectionId);
    // Simulate AI regeneration
    setTimeout(() => {
      showToast('info', 'Připravujeme', 'AI regenerace sekcí bude brzy dostupná.');
      setIsRegenerating(null);
    }, 1000);
  };

  const getSectionIcon = (type: string) => {
    const typeInfo = sectionTypes.find(t => t.type === type);
    return typeInfo?.icon || Layout;
  };

  // Section Editor Component
  const SectionEditor: React.FC<{ section: LandingSection }> = ({ section }) => {
    const [localTitle, setLocalTitle] = useState(section.title);
    const [localContent, setLocalContent] = useState(section.content);
    const [localPurpose, setLocalPurpose] = useState(section.purpose || '');

    const handleSaveSection = () => {
      handleUpdateSection(section.id, {
        title: localTitle,
        content: localContent,
        purpose: localPurpose,
      });
      setEditingSection(null);
    };

    return (
      <div className="bg-white border-2 border-primary rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
        <div className="p-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 size={16} className="text-primary" />
            <span className="font-bold text-primary text-sm">Editace sekce</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingSection(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Typ sekce</label>
            <select
              value={section.type}
              onChange={(e) => handleUpdateSection(section.id, { type: e.target.value as LandingSection['type'] })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
            >
              {sectionTypes.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nadpis</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Nadpis sekce"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Obsah</label>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="Text sekce..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Účel sekce</label>
            <input
              type="text"
              value={localPurpose}
              onChange={(e) => setLocalPurpose(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Např. Zaujmout návštěvníka, Budovat důvěru..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditingSection(null)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleSaveSection}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Potvrdit změny
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Section Card Component
  const SectionCard: React.FC<{ section: LandingSection; index: number }> = ({ section, index }) => {
    const Icon = getSectionIcon(section.type);
    
    if (editingSection === section.id) {
      return <SectionEditor section={section} />;
    }

    return (
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 group">
        {/* Section Number */}
        <div className="hidden md:flex flex-col items-center gap-2">
          <div className="text-primary/30 font-black text-3xl group-hover:text-primary/60 transition-colors">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMoveSection(index, 'up')}
              disabled={index === 0}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => handleMoveSection(index, 'down')}
              disabled={index === sections.length - 1}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-primary/30 transition-all">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{section.title}</h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {sectionTypes.find(t => t.type === section.type)?.label || section.type}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleRegenerateSection(section.id)}
                disabled={isRegenerating === section.id}
                className="p-2 text-gray-400 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors"
                title="Regenerovat AI"
              >
                {isRegenerating === section.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
              <button
                onClick={() => setEditingSection(section.id)}
                className="p-2 text-gray-400 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors"
                title="Upravit"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDuplicateSection(section)}
                className="p-2 text-gray-400 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors"
                title="Duplikovat"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Smazat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap line-clamp-4">
            {section.content || 'Žádný obsah. Klikněte na upravit pro přidání textu.'}
          </p>

          {section.purpose && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-violet-700 bg-violet-100/50 px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                <Target size={12} /> Cíl: {section.purpose}
              </span>
            </div>
          )}

          {/* Mobile Move Buttons */}
          <div className="flex md:hidden items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleMoveSection(index, 'up')}
              disabled={index === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30"
            >
              <ChevronUp size={14} /> Nahoru
            </button>
            <button
              onClick={() => handleMoveSection(index, 'down')}
              disabled={index === sections.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-primary hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30"
            >
              <ChevronDown size={14} /> Dolů
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Preview Mode Component
  const PreviewMode = () => (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Browser Mock Header */}
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-gray-500 border border-gray-200">
              https://{profile?.companyName?.toLowerCase().replace(/\s+/g, '-') || 'vase-firma'}.cz
            </div>
          </div>
        </div>

        {/* Page Content Preview */}
        <div className="p-6 md:p-8 space-y-8">
          {sections.map((section, i) => {
            const Icon = getSectionIcon(section.type);
            
            return (
              <div key={section.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                {section.type === 'hero' ? (
                  <div className="text-center py-8 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl">
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-4">{section.title}</h1>
                    <p className="text-gray-600 max-w-xl mx-auto mb-6">{section.content}</p>
                    <button className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold">
                      Začít nyní
                    </button>
                  </div>
                ) : section.type === 'cta' ? (
                  <div className="text-center py-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white">
                    <h2 className="text-xl md:text-2xl font-bold mb-3">{section.title}</h2>
                    <p className="text-violet-100 mb-6">{section.content}</p>
                    <button className="px-8 py-3 bg-white text-primary rounded-xl font-bold">
                      Kontaktujte nás
                    </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-20 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage('strategy')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Landing Page Editor</h1>
                <p className="text-sm text-gray-500">{profile.companyName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="bg-gray-100 rounded-xl p-1 flex">
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !isPreviewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit3 size={16} />
                  <span className="hidden sm:inline">Editace</span>
                </button>
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPreviewMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye size={16} />
                  <span className="hidden sm:inline">Náhled</span>
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  hasChanges
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-primary/25'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Uložit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {isPreviewMode ? (
          <PreviewMode />
        ) : (
          <div className="space-y-6">
            {/* Sections List */}
            {sections.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} />
            ))}

            {/* Add Section Button */}
            {isAddingSection ? (
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-primary/30 animate-in fade-in">
                <h4 className="font-bold text-gray-900 mb-4">Vyberte typ sekce</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sectionTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.type}
                        onClick={() => handleAddSection(type.type as LandingSection['type'])}
                        className="p-4 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-primary/30 rounded-xl text-left transition-all group"
                      >
                        <Icon size={24} className="text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                        <div className="font-bold text-sm text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setIsAddingSection(false)}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Zrušit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSection(true)}
                className="w-full p-6 border-2 border-dashed border-gray-200 hover:border-primary/30 rounded-2xl text-gray-500 hover:text-primary flex items-center justify-center gap-2 transition-all group"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Přidat sekci</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <span className="text-sm font-medium">Máte neuložené změny</span>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-primary rounded-lg text-sm font-bold hover:bg-violet-500 transition-colors"
            >
              {isSaving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageEditor;
