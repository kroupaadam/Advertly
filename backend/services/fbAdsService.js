import dotenv from 'dotenv';
import OpenAI from 'openai';
import { searchCompetitorAds, checkApiStatus } from './facebookAdsLibrary.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * Facebook Ads Library Scraping Service
 * 
 * Tento service kombinuje:
 * 1. Reálná data z Facebook Ads Library API (pokud je nakonfigurováno)
 * 2. AI analýzu a generování kampaní
 */

// Pomocná funkce pro transformaci onboarding dat na profil
export const transformOnboardingToProfile = (onboardingData) => {
  const priceRangeMap = {
    'under_50k': { min: 0, max: 50000, label: 'do 50 000 Kč' },
    '50k_200k': { min: 50000, max: 200000, label: '50 000 - 200 000 Kč' },
    '200k_1m': { min: 200000, max: 1000000, label: '200 000 - 1 000 000 Kč' },
    '1m_5m': { min: 1000000, max: 5000000, label: '1 - 5 milionů Kč' },
    'over_5m': { min: 5000000, max: 50000000, label: 'nad 5 milionů Kč' },
  };

  const customerTypeMap = {
    'b2c_private': 'B2C - majitelé domů a byty',
    'b2b_business': 'B2B - firmy a korporace',
    'mixed': 'Mix B2C a B2B',
  };

  const decisionTimeMap = {
    'days': 'dny',
    'weeks': 'týdny',
    'months': 'měsíce',
  };

  const mainFearMap = {
    'price_roi': 'cena a návratnost investice',
    'result_quality': 'že výsledek nebude odpovídat očekávání',
    'technical_issues': 'technické komplikace',
    'time_disruption': 'délka realizace a zásah do života',
    'other': onboardingData.mainFearOther || 'jiný strach',
  };

  const leadQualityMap = {
    'quality_over_quantity': 'kvalita - méně poptávek, ale vážní zájemci',
    'volume_over_quality': 'objem - více poptávek, i nerozhodnutí',
  };

  const firstStepMap = {
    'consultation': 'odborná konzultace',
    'assessment': 'technické posouzení / zaměření',
    'price_estimate': 'orientační cenový odhad',
    'checklist': 'checklist / průvodce',
    'none': 'žádný nezávazný krok',
  };

  const uspMap = {
    'speed': 'rychlost realizace',
    'quality': 'kvalita zpracování a detail',
    'custom_solution': 'individuální řešení na míru',
    'technology': 'technické řešení a inovace',
    'references': 'reference a realizace podobných projektů',
    'price': 'nejlepší cena na trhu',
    'other': onboardingData.uspOther || 'jiná výhoda',
  };

  const guaranteeMap = {
    'output_match': 'shoda výsledku s odsouhlaseným návrhem',
    'timeline': 'dodržení termínu realizace',
    'fixed_price': 'pevná cena bez navýšení',
    'satisfaction': 'spokojenost zákazníka / úpravy',
    'none': 'bez formální garance',
  };

  const ctaMap = {
    'request_consultation': 'Požádat o konzultaci',
    'book_meeting': 'Domluvit schůzku',
    'send_info': 'Poslat informace o projektu',
    'other': onboardingData.ctaOther || 'Kontaktovat',
  };

  return {
    companyName: onboardingData.companyName,
    whatYouSell: onboardingData.whatYouSell,
    customerType: customerTypeMap[onboardingData.customerType] || onboardingData.customerType,
    priceRange: priceRangeMap[onboardingData.priceRange] || { label: 'nezadáno' },
    decisionTime: decisionTimeMap[onboardingData.decisionTime] || onboardingData.decisionTime,
    mainFear: mainFearMap[onboardingData.mainFear] || onboardingData.mainFear,
    leadQuality: leadQualityMap[onboardingData.leadQualityVsVolume] || onboardingData.leadQualityVsVolume,
    firstStep: firstStepMap[onboardingData.firstStep] || onboardingData.firstStep,
    usp: uspMap[onboardingData.usp] || onboardingData.usp,
    guarantee: guaranteeMap[onboardingData.guarantee] || onboardingData.guarantee,
    cta: ctaMap[onboardingData.cta] || onboardingData.cta,
  };
};

// Generování analýzy konkurence na základě produktu
export const analyzeCompetitors = async (profile) => {
  const prompt = `Jsi expert na analýzu konkurence v oblasti digitálního marketingu v České republice.

Na základě následujících informací o firmě analyzuj trh a konkurenci:

Firma: ${profile.companyName}
Produkt/služba: ${profile.whatYouSell}
Typ zákazníka: ${profile.customerType}
Cenové rozmezí: ${profile.priceRange.label}
USP: ${profile.usp}

Vytvoř analýzu v JSON formátu:
{
  "competitors": [
    {
      "name": "Název konkurenta",
      "estimatedMarketShare": "např. 15%",
      "strengths": ["silná stránka 1", "silná stránka 2"],
      "weaknesses": ["slabina 1", "slabina 2"],
      "adStrategy": "Jak inzerují - jaké kanály, messaging, nabídky",
      "pricePositioning": "premium / střední / budget"
    }
  ],
  "marketInsights": {
    "totalMarketSize": "Odhad velikosti trhu v ČR",
    "growthRate": "Růst trhu ročně",
    "mainTrends": ["trend 1", "trend 2", "trend 3"],
    "seasonality": "Sezónnost poptávky"
  },
  "opportunities": ["příležitost 1", "příležitost 2", "příležitost 3"],
  "threats": ["hrozba 1", "hrozba 2"],
  "recommendedAdApproach": "Doporučený přístup k reklamám na základě analýzy konkurence"
}

Vrať POUZE validní JSON, nic jiného.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Jsi expert na marketing a analýzu konkurence. Odpovídej vždy v JSON formátu.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing competitors:', error);
    throw new Error(`Nepodařilo se analyzovat konkurenci: ${error.message}`);
  }
};

// Generování reklamních textů na základě analýzy
export const generateAdCampaign = async (profile, competitorAnalysis) => {
  const prompt = `Jsi expert copywriter specializující se na výkonnostní reklamy na Facebooku a Instagramu.

Na základě následujících informací vytvoř kompletní reklamní kampaň:

FIRMA:
- Název: ${profile.companyName}
- Produkt: ${profile.whatYouSell}
- Zákazník: ${profile.customerType}
- Cena: ${profile.priceRange.label}
- Doba rozhodování: ${profile.decisionTime}
- Hlavní strach zákazníka: ${profile.mainFear}
- Cíl poptávek: ${profile.leadQuality}
- První krok: ${profile.firstStep}
- USP: ${profile.usp}
- Garance: ${profile.guarantee}
- CTA: ${profile.cta}

ANALÝZA KONKURENCE:
${JSON.stringify(competitorAnalysis, null, 2)}

Vytvoř reklamní kampaň v JSON formátu:
{
  "campaignStrategy": {
    "objective": "Cíl kampaně",
    "targetAudience": "Popis cílové skupiny",
    "funnelStage": "cold / warm / hot",
    "budgetSplit": {
      "coldAudience": 50,
      "warmAudience": 30,
      "hotAudience": 20
    },
    "recommendedChannels": ["Facebook", "Instagram", "atd."]
  },
  "adVariants": [
    {
      "name": "Varianta 1 - Hlavní",
      "type": "static",
      "angle": "Jaký úhel/hook používá",
      "headline": "Headline reklamy (max 60 znaků)",
      "primaryText": "Hlavní text reklamy (100-150 slov) - má zaujmout, vysvětlit hodnotu a vyvolat akci",
      "cta": "Text CTA tlačítka",
      "visualDescription": "Popis vizuálu pro designera",
      "targetEmotion": "Jakou emoci má vyvolat"
    },
    {
      "name": "Varianta 2 - Video hook",
      "type": "video",
      "angle": "Jiný úhel než varianta 1",
      "headline": "Headline pro video",
      "hook": "První 3 vteřiny - co říct aby lidi nepřeskočili (15 slov max)",
      "script": "Celý skript videa (30-60 sekund, scene by scene)",
      "cta": "Text CTA",
      "visualDescription": "Popis vizuálů a scén"
    },
    {
      "name": "Varianta 3 - Social proof",
      "type": "static",
      "angle": "Důkaz a reference",
      "headline": "Headline s důrazem na výsledky",
      "primaryText": "Text zaměřený na výsledky a spokojenost zákazníků",
      "cta": "Text CTA",
      "visualDescription": "Popis vizuálu s testimonialem/čísly"
    },
    {
      "name": "Varianta 4 - Remarketing",
      "type": "static", 
      "angle": "Pro ty co už navštívili web",
      "headline": "Remarketing headline",
      "primaryText": "Text překonávající námitky, urgence",
      "cta": "Silnější CTA",
      "visualDescription": "Remarketing vizuál"
    }
  ],
  "landingPageStructure": {
    "hero": {
      "headline": "Hlavní headline landing page",
      "subheadline": "Podtitulek vysvětlující nabídku",
      "cta": "CTA tlačítko"
    },
    "problemSection": "Text o problému zákazníka",
    "solutionSection": "Jak to řešíme",
    "socialProof": "Jaké důkazy ukázat",
    "processSteps": ["Krok 1", "Krok 2", "Krok 3"],
    "guarantee": "Text garance",
    "faq": [
      {"question": "Otázka 1", "answer": "Odpověď 1"},
      {"question": "Otázka 2", "answer": "Odpověď 2"},
      {"question": "Otázka 3", "answer": "Odpověď 3"}
    ],
    "finalCta": "Závěrečná výzva k akci"
  },
  "expectedResults": {
    "estimatedCTR": "Očekávaný CTR",
    "estimatedCPL": "Očekávaná cena za lead",
    "keyMetricsToTrack": ["metrika 1", "metrika 2", "metrika 3"],
    "optimizationTips": ["tip 1", "tip 2", "tip 3"]
  }
}

Vrať POUZE validní JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Jsi expert copywriter. Piš v češtině. Odpovídej vždy v JSON formátu.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating ad campaign:', error);
    throw new Error(`Nepodařilo se vygenerovat kampaň: ${error.message}`);
  }
};

// Hlavní funkce - kompletní generování strategie z onboardingu
export const generateCompleteStrategyFromOnboarding = async (onboardingData) => {
  console.log('🚀 Starting strategy generation from onboarding data...');
  
  // 1. Transformovat data
  const profile = transformOnboardingToProfile(onboardingData);
  console.log('✅ Profile transformed');

  // 2. Zkusit získat reálná data z Facebook Ads Library
  let realAdsData = null;
  try {
    const fbStatus = await checkApiStatus();
    if (fbStatus.valid) {
      console.log('📡 Facebook Ads Library API is connected, fetching real ads...');
      realAdsData = await searchCompetitorAds(profile);
      console.log(`✅ Found ${realAdsData.competitorAds?.length || 0} competitor ads`);
    } else {
      console.log('⚠️ Facebook Ads Library API not configured, using AI analysis...');
    }
  } catch (fbError) {
    console.log('⚠️ Facebook API error, falling back to AI analysis:', fbError.message);
  }

  // 3. Analyzovat konkurenci (AI + reálná data pokud jsou dostupná)
  console.log('🔍 Analyzing competitors...');
  const competitorAnalysis = await analyzeCompetitors(profile);
  
  // Přidat reálná data pokud jsou dostupná
  if (realAdsData && realAdsData.competitorAds?.length > 0) {
    competitorAnalysis.realAdsFromLibrary = realAdsData.competitorAds.slice(0, 10);
    competitorAnalysis.insights = [
      ...(competitorAnalysis.insights || []),
      ...(realAdsData.insights || []),
    ];
    competitorAnalysis.dataSource = 'facebook_ads_library + ai';
  } else {
    competitorAnalysis.dataSource = 'ai_only';
  }
  console.log('✅ Competitor analysis complete');

  // 4. Generovat kampaň
  console.log('✍️ Generating ad campaign...');
  const adCampaign = await generateAdCampaign(profile, competitorAnalysis);
  console.log('✅ Ad campaign generated');

  return {
    profile,
    competitorAnalysis,
    adCampaign,
    realAdsData,
    generatedAt: new Date().toISOString(),
  };
};

export default {
  transformOnboardingToProfile,
  analyzeCompetitors,
  generateAdCampaign,
  generateCompleteStrategyFromOnboarding,
};
