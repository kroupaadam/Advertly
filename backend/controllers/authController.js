import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Strategy from '../models/Strategy.js';
import { generateToken } from '../middleware/auth.js';
import { sendVerificationSMS } from '../utils/smsService.js';
import {
  registerSchema,
  loginSchema,
  verifyCodeSchema,
  changePasswordSchema,
  validateRequest,
} from '../validators/authValidators.js';

export const register = async (req, res) => {
  try {
    // Validate with Zod
    const validation = validateRequest(registerSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(validation);
    }

    const { fullName, email, password, phone, phonePrefix } = validation.data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Uživatel s tímto emailem již existuje',
        errors: { email: 'Tento email je již zaregistrován' }
      });
    }

    // Check if phone number is already registered
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ 
        message: 'Telefonní číslo je již zaregistrováno',
        errors: { phone: 'Toto telefonní číslo je již zaregistrováno' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code (6-digit)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      phonePrefix,
      verificationCode,
      verificationCodeExpiresAt,
      isVerified: false,
      notifications: [
        {
          id: 'welcome-' + Date.now(),
          title: 'Vítejte v Advertly',
          description: 'Vítejte! Jsme rádi, že jste si zvolili Advertly. Nyní můžete začít s konfigurací vaší první marketingové strategie.',
          type: 'success',
          unread: true,
          timestamp: new Date()
        }
      ]
    });

    // Send verification code via SMS
    await sendVerificationSMS(phone, phonePrefix, verificationCode);

    // Generate token for immediate login (verification is hidden for now)
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Uživatel byl úspěšně zaregistrován.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phonePrefix: user.phonePrefix,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      message: 'Registrace selhala. Zkuste to prosím znovu.',
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate with Zod
    const validation = validateRequest(loginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(validation);
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        message: 'Neplatný email nebo heslo',
        errors: { email: 'Uživatel s tímto emailem nebyl nalezen' }
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Neplatný email nebo heslo',
        errors: { password: 'Nesprávné heslo' }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Check if user has any strategies (completed onboarding)
    const strategyCount = await Strategy.countDocuments({ userId: user._id });
    const hasStrategies = strategyCount > 0;

    res.status(200).json({
      message: 'Přihlášení bylo úspěšné',
      token,
      hasStrategies,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phonePrefix: user.phonePrefix,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Přihlášení selhalo. Zkuste to prosím znovu.',
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phonePrefix: user.phonePrefix,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Nepodařilo se načíst uživatele',
      error: error.message 
    });
  }
};

export const verifyPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        message: 'Telefonní číslo a kód jsou povinné',
      });
    }

    // Find user with verification code
    const user = await User.findOne({ phone }).select('+verificationCode +verificationCodeExpiresAt');
    
    if (!user) {
      return res.status(404).json({
        message: 'Uživatel nebyl nalezen',
      });
    }

    // Check if code is expired
    if (!user.verificationCodeExpiresAt || new Date() > user.verificationCodeExpiresAt) {
      return res.status(400).json({
        message: 'Ověřovací kód vypršel. Požádejte o nový kód.',
      });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({
        message: 'Nesprávný ověřovací kód',
      });
    }

    // Mark user as verified and clear verification code
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Telefonní číslo bylo úspěšně ověřeno',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phonePrefix: user.phonePrefix,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ověření telefonního čísla selhalo',
      error: error.message,
    });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: 'Telefonní číslo je povinné',
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({
        message: 'Uživatel nebyl nalezen',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Toto telefonní číslo je již ověřeno',
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    // Send verification code via SMS
    await sendVerificationSMS(phone, user.phonePrefix, verificationCode);

    res.status(200).json({
      message: 'Nový ověřovací kód byl odeslán na váš telefonní číslo',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Chyba při odesílání kódu',
      error: error.message,
    });
  }
};
export const changePassword = async (req, res) => {
  try {
    // Validate with Zod
    const validation = validateRequest(changePasswordSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(validation);
    }

    const { currentPassword, newPassword } = validation.data;
    const userId = req.user.id; // From verifyToken middleware

    // Get user with password field (it's hidden by default in schema)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nebyl nalezen' });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Současné heslo je nesprávné',
        errors: { currentPassword: 'Heslo není správné' }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: 'Heslo bylo úspěšně změněno'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Chyba při změně hesla',
      error: error.message,
    });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.userId;
    const { onboardingData } = req.body;

    if (!onboardingData) {
      return res.status(400).json({
        message: 'Onboarding data jsou povinná',
      });
    }

    // Find user and update onboarding status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nebyl nalezen' });
    }

    // Update user with onboarding data
    user.hasCompletedOnboarding = true;
    user.onboardingData = onboardingData;
    await user.save();

    res.status(200).json({
      message: 'Onboarding byl úspěšně dokončen',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phonePrefix: user.phonePrefix,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      message: 'Chyba při dokončování onboardingu',
      error: error.message,
    });
  }
};

export const getOnboardingStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Uživatel nebyl nalezen' });
    }

    res.status(200).json({
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      onboardingData: user.onboardingData || null,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Chyba při načítání stavu onboardingu',
      error: error.message,
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatar || null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Uživatel nebyl nalezen' });
    }

    res.status(200).json({
      message: 'Avatar byl úspěšně aktualizován',
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({
      message: 'Chyba při ukládání avataru',
      error: error.message,
    });
  }
};