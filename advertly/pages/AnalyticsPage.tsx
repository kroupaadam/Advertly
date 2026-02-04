import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import ButtonColorful from '../components/ButtonColorful';
import { PieChart, PlusCircle } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { strategies, activeProfileId, profiles, setPage } = useApp();

  // Get current strategy and profile
  const currentProfile = useMemo(() => {
    return activeProfileId ? profiles.find(p => p.id === activeProfileId) : undefined;
  }, [profiles, activeProfileId]);

  const currentStrategy = useMemo(() => {
    return activeProfileId ? strategies[activeProfileId] : undefined;
  }, [strategies, activeProfileId]);

  // Extract analytics data from strategy
  const analyticsData = useMemo(() => {
    // Check if we have a strategy
    if (!currentStrategy) return null;

    const result = currentStrategy.result || currentStrategy;
    const expectedResults = result.adCampaign?.expectedResults || result.expectedResults || {};
    const campaignStrategy = result.adCampaign?.campaignStrategy || result.campaignStrategy || {};
    const budget = result.adCampaign?.budget || result.budget || {};
    const onboarding = currentStrategy.onboardingData || {};

    return {
      expectedResults: {
        estimatedCTR: expectedResults.estimatedCTR || '2-4%',
        estimatedCPA: expectedResults.estimatedCPA || '150-300 Kč',
        estimatedLeadsPerMonth: expectedResults.estimatedLeadsPerMonth || '20-50',
        estimatedROI: expectedResults.estimatedROI || '200-400%',
        breakEvenPoint: expectedResults.breakEvenPoint || '2-3 měsíce'
      },
      budget: {
        monthly: budget.monthly || onboarding.monthlyBudget || 0,
        allocation: budget.allocation || {
          awareness: 30,
          consideration: 40,
          conversion: 30
        }
      },
      campaignGoals: campaignStrategy.goals || ['Zvýšení povědomí', 'Generování leadů'],
      targetAudience: result.generatedProfile?.icp || result.icp || {}
    };
  }, [currentStrategy]);

  // No strategy case
  if (!currentStrategy || !currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 font-sans">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 relative">
            <PieChart size={40} className="text-gray-300" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                <PlusCircle size={16} />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytika není dostupná</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
          Nejprve vytvořte strategii. Na základě vaší strategie uvidíte očekávané výsledky.
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

  const { expectedResults, budget, campaignGoals, targetAudience } = analyticsData;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytika a predikce</h1>
        <p className="text-gray-600">
          Očekávané výsledky vašich reklamních kampaní
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              CTR
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{expectedResults.estimatedCTR}</div>
          <div className="text-gray-600 text-sm">Očekávaná míra prokliku</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Leads
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{expectedResults.estimatedLeadsPerMonth}</div>
          <div className="text-gray-600 text-sm">Leadů měsíčně</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              CPA
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{expectedResults.estimatedCPA}</div>
          <div className="text-gray-600 text-sm">Cena za akvizici</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              ROI
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{expectedResults.estimatedROI}</div>
          <div className="text-gray-600 text-sm">Očekávaná návratnost</div>
        </div>
      </div>

      {/* Budget & Goals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget Allocation */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Alokace rozpočtu
          </h3>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Měsíční rozpočet</span>
              <span className="text-2xl font-bold text-gray-900">
                {typeof budget.monthly === 'number' 
                  ? `${budget.monthly.toLocaleString('cs-CZ')} Kč`
                  : budget.monthly || 'Neuvedeno'
                }
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Awareness */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Povědomí (Awareness)</span>
                <span className="text-gray-900 font-medium">{budget.allocation.awareness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${budget.allocation.awareness}%` }}
                />
              </div>
            </div>

            {/* Consideration */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Zvažování (Consideration)</span>
                <span className="text-gray-900 font-medium">{budget.allocation.consideration}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${budget.allocation.consideration}%` }}
                />
              </div>
            </div>

            {/* Conversion */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Konverze (Conversion)</span>
                <span className="text-gray-900 font-medium">{budget.allocation.conversion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${budget.allocation.conversion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Break-even point</span>
              <span className="text-green-600 font-medium">{expectedResults.breakEvenPoint}</span>
            </div>
          </div>
        </div>

        {/* Campaign Goals & ICP */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cíle kampaně
          </h3>

          <div className="space-y-3 mb-6">
            {(Array.isArray(campaignGoals) ? campaignGoals : [campaignGoals]).map((goal: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{goal}</span>
              </div>
            ))}
          </div>

          {/* ICP Summary */}
          {targetAudience && Object.keys(targetAudience).length > 0 && (
            <div className="pt-4 border-t border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Cílová skupina</h4>
              <div className="space-y-2">
                {targetAudience.demographics && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700 text-sm">{typeof targetAudience.demographics === 'string' ? targetAudience.demographics : JSON.stringify(targetAudience.demographics)}</span>
                  </div>
                )}
                {targetAudience.psychographics && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-gray-700 text-sm">{typeof targetAudience.psychographics === 'string' ? targetAudience.psychographics : JSON.stringify(targetAudience.psychographics)}</span>
                  </div>
                )}
                {targetAudience.painPoints && Array.isArray(targetAudience.painPoints) && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-gray-700 text-sm">
                      Pain points: {targetAudience.painPoints.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Doporučení
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-green-400 font-medium">Silné stránky</span>
            </div>
            <p className="text-gray-700 text-sm">
              Vaše strategie má dobře definovanou cílovou skupinu a realistický rozpočet pro dosažení výsledků.
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-amber-400 font-medium">Na co si dát pozor</span>
            </div>
            <p className="text-gray-700 text-sm">
              Doporučujeme průběžně testovat různé varianty reklam a sledovat, které performují nejlépe.
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <span className="text-blue-400 font-medium">Další krok</span>
            </div>
            <p className="text-gray-700 text-sm">
              Nastavte si landing page a spusťte první kampaň. Data z reálného provozu vám pomohou optimalizovat.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setPage('campaigns')}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
        >
          Zobrazit kampaně
        </button>
        <button
          onClick={() => setPage('strategy')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Zobrazit celou strategii
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPage;
