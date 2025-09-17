import bcrypt from 'bcryptjs';
import { generateTokens, ROLES } from '../middleware/auth.js';

// Mock user data - hardcoded for testing without database
const MOCK_PATIENTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'patient@demo.com',
    password_hash: '$2a$10$KMlQhLjV7hZRuLEl.mnZxup5njjJF5yf8VIBNxvVW/6fILSwILMJG', // Patient123!
    first_name: 'Demo',
    last_name: 'Patient',
    phone: '555-DEMO-001',
    date_of_birth: '1990-01-01',
    subscription_tier: 'free',
    created_at: new Date('2025-01-01')
  },
  // Extra explicit test account for QA/dev login (no database required)
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'test.patient@zappy.health',
    password_hash: '$2a$10$.srD/9QAiGd0o.cmOJ9Jc.SS1f1h9f9HDC/Q1VAO38u5iZzLebWaW', // TestPatient123!
    first_name: 'Test',
    last_name: 'Patient',
    phone: '555-TEST-123',
    date_of_birth: '1990-01-01',
    subscription_tier: 'free',
    created_at: new Date('2025-01-01')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'john.doe@example.com',
    password_hash: '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', // JohnDoe123!
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-0100',
    date_of_birth: '1985-03-15',
    subscription_tier: 'premium',
    created_at: new Date('2025-01-01')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'jane.smith@example.com',
    password_hash: '$2a$10$ahpAiPpZUBLwn2JQyw2FxuOOr5Fz8B89I/gSs/p4ALHJEUQEzhrMW', // JaneSmith123!
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '555-0101',
    date_of_birth: '1990-07-22',
    subscription_tier: 'basic',
    created_at: new Date('2025-01-01')
  }
];

const MOCK_ADMINS = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    email: 'admin@telehealth.com',
    password_hash: '$2a$10$0tHlfcBjzPGSaQpN.Giy1uE.aeq.zbI75W.uVpw2H8V42RtkY5OsO', // Admin123!
    first_name: 'Admin',
    last_name: 'User',
    role: 'super_admin'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    email: 'support@telehealth.com',
    password_hash: '$2a$10$Hzd2A0tjjYknzRJREoN25ObhfZa.50fHEsvHK3SbrVPmyKLwdz/R2', // Support123!
    first_name: 'Support',
    last_name: 'Team',
    role: 'support'
  }
];

const MOCK_PROVIDERS = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    email: 'dr.smith@clinic.com',
    password_hash: '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', // Provider123!
    first_name: 'Sarah',
    last_name: 'Smith',
    title: 'Dr.',
    specialties: ['General Medicine', 'Dermatology'],
    status: 'active'
  }
];

class MockAuthService {
  // Patient authentication
  async authenticatePatient(email, password) {
    console.log('🔍 Mock Auth: Attempting patient login for:', email);
    
    const patient = MOCK_PATIENTS.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!patient) {
      console.log('❌ Mock Auth: Patient not found');
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, patient.password_hash);
    if (!isValidPassword) {
      console.log('❌ Mock Auth: Invalid password');
      return null;
    }

    console.log('✅ Mock Auth: Patient authenticated successfully');
    
    // Generate tokens
    const tokens = generateTokens({
      id: patient.id,
      email: patient.email,
      role: ROLES.PATIENT,
      metadata: {
        firstName: patient.first_name,
        lastName: patient.last_name,
        subscriptionStatus: patient.subscription_tier
      },
      verified: true,
      created_at: patient.created_at
    });

    return {
      user: {
        id: patient.id,
        email: patient.email,
        firstName: patient.first_name,
        lastName: patient.last_name,
        role: ROLES.PATIENT,
        verified: true,
        subscriptionStatus: patient.subscription_tier
      },
      ...tokens
    };
  }

  // Admin authentication
  async authenticateAdmin(email, password) {
    console.log('🔍 Mock Auth: Attempting admin login for:', email);
    
    const admin = MOCK_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      console.log('❌ Mock Auth: Admin not found');
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      console.log('❌ Mock Auth: Invalid password');
      return null;
    }

    console.log('✅ Mock Auth: Admin authenticated successfully');
    return {
      user: {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
        verified: true
      }
    };
  }

  // Provider authentication  
  async authenticateProvider(email, password) {
    console.log('🔍 Mock Auth: Attempting provider login for:', email);
    
    const provider = MOCK_PROVIDERS.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!provider) {
      console.log('❌ Mock Auth: Provider not found');
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, provider.password_hash);
    if (!isValidPassword) {
      console.log('❌ Mock Auth: Invalid password');
      return null;
    }

    console.log('✅ Mock Auth: Provider authenticated successfully');
    return {
      user: {
        id: provider.id,
        email: provider.email,
        firstName: provider.first_name,
        lastName: provider.last_name,
        role: ROLES.PROVIDER,
        verified: true,
        specialties: provider.specialties,
        status: provider.status
      }
    };
  }

  // Get available mock users for reference
  getMockUsers() {
    return {
      patients: MOCK_PATIENTS.map(p => ({
        email: p.email,
        name: `${p.first_name} ${p.last_name}`,
        password: 'See MOCK_CREDENTIALS.md'
      })),
      admins: MOCK_ADMINS.map(a => ({
        email: a.email,
        name: `${a.first_name} ${a.last_name}`,
        role: a.role,
        password: 'See MOCK_CREDENTIALS.md'
      })),
      providers: MOCK_PROVIDERS.map(p => ({
        email: p.email,
        name: `${p.title} ${p.first_name} ${p.last_name}`,
        specialties: p.specialties,
        password: 'See MOCK_CREDENTIALS.md'
      }))
    };
  }
}

export const mockAuthService = new MockAuthService();
export { MOCK_PATIENTS, MOCK_ADMINS, MOCK_PROVIDERS };