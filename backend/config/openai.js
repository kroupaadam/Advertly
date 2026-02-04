import OpenAI from 'openai';
import { aiLogger } from './logger.js';

/**
 * OpenAI Client Singleton
 * Centralized configuration for OpenAI API
 */

if (!process.env.OPENAI_API_KEY) {
  aiLogger.warn('OPENAI_API_KEY not configured. AI features will not work.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Retry configuration
export const AI_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  defaultTemperature: 0.7,
};

/**
 * Sleep helper for retries
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call OpenAI with automatic retry logic
 * @param {Object} options - OpenAI chat completion options
 * @param {boolean} expectArray - Whether to extract array from response
 * @returns {Promise<Object|Array>} Parsed JSON response
 */
export async function callOpenAIWithRetry(options, expectArray = false) {
  let lastError;
  
  for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        response_format: { type: 'json_object' },
        ...options,
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      // If we expect an array, extract it from the response
      if (expectArray) {
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // Try to find array in the response object
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) {
          return parsed[arrayKey];
        }
        throw new Error('Expected array in response but got object');
      }
      
      return parsed;
    } catch (error) {
      lastError = error;
      aiLogger.warn({ attempt, maxRetries: AI_CONFIG.maxRetries, err: error.message }, 'OpenAI API attempt failed');
      
      // Don't retry on invalid API key or quota exceeded
      if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota') {
        throw error;
      }
      
      if (attempt < AI_CONFIG.maxRetries) {
        await sleep(AI_CONFIG.retryDelayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
