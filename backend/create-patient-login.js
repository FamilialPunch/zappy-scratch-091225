import dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '../.env' });

// Database connection using postgres library like the test script
const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'telehealth_db',
  username: 'telehealth_user',
  password: 'secure_password'
});

async function createTestPatient() {
  try {
    console.log('Connecting to database...');
    
    // Test credentials for patient login
    const email = 'test.patient@zappy.health';
    const password = 'TestPatient123!';
    const firstName = 'Test';
    const lastName = 'Patient';
    const dateOfBirth = '1990-01-01';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Check if patient already exists
    const existing = await sql`
      SELECT id FROM patients WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log('Patient already exists, updating password...');
      await sql`
        UPDATE patients 
        SET password_hash = ${passwordHash}, updated_at = NOW() 
        WHERE email = ${email}
      `;
      console.log('Password updated for existing patient');
    } else {
      // Create new patient
      const result = await sql`
        INSERT INTO patients (
          email, password_hash, first_name, last_name, 
          date_of_birth, gender, phone, 
          shipping_address, shipping_city, shipping_state, shipping_zip,
          is_active, email_verified
        ) VALUES (
          ${email}, ${passwordHash}, ${firstName}, ${lastName},
          ${dateOfBirth}, 'Other', '555-TEST-123',
          '123 Test Street', 'Test City', 'CA', '90210',
          ${true}, ${true}
        )
        RETURNING id, email, first_name, last_name
      `;

      console.log('New patient created:', result[0]);
    }

    // Verify the patient exists and can be found
    const verifyResult = await sql`
      SELECT id, email, first_name, last_name, date_of_birth, is_active, email_verified
      FROM patients 
      WHERE email = ${email}
    `;

    console.log('\n=== PATIENT LOGIN CREDENTIALS ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Patient Details:', verifyResult[0]);
    console.log('=================================\n');

    console.log('✅ Patient account created successfully!');
    console.log('You can now use these credentials to log into the patient portal.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await sql.end();
  }
}

createTestPatient();