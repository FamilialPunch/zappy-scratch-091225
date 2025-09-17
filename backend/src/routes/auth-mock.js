import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { 
  requireAuth, 
  generateTokens, 
  verifyRefreshToken, 
  ROLES 
} from '../middleware/auth.js';
import { AppError } from '../errors/AppError.js';
import { mockAuthService } from '../services/mockAuth.js';

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

// Patient login using mock authentication
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

// Provider login using mock authentication
router.post('/login/provider',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Provider login attempt for:', email);
    
    // Use mock authentication service
    const authResult = await mockAuthService.authenticateProvider(email, password);
    
    if (!authResult) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('✅ Provider login successful');
    
    res.json({
      success: true,
      data: authResult
    });
  })
);

// Admin login using mock authentication
router.post('/login/admin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt for:', email);
    
    // Use mock authentication service
    const authResult = await mockAuthService.authenticateAdmin(email, password);
    
    if (!authResult) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('✅ Admin login successful');
    
    res.json({
      success: true,
      data: authResult
    });
  })
);

// Get current user info
router.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Since we're using mock auth, just return the user from the token
    res.json({
      success: true,
      data: req.user
    });
  })
);

// Mock logout endpoint
router.post('/logout',
  asyncHandler(async (req, res) => {
    // In a real app, this would invalidate tokens
    console.log('🚪 User logged out');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

// Get available mock users (for testing/development)
router.get('/mock-users',
  asyncHandler(async (req, res) => {
    const users = mockAuthService.getMockUsers();
    res.json({
      success: true,
      data: users,
      message: 'Available mock users for testing. See MOCK_CREDENTIALS.md for passwords.'
    });
  })
);

// Health check for auth service
router.get('/health',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      service: 'Mock Authentication Service',
      status: 'healthy',
      availableEndpoints: [
        'POST /login/patient',
        'POST /login/provider', 
        'POST /login/admin',
        'GET /me',
        'POST /logout',
        'GET /mock-users'
      ]
    });
  })
);

export default router;