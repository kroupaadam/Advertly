/**
 * SMS Service with Twilio integration and development fallback
 * 
 * Configuration via environment variables:
 * - TWILIO_ACCOUNT_SID: Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Twilio phone number (with +country code)
 * - SMS_ENABLED: Set to 'true' to enable real SMS sending
 */

import twilio from 'twilio';
import { authLogger } from '../config/logger.js';

// Check if Twilio is configured
const isTwilioConfigured = () => {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
};

const isSmsEnabled = () => {
  return process.env.SMS_ENABLED === 'true' && isTwilioConfigured();
};

// Lazy-loaded Twilio client
let twilioClient = null;
const getTwilioClient = () => {
  if (!twilioClient && isTwilioConfigured()) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

/**
 * Send verification SMS via Twilio
 */
const sendViaTwilio = async (fullPhone, code) => {
  const client = getTwilioClient();
  if (!client) {
    throw new Error('Twilio client not configured');
  }

  const message = await client.messages.create({
    body: `Váš ověřovací kód pro Advertly: ${code}. Platnost 10 minut.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: fullPhone,
  });

  authLogger.info({ 
    messageSid: message.sid, 
    to: fullPhone.slice(0, -4) + '****' // Mask last 4 digits
  }, 'SMS sent via Twilio');

  return message;
};

/**
 * Development mode: Log SMS to console
 */
const sendViaDevelopment = async (fullPhone, code) => {
  authLogger.info({
    to: fullPhone,
    code,
    validFor: '10 minutes',
  }, 'SMS Verification Code (Development Mode)');

  // Also show in console for easy visibility during development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              📱 SMS VERIFICATION CODE                      ║
╠════════════════════════════════════════════════════════════╣
║ TO:     ${fullPhone.padEnd(48)} ║
║ CODE:   ${code.padEnd(48)} ║
║ VALID:  10 minutes                                         ║
╚════════════════════════════════════════════════════════════╝
`);
  }

  return { sid: 'dev-' + Date.now() };
};

/**
 * Send verification SMS
 * Uses Twilio in production, logs to console in development
 */
export const sendVerificationSMS = async (phone, phonePrefix, code) => {
  try {
    const fullPhone = phonePrefix + phone;

    if (isSmsEnabled()) {
      await sendViaTwilio(fullPhone, code);
    } else {
      await sendViaDevelopment(fullPhone, code);
    }

    return true;
  } catch (error) {
    authLogger.error({ 
      err: error,
      phone: phone?.slice(0, -4) + '****' 
    }, 'Failed to send SMS');
    
    // In development, don't fail registration if SMS fails
    if (process.env.NODE_ENV !== 'production') {
      authLogger.warn('SMS sending failed but continuing in development mode');
      return true;
    }
    
    return false;
  }
};

/**
 * Check SMS service status
 */
export const getSmsServiceStatus = () => {
  return {
    enabled: isSmsEnabled(),
    provider: isTwilioConfigured() ? 'twilio' : 'development',
    configured: isTwilioConfigured(),
  };
};
