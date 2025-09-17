import bcrypt from 'bcryptjs';

async function generateMockPasswords() {
  const mockUsers = [
    { email: 'patient@demo.com', password: 'Patient123!', name: 'Demo Patient' },
    { email: 'john.doe@example.com', password: 'JohnDoe123!', name: 'John Doe' },
    { email: 'jane.smith@example.com', password: 'JaneSmith123!', name: 'Jane Smith' },
    { email: 'bob.johnson@example.com', password: 'BobJohnson123!', name: 'Bob Johnson' },
    { email: 'admin@telehealth.com', password: 'Admin123!', name: 'Admin User' },
    { email: 'support@telehealth.com', password: 'Support123!', name: 'Support Team' }
  ];

  console.log('=== MOCK USER CREDENTIALS ===\n');

  for (const user of mockUsers) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`${user.name}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Hash: ${hash}`);
    console.log('');
  }

  console.log('=== PATIENT LOGIN CREDENTIALS FOR TESTING ===');
  console.log('Email: patient@demo.com');
  console.log('Password: Patient123!');
  console.log('==========================================');
}

generateMockPasswords().catch(console.error);