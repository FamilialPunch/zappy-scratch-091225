-- Create test patient account for login
-- Password: TestPatient123! (hashed with bcrypt)

-- First, let's check if the patient table exists and see its structure
\d patients;

-- Create or update the test patient
INSERT INTO patients (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  date_of_birth, 
  gender, 
  phone, 
  shipping_address, 
  shipping_city, 
  shipping_state, 
  shipping_zip,
  is_active, 
  email_verified
) VALUES (
  'test.patient@zappy.health',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'TestPatient123!'
  'Test',
  'Patient', 
  '1990-01-01',
  'Other',
  '555-TEST-123',
  '123 Test Street',
  'Test City',
  'CA',
  '90210',
  true,
  true
) ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Verify the patient was created
SELECT 
  id,
  email,
  first_name,
  last_name,
  date_of_birth,
  is_active,
  email_verified,
  created_at
FROM patients 
WHERE email = 'test.patient@zappy.health';

-- Display login credentials
SELECT 
  'LOGIN CREDENTIALS' as info,
  'test.patient@zappy.health' as email,
  'TestPatient123!' as password;