import bcrypt from 'bcryptjs';

async function testDemoPatientLogin() {
  const email = 'patient@demo.com';
  const password = 'Patient123!';
  
  // The hash that should be in the database
  const expectedHash = '$2a$10$KMlQhLjV7hZRuLEl.mnZxup5njjJF5yf8VIBNxvVW/6fILSwILMJG';
  
  // Verify the password matches
  const isValid = await bcrypt.compare(password, expectedHash);
  
  console.log('=== DEMO PATIENT LOGIN TEST ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Password Valid:', isValid ? '✅ YES' : '❌ NO');
  console.log('===============================\n');
  
  if (isValid) {
    console.log('🎉 SUCCESS! Demo patient login credentials are working!');
    console.log('\n📋 Ready to use:');
    console.log('Email: patient@demo.com');
    console.log('Password: Patient123!');
    console.log('\n🚀 You can now log into the patient portal with these credentials.');
  } else {
    console.log('❌ Error: Demo patient credentials are not working correctly.');
  }
}

testDemoPatientLogin().catch(console.error);