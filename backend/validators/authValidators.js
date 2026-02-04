import { z } from 'zod';

/**
 * Validation Schemas for Auth endpoints
 * Using Zod for type-safe validation
 */

// ==================== CUSTOM VALIDATORS ====================

const phoneRegex = /^\d{9,}$/;
const passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{6,}$/;

// ==================== SCHEMAS ====================

export const registerSchema = z.object({
  fullName: z.string({
    required_error: 'Jméno je povinné',
  }).min(2, 'Jméno musí mít alespoň 2 znaky'),
  
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
  
  password: z.string({
    required_error: 'Heslo je povinné',
  }).regex(passwordRegex, 'Heslo musí obsahovat alespoň 6 znaků, 1 číslo a 1 velké písmeno'),
  
  confirmPassword: z.string({
    required_error: 'Potvrzení hesla je povinné',
  }),
  
  phone: z.string({
    required_error: 'Telefonní číslo je povinné',
  }).transform(val => val.replace(/\s/g, ''))
    .refine(val => phoneRegex.test(val), 'Telefonní číslo musí obsahovat alespoň 9 číslic'),
  
  phonePrefix: z.string({
    required_error: 'Telefonní předvolba je povinná',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hesla se musí shodovat',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
  
  password: z.string({
    required_error: 'Heslo je povinné',
  }).min(1, 'Heslo je povinné'),
});

export const verifyCodeSchema = z.object({
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
  
  code: z.string({
    required_error: 'Ověřovací kód je povinný',
  }).length(6, 'Kód musí mít 6 číslic'),
});

export const resendCodeSchema = z.object({
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
});

export const forgotPasswordSchema = z.object({
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
});

export const resetPasswordSchema = z.object({
  email: z.string({
    required_error: 'Email je povinný',
  }).email('Zadejte platnou emailovou adresu'),
  
  code: z.string({
    required_error: 'Ověřovací kód je povinný',
  }).length(6, 'Kód musí mít 6 číslic'),
  
  newPassword: z.string({
    required_error: 'Nové heslo je povinné',
  }).regex(passwordRegex, 'Heslo musí obsahovat alespoň 6 znaků, 1 číslo a 1 velké písmeno'),
  
  confirmNewPassword: z.string({
    required_error: 'Potvrzení hesla je povinné',
  }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Hesla se musí shodovat',
  path: ['confirmNewPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({
    required_error: 'Aktuální heslo je povinné',
  }).min(1, 'Aktuální heslo je povinné'),
  
  newPassword: z.string({
    required_error: 'Nové heslo je povinné',
  }).regex(passwordRegex, 'Heslo musí obsahovat alespoň 6 znaků, 1 číslo a 1 velké písmeno'),
  
  confirmNewPassword: z.string({
    required_error: 'Potvrzení hesla je povinné',
  }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Hesla se musí shodovat',
  path: ['confirmNewPassword'],
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
    
    result.error.errors.forEach(err => {
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
