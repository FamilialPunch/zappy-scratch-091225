import bcrypt from 'bcryptjs';

async function testLogin() {
  const email = 'test.patient@zappy.health';
  const password = 'TestPatient123!';
  
  // Generate the correct hash for this password
  const correctHash = await bcrypt.hash(password, 10);
  console.log('Generated hash for password:', correctHash);
  
  // The hash that's now in the database
  const storedHash = '$2a$10$.srD/9QAiGd0o.cmOJ9Jc.SS1f1h9f9HDC/Q1VAO38u5iZzLebWaW';
  
  // Verify the password matches
  const isValid = await bcrypt.compare(password, storedHash);
  const isValidWithCorrect = await bcrypt.compare(password, correctHash);
  
  console.log('=== PATIENT LOGIN TEST ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Current DB Hash:', storedHash);
  console.log('Correct Hash:', correctHash);
  console.log('Password Valid (current):', isValid);
  console.log('Password Valid (correct):', isValidWithCorrect);
  console.log('========================\n');
  
  if (isValidWithCorrect) {
    console.log('✅ GENERATED CORRECT HASH!');
    console.log('Use this hash in the database:', correctHash);
  } else {
    console.log('❌ Something went wrong with hash generation');
  }
}

testLogin().catch(console.error);