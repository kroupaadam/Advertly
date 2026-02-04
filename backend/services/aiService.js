import { openai, AI_MODEL, callOpenAIWithRetry } from '../config/openai.js';
import { aiLogger } from '../config/logger.js';

// ==================== PROMPTS ====================

const SYSTEM_PROMPT = `You are an expert marketing strategist and copywriter specializing in digital advertising. 
Your role is to create compelling, data-driven marketing strategies and content for businesses.
Always respond in valid JSON format as specified.
Focus on practical, actionable insights that drive conversions.`;

const ONBOARDING_SYSTEM_PROMPT = `You are an expert marketing strategist and onboarding assistant for 'Advertly'.
Your goal is to have a natural conversation with the user to collect information needed to build a marketing profile.

You need to collect the following information (State):
- companyName (string)
- industry (string) - Map to: SaaS, E-commerce, Marketing, Finance, Services, Construction, Education, Health, Other
- productDescription (string) - What they sell, key offer
- targetInvestAmount (number) - Monthly marketing budget
- yearsOfExperience (number)
- location (string)
- usp (string) - Unique Selling Proposition
- toneOfVoice (string) - e.g. Professional, Friendly, Authoritative, etc.
- targetAudience (string) - Who is the customer?

Current State is provided in the prompt.
Your response MUST be a valid JSON object with this exact structure:
{
  "aiResponse": "Your text response to the user here. Be professional but friendly. Ask for one or two missing pieces of info at a time.",
  "extractedUpdates": { 
     // Only include fields that you extracted from the LATEST user message.
     // Example: "budget": 5000
  },
  "isComplete": boolean, // Set to true ONLY when all critical info is collected
  "missingInfo": ["list", "of", "missing", "fields"]
}
`;


const generateStrategyPrompt = (profile) => `
You are a marketing strategy expert. Based on the following company profile, create a comprehensive marketing strategy.

Company Profile:
- Name: ${profile.companyName}
- Industry: ${profile.industry}
- Years of Experience: ${profile.yearsOfExperience}
- Realized Projects: ${profile.realizedProjects}
- Location: ${profile.location}
- Product Description: ${profile.productDescription}
- Pricing Model: ${profile.pricingModel}
- USP: ${profile.usp}
- Target Monthly Investment: $${profile.targetInvestAmount}
- Strategy Preference: ${profile.strategyPreference}
- Tone of Voice: ${profile.toneOfVoice}
- Company Culture: ${profile.culture}

Create a comprehensive marketing strategy in JSON format with these exact keys:
{
  "irresistibleOffer": "A compelling offer that makes the target audience say yes (one sentence)",
  "marketingApproach": "Overall marketing approach (2-3 sentences)",
  "primaryChannel": "Best primary marketing channel (e.g., 'Facebook & Instagram video ads')",
  "secondaryChannels": ["list", "of", "secondary", "channels"],
  "budgetAllocation": {
    "coldAds": 40,
    "remarketing": 35,
    "testing": 25
  },
  "keyMessages": ["message1", "message2", "message3", "message4", "message5"],
  "expectedOutcomes": "Realistic expected outcomes in 90 days (2-3 sentences)"
}`;

const generateICPPrompt = (profile) => `
You are an expert in creating Ideal Customer Profiles (ICP). Based on the company profile below, create a detailed ICP.

Company Profile:
- Company: ${profile.companyName}
- Industry: ${profile.industry}
- Product/Service: ${profile.productDescription}
- USP: ${profile.usp}

Create an Ideal Customer Profile in JSON format with these exact keys:
{
  "demographics": {
    "ageRange": "e.g., 35-55",
    "gender": "e.g., Mixed",
    "incomeLevel": "e.g., $75,000+",
    "education": "e.g., Bachelor's degree or higher"
  },
  "psychographics": {
    "values": ["value1", "value2", "value3"],
    "lifestyle": "Description of lifestyle (2-3 sentences)",
    "painPoints": ["pain1", "pain2", "pain3", "pain4"]
  },
  "behaviors": {
    "purchasingBehavior": "Description of how they make purchase decisions",
    "onlineActivity": "Where they spend time online",
    "mediaConsumption": ["platform1", "platform2", "platform3"]
  },
  "dreamOutcome": "What they really want (one sentence)",
  "fears": ["fear1", "fear2", "fear3"],
  "boundaries": ["boundary1", "boundary2"]
}`;

const generateAdsPrompt = (profile, strategy) => `
You are an expert copywriter specializing in digital advertising. Create 5 compelling ad variants for the following business.

Company: ${profile.companyName}
Product/Service: ${profile.productDescription}
USP: ${profile.usp}
Irresistible Offer: ${strategy.irresistibleOffer}
Tone: ${profile.toneOfVoice}

Create 5 ad variants in JSON format. Return as array with this exact structure for each:
[
  {
    "type": "cold_static",
    "headline": "Compelling headline (max 60 chars)",
    "hook": "Attention-grabbing first line (15-20 words)",
    "body": "Main copy explaining benefits (40-60 words)",
    "cta": "Call to action button text (2-4 words)",
    "visualDescription": "Description for designer of visual/image needed"
  },
  {
    "type": "cold_video",
    "headline": "Video headline (max 60 chars)",
    "hook": "First 3 seconds hook (10-15 words)",
    "body": "Video script (80-100 words)",
    "cta": "Call to action button text",
    "script": "Full video script with scene descriptions"
  },
  {
    "type": "cold_static",
    "headline": "Alternative static ad headline",
    "hook": "Different angle hook (15-20 words)",
    "body": "Different benefit focus (40-60 words)",
    "cta": "CTA variation",
    "visualDescription": "Alternative visual description"
  },
  {
    "type": "cold_video",
    "headline": "Alternative video headline",
    "hook": "Different hook angle (10-15 words)",
    "body": "Different video angle (80-100 words)",
    "cta": "CTA variation",
    "script": "Alternative video script"
  },
  {
    "type": "remarketing",
    "headline": "Remarketing ad headline",
    "hook": "Remarketing hook - address objections (15-20 words)",
    "body": "Social proof and risk reversal (50-70 words)",
    "cta": "Remarketing CTA",
    "visualDescription": "Testimonial or proof-based visual"
  }
]`;

const generateLandingPagePrompt = (profile, strategy) => `
You are an expert in creating high-converting landing pages. Design a landing page structure for the following business.

Company: ${profile.companyName}
Product/Service: ${profile.productDescription}
Irresistible Offer: ${strategy.irresistibleOffer}
Key Messages: ${strategy.keyMessages.join(', ')}

Create a landing page structure in JSON format as an array of sections:
[
  {
    "type": "hero",
    "title": "Main headline (max 100 chars)",
    "content": "Hero section copy with offer (30-50 words)",
    "purpose": "Why this section is important"
  },
  {
    "type": "social_proof",
    "title": "Section title",
    "content": "Social proof elements to include (testimonials, numbers, brands, etc.)",
    "purpose": "Build credibility"
  },
  {
    "type": "features",
    "title": "Features/Benefits",
    "content": "List 4-5 key benefits with brief descriptions",
    "purpose": "Show what customers get"
  },
  {
    "type": "guarantee",
    "title": "Guarantee/Risk Reversal",
    "content": "Money-back guarantee or risk-free offer details",
    "purpose": "Remove buying friction"
  },
  {
    "type": "faq",
    "title": "Frequently Asked Questions",
    "content": "3-4 most important FAQs with answers",
    "purpose": "Address common objections"
  },
  {
    "type": "cta",
    "title": "Final Call to Action",
    "content": "Final push to conversion with deadline or urgency",
    "purpose": "Drive immediate action"
  }
]`;

const analyzeMarketPrompt = (profile) => `
You are a market analysis expert. Analyze the market for the following business and identify top competitors and their strategies.

Company: ${profile.companyName}
Industry: ${profile.industry}
Location: ${profile.location}
Product/Service: ${profile.productDescription}

Provide market analysis in JSON format:
{
  "marketSize": "Estimated market size or opportunity (2-3 sentences)",
  "growthTrends": ["trend1", "trend2", "trend3"],
  "topCompetitors": [
    {
      "name": "Competitor name",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketingApproach": "How they market (2-3 sentences)"
    },
    {
      "name": "Another competitor",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketingApproach": "How they market (2-3 sentences)"
    },
    {
      "name": "Third competitor",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketingApproach": "How they market (2-3 sentences)"
    }
  ],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
  "threats": ["threat1", "threat2", "threat3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`;

// Using centralized callOpenAIWithRetry from config/openai.js

// ==================== API CALLS ====================

export async function generateMarketingStrategy(profile) {
  try {
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: generateStrategyPrompt(profile),
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating strategy');
    throw new Error(`Failed to generate marketing strategy: ${error.message}`);
  }
}

export async function generateIdealCustomerProfile(profile) {
  try {
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: generateICPPrompt(profile),
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating ICP');
    throw new Error(`Failed to generate ICP: ${error.message}`);
  }
}

export async function generateAdVariants(profile, strategy) {
  try {
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + '\nIMPORTANT: Wrap your response array in an object with key "ads". Example: {"ads": [...]}',
        },
        {
          role: 'user',
          content: generateAdsPrompt(profile, strategy),
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    }, true); // expectArray = true
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating ads');
    throw new Error(`Failed to generate ad variants: ${error.message}`);
  }
}

export async function generateLandingPageStructure(profile, strategy) {
  try {
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + '\nIMPORTANT: Wrap your response array in an object with key "sections". Example: {"sections": [...]}',
        },
        {
          role: 'user',
          content: generateLandingPagePrompt(profile, strategy),
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    }, true); // expectArray = true
  } catch (error) {
    aiLogger.error({ err: error }, 'Error generating landing page');
    throw new Error(`Failed to generate landing page structure: ${error.message}`);
  }
}

export async function analyzeMarket(profile) {
  try {
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: analyzeMarketPrompt(profile),
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });
  } catch (error) {
    aiLogger.error({ err: error }, 'Error analyzing market');
    throw new Error(`Failed to analyze market: ${error.message}`);
  }
}

export async function chatWithOnboardingAssistant(history, currentProfileState) {
  try {
    // 1. Prepare context for the AI
    const stateContext = `
      CURRENT KNOWN STATE:
      ${JSON.stringify(currentProfileState, null, 2)}
    `;

    // 2. Format history for OpenAI
    // Expecting history to be array of { role: 'user' | 'assistant', content: string }
    // We should filter or sanitize if needed, but assuming valid input for now.
    
    // 3. Call OpenAI
    return await callOpenAIWithRetry({
      messages: [
        {
          role: 'system',
          content: ONBOARDING_SYSTEM_PROMPT + '\n' + stateContext,
        },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
  } catch (error) {
    aiLogger.error({ err: error }, 'Error in chat onboarding');
    throw new Error(`Failed to chat with onboarding assistant: ${error.message}`);
  }
}

