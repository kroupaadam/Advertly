
import { MarketingProfile, MarketingStrategy, IdealCustomerProfile, AdVariant, LandingPageSection, CompetitorAdAnalysis, Industry } from './types';

export const getSuggestions = (type: 'usp' | 'guarantee', context: Partial<MarketingProfile>): string[] => {
    if (type === 'guarantee') {
        return [
            "100% vrácení peněz, pokud neuvidíte výsledky do 90 dnů.",
            "Záruka nejnižší ceny: Pokud najdete levnější, doplatíme rozdíl.",
            "Garance termínu: Za každý den prodlení sleva 1 000 Kč.",
            "Neplatíte nic, dokud neschválíte finální výsledek.",
            "Doživotní záruka na materiály a technické řešení."
        ];
    }
    return [
        "Jako jediní v ČR používáme technologii X, která šetří Y.",
        "Máme největší počet realizací v kraji (přes 500+).",
        "Osobní přístup: Majitel firmy dohlíží na každou zakázku.",
        "Kompletní řešení na klíč bez subdodavatelů.",
        "Specializace pouze na RD, neřešíme komerční budovy."
    ];
};

export const generateStrategy = (profile: MarketingProfile): MarketingStrategy => {
    const icp: IdealCustomerProfile = {
        ageRange: "35-50 let",
        incomeLevel: "Vyšší střední třída (70k+ Kč/měsíc)",
        location: profile.location,
        fears: [
            "Že dodavatel zmizí v polovině práce.",
            "Nafouknutí rozpočtu o skryté náklady.",
            "Nekvalitní provedení, které se za rok rozpadne.",
            "Složitá byrokracie a papírování."
        ],
        dreamOutcome: [
            "Bezstarostný domov s minimální údržbou.",
            "Pocit, že udělali nejlepší investici svého života.",
            "Status 'mám to vyřešené nejlépe v ulici'.",
            "Úspora času a energie na důležitější věci."
        ],
        boundaries: [
            "Nedostatek volného kapitálu na startu.",
            "Špatné recenze konkurence v okolí vyvolávající nedůvěru.",
            "Časová vytíženost (nemají čas na schůzky)."
        ]
    };

    const generateAds = (type: AdVariant['type'], count: number): AdVariant[] => {
        return Array.from({ length: count }, (_, i) => ({
            id: `ad-${type}-${i}`,
            type,
            hook: `Přestaňte řešit ${profile.productDescription.split(' ')[0]} postaru!`,
            body: `Víme, že ${icp.fears[0].toLowerCase()} V ${profile.companyName} garantujeme ${profile.guarantee}.`,
            cta: profile.pricingModel === 'free_quote' ? "Chci kalkulaci zdarma" : "Zjistit cenu",
            visualDescription: type.includes('video') ? "Dynamický střih realizace, detail na spokojeného klienta." : "Clean foto produktu s výrazným textem garance.",
            script: type.includes('video') ? `0:00 - Hook: ${profile.usp}\n0:05 - Problém: ${icp.fears[1]}\n0:15 - Řešení: Naše služba\n0:25 - CTA: ${profile.guarantee}` : undefined
        }));
    };

    const competitorAnalysis: CompetitorAdAnalysis[] = Array.from({ length: 5 }, (_, i) => ({
        id: `comp-${i}`,
        competitorName: `Konkurent ${i + 1}`,
        adHeadline: "Slevy na všechno!",
        score: Math.floor(Math.random() * 40) + 40,
        insight: "Cílí pouze na cenu, chybí jim hloubka a garance kvality.",
        rank: i + 1
    }));

    return {
        profileId: profile.id,
        irresistibleOffer: `Získejte ${profile.productDescription.split(' ')[0]} s garancí ${profile.guarantee} a bonusem za včasné objednání.`,
        icp,
        ads: {
            videos: generateAds('video_cold', 5),
            statics: generateAds('static_cold', 5),
            remarketing: generateAds('remarketing', 5)
        },
        landingPageStructure: [
            { id: 'h1', type: 'hero', title: `Doručíme ${profile.productDescription.split(' ')[0]} do 30 dnů`, content: profile.usp, purpose: "Zaujmout a definovat USP" },
            { id: 'proof', type: 'social_proof', title: `Věří nám ${profile.realizedProjects} rodin`, content: "Fotky realizací a recenze", purpose: "Budování důvěry" },
            { id: 'guar', type: 'guarantee', title: "Naše garance", content: profile.guarantee, purpose: "Risk reversal" }
        ],
        competitorAnalysis,
        budgetAllocation: {
            coldAds: Math.floor(profile.targetInvestAmount * 0.7),
            remarketing: Math.floor(profile.targetInvestAmount * 0.2),
            testing: Math.floor(profile.targetInvestAmount * 0.1)
        }
    };
};
