import dotenv from 'dotenv';
dotenv.config();

/**
 * Facebook Ads Library API Integration
 * 
 * Požadavky:
 * 1. Facebook App s oprávněním ads_read
 * 2. Access token z verifikovaného Business Manageru
 * 3. App musí mít schválený přístup k Ads Library API
 * 
 * Dokumentace: https://www.facebook.com/ads/library/api/
 * Graph API: https://developers.facebook.com/docs/marketing-api/reference/ads_archive/
 */

const FB_API_VERSION = 'v18.0';
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// Access token from environment
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

/**
 * Vyhledá reklamy v Facebook Ads Library
 * @param {Object} options - Parametry vyhledávání
 * @param {string} options.searchTerms - Klíčová slova pro vyhledávání
 * @param {string} options.country - Kód země (default: CZ)
 * @param {string} options.adActiveStatus - ACTIVE, INACTIVE, ALL
 * @param {number} options.limit - Počet výsledků (max 1000)
 * @param {string} options.adType - ALL, POLITICAL_AND_ISSUE_ADS
 */
export const searchAds = async (options = {}) => {
  const {
    searchTerms,
    country = 'CZ',
    adActiveStatus = 'ACTIVE',
    limit = 50,
    adType = 'ALL',
  } = options;

  if (!FB_ACCESS_TOKEN) {
    throw new Error('FB_ACCESS_TOKEN is not configured. Please add it to your .env file.');
  }

  if (!searchTerms) {
    throw new Error('searchTerms is required');
  }

  const params = new URLSearchParams({
    access_token: FB_ACCESS_TOKEN,
    search_terms: searchTerms,
    ad_reached_countries: country,
    ad_active_status: adActiveStatus,
    ad_type: adType,
    limit: limit.toString(),
    fields: [
      'id',
      'ad_creation_time',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_descriptions',
      'ad_creative_link_titles',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'ad_snapshot_url',
      'currency',
      'languages',
      'page_id',
      'page_name',
      'publisher_platforms',
      'estimated_audience_size',
      'impressions',
      'spend',
    ].join(','),
  });

  try {
    const response = await fetch(`${FB_GRAPH_URL}/ads_archive?${params}`);
    const data = await response.json();

    if (data.error) {
      console.error('Facebook API Error:', data.error);
      throw new Error(data.error.message || 'Facebook API error');
    }

    return {
      ads: data.data || [],
      paging: data.paging || null,
      total: data.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching ads from Facebook:', error);
    throw error;
  }
};

/**
 * Vyhledá reklamy konkurence na základě profilu firmy
 * @param {Object} profile - Profil firmy z onboardingu
 */
export const searchCompetitorAds = async (profile) => {
  const searchQueries = [
    profile.whatYouSell, // Hlavní produkt/služba
    profile.companyName, // Název firmy (kontrola vlastních reklam)
  ].filter(Boolean);

  const results = {
    competitorAds: [],
    ownAds: [],
    insights: [],
  };

  for (const query of searchQueries) {
    try {
      const { ads } = await searchAds({
        searchTerms: query,
        country: 'CZ',
        adActiveStatus: 'ACTIVE',
        limit: 25,
      });

      // Rozdělit na vlastní a konkurenční reklamy
      for (const ad of ads) {
        const isOwnAd = ad.page_name?.toLowerCase().includes(profile.companyName?.toLowerCase());
        
        const processedAd = {
          id: ad.id,
          pageName: ad.page_name,
          pageId: ad.page_id,
          creativeBody: ad.ad_creative_bodies?.[0] || '',
          headline: ad.ad_creative_link_titles?.[0] || '',
          description: ad.ad_creative_link_descriptions?.[0] || '',
          linkCaption: ad.ad_creative_link_captions?.[0] || '',
          snapshotUrl: ad.ad_snapshot_url,
          platforms: ad.publisher_platforms || [],
          startDate: ad.ad_delivery_start_time,
          stopDate: ad.ad_delivery_stop_time,
          isActive: !ad.ad_delivery_stop_time,
          estimatedAudience: ad.estimated_audience_size,
          impressions: ad.impressions,
          spend: ad.spend,
          currency: ad.currency,
          languages: ad.languages,
        };

        if (isOwnAd) {
          results.ownAds.push(processedAd);
        } else {
          results.competitorAds.push(processedAd);
        }
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
      // Continue with other queries even if one fails
    }
  }

  // Generovat insights z nalezených reklam
  results.insights = generateInsightsFromAds(results.competitorAds);

  return results;
};

/**
 * Generuje insights z nalezených reklam
 */
const generateInsightsFromAds = (ads) => {
  if (!ads || ads.length === 0) {
    return [{
      type: 'no_data',
      message: 'Nenalezeny žádné aktivní reklamy konkurence pro analýzu.',
    }];
  }

  const insights = [];

  // Nejčastější platformy
  const platformCounts = {};
  ads.forEach(ad => {
    (ad.platforms || []).forEach(platform => {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
  });
  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([platform]) => platform);

  if (topPlatforms.length > 0) {
    insights.push({
      type: 'platforms',
      message: `Konkurence nejvíce inzeruje na: ${topPlatforms.join(', ')}`,
      data: topPlatforms,
    });
  }

  // Analýza headlines
  const headlines = ads.map(ad => ad.headline).filter(Boolean);
  if (headlines.length > 0) {
    insights.push({
      type: 'headlines',
      message: `Nalezeno ${headlines.length} unikátních headlines od konkurence.`,
      examples: headlines.slice(0, 5),
    });
  }

  // Počet aktivních inzerentů
  const uniquePages = new Set(ads.map(ad => ad.pageId)).size;
  insights.push({
    type: 'competition_level',
    message: `Nalezeno ${uniquePages} aktivních inzerentů v tomto oboru.`,
    count: uniquePages,
  });

  // Délka textů
  const avgBodyLength = ads.reduce((sum, ad) => sum + (ad.creativeBody?.length || 0), 0) / ads.length;
  insights.push({
    type: 'copy_length',
    message: `Průměrná délka reklamního textu: ${Math.round(avgBodyLength)} znaků`,
    averageLength: Math.round(avgBodyLength),
  });

  return insights;
};

/**
 * Získá detaily konkrétní reklamy
 */
export const getAdDetails = async (adId) => {
  if (!FB_ACCESS_TOKEN) {
    throw new Error('FB_ACCESS_TOKEN is not configured');
  }

  const params = new URLSearchParams({
    access_token: FB_ACCESS_TOKEN,
    fields: [
      'id',
      'ad_creation_time',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_descriptions',
      'ad_creative_link_titles',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'ad_snapshot_url',
      'currency',
      'languages',
      'page_id',
      'page_name',
      'publisher_platforms',
      'estimated_audience_size',
      'impressions',
      'spend',
      'demographic_distribution',
      'delivery_by_region',
    ].join(','),
  });

  try {
    const response = await fetch(`${FB_GRAPH_URL}/${adId}?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data;
  } catch (error) {
    console.error('Error fetching ad details:', error);
    throw error;
  }
};

/**
 * Získá reklamy konkrétní stránky
 */
export const getPageAds = async (pageId, options = {}) => {
  const { limit = 50, adActiveStatus = 'ALL' } = options;

  if (!FB_ACCESS_TOKEN) {
    throw new Error('FB_ACCESS_TOKEN is not configured');
  }

  const params = new URLSearchParams({
    access_token: FB_ACCESS_TOKEN,
    ad_reached_countries: 'CZ',
    search_page_ids: pageId,
    ad_active_status: adActiveStatus,
    limit: limit.toString(),
    fields: [
      'id',
      'ad_creation_time',
      'ad_creative_bodies',
      'ad_creative_link_titles',
      'ad_snapshot_url',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'publisher_platforms',
    ].join(','),
  });

  try {
    const response = await fetch(`${FB_GRAPH_URL}/ads_archive?${params}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      ads: data.data || [],
      paging: data.paging || null,
    };
  } catch (error) {
    console.error('Error fetching page ads:', error);
    throw error;
  }
};

/**
 * Kontroluje jestli je FB API token nakonfigurován a validní
 */
export const checkApiStatus = async () => {
  if (!FB_ACCESS_TOKEN) {
    return {
      configured: false,
      valid: false,
      message: 'FB_ACCESS_TOKEN není nakonfigurován v .env souboru',
    };
  }

  try {
    // Test API call
    const response = await fetch(
      `${FB_GRAPH_URL}/ads_archive?access_token=${FB_ACCESS_TOKEN}&search_terms=test&ad_reached_countries=CZ&limit=1`
    );
    const data = await response.json();

    if (data.error) {
      return {
        configured: true,
        valid: false,
        message: data.error.message,
        errorCode: data.error.code,
      };
    }

    return {
      configured: true,
      valid: true,
      message: 'Facebook Ads Library API je připojeno a funkční',
    };
  } catch (error) {
    return {
      configured: true,
      valid: false,
      message: error.message,
    };
  }
};

export default {
  searchAds,
  searchCompetitorAds,
  getAdDetails,
  getPageAds,
  checkApiStatus,
};
