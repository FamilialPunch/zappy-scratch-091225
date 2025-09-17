import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase, generateUserId } from '../config/auth.js';
import { getDatabase, getRawConnection } from '../config/database.js';
import { mockAuthService } from '../services/mockAuth.js';
import { mockPatientLogin, mockUpdatePatientLogin } from '../services/mock-auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  requireAuth, 
  generateTokens, 
  verifyRefreshToken, 
  ROLES 
} from '../middleware/auth.js';
import { AppError } from '../errors/AppError.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Patient intake form submission (no account required)
router.post('/intake',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isDate().withMessage('Date of birth is required'),
    body('chiefComplaint').notEmpty().withMessage('Chief complaint is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      email, firstName, lastName, phone, dateOfBirth,
      shippingAddress, shippingCity, shippingState, shippingZip,
      allergies, currentMedications, medicalConditions,
      chiefComplaint, symptoms, symptomDuration, severity
    } = req.body;

    const db = getDatabase();
    
    // Check if patient exists
    let patientResult = await db.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );
    
    let patientId;
    
    if (patientResult.rows.length === 0) {
      // Create new patient
      const insertResult = await db.query(`
        INSERT INTO patients (
          email, first_name, last_name, phone, date_of_birth,
          shipping_address, shipping_city, shipping_state, shipping_zip,
          allergies, current_medications, medical_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        email, firstName, lastName, phone, dateOfBirth,
        shippingAddress, shippingCity, shippingState, shippingZip,
        allergies, currentMedications, medicalConditions
      ]);
      patientId = insertResult.rows[0].id;
    } else {
      patientId = patientResult.rows[0].id;
      
      // Update patient info
      await db.query(`
        UPDATE patients SET
          first_name = $2, last_name = $3, phone = $4,
          shipping_address = $5, shipping_city = $6, 
          shipping_state = $7, shipping_zip = $8,
          allergies = $9, current_medications = $10, 
          medical_conditions = $11,
          updated_at = NOW()
        WHERE id = $1
      `, [
        patientId, firstName, lastName, phone,
        shippingAddress, shippingCity, shippingState, shippingZip,
        allergies, currentMedications, medicalConditions
      ]);
    }
    
    // Create consultation
    const consultationResult = await db.query(`
      INSERT INTO consultations (
        patient_id, chief_complaint, symptoms, 
        symptom_duration, severity
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, submitted_at
    `, [
      patientId, chiefComplaint, symptoms, 
      symptomDuration, severity
    ]);
    
    const consultation = consultationResult.rows[0];
    
    res.status(201).json({
      success: true,
      data: { 
        consultationId: consultation.id,
        submittedAt: consultation.submitted_at,
        message: 'Your consultation request has been received. A provider will review it within 24 hours.'
      }
    });
  })
);

// Register patient with password (for returning patients)
router.post('/register/patient',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isDate().withMessage('Date of birth is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { 
      email, password, firstName, lastName, phone, dateOfBirth,
      shippingAddress, shippingCity, shippingState, shippingZip
    } = req.body;

    const db = getDatabase();
    
    // Check if patient exists
    const existingPatient = await db.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );
    
    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create patient
    const result = await db.query(`
      INSERT INTO patients (
        email, password_hash, first_name, last_name, 
        phone, date_of_birth, shipping_address, 
        shipping_city, shipping_state, shipping_zip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, first_name, last_name
    `, [
      email, passwordHash, firstName, lastName, phone, 
      dateOfBirth, shippingAddress, shippingCity, 
      shippingState, shippingZip
    ]);
    
    const patient = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: 'patient' },
      process.env.JWT_SECRET || 'development-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: { 
        patient: {
          id: patient.id,
          email: patient.email,
          firstName: patient.first_name,
          lastName: patient.last_name
        },
        token 
      }
    });
  })
);

// Patient login using mock authentication (no database required)
router.post('/login/patient',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Patient login attempt for:', email);
    
    // Use mock authentication service
    const authResult = await mockAuthService.authenticatePatient(email, password);
    
    if (!authResult) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('✅ Patient login successful');
    
    res.json({
      success: true,
      data: authResult
    });
  })
);

// Provider login (for medical professionals)
router.post('/login/provider',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const db = getDatabase();

    // Get provider data
    const result = await db.query(`
      SELECT 
        id, email, password_hash, first_name, last_name,
        license_number, npi_number, specialties, states_licensed,
        status, email_verified, created_at
      FROM providers 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const provider = result.rows[0];

    // Check provider is active
    if (provider.status !== 'active') {
      throw new AppError('Provider account is not active', 403, 'PROVIDER_INACTIVE');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, provider.password_hash || '');
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = generateTokens({
      id: provider.id,
      email: provider.email,
      role: ROLES.PROVIDER,
      metadata: {
        firstName: provider.first_name,
        lastName: provider.last_name,
        licenseNumber: provider.license_number,
        npiNumber: provider.npi_number,
        specialties: provider.specialties,
        statesLicensed: provider.states_licensed,
        providerStatus: provider.status
      },
      verified: provider.email_verified,
      created_at: provider.created_at
    });

    // Update last login
    await db.query(
      'UPDATE providers SET last_login = NOW() WHERE id = $1',
      [provider.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: provider.id,
          email: provider.email,
          firstName: provider.first_name,
          lastName: provider.last_name,
          role: ROLES.PROVIDER,
          verified: provider.email_verified,
          licenseNumber: provider.license_number,
          statesLicensed: provider.states_licensed
        },
        ...tokens
      }
    });
  })
);

// Admin login
router.post('/login/admin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorCode').optional().isLength({ min: 6, max: 6 }).withMessage('Invalid 2FA code')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password, twoFactorCode } = req.body;
    const db = getDatabase();

    // Get admin data
    const result = await db.query(`
      SELECT 
        id, email, password_hash, first_name, last_name,
        role, permissions, two_factor_enabled, 
        two_factor_secret, status, created_at
      FROM admins 
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const admin = result.rows[0];

    // Check admin is active
    if (admin.status !== 'active') {
      throw new AppError('Admin account is not active', 403, 'ADMIN_INACTIVE');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash || '');
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check 2FA if enabled
    if (admin.two_factor_enabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: false,
          requiresTwoFactor: true,
          message: 'Two-factor authentication code required'
        });
      }
      // TODO: Verify 2FA code with speakeasy or similar
    }

    // Generate tokens
    const tokens = generateTokens({
      id: admin.id,
      email: admin.email,
      role: ROLES.ADMIN,
      metadata: {
        firstName: admin.first_name,
        lastName: admin.last_name,
        permissions: admin.permissions
      },
      verified: true,
      created_at: admin.created_at
    });

    // Update last login
    await db.query(
      'UPDATE admins SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          firstName: admin.first_name,
          lastName: admin.last_name,
          role: ROLES.ADMIN,
          permissions: admin.permissions
        },
        ...tokens
      }
    });
  })
);

// Refresh token endpoint
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const db = getDatabase();

    // Get user based on ID and determine role
    let user = null;
    let role = null;

    // Try patients first
    const patientResult = await db.query(
      'SELECT id, email, first_name, last_name, email_verified FROM patients WHERE id = $1',
      [decoded.id]
    );

    if (patientResult.rows.length > 0) {
      user = patientResult.rows[0];
      role = ROLES.PATIENT;
    } else {
      // Try providers
      const providerResult = await db.query(
        'SELECT id, email, first_name, last_name, status FROM providers WHERE id = $1',
        [decoded.id]
      );

      if (providerResult.rows.length > 0) {
        user = providerResult.rows[0];
        role = ROLES.PROVIDER;
      } else {
        // Try admins
        const adminResult = await db.query(
          'SELECT id, email, first_name, last_name, permissions FROM admins WHERE id = $1',
          [decoded.id]
        );

        if (adminResult.rows.length > 0) {
          user = adminResult.rows[0];
          role = ROLES.ADMIN;
        }
      }
    }

    if (!user) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: role,
      metadata: {
        firstName: user.first_name,
        lastName: user.last_name
      },
      verified: user.email_verified || true
    });

    res.json({
      success: true,
      data: tokens
    });
  })
);

// Logout (invalidate refresh token)
router.post('/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    // In a production system, you would:
    // 1. Add the refresh token to a blacklist
    // 2. Clear any server-side sessions
    // 3. Increment tokenVersion to invalidate all tokens

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// Request password reset
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('userType').isIn(['patient', 'provider', 'admin']).withMessage('Valid user type required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, userType } = req.body;
    const db = getDatabase();

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token based on type
    const table = `${userType}s`; // patients, providers, admins
    const result = await db.query(
      `UPDATE ${table} 
       SET reset_token = $1, reset_token_expires = $2 
       WHERE email = $3 
       RETURNING id`,
      [resetToken, resetExpires, email]
    );

    if (result.rows.length > 0) {
      // TODO: Send email with reset link
      // For now, return token in development
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          success: true,
          message: 'Password reset email sent',
          resetToken: resetToken // Remove in production
        });
      }
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  })
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('userType').isIn(['patient', 'provider', 'admin']).withMessage('Valid user type required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { token, password, userType } = req.body;
    const db = getDatabase();

    // Find user with valid reset token
    const table = `${userType}s`;
    const result = await db.query(
      `SELECT id FROM ${table} 
       WHERE reset_token = $1 
       AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const userId = result.rows[0].id;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await db.query(
      `UPDATE ${table} 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [passwordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

// Verify email
router.get('/verify-email/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const db = getDatabase();

    // Find user with verification token
    const result = await db.query(
      `UPDATE patients 
       SET email_verified = true, verification_token = NULL 
       WHERE verification_token = $1 
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  })
);

// Get current user
router.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDatabase();
    let userData = null;

    // Get full user data based on role
    switch (req.user.role) {
      case ROLES.PATIENT:
        const patientResult = await db.query(
          `SELECT id, email, first_name, last_name, phone, 
                  date_of_birth, subscription_status, created_at 
           FROM patients WHERE id = $1`,
          [req.user.id]
        );
        userData = patientResult.rows[0];
        break;

      case ROLES.PROVIDER:
        const providerResult = await db.query(
          `SELECT id, email, first_name, last_name, license_number, 
                  npi_number, specialties, states_licensed, status 
           FROM providers WHERE id = $1`,
          [req.user.id]
        );
        userData = providerResult.rows[0];
        break;

      case ROLES.ADMIN:
        const adminResult = await db.query(
          `SELECT id, email, first_name, last_name, role, permissions 
           FROM admins WHERE id = $1`,
          [req.user.id]
        );
        userData = adminResult.rows[0];
        break;
    }

    if (!userData) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        ...userData,
        role: req.user.role
      }
    });
  })
);

export default router;
