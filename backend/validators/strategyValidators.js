import { z } from 'zod';

/**
 * Validation Schemas for Strategy endpoints
 */

// ==================== ONBOARDING DATA SCHEMA ====================

export const onboardingDataSchema = z.object({
  companyName: z.string({
    required_error: 'Název firmy je povinný',
  }).min(2, 'Název firmy musí mít alespoň 2 znaky'),

  whatYouSell: z.string({
    required_error: 'Uveďte, co prodáváte',
  }).min(3, 'Popište, co prodáváte'),

  serviceDescription: z.string({
    required_error: 'Popis služby je povinný',
  }).min(10, 'Popis služby musí mít alespoň 10 znaků'),

  customerType: z.enum(['b2c_private', 'b2b_business', 'mixed'], {
    required_error: 'Vyberte typ zákazníka',
  }).optional(),

  priceRange: z.enum(['under_50k', '50k_200k', '200k_1m', '1m_5m', 'over_5m'], {
    required_error: 'Vyberte cenové rozmezí',
  }).optional(),

  completedProjects: z.string().optional(),
  yearsInBusiness: z.string().optional(),
  serviceArea: z.string().optional(),

  decisionTime: z.enum(['days', 'weeks', 'months']).optional(),

  mainFear: z.enum(['price_roi', 'result_quality', 'technical_issues', 'time_disruption', 'other']).optional(),
  mainFearOther: z.string().optional(),

  freeQuote: z.enum(['yes', 'no']).optional(),

  usp: z.enum(['speed', 'quality', 'custom_solution', 'technology', 'references', 'price', 'other']).optional(),
  uspOther: z.string().optional(),

  guarantee: z.enum(['output_match', 'timeline', 'fixed_price', 'satisfaction', 'none']).optional(),

  hasWarranty: z.boolean().optional(),
  warrantyDescription: z.string().optional(),

  leadQualityVsVolume: z.enum(['quality_over_quantity', 'quantity_over_quality']).optional(),

  firstStep: z.string().optional(),

  currentMarketingBudget: z.enum(['nothing', 'under_10k', '10k_30k', '30k_100k', 'over_100k']).optional(),
  targetMonthlySales: z.string().optional(),
  plannedMarketingBudget: z.enum(['under_10k', '10k_30k', '30k_50k', '50k_100k', 'over_100k']).optional(),

  toneOfVoice: z.enum(['professional', 'friendly', 'casual', 'luxury', 'technical']).optional(),

  cta: z.enum(['request_consultation', 'book_meeting', 'send_info', 'other']).optional(),
  ctaOther: z.string().optional(),

  additionalInfo: z.string().optional(),
});

// ==================== STRATEGY GENERATION SCHEMAS ====================

export const generateFromOnboardingSchema = z.object({
  onboardingData: onboardingDataSchema,
});

export const generateStrategySchema = z.object({
  profile: z.object({
    companyName: z.string().min(1),
    industry: z.string().optional(),
    productDescription: z.string().optional(),
    usp: z.string().optional(),
    targetInvestAmount: z.number().optional(),
    strategyPreference: z.string().optional(),
    toneOfVoice: z.string().optional(),
  }),
});

export const generateICPSchema = z.object({
  profile: z.object({
    companyName: z.string().min(1),
    industry: z.string().optional(),
    productDescription: z.string().optional(),
    usp: z.string().optional(),
  }),
});

export const generateAdsSchema = z.object({
  profile: z.object({
    companyName: z.string().min(1),
    productDescription: z.string().optional(),
    usp: z.string().optional(),
    toneOfVoice: z.string().optional(),
  }),
  strategy: z.object({
    irresistibleOffer: z.string().optional(),
  }),
});

export const generateLandingPageSchema = z.object({
  profile: z.object({
    companyName: z.string().min(1),
    productDescription: z.string().optional(),
  }),
  strategy: z.object({
    irresistibleOffer: z.string().optional(),
    keyMessages: z.array(z.string()).optional(),
  }),
});

export const facebookAdsSearchSchema = z.object({
  searchTerms: z.string({
    required_error: 'Klíčová slova jsou povinná',
  }).min(2, 'Zadejte alespoň 2 znaky'),
  country: z.string().default('CZ'),
  limit: z.number().min(1).max(100).default(20),
});

// ==================== VALIDATION HELPER ====================

/**
 * Validates request body against a Zod schema
 * Returns formatted error response or parsed data
 */
export function validateRequest(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = {};
    const firstError = result.error.errors[0];

    result.error.errors.forEach((err) => {
      const field = err.path.join('.');
      if (!errors[field]) {
        errors[field] = err.message;
      }
    });

    return {
      success: false,
      message: firstError.message,
      errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
