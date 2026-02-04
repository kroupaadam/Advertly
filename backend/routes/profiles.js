import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Strategy from '../models/Strategy.js';

const router = express.Router();

// Get user profile (from latest strategy)
router.get('/api/profiles/:profileId', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const strategy = await Strategy.findOne({ 
      userId: req.user.id,
      profileId 
    });

    if (!strategy) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Build profile from strategy data
    const profile = {
      id: strategy.profileId,
      companyName: strategy.companyName,
      industry: strategy.industry,
      location: strategy.serviceArea || 'Česká republika',
      productDescription: strategy.serviceDescription || strategy.whatYouSell,
      usp: strategy.usp || '',
      uspOther: strategy.uspOther || '',
      guarantee: strategy.guarantee || '',
      guaranteeCustom: strategy.guaranteeCustom || '',
      warranty: strategy.warrantyDescription || '',
      hasWarranty: strategy.hasWarranty || false,
      yearsOfExperience: parseInt(strategy.yearsInBusiness) || 0,
      realizedProjects: parseInt(strategy.completedProjects) || 0,
      toneOfVoice: strategy.toneOfVoice || 'professional',
      culture: '',
      currentMarketingBudget: strategy.currentMarketingBudget || 0,
      targetMonthlySales: strategy.targetMonthlySales || 0,
      targetInvestAmount: strategy.plannedMarketingBudget || 0,
      strategyPreference: strategy.leadQualityVsVolume === 'quality_over_quantity' ? 'quality_leads' : 'quantity_scale',
      additionalInfo: strategy.additionalInfo || '',
      customerType: strategy.customerType,
      priceRange: strategy.priceRange,
      decisionTime: strategy.decisionTime,
      mainFear: strategy.mainFear,
      freeQuote: strategy.freeQuote,
      firstStep: strategy.firstStep,
      cta: strategy.cta,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
    };

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/api/profiles/:profileId', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;
    
    console.log('[PROFILES] PUT /api/profiles/:profileId');
    console.log('[PROFILES] profileId:', profileId);
    console.log('[PROFILES] updates:', JSON.stringify(updates, null, 2));
    console.log('[PROFILES] userId:', req.user.id);

    // Find the strategy to update
    const strategy = await Strategy.findOne({ 
      userId: req.user.id,
      profileId 
    });
    
    console.log('[PROFILES] Found strategy:', !!strategy);

    if (!strategy) {
      console.log('[PROFILES] Strategy not found - returning 404');
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Map profile fields to strategy fields
    const fieldMapping = {
      companyName: 'companyName',
      industry: 'industry',
      location: 'serviceArea',
      productDescription: 'serviceDescription',
      usp: 'usp',
      uspOther: 'uspOther',
      guarantee: 'guarantee',
      guaranteeCustom: 'guaranteeCustom',
      warranty: 'warrantyDescription',
      hasWarranty: 'hasWarranty',
      yearsOfExperience: 'yearsInBusiness',
      realizedProjects: 'completedProjects',
      toneOfVoice: 'toneOfVoice',
      currentMarketingBudget: 'currentMarketingBudget',
      targetMonthlySales: 'targetMonthlySales',
      targetInvestAmount: 'plannedMarketingBudget',
      additionalInfo: 'additionalInfo',
      customerType: 'customerType',
      priceRange: 'priceRange',
      decisionTime: 'decisionTime',
      mainFear: 'mainFear',
      freeQuote: 'freeQuote',
      firstStep: 'firstStep',
      cta: 'cta',
    };

    // Apply updates
    for (const [profileField, value] of Object.entries(updates)) {
      const strategyField = fieldMapping[profileField];
      if (strategyField && value !== undefined) {
        console.log(`[PROFILES] Setting ${strategyField} = ${value}`);
        strategy[strategyField] = value;
      } else if (!fieldMapping[profileField]) {
        console.log(`[PROFILES] Field ${profileField} not in fieldMapping, skipping`);
      }
    }

    // Handle strategyPreference -> leadQualityVsVolume conversion
    if (updates.strategyPreference) {
      console.log('[PROFILES] Converting strategyPreference to leadQualityVsVolume');
      strategy.leadQualityVsVolume = updates.strategyPreference === 'quality_leads' 
        ? 'quality_over_quantity' 
        : 'quantity_over_quality';
    }

    strategy.updatedAt = new Date();
    console.log('[PROFILES] Saving strategy...');
    await strategy.save();
    console.log('[PROFILES] Strategy saved successfully');

    res.json({ 
      message: 'Profile updated successfully',
      profile: {
        id: strategy.profileId,
        companyName: strategy.companyName,
        industry: strategy.industry,
        updatedAt: strategy.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all profiles for user
router.get('/api/profiles', verifyToken, async (req, res) => {
  try {
    const strategies = await Strategy.find({ userId: req.user.id })
      .select('profileId companyName industry serviceArea createdAt updatedAt')
      .sort({ createdAt: -1 });

    const profiles = strategies.map(s => ({
      id: s.profileId,
      companyName: s.companyName,
      industry: s.industry,
      location: s.serviceArea || 'Česká republika',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.json({ profiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete profile (and associated strategy)
router.delete('/api/profiles/:profileId', verifyToken, async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Find and delete the strategy associated with this profile
    const result = await Strategy.findOneAndDelete({ 
      userId: req.user.id,
      profileId 
    });

    if (!result) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ 
      message: 'Profile and strategy deleted successfully',
      deletedProfileId: profileId 
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
