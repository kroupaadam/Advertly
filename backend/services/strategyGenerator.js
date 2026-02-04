import { openai, AI_MODEL } from '../config/openai.js';
import { aiLogger } from '../config/logger.js';
import { searchAds, checkApiStatus } from './facebookAdsLibrary.js';

// ============================================================================
// SYSTÉMOVÉ PROMPTY PRO AI - PROFESIONÁLNÍ COPYWRITING
// ============================================================================

const SYSTEM_PROMPTS = {
  // Expert copywriter pro Facebook/Instagram reklamy
  adCopywriter: `Jsi světově uznávaný direct response copywriter s 15 lety zkušeností. Specializuješ se na Facebook a Instagram reklamy pro české firmy.

TVOJE SILNÉ STRÁNKY:
- Píšeš hooky, které zastaví scrollování do 3 vteřin
- Rozumíš psychologii českého zákazníka
- Kombinuješ emoce s logickými argumenty
- Vytváříš urgenci bez manipulace
- Každý text má jasný CTA

PRAVIDLA PRO PSANÍ:
1. Používej "ty" formu (tykání), ne "vy"
2. Piš česky, přirozeně - žádné doslovné překlady z angličtiny
3. Krátké věty. Jasné sdělení. Bez zbytečných slov.
4. Každá reklama řeší konkrétní problém a nabízí řešení
5. Používej čísla a specifika místo obecností
6. Vždy uveď jasnou výhodu pro zákazníka

FORMÁTY KTERÉ FUNGUJÍ:
- Hook → Problém → Řešení → Důkaz → CTA
- Otázka → Agitace → Řešení
- Příběh → Poučení → Nabídka
- Statistika → Implikace → Řešení`,

  // Expert na analýzu konkurence
  competitorAnalyst: `Jsi strategický konzultant specializující se na competitive intelligence v digitálním marketingu.

TVOJE ÚKOLY:
1. Analyzovat reklamní strategie konkurence
2. Identifikovat mezery na trhu (co nikdo nedělá)
3. Najít příležitosti k diferenciaci
4. Určit best practices v oboru

ZPŮSOB ANALÝZY:
- Analyzuješ messaging (co říkají, jak to říkají)
- Hodnotíš vizuální styl (profesionální, casual, luxusní)
- Identifikuješ cílovou skupinu z obsahu reklam
- Určuješ cenovou pozici (premium, střed, budget)
- Hledáš slabiny v jejich komunikaci

Vždy poskytuj actionable insights, ne jen pozorování.`,

  // Expert na ICP (Ideal Customer Profile)
  icpExpert: `Jsi expert na customer research a buyer personas.

TVOJE METODOLOGIE:
1. Demografické údaje (věk, lokace, příjem, vzdělání)
2. Psychografické údaje (hodnoty, obavy, touhy)
3. Behaviorální data (jak nakupují, kde tráví čas online)
4. Pain points (co je trápí, co je frustruje)
5. Dream outcome (ideální výsledek, kterého chtějí dosáhnout)

Vždy vytváříš profil založený na reálném chování, ne na předpokladech.`,

  // Expert na landing pages
  landingPageExpert: `Jsi UX/conversion specialist s track recordem 40%+ conversion rate na landing pages.

TVOJE PRINCIPY:
1. Jasná value proposition above the fold
2. Jeden cíl = jedna akce
3. Social proof strategicky umístěný
4. Odstranění všech frikcí a pochybností
5. Urgence a scarcity (pokud je relevantní)
6. Mobile-first design myšlení

STRUKTURA LANDING PAGE:
- Hero: Headline + subheadline + CTA + vizuál
- Problem: Pojmenuj bolest zákazníka
- Solution: Představ řešení jako hrdinu
- Features/Benefits: Co získá, ne co děláš
- Social Proof: Testimonials, loga, čísla
- Guarantee: Sniž vnímané riziko
- FAQ: Odpověz na námitky
- Final CTA: Zopakuj nabídku s urgencí`,
};

// ============================================================================
// HELPER FUNKCE
// ============================================================================

/**
 * Generuje search terms pro Facebook Ads Library na základě produktu/služby
 */
const generateSearchTerms = (onboardingData) => {
  const product = onboardingData.whatYouSell?.toLowerCase() || '';
  const description = onboardingData.serviceDescription?.toLowerCase() || '';
  const area = onboardingData.serviceArea?.toLowerCase() || '';
  
  const terms = new Set();
  
  // Hlavní produkt/služba
  if (product) terms.add(product);
  
  // Extrahovat klíčová slova z popisu
  const keywords = description.split(/[,.\s]+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
  keywords.forEach(kw => terms.add(kw));
  
  // Kombinace s lokalitou
  if (area && product) {
    terms.add(`${product} ${area}`);
  }
  
  // Synonyma a variace běžných služeb
  const synonymMap = {
    'zimní zahrada': ['zimní zahrady', 'zasklení terasy', 'prosklená přístavba', 'pergola'],
    'střecha': ['střechy', 'pokrývač', 'klempíř', 'rekonstrukce střechy'],
    'okna': ['plastová okna', 'výměna oken', 'eurookna', 'montáž oken'],
    'kuchyně': ['kuchyně na míru', 'kuchyňská linka', 'kuchyňské studio'],
    'koupelna': ['rekonstrukce koupelny', 'koupelny na klíč', 'obklady dlažby'],
    'podlaha': ['podlahy', 'podlahář', 'vinylová podlaha', 'plovoucí podlaha'],
    'elektro': ['elektrikář', 'elektroinstalace', 'elektromontáže'],
    'topení': ['topenář', 'plynař', 'tepelné čerpadlo', 'kotle'],
    'zahrada': ['zahradník', 'údržba zahrady', 'zahradní architekt', 'realizace zahrad'],
    'stavba': ['stavební firma', 'výstavba domu', 'hrubá stavba', 'rekonstrukce'],
    'malíř': ['malířské práce', 'natěrač', 'fasáda', 'omítky'],
    'nábytek': ['nábytek na míru', 'truhlář', 'vestavěné skříně', 'interiérový design'],
    'auto': ['autoservis', 'pneuservis', 'autoopravna', 'lakování aut'],
    'web': ['tvorba webu', 'webové stránky', 'eshop', 'webdesign'],
    'marketing': ['digitální marketing', 'reklama', 'social media', 'PPC'],
    'účetnictví': ['účetní', 'daňový poradce', 'vedení účetnictví', 'mzdy'],
    'právo': ['advokát', 'právník', 'právní služby', 'právní poradenství'],
    'finance': ['finanční poradce', 'hypotéka', 'úvěr', 'pojištění'],
    'foto': ['fotograf', 'fotografování', 'produktová fotografie', 'svatební fotograf'],
  };

  // Přidat synonyma pokud existují
  Object.entries(synonymMap).forEach(([key, values]) => {
    if (product.includes(key) || description.includes(key)) {
      values.forEach(v => terms.add(v));
    }
  });

  return Array.from(terms).slice(0, 10); // Max 10 search terms
};

/**
 * Formátuje data z onboardingu do čitelné podoby pro AI
 */
const formatOnboardingForAI = (data) => {
  const priceLabels = {
    'under_50k': 'do 50 000 Kč',
    '50k_200k': '50 000 - 200 000 Kč',
    '200k_1m': '200 000 Kč - 1 milion Kč',
    '1m_5m': '1 - 5 milionů Kč',
    'over_5m': 'nad 5 milionů Kč',
  };

  const customerTypeLabels = {
    'b2c_private': 'Soukromé osoby (B2C)',
    'b2b_business': 'Firmy (B2B)',
    'mixed': 'Mix B2C i B2B',
  };

  const decisionTimeLabels = {
    'days': 'Dny',
    'weeks': 'Týdny',
    'months': 'Měsíce',
  };

  const fearLabels = {
    'price_roi': 'Cena a návratnost investice',
    'result_quality': 'Kvalita výsledku',
    'technical_issues': 'Technické problémy',
    'time_disruption': 'Doba realizace a zásah do života',
  };

  const uspLabels = {
    'speed': 'Rychlost realizace',
    'quality': 'Kvalita zpracování',
    'custom_solution': 'Individuální řešení na míru',
    'technology': 'Moderní technologie',
    'references': 'Silné reference',
    'price': 'Konkurenční cena',
  };

  const guaranteeLabels = {
    'output_match': 'Garance shody s návrhem',
    'timeline': 'Garance termínu',
    'fixed_price': 'Garance pevné ceny',
    'satisfaction': 'Garance spokojenosti',
    'none': 'Bez formální garance',
  };

  const toneLabels = {
    'professional': 'Profesionální',
    'friendly': 'Přátelský',
    'casual': 'Neformální',
    'luxury': 'Luxusní',
    'technical': 'Technický/odborný',
  };

  const ctaLabels = {
    'request_consultation': 'Požádat o konzultaci',
    'book_meeting': 'Domluvit schůzku',
    'send_info': 'Poslat informace o projektu',
    'other': data.ctaOther || 'Jiné',
  };

  const budgetLabels = {
    'nothing': 'Zatím nic',
    'under_10k': 'do 10 000 Kč/měsíc',
    '10k_30k': '10 000 - 30 000 Kč/měsíc',
    '30k_100k': '30 000 - 100 000 Kč/měsíc',
    'over_100k': 'nad 100 000 Kč/měsíc',
  };

  const plannedBudgetLabels = {
    'under_10k': 'do 10 000 Kč/měsíc',
    '10k_30k': '10 000 - 30 000 Kč/měsíc',
    '30k_50k': '30 000 - 50 000 Kč/měsíc',
    '50k_100k': '50 000 - 100 000 Kč/měsíc',
    'over_100k': 'nad 100 000 Kč/měsíc',
  };

  return {
    companyName: data.companyName,
    whatYouSell: data.whatYouSell,
    serviceDescription: data.serviceDescription,
    customerType: customerTypeLabels[data.customerType] || data.customerType,
    priceRange: priceLabels[data.priceRange] || data.priceRange,
    completedProjects: data.completedProjects,
    yearsInBusiness: data.yearsInBusiness,
    serviceArea: data.serviceArea,
    decisionTime: decisionTimeLabels[data.decisionTime] || data.decisionTime,
    mainFear: fearLabels[data.mainFear] || data.mainFearOther || data.mainFear,
    freeQuote: data.freeQuote === 'yes' ? 'Ano, zdarma' : 'Ne, placené',
    usp: uspLabels[data.usp] || data.uspOther || data.usp,
    guarantee: guaranteeLabels[data.guarantee] || data.guarantee,
    hasWarranty: data.hasWarranty ? `Ano - ${data.warrantyDescription || 'bez detailu'}` : 'Ne',
    leadPreference: data.leadQualityVsVolume === 'quality_over_quantity' 
      ? 'Kvalita (méně poptávek, ale vážní zájemci)' 
      : 'Objem (více poptávek)',
    firstStep: data.firstStep,
    currentBudget: budgetLabels[data.currentMarketingBudget] || data.currentMarketingBudget,
    targetSales: data.targetMonthlySales,
    plannedBudget: plannedBudgetLabels[data.plannedMarketingBudget] || data.plannedMarketingBudget,
    toneOfVoice: toneLabels[data.toneOfVoice] || data.toneOfVoice,
    cta: ctaLabels[data.cta] || data.cta,
    additionalInfo: data.additionalInfo || 'Neuvedeno',
  };
};

// ============================================================================
// HLAVNÍ GENEROVACÍ FUNKCE
// ============================================================================

/**
 * KROK 1: Ověření a příprava dat z formuláře
 */
export const validateAndPrepareData = async (onboardingData, progressCallback) => {
  progressCallback?.('Ověřuji vaše odpovědi a formulář...');
  
  // Validate required fields
  const required = ['companyName', 'whatYouSell', 'serviceDescription'];
  const missing = required.filter(field => !onboardingData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Chybějící povinná pole: ${missing.join(', ')}`);
  }

  // Format data for AI
  const formattedData = formatOnboardingForAI(onboardingData);
  
  // Generate search terms for competitor research
  const searchTerms = generateSearchTerms(onboardingData);
  
  return {
    rawData: onboardingData,
    formattedData,
    searchTerms,
  };
};

/**
 * KROK 2: Scrapování reálných reklam z Facebook Ads Library
 */
export const scrapeCompetitorAds = async (searchTerms, companyName, progressCallback) => {
  progressCallback?.('Scrapuji konkurenci a analyzuji trh...');
  
  // Check if FB API is available
  const apiStatus = await checkApiStatus();
  
  if (!apiStatus.valid) {
    aiLogger.warn('Facebook Ads Library API not configured, skipping real ads');
    return {
      available: false,
      ads: [],
      reason: apiStatus.message,
    };
  }

  const allAds = [];
  const processedPageIds = new Set();

  // Search for each term
  for (const term of searchTerms.slice(0, 5)) { // Max 5 searches to avoid rate limits
    try {
      progressCallback?.(`Hledám reklamy: "${term}"...`);
      
      const result = await searchAds({
        searchTerms: term,
        country: 'CZ',
        adActiveStatus: 'ACTIVE',
        limit: 20,
      });

      if (result.ads?.length > 0) {
        for (const ad of result.ads) {
          // Skip own ads and duplicates
          const isOwnAd = ad.page_name?.toLowerCase().includes(companyName?.toLowerCase());
          const isDuplicate = processedPageIds.has(ad.page_id);
          
          if (!isOwnAd && !isDuplicate) {
            processedPageIds.add(ad.page_id);
            allAds.push({
              id: ad.id,
              pageName: ad.page_name,
              pageId: ad.page_id,
              headline: ad.ad_creative_link_titles?.[0] || '',
              bodyText: ad.ad_creative_bodies?.[0] || '',
              description: ad.ad_creative_link_descriptions?.[0] || '',
              linkCaption: ad.ad_creative_link_captions?.[0] || '',
              platforms: ad.publisher_platforms || [],
              startDate: ad.ad_delivery_start_time,
              snapshotUrl: ad.ad_snapshot_url,
              searchTerm: term,
            });
          }
        }
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      aiLogger.error({ term, err: error.message }, 'Error searching for term');
    }
  }

  aiLogger.info({ count: allAds.length, competitors: processedPageIds.size }, 'Found competitor ads');
  
  return {
    available: true,
    ads: allAds,
    uniqueCompetitors: processedPageIds.size,
    searchTermsUsed: searchTerms.slice(0, 5),
  };
};

/**
 * KROK 3: AI Analýza konkurence (kombinace reálných dat + AI insights)
 */
export const analyzeCompetition = async (formattedData, realAds, progressCallback) => {
  progressCallback?.('Analyzuji vaše odpovědi...');

  // Build context from real ads
  let realAdsContext = '';
  if (realAds.available && realAds.ads.length > 0) {
    realAdsContext = `
REÁLNÉ REKLAMY KONKURENCE (z Facebook Ads Library):
${realAds.ads.slice(0, 10).map((ad, i) => `
${i + 1}. ${ad.pageName}
   Headline: ${ad.headline || 'N/A'}
   Text: ${ad.bodyText?.substring(0, 200) || 'N/A'}...
   Platformy: ${ad.platforms?.join(', ') || 'N/A'}
`).join('')}

Celkem nalezeno ${realAds.ads.length} aktivních reklam od ${realAds.uniqueCompetitors} konkurentů.
`;
  } else {
    realAdsContext = `
POZNÁMKA: Nepodařilo se získat reálná data z Facebook Ads Library.
Analyzuj konkurenci na základě znalostí trhu a odvětví.
`;
  }

  const prompt = `Analyzuj konkurenci a trh pro tuto firmu:

PROFIL FIRMY:
${JSON.stringify(formattedData, null, 2)}

${realAdsContext}

Na základě těchto informací vytvoř detailní analýzu v JSON formátu:

{
  "marketOverview": {
    "marketSize": "Odhad velikosti trhu v ČR",
    "competition": "nízká / střední / vysoká",
    "growthTrend": "rostoucí / stabilní / klesající",
    "seasonality": "Popis sezónnosti (kdy je nejvíc poptávek)"
  },
  "competitors": [
    {
      "name": "Název konkurenta (nebo typ)",
      "positioning": "premium / střední / budget",
      "strengths": ["silná stránka 1", "silná stránka 2"],
      "weaknesses": ["slabina 1", "slabina 2"],
      "adApproach": "Jak komunikují v reklamách",
      "estimatedBudget": "Odhad měsíčního budgetu na reklamu"
    }
  ],
  "adInsights": {
    "commonAngles": ["Jaké úhly/hooky používají", "např. cena, kvalita, rychlost"],
    "missingAngles": ["Co nikdo nepoužívá - příležitost"],
    "averageCopyLength": "Krátký (do 100 slov) / Střední / Dlouhý",
    "commonCTAs": ["Nejčastější výzvy k akci"],
    "visualTrends": "Jaký typ vizuálů převládá"
  },
  "opportunities": [
    "Konkrétní příležitost jak se odlišit 1",
    "Konkrétní příležitost jak se odlišit 2",
    "Konkrétní příležitost jak se odlišit 3"
  ],
  "threats": [
    "Hlavní hrozba/riziko 1",
    "Hlavní hrozba/riziko 2"
  ],
  "recommendedDifferentiation": "Konkrétní doporučení jak se odlišit od konkurence (2-3 věty)"
}

DŮLEŽITÉ: Vrať POUZE validní JSON, žádný další text.`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.competitorAnalyst },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Add real ads data if available
    if (realAds.available && realAds.ads.length > 0) {
      analysis.realAdsData = {
        available: true,
        count: realAds.ads.length,
        competitors: realAds.uniqueCompetitors,
        samples: realAds.ads.slice(0, 5),
      };
    }

    return analysis;
  } catch (error) {
    aiLogger.error({ err: error }, 'Error analyzing competition');
    throw new Error(`Chyba při analýze konkurence: ${error.message}`);
  }
};

/**
 * KROK 4: Generování ICP (Ideal Customer Profile)
 */
export const generateICP = async (formattedData, competitorAnalysis, progressCallback) => {
  progressCallback?.('Generuji profil ideálního zákazníka...');

  const prompt = `Vytvoř detailní profil ideálního zákazníka (ICP) pro tuto firmu:

FIRMA:
${JSON.stringify(formattedData, null, 2)}

ANALÝZA TRHU:
${JSON.stringify(competitorAnalysis.marketOverview, null, 2)}

Vytvoř ICP v JSON formátu:

{
  "summary": "Jednověté shrnutí ideálního zákazníka",
  "demographics": {
    "ageRange": "např. 35-55 let",
    "gender": "Muži / Ženy / Mix",
    "location": "Kde bydlí",
    "income": "Příjmová skupina",
    "familyStatus": "Svobodný / Rodina s dětmi / Prázdné hnízdo",
    "housing": "Vlastní dům / Byt / Pronájem"
  },
  "psychographics": {
    "values": ["Co je pro ně důležité - 3 hodnoty"],
    "lifestyle": "Jaký vedou životní styl (2 věty)",
    "hobbies": ["Zájmy relevantní k produktu"],
    "mediaConsumption": ["Kde tráví čas online - FB, IG, YouTube..."]
  },
  "buyingBehavior": {
    "researchProcess": "Jak hledají informace před nákupem",
    "decisionMakers": "Kdo rozhoduje o nákupu",
    "triggers": ["Co je přiměje začít hledat řešení"],
    "objections": ["Hlavní námitky/obavy před nákupem"]
  },
  "painPoints": [
    "Konkrétní problém/frustrace 1",
    "Konkrétní problém/frustrace 2",
    "Konkrétní problém/frustrace 3"
  ],
  "dreamOutcome": "Co opravdu chtějí - ideální výsledek (1 věta)",
  "messagingAngles": [
    "Úhel/hook který na ně zabere 1",
    "Úhel/hook který na ně zabere 2",
    "Úhel/hook který na ně zabere 3"
  ]
}

DŮLEŽITÉ: Vrať POUZE validní JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.icpExpert },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating ICP');
    throw new Error(`Chyba při generování ICP: ${error.message}`);
  }
};

/**
 * KROK 5: Generování reklamních textů
 */
export const generateAdCopy = async (formattedData, competitorAnalysis, icp, progressCallback) => {
  progressCallback?.('Generuji reklamní kampaň...');

  const prompt = `Vytvoř kompletní sadu reklamních textů pro Facebook/Instagram kampaň.

FIRMA:
- Název: ${formattedData.companyName}
- Produkt: ${formattedData.whatYouSell}
- Popis: ${formattedData.serviceDescription}
- USP: ${formattedData.usp}
- Garance: ${formattedData.guarantee}
- Tón komunikace: ${formattedData.toneOfVoice}
- CTA: ${formattedData.cta}
- Záruka: ${formattedData.hasWarranty}
- Cenové nabídky: ${formattedData.freeQuote}

IDEÁLNÍ ZÁKAZNÍK:
${JSON.stringify(icp, null, 2)}

KONKURENČNÍ INSIGHTS:
- Běžné úhly: ${competitorAnalysis.adInsights?.commonAngles?.join(', ')}
- Nevyužité úhly: ${competitorAnalysis.adInsights?.missingAngles?.join(', ')}
- Doporučená diferenciace: ${competitorAnalysis.recommendedDifferentiation}

Vytvoř 6 variant reklam v JSON formátu:

{
  "campaignStrategy": {
    "objective": "Hlavní cíl kampaně",
    "primaryAudience": "Popis primární cílové skupiny",
    "channels": ["Facebook", "Instagram"],
    "budgetSplit": {
      "prospecting": 60,
      "retargeting": 40
    }
  },
  "adVariants": [
    {
      "id": "ad-1",
      "name": "Hlavní varianta - Problem/Solution",
      "type": "static",
      "angle": "Jaký úhel/hook používá",
      "targetEmotion": "Jakou emoci má vyvolat",
      "headline": "Headline max 40 znaků",
      "primaryText": "Hlavní text reklamy (80-120 slov). Struktura: Hook → Problém → Řešení → Výhody → CTA. Piš přirozeně česky, používej emoji střídmě.",
      "cta": "Text CTA tlačítka",
      "visualBrief": "Popis vizuálu pro designera/fotografa"
    },
    {
      "id": "ad-2", 
      "name": "Video varianta - Story hook",
      "type": "video",
      "angle": "Jiný úhel než varianta 1",
      "targetEmotion": "Emoce",
      "headline": "Video headline",
      "hook": "První 3 vteřiny - co říct/ukázat aby nepřeskočili (max 15 slov)",
      "script": "Kompletní skript videa (30-45 sekund). Scene by scene s časovými značkami.",
      "cta": "CTA",
      "visualBrief": "Popis vizuálů a scén"
    },
    {
      "id": "ad-3",
      "name": "Social Proof varianta",
      "type": "static", 
      "angle": "Reference a výsledky",
      "targetEmotion": "Důvěra",
      "headline": "Headline zaměřený na výsledky",
      "primaryText": "Text s důrazem na social proof, čísla, testimonial (80-100 slov)",
      "cta": "CTA",
      "visualBrief": "Vizuál s testimonialem nebo čísly"
    },
    {
      "id": "ad-4",
      "name": "Otázková varianta",
      "type": "static",
      "angle": "Engaging question",
      "targetEmotion": "Zvědavost",
      "headline": "Headline jako otázka",
      "primaryText": "Text začínající otázkou, pak řešení (80-100 slov)",
      "cta": "CTA",
      "visualBrief": "Vizuál"
    },
    {
      "id": "ad-5",
      "name": "Urgence/Akce varianta",
      "type": "static",
      "angle": "Limited time/scarcity",
      "targetEmotion": "FOMO",
      "headline": "Headline s urgencí",
      "primaryText": "Text s časově omezenou nabídkou (80-100 slov)",
      "cta": "CTA s urgencí",
      "visualBrief": "Vizuál"
    },
    {
      "id": "ad-6",
      "name": "Retargeting varianta",
      "type": "static",
      "angle": "Překonání námitek",
      "targetEmotion": "Jistota",
      "headline": "Retargeting headline",
      "primaryText": "Text pro ty co už navštívili web - překonání námitek, garance, urgence (80-100 slov)",
      "cta": "Silnější CTA",
      "visualBrief": "Vizuál"
    }
  ]
}

PRAVIDLA:
1. Každá varianta musí být unikátní - jiný úhel, jiný hook
2. Piš přirozeně česky, NE jako překlad z angličtiny
3. Používej specifika a čísla místo obecností
4. Každý text musí mít jasný CTA
5. Emoji používej střídmě (max 2-3 na text)

DŮLEŽITÉ: Vrať POUZE validní JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.adCopywriter },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating ad copy');
    throw new Error(`Chyba při generování reklam: ${error.message}`);
  }
};

/**
 * KROK 6: Generování struktury landing page
 */
export const generateLandingPage = async (formattedData, icp, adCopy, progressCallback) => {
  progressCallback?.('Připravuji váš dashboard...');

  const prompt = `Vytvoř strukturu vysokokonverzní landing page pro tuto firmu.

FIRMA:
- Název: ${formattedData.companyName}
- Produkt: ${formattedData.whatYouSell}
- USP: ${formattedData.usp}
- Garance: ${formattedData.guarantee}
- CTA: ${formattedData.cta}

IDEÁLNÍ ZÁKAZNÍK:
- Pain points: ${icp.painPoints?.join(', ')}
- Dream outcome: ${icp.dreamOutcome}
- Námitky: ${icp.buyingBehavior?.objections?.join(', ')}

Vytvoř landing page strukturu v JSON formátu:

{
  "hero": {
    "headline": "Hlavní headline (max 80 znaků) - jasná value proposition",
    "subheadline": "Podtitulek vysvětlující nabídku (max 120 znaků)",
    "cta": "Text CTA tlačítka",
    "trustIndicators": ["Indikátor důvěry 1", "např. 500+ spokojených zákazníků"]
  },
  "problemSection": {
    "headline": "Headline sekce problému",
    "problems": [
      "Problém/frustrace 1 kterou zákazník zná",
      "Problém/frustrace 2",
      "Problém/frustrace 3"
    ]
  },
  "solutionSection": {
    "headline": "Headline představující řešení",
    "description": "Jak to řešíme (2-3 věty)",
    "benefits": [
      {"title": "Benefit 1", "description": "Krátký popis"},
      {"title": "Benefit 2", "description": "Krátký popis"},
      {"title": "Benefit 3", "description": "Krátký popis"}
    ]
  },
  "processSection": {
    "headline": "Jak to funguje",
    "steps": [
      {"step": 1, "title": "Krok 1", "description": "Co zákazník udělá"},
      {"step": 2, "title": "Krok 2", "description": "Co se stane"},
      {"step": 3, "title": "Krok 3", "description": "Výsledek"}
    ]
  },
  "socialProof": {
    "headline": "Headline social proof sekce",
    "testimonials": [
      {"name": "Jméno", "role": "Pozice/Lokace", "quote": "Testimonial text"},
      {"name": "Jméno 2", "role": "Pozice/Lokace", "quote": "Testimonial text"}
    ],
    "stats": [
      {"number": "500+", "label": "Spokojených zákazníků"},
      {"number": "15", "label": "Let na trhu"}
    ]
  },
  "guaranteeSection": {
    "headline": "Naše garance",
    "description": "Text garance který odstraní pochybnosti (2-3 věty)"
  },
  "faq": [
    {"question": "Nejčastější otázka 1", "answer": "Odpověď"},
    {"question": "Nejčastější otázka 2", "answer": "Odpověď"},
    {"question": "Nejčastější otázka 3", "answer": "Odpověď"},
    {"question": "Nejčastější otázka 4", "answer": "Odpověď"}
  ],
  "finalCta": {
    "headline": "Závěrečná výzva k akci",
    "subheadline": "Podtitulek s urgencí nebo benefitem",
    "cta": "Text CTA tlačítka",
    "guarantee": "Krátká zmínka garance pod tlačítkem"
  }
}

DŮLEŽITÉ: Vrať POUZE validní JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.landingPageExpert },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating landing page');
    throw new Error(`Chyba při generování landing page: ${error.message}`);
  }
};

/**
 * HLAVNÍ FUNKCE: Kompletní generování strategie
 */
export const generateCompleteStrategy = async (onboardingData, progressCallback) => {
  const startTime = Date.now();
  
  try {
    // KROK 1: Validace a příprava dat
    const { rawData, formattedData, searchTerms } = await validateAndPrepareData(
      onboardingData, 
      progressCallback
    );
    aiLogger.debug({ searchTerms }, 'Step 1: Data validated and prepared');

    // KROK 2: Scrapování reálných reklam
    const realAds = await scrapeCompetitorAds(
      searchTerms, 
      formattedData.companyName, 
      progressCallback
    );
    aiLogger.debug({ adsCount: realAds.ads?.length || 0 }, 'Step 2: Scraped competitor ads');

    // KROK 3: AI Analýza konkurence
    const competitorAnalysis = await analyzeCompetition(
      formattedData, 
      realAds, 
      progressCallback
    );
    aiLogger.debug('Step 3: Competitor analysis complete');

    // KROK 4: Generování ICP
    const icp = await generateICP(
      formattedData, 
      competitorAnalysis, 
      progressCallback
    );
    aiLogger.debug('Step 4: ICP generated');

    // KROK 5: Generování reklamních textů
    const adCopy = await generateAdCopy(
      formattedData, 
      competitorAnalysis, 
      icp, 
      progressCallback
    );
    aiLogger.debug('Step 5: Ad copy generated');

    // KROK 6: Generování landing page
    const landingPage = await generateLandingPage(
      formattedData, 
      icp, 
      adCopy, 
      progressCallback
    );
    aiLogger.debug('Step 6: Landing page structure generated');

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    aiLogger.info({ duration }, 'Strategy generation complete');

    return {
      success: true,
      profile: formattedData,
      searchTermsUsed: searchTerms,
      realAdsData: realAds,
      competitorAnalysis,
      icp,
      adCampaign: adCopy,
      landingPage,
      generatedAt: new Date().toISOString(),
      generationDuration: duration,
    };
  } catch (error) {
    aiLogger.error({ err: error }, 'Strategy generation failed');
    throw error;
  }
};

export default {
  validateAndPrepareData,
  scrapeCompetitorAds,
  analyzeCompetition,
  generateICP,
  generateAdCopy,
  generateLandingPage,
  generateCompleteStrategy,
};
