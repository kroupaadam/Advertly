import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      unique: true,
    },
    phonePrefix: {
      type: String,
      required: [true, 'Please provide a phone prefix'],
      default: '+420',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpiresAt: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    onboardingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    notifications: [
      {
        id: String,
        title: String,
        description: String,
        type: {
          type: String,
          enum: ['info', 'success', 'warning', 'error'],
          default: 'info'
        },
        unread: {
          type: Boolean,
          default: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    notificationSettings: {
      new_leads: { type: Boolean, default: true },
      new_campaigns: { type: Boolean, default: true },
      budget_alerts: { type: Boolean, default: true },
      performance_alerts: { type: Boolean, default: true },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export default mongoose.model('User', userSchema);
