import express from 'express';
import { verifyToken as auth } from '../middleware/auth.js';
import { aiRateLimiter, strategyGenerationLimiter } from '../middleware/rateLimit.js';
import { aiLogger } from '../config/logger.js';
import Strategy from '../models/Strategy.js';
import {
  generateMarketingStrategy,
  generateIdealCustomerProfile,
  generateAdVariants,
  generateLandingPageStructure,
  analyzeMarket,
  chatWithOnboardingAssistant,
} from '../services/aiService.js';

import { generateCompleteStrategyFromOnboarding } from '../services/fbAdsService.js';
import { generateCompleteStrategy } from '../services/strategyGenerator.js';

const router = express.Router();

// Allowed origins for CORS (from environment or defaults)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

/**
 * Get CORS origin dynamically for SSE endpoints
 */
const getCorsOrigin = (req) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  // In development, be more permissive
  if (process.env.NODE_ENV !== 'production') {
    return origin || '*';
  }
  return allowedOrigins[0]; // Fallback to first allowed origin
};

// ==================== NEW: Generate from Onboarding with SSE Progress ====================

// Generate strategy with Server-Sent Events for real-time progress
router.get('/api/ai/generate-stream', auth, async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  const sendProgress = (step, progress, message) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', step, progress, message })}\n\n`);
  };

  const sendComplete = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    res.end();
  };

  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  };

  try {
    // Get onboarding data from query string (base64 encoded)
    const encodedData = req.query.data;
    if (!encodedData) {
      return sendError(new Error('Missing onboarding data'));
    }

    const onboardingData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    
    aiLogger.info({ company: onboardingData.companyName }, 'Starting SSE strategy generation');

    // Progress callback that sends SSE updates
    let currentStep = 0;
    const progressCallback = (message) => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / 6) * 100), 95);
      sendProgress(currentStep, progress, message);
    };

    // Generate strategy with progress updates
    const result = await generateCompleteStrategy(onboardingData, progressCallback);

    // Save to database
    const newStrategy = new Strategy({
      userId: req.user.id,
      profileId: onboardingData.id || `onboarding-${Date.now()}`,
      companyName: onboardingData.companyName,
      industry: onboardingData.whatYouSell,
      
      // Onboarding fields
      whatYouSell: onboardingData.whatYouSell,
      serviceDescription: onboardingData.serviceDescription,
      customerType: onboardingData.customerType,
      priceRange: onboardingData.priceRange,
      completedProjects: onboardingData.completedProjects,
      yearsInBusiness: onboardingData.yearsInBusiness,
      serviceArea: onboardingData.serviceArea,
      decisionTime: onboardingData.decisionTime,
      mainFear: onboardingData.mainFear,
      freeQuote: onboardingData.freeQuote,
      guarantee: onboardingData.guarantee,
      hasWarranty: onboardingData.hasWarranty,
      warrantyDescription: onboardingData.warrantyDescription,
      usp: onboardingData.usp,
      leadQualityVsVolume: onboardingData.leadQualityVsVolume,
      firstStep: onboardingData.firstStep,
      currentMarketingBudget: onboardingData.currentMarketingBudget,
      targetMonthlySales: onboardingData.targetMonthlySales,
      plannedMarketingBudget: onboardingData.plannedMarketingBudget,
      toneOfVoice: onboardingData.toneOfVoice,
      cta: onboardingData.cta,
      additionalInfo: onboardingData.additionalInfo,
      
      // Generated data
      irresistibleOffer: result.landingPage?.hero?.headline || '',
      marketingApproach: result.adCampaign?.campaignStrategy?.objective || '',
      primaryChannel: result.adCampaign?.campaignStrategy?.channels?.[0] || 'Facebook',
      secondaryChannels: result.adCampaign?.campaignStrategy?.channels?.slice(1) || [],
      keyMessages: result.adCampaign?.adVariants?.map(a => a.headline) || [],
      
      // Store complete raw data
      onboardingData: onboardingData,
      competitorAnalysis: result.competitorAnalysis,
      icp: result.icp,
      adCampaign: result.adCampaign,
      landingPageStructure: result.landingPage,
      realAdsData: result.realAdsData,
      generatedProfile: result.profile,
      generationDuration: result.generationDuration,
      status: 'completed',
    });

    await newStrategy.save();

    // Send final complete message
    sendProgress(6, 100, 'Strategie je připravena!');
    sendComplete({
      strategy: newStrategy,
      result: result,
    });

  } catch (error) {
    aiLogger.error({ err: error }, 'SSE Strategy generation error');
    sendError(error);
  }
});

// ==================== NEW: Generate from Onboarding ====================

// Generate complete strategy from onboarding data (new flow - uses new strategyGenerator)
router.post('/api/ai/generate-from-onboarding', auth, strategyGenerationLimiter, async (req, res) => {
  try {
    const { onboardingData } = req.body;

    if (!onboardingData || !onboardingData.companyName) {
      return res.status(400).json({ error: 'Onboarding data with companyName is required' });
    }

    console.log('🚀 Generating strategy from onboarding for:', onboardingData.companyName);

    // Use the new strategy generator with all steps
    const result = await generateCompleteStrategy(onboardingData, (step) => {
      console.log(`   📍 ${step}`);
    });

    // Save to database with all onboarding fields
    const newStrategy = new Strategy({
      userId: req.user.id,
      profileId: onboardingData.id || `onboarding-${Date.now()}`,
      companyName: onboardingData.companyName,
      industry: onboardingData.whatYouSell,
      
      // ==================== ALL ONBOARDING FIELDS ====================
      whatYouSell: onboardingData.whatYouSell,
      serviceDescription: onboardingData.serviceDescription,
      customerType: onboardingData.customerType,
      priceRange: onboardingData.priceRange,
      completedProjects: onboardingData.completedProjects,
      yearsInBusiness: onboardingData.yearsInBusiness,
      serviceArea: onboardingData.serviceArea,
      decisionTime: onboardingData.decisionTime,
      mainFear: onboardingData.mainFear,
      mainFearOther: onboardingData.mainFearOther,
      freeQuote: onboardingData.freeQuote,
      guarantee: onboardingData.guarantee,
      guaranteeCustom: onboardingData.guaranteeCustom,
      hasWarranty: onboardingData.hasWarranty,
      warrantyDescription: onboardingData.warrantyDescription,
      usp: onboardingData.usp,
      uspOther: onboardingData.uspOther,
      leadQualityVsVolume: onboardingData.leadQualityVsVolume,
      firstStep: onboardingData.firstStep,
      currentMarketingBudget: onboardingData.currentMarketingBudget,
      targetMonthlySales: onboardingData.targetMonthlySales,
      plannedMarketingBudget: onboardingData.plannedMarketingBudget,
      toneOfVoice: onboardingData.toneOfVoice,
      cta: onboardingData.cta,
      ctaOther: onboardingData.ctaOther,
      additionalInfo: onboardingData.additionalInfo,
      
      // ==================== GENERATED STRATEGY DATA ====================
      irresistibleOffer: result.landingPage?.hero?.headline || '',
      marketingApproach: result.adCampaign?.campaignStrategy?.objective || '',
      primaryChannel: result.adCampaign?.campaignStrategy?.channels?.[0] || 'Facebook',
      secondaryChannels: result.adCampaign?.campaignStrategy?.channels?.slice(1) || [],
      keyMessages: result.adCampaign?.adVariants?.map(a => a.headline) || [],
      expectedOutcomes: result.adCampaign?.campaignStrategy?.objective || '',
      budgetAllocation: result.adCampaign?.campaignStrategy?.budgetSplit || {},
      
      // Store complete raw data for flexibility
      onboardingData: onboardingData,
      competitorAnalysis: result.competitorAnalysis,
      icp: result.icp,
      adCampaign: result.adCampaign,
      landingPageStructure: result.landingPage,
      realAdsData: result.realAdsData,
      generatedProfile: result.profile,
      generationDuration: result.generationDuration,
      status: 'completed',
    });

    await newStrategy.save();

    res.status(201).json({
      message: 'Strategy generated successfully from onboarding',
      strategy: newStrategy,
      result: result,
    });
  } catch (error) {
    console.error('Onboarding strategy generation error:', error);
    res.status(500).json({
      error: 'Failed to generate strategy from onboarding',
      details: error.message,
    });
  }
});

// ==================== PUBLIC: Generate from Onboarding with SSE Progress (No Auth) ====================
// This endpoint is for testing/demo purposes without requiring authentication
router.get('/api/ai/generate-stream-public', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendProgress = (step, progress, message) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', step, progress, message })}\n\n`);
  };

  const sendComplete = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`);
    res.end();
  };

  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  };

  try {
    // Get onboarding data from query string (base64 encoded)
    const encodedData = req.query.data;
    if (!encodedData) {
      return sendError(new Error('Missing onboarding data'));
    }

    const onboardingData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    
    console.log('🚀 [PUBLIC] Starting SSE strategy generation for:', onboardingData.companyName);

    // Progress callback that sends SSE updates
    let currentStep = 0;
    const progressCallback = (message) => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / 6) * 100), 95);
      sendProgress(currentStep, progress, message);
    };

    // Generate strategy with progress updates
    const result = await generateCompleteStrategy(onboardingData, progressCallback);

    // Don't save to database for public endpoint (or save as guest strategy)
    console.log('✅ [PUBLIC] Strategy generated successfully');
    sendComplete({
      message: 'Strategy generated successfully',
      result: result,
    });
  } catch (error) {
    console.error('❌ [PUBLIC] Strategy generation error:', error);
    sendError(error);
  }
});

// ==================== FACEBOOK ADS LIBRARY ENDPOINTS ====================

import { checkApiStatus, searchAds, searchCompetitorAds } from '../services/facebookAdsLibrary.js';

// Check Facebook Ads Library API status
router.get('/api/facebook-ads/status', auth, async (req, res) => {
  try {
    const status = await checkApiStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search ads in Facebook Ads Library
router.post('/api/facebook-ads/search', auth, aiRateLimiter, async (req, res) => {
  try {
    const { searchTerms, country, limit } = req.body;
    
    if (!searchTerms) {
      return res.status(400).json({ error: 'searchTerms is required' });
    }

    const results = await searchAds({ searchTerms, country, limit });
    res.json(results);
  } catch (error) {
    console.error('Facebook Ads search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search competitor ads based on profile
router.post('/api/facebook-ads/competitors', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile || !profile.whatYouSell) {
      return res.status(400).json({ error: 'profile with whatYouSell is required' });
    }

    const results = await searchCompetitorAds(profile);
    res.json(results);
  } catch (error) {
    console.error('Competitor ads search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI GENERATION ENDPOINTS ====================

// Generate complete strategy (all components)
router.post('/api/ai/generate-strategy', auth, strategyGenerationLimiter, async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    // Step 1: Generate strategy and ICP in parallel (they don't depend on each other)
    const [strategy, icp, marketAnalysis] = await Promise.all([
      generateMarketingStrategy(profile),
      generateIdealCustomerProfile(profile),
      analyzeMarket(profile),
    ]);

    // Step 2: Generate ads and landing page AFTER strategy is ready (they need strategy data)
    const [ads, landingPage] = await Promise.all([
      generateAdVariants(profile, strategy),
      generateLandingPageStructure(profile, strategy),
    ]);

    // Create and save strategy to database
    const newStrategy = new Strategy({
      userId: req.user.id,
      profileId: profile.id || `profile-${Date.now()}`,
      companyName: profile.companyName,
      industry: profile.industry,
      irresistibleOffer: strategy.irresistibleOffer,
      marketingApproach: strategy.marketingApproach,
      primaryChannel: strategy.primaryChannel,
      secondaryChannels: strategy.secondaryChannels,
      keyMessages: strategy.keyMessages,
      expectedOutcomes: strategy.expectedOutcomes,
      budgetAllocation: strategy.budgetAllocation,
      idealCustomerProfile: icp,
      adVariants: ads,
      landingPageStructure: landingPage,
      marketAnalysis: marketAnalysis,
      status: 'completed',
    });

    await newStrategy.save();

    res.status(201).json({
      message: 'Strategy generated successfully',
      strategy: newStrategy,
    });
  } catch (error) {
    console.error('Strategy generation error:', error);
    res.status(500).json({
      error: 'Failed to generate strategy',
      details: error.message,
    });
  }
});

// Generate only marketing strategy
router.post('/api/ai/generate-strategy-only', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    const strategy = await generateMarketingStrategy(profile);

    res.status(200).json({
      message: 'Strategy generated successfully',
      data: strategy,
    });
  } catch (error) {
    console.error('Strategy generation error:', error);
    res.status(500).json({
      error: 'Failed to generate strategy',
      details: error.message,
    });
  }
});

// Generate ICP
router.post('/api/ai/generate-icp', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    const icp = await generateIdealCustomerProfile(profile);

    res.status(200).json({
      message: 'ICP generated successfully',
      data: icp,
    });
  } catch (error) {
    console.error('ICP generation error:', error);
    res.status(500).json({
      error: 'Failed to generate ICP',
      details: error.message,
    });
  }
});

// Generate Ad Variants
router.post('/api/ai/generate-ads', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile, strategy } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    const defaultStrategy = strategy || {
      irresistibleOffer: 'Special offer just for you',
    };

    const ads = await generateAdVariants(profile, defaultStrategy);

    res.status(200).json({
      message: 'Ad variants generated successfully',
      data: ads,
    });
  } catch (error) {
    console.error('Ad generation error:', error);
    res.status(500).json({
      error: 'Failed to generate ad variants',
      details: error.message,
    });
  }
});

// Generate Landing Page
router.post('/api/ai/generate-landing-page', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile, strategy } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    const defaultStrategy = strategy || {
      irresistibleOffer: 'Special offer',
      keyMessages: [],
    };

    const landingPage = await generateLandingPageStructure(profile, defaultStrategy);

    res.status(200).json({
      message: 'Landing page structure generated successfully',
      data: landingPage,
    });
  } catch (error) {
    console.error('Landing page generation error:', error);
    res.status(500).json({
      error: 'Failed to generate landing page',
      details: error.message,
    });
  }
});

// Analyze Market
router.post('/api/ai/analyze-market', auth, aiRateLimiter, async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Profile with companyName is required' });
    }

    const analysis = await analyzeMarket(profile);

    res.status(200).json({
      message: 'Market analysis completed successfully',
      data: analysis,
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze market',
      details: error.message,
    });
  }
});

// ==================== STRATEGY CRUD ENDPOINTS ====================

// Get user's strategies
router.get('/api/strategies', auth, async (req, res) => {
  try {
    const strategies = await Strategy.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      count: strategies.length,
      data: strategies,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({
      error: 'Failed to fetch strategies',
      details: error.message,
    });
  }
});

// Get single strategy by ID
router.get('/api/strategies/:id', auth, async (req, res) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy || strategy.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.status(200).json(strategy);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({
      error: 'Failed to fetch strategy',
      details: error.message,
    });
  }
});

// Get strategy by profileId
router.get('/api/strategies/profile/:profileId', auth, async (req, res) => {
  try {
    const strategy = await Strategy.findOne({ 
      userId: req.user.id, 
      profileId: req.params.profileId 
    });

    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.status(200).json(strategy);
  } catch (error) {
    console.error('Error fetching strategy by profileId:', error);
    res.status(500).json({
      error: 'Failed to fetch strategy',
      details: error.message,
    });
  }
});

// Update strategy
router.put('/api/strategies/:id', auth, async (req, res) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy || strategy.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    const allowedUpdates = [
      // Onboarding fields
      'whatYouSell',
      'serviceDescription',
      'customerType',
      'priceRange',
      'completedProjects',
      'yearsInBusiness',
      'serviceArea',
      'decisionTime',
      'mainFear',
      'mainFearOther',
      'freeQuote',
      'guarantee',
      'guaranteeCustom',
      'hasWarranty',
      'warrantyDescription',
      'usp',
      'uspOther',
      'leadQualityVsVolume',
      'firstStep',
      'currentMarketingBudget',
      'targetMonthlySales',
      'plannedMarketingBudget',
      'toneOfVoice',
      'cta',
      'ctaOther',
      'additionalInfo',
      // Generated strategy fields
      'irresistibleOffer',
      'marketingApproach',
      'primaryChannel',
      'secondaryChannels',
      'keyMessages',
      'expectedOutcomes',
      'budgetAllocation',
      'status',
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        strategy[key] = req.body[key];
      }
    });

    await strategy.save();

    res.status(200).json({
      message: 'Strategy updated successfully',
      data: strategy,
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    res.status(500).json({
      error: 'Failed to update strategy',
      details: error.message,
    });
  }
});

// Delete strategy
router.delete('/api/strategies/:id', auth, async (req, res) => {
  try {
    const strategy = await Strategy.findById(req.params.id);

    if (!strategy || strategy.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    await Strategy.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Strategy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({
      error: 'Failed to delete strategy',
      details: error.message,
    });
  }
});

// AI Ask - Answer questions about strategy
router.post('/api/ai/ask', auth, aiRateLimiter, async (req, res) => {
  try {
    const { question, profileId, strategyData, profileData } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Build context from strategy and profile data
    const context = {
      company: profileData?.companyName || 'Your company',
      industry: profileData?.industry || 'Unknown',
      strategy: {
        offer: strategyData?.irresistibleOffer || 'Your offer',
        channels: strategyData?.primaryChannel || 'Unknown',
        approach: strategyData?.marketingApproach || 'Unknown',
        ads: strategyData?.ads?.length || 0,
      }
    };

    // Format the AI prompt
    const prompt = `You are a helpful marketing assistant. Answer the following question about a marketing strategy in Czech language. 
    
Context about the company:
- Company: ${context.company}
- Industry: ${context.industry}
- Main Offer: ${context.strategy.offer}
- Primary Channel: ${context.strategy.channels}
- Marketing Approach: ${context.strategy.approach}
- Number of Ads Created: ${context.strategy.ads}

User Question: ${question}

Please provide a helpful, actionable response in Czech language. Keep it concise and practical.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful Czech-speaking marketing assistant for Advertly AI marketing platform.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return res.status(500).json({
        error: 'Failed to get AI response',
        details: 'OpenAI API error'
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Omlouvám se, nemůžu odpovědět na tuto otázku.';

    res.status(200).json({
      answer,
      question,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in AI Ask:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      details: error.message
    });
  }
});

// ==================== NEW: Chat Onboarding Endpoint ====================

router.post('/api/ai/chat-onboarding', auth, async (req, res) => {
  try {
    const { history, currentProfileState } = req.body;
    
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ message: 'Invalid history format' });
    }

    const result = await chatWithOnboardingAssistant(history, currentProfileState || {});
    
    res.json(result);
  } catch (error) {
    aiLogger.error({ err: error }, 'Error in chat onboarding');
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

export default router;

