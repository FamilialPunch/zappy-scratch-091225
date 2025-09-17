import bcrypt from 'bcryptjs';

// Mock patient data with real password hashes for testing
const mockPatients = [
  {
    id: 'demo-patient-1',
    email: 'patient@demo.com',
    password_hash: '$2a$10$KMlQhLjV7hZRuLEl.mnZxup5njjJF5yf8VIBNxvVW/6fILSwILMJG',
    first_name: 'Demo',
    last_name: 'Patient',
    phone: '555-DEMO-001',
    date_of_birth: '1990-01-01',
    subscription_tier: 'free',
    created_at: new Date('2024-01-01'),
    is_active: true
  },
  {
    id: 'demo-patient-2',
    email: 'john.doe@example.com',
    password_hash: '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-0100',
    date_of_birth: '1985-03-15',
    subscription_tier: 'free',
    created_at: new Date('2024-01-01'),
    is_active: true
  },
  {
    id: 'demo-patient-3',
    email: 'jane.smith@example.com',
    password_hash: '$2a$10$ahpAiPpZUBLwn2JQyw2FxuOOr5Fz8B89I/gSs/p4ALHJEUQEzhrMW',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '555-0101',
    date_of_birth: '1990-07-22',
    subscription_tier: 'free',
    created_at: new Date('2024-01-01'),
    is_active: true
  },
  {
    id: 'demo-patient-4',
    email: 'test.patient@zappy.health',
    password_hash: '$2a$10$.srD/9QAiGd0o.cmOJ9Jc.SS1f1h9f9HDC/Q1VAO38u5iZzLebWaW',
    first_name: 'Test',
    last_name: 'Patient',
    phone: '555-TEST-123',
    date_of_birth: '1990-01-01',
    subscription_tier: 'free',
    created_at: new Date('2024-01-01'),
    is_active: true
  }
];

export async function mockPatientLogin(email, password) {
  console.log('🔄 Using mock authentication for patient login');
  
  // Find patient by email
  const patient = mockPatients.find(p => p.email.toLowerCase() === email.toLowerCase());
  
  if (!patient) {
    console.log('❌ Mock auth: Patient not found');
    return null;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, patient.password_hash);
  
  if (!isValidPassword) {
    console.log('❌ Mock auth: Invalid password');
    return null;
  }

  console.log('✅ Mock auth: Patient login successful');
  return patient;
}

export async function mockUpdatePatientLogin(patientId) {
  console.log('🔄 Mock auth: Simulating last login update');
  // In mock mode, we just log this action
  return true;
}