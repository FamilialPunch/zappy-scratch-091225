# Mock User Credentials for Zappy Health Telehealth System

This document contains all the mock/demo login credentials for testing the Zappy Health telehealth system.

## 🏥 Patient Login Credentials

Use these credentials to test the patient portal functionality:

### Primary Demo Patient
- **Email:** `patient@demo.com`  
- **Password:** `Patient123!`
- **Name:** Demo Patient
- **Details:** Complete patient profile for comprehensive testing

### Additional Test Patients
- **Email:** `john.doe@example.com`  
- **Password:** `JohnDoe123!`
- **Name:** John Doe
- **DOB:** 1985-03-15

- **Email:** `test.patient@zappy.health`  
- **Password:** `TestPatient123!`
- **Name:** Test Patient
- **DOB:** 1990-01-01

- **Email:** `jane.smith@example.com`  
- **Password:** `JaneSmith123!`
- **Name:** Jane Smith
- **DOB:** 1990-07-22

- **Email:** `bob.johnson@example.com`  
- **Password:** `BobJohnson123!`
- **Name:** Bob Johnson
- **DOB:** 1978-11-30

## 👨‍⚕️ Provider Login Credentials

Use these credentials to test the provider portal functionality:

- **Email:** `dr.smith@clinic.com`  
- **Password:** `Provider123!`
- **Name:** Dr. Sarah Smith
- **Specialties:** General Medicine, Dermatology

- **Email:** `dr.jones@clinic.com`  
- **Password:** `Provider123!`
- **Name:** Dr. Michael Jones
- **Specialties:** General Medicine, Endocrinology

- **Email:** `np.williams@clinic.com`  
- **Password:** `Provider123!`
- **Name:** Emily Williams, NP
- **Specialties:** Family Medicine

## 👩‍💼 Admin Login Credentials

Use these credentials to test the admin portal functionality:

- **Email:** `admin@telehealth.com`  
- **Password:** `Admin123!`
- **Name:** Admin User
- **Role:** Super Admin

- **Email:** `support@telehealth.com`  
- **Password:** `Support123!`
- **Name:** Support Team
- **Role:** Support

## 🚀 Quick Start Testing

### To test patient login:
1. Go to the patient portal login page
2. Use: `patient@demo.com` / `Patient123!`

### To test provider login:
1. Go to the provider portal login page  
2. Use: `dr.smith@clinic.com` / `Provider123!`

### To test admin login:
1. Go to the admin portal login page
2. Use: `admin@telehealth.com` / `Admin123!`

## 📋 Database Setup

These credentials are automatically created when you run the database initialization script:
```bash
docker-compose up -d
```

The mock data is defined in: `database/complete-schema.sql`

## 🔒 Security Notes

- These are **DEMO CREDENTIALS ONLY** - never use in production
- All passwords follow the pattern: `[Role][Name]123!`
- Password hashes are generated using bcrypt with salt rounds = 10
- All accounts are set to active by default

## 🧪 Testing Scenarios

You can use these different accounts to test:
- **Patient workflows:** Consultations, appointments, medical history
- **Provider workflows:** Patient management, prescriptions, consultations  
- **Admin workflows:** User management, system administration
- **Multi-role interactions:** Patient-provider communications, admin oversight

---
*Last updated: September 17, 2025*