import mongoose from 'mongoose';

const strategySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileId: {
      type: String,
      required: true,
    },
    companyName: String,
    industry: String,
    
    // ==================== FROM ONBOARDING ====================
    // Step 2: What you sell
    whatYouSell: String,
    
    // Step 3: Service description
    serviceDescription: String,
    
    // Step 4: Customer type
    customerType: {
      type: String,
      enum: ['b2c_private', 'b2b_business', 'mixed'],
    },
    
    // Step 5: Price range
    priceRange: {
      type: String,
      enum: ['under_50k', '50k_200k', '200k_1m', '1m_5m', 'over_5m'],
    },
    
    // Step 6: Experience
    completedProjects: String,
    yearsInBusiness: String,
    
    // Step 7: Service area
    serviceArea: String,
    
    // Step 8: Decision time
    decisionTime: {
      type: String,
      enum: ['days', 'weeks', 'months'],
    },
    
    // Step 9: Main fear
    mainFear: {
      type: String,
      enum: ['price_roi', 'result_quality', 'technical_issues', 'time_disruption', 'other'],
    },
    mainFearOther: String,
    
    // Step 10: Free quote
    freeQuote: {
      type: String,
      enum: ['yes', 'no'],
    },
    
    // Step 11: Guarantee
    guarantee: {
      type: String,
      enum: ['output_match', 'timeline', 'fixed_price', 'satisfaction', 'none'],
    },
    guaranteeCustom: String,
    
    // Step 12: Warranty
    hasWarranty: Boolean,
    warrantyDescription: String,
    
    // Step 13: USP
    usp: {
      type: String,
      enum: ['speed', 'quality', 'custom_solution', 'technology', 'references', 'price', 'other'],
    },
    uspOther: String,
    
    // Step 14: Lead quality preference
    leadQualityVsVolume: {
      type: String,
      enum: ['quality_over_quantity', 'volume_over_quality'],
    },
    
    // Step 15: First step
    firstStep: {
      type: String,
      enum: ['consultation', 'assessment', 'price_estimate', 'checklist', 'none'],
    },
    
    // Step 16: Marketing budget
    currentMarketingBudget: {
      type: String,
      enum: ['nothing', 'under_10k', '10k_30k', '30k_100k', 'over_100k'],
    },
    targetMonthlySales: String,
    plannedMarketingBudget: {
      type: String,
      enum: ['under_10k', '10k_30k', '30k_50k', '50k_100k', 'over_100k'],
    },
    
    // Step 17: Tone of voice
    toneOfVoice: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'luxury', 'technical'],
    },
    
    // Step 18: CTA
    cta: {
      type: String,
      enum: ['request_consultation', 'book_meeting', 'send_info', 'other'],
    },
    ctaOther: String,
    
    // Step 19: Additional info
    additionalInfo: String,
    
    // ==================== GENERATED STRATEGY ====================
    // Core Strategy
    irresistibleOffer: String,
    marketingApproach: String,
    primaryChannel: String,
    secondaryChannels: [String],
    keyMessages: [String],
    expectedOutcomes: String,
    
    // Budget Allocation
    budgetAllocation: {
      coldAds: Number,
      remarketing: Number,
      testing: Number,
    },
    
    // ICP
    idealCustomerProfile: {
      demographics: {
        ageRange: String,
        gender: String,
        incomeLevel: String,
        education: String,
      },
      psychographics: {
        values: [String],
        lifestyle: String,
        painPoints: [String],
      },
      behaviors: {
        purchasingBehavior: String,
        onlineActivity: String,
        mediaConsumption: [String],
      },
      dreamOutcome: String,
      fears: [String],
      boundaries: [String],
    },
    
    // Ad Variants
    adVariants: [
      {
        type: String, // 'cold_static', 'cold_video', 'remarketing'
        headline: String,
        hook: String,
        body: String,
        cta: String,
        visualDescription: String,
        script: String,
      },
    ],
    
    // Landing Page Structure (Mixed to support both old and new formats)
    landingPageStructure: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // Market Analysis
    marketAnalysis: {
      marketSize: String,
      growthTrends: [String],
      topCompetitors: [
        {
          name: String,
          strengths: [String],
          weaknesses: [String],
          marketingApproach: String,
        },
      ],
      opportunities: [String],
      threats: [String],
      recommendations: [String],
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'completed', 'archived'],
      default: 'completed',
    },
    
    // NEW: Onboarding Data (from new flow)
    onboardingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: Competitor Analysis (from fbAdsService)
    competitorAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: Full Ad Campaign (from fbAdsService)
    adCampaign: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: Generated Profile
    generatedProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: ICP from new generator
    icp: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: Real ads data from FB Ads Library
    realAdsData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // NEW: Generation duration in seconds
    generationDuration: {
      type: Number,
      default: null,
    },
    
    // Metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
strategySchema.index({ userId: 1 });
strategySchema.index({ profileId: 1 });
strategySchema.index({ userId: 1, status: 1 });
strategySchema.index({ createdAt: -1 });

export default mongoose.model('Strategy', strategySchema);
