const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Database connection
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'telehealth_db',
  user: 'telehealth_user',
  password: 'secure_password'
});

async function createTestPatient() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Test credentials
    const email = 'test.patient@zappy.health';
    const password = 'TestPatient123!';
    const firstName = 'Test';
    const lastName = 'Patient';
    const dateOfBirth = '1990-01-01';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Check if patient already exists
    const existingResult = await client.query(
      'SELECT id FROM patients WHERE email = $1',
      [email]
    );

    if (existingResult.rows.length > 0) {
      console.log('Patient already exists, updating password...');
      await client.query(
        'UPDATE patients SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [passwordHash, email]
      );
      console.log('Password updated for existing patient');
    } else {
      // Create new patient
      const result = await client.query(`
        INSERT INTO patients (
          email, password_hash, first_name, last_name, 
          date_of_birth, gender, phone, 
          shipping_address, shipping_city, shipping_state, shipping_zip,
          is_active, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, email, first_name, last_name
      `, [
        email, passwordHash, firstName, lastName,
        dateOfBirth, 'Other', '555-TEST-123',
        '123 Test Street', 'Test City', 'CA', '90210',
        true, true
      ]);

      console.log('New patient created:', result.rows[0]);
    }

    console.log('\n=== PATIENT LOGIN CREDENTIALS ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('=================================\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTestPatient();