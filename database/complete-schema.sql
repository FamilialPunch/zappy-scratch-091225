-- Complete Telehealth Database Schema with All Required Tables
-- Includes all missing fields and tables identified in the mapping analysis

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables for clean setup
DROP TABLE IF EXISTS patient_measurements CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS consultation_messages CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Enhanced Patients table with all required fields
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    
    -- Shipping address
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    
    -- Medical information
    allergies TEXT,
    current_medications TEXT,
    medical_conditions TEXT,
    blood_type VARCHAR(10),
    
    -- Subscription and account tracking
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_active BOOLEAN DEFAULT false,
    subscription_start_date DATE,
    subscription_end_date DATE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR(255),
    
    -- Profile
    profile_image_url TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Enhanced Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(20), -- Dr., NP, PA, etc.
    phone VARCHAR(20),
    license_number VARCHAR(100),
    license_state VARCHAR(2),
    npi_number VARCHAR(20),
    specialties TEXT[],
    
    -- Statistics
    total_consultations INTEGER DEFAULT 0,
    average_response_time_minutes INTEGER,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    max_daily_consultations INTEGER DEFAULT 50,
    current_daily_consultations INTEGER DEFAULT 0,
    
    -- Profile
    profile_image_url TEXT,
    bio TEXT,
    years_experience INTEGER,
    education TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, support
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enhanced Consultations table with intake data
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id),
    
    -- Intake data
    consultation_type VARCHAR(100) NOT NULL,
    chief_complaint TEXT NOT NULL,
    symptoms TEXT[],
    symptom_duration VARCHAR(100),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    urgency VARCHAR(20) DEFAULT 'regular', -- regular, urgent, emergency
    photos_urls TEXT[],
    attachments JSONB,
    
    -- Complete intake form data (from health quiz)
    intake_data JSONB,
    
    -- Provider assessment
    diagnosis TEXT,
    treatment_plan TEXT,
    internal_notes TEXT,
    provider_notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    plan_sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion tracking
    medication_offered BOOLEAN DEFAULT false,
    medication_ordered BOOLEAN DEFAULT false,
    order_id UUID,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Pricing
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    -- Medication details
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100),
    quantity INTEGER,
    frequency VARCHAR(100),
    duration VARCHAR(100),
    instructions TEXT,
    refills INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    
    -- Dates
    next_refill_date DATE,
    expiration_date DATE,
    last_filled_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled, on_hold
    is_controlled_substance BOOLEAN DEFAULT false,
    
    -- Pricing
    price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory management
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    strength VARCHAR(50),
    form VARCHAR(50),
    
    -- Stock levels
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 100,
    
    -- Pricing
    cost_per_unit DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    subscription_price DECIMAL(10,2),
    
    -- Supplier info
    supplier_name VARCHAR(200),
    supplier_sku VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    
    -- Categories
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    patient_id UUID NOT NULL REFERENCES patients(id),
    consultation_id UUID REFERENCES consultations(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    -- Totals
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Shipping
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(2),
    shipping_zip VARCHAR(10),
    shipping_method VARCHAR(50),
    
    -- Fulfillment
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    pharmacy_order_id VARCHAR(100),
    tracking_number VARCHAR(100),
    carrier VARCHAR(50),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Subscription
    is_subscription BOOLEAN DEFAULT false,
    subscription_frequency VARCHAR(50),
    next_refill_date DATE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    medication_name VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages between patient and provider
CREATE TABLE consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    recipient_id UUID,
    
    message_type VARCHAR(50),
    content TEXT NOT NULL,
    attachments JSONB,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient health measurements tracking
CREATE TABLE patient_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Vital signs
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation INTEGER,
    
    -- Lab values
    glucose_level DECIMAL(5,2),
    cholesterol_total INTEGER,
    cholesterol_ldl INTEGER,
    cholesterol_hdl INTEGER,
    triglycerides INTEGER,
    
    measurement_date DATE NOT NULL,
    measurement_time TIME,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets system
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE DEFAULT 'TKT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    
    -- Requester
    requester_id UUID,
    requester_type VARCHAR(20), -- patient, provider, admin
    requester_email VARCHAR(255),
    
    -- Ticket details
    category VARCHAR(100),
    subject VARCHAR(255),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    
    -- Assignment
    assigned_to UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_time_hours INTEGER,
    satisfaction_rating INTEGER,
    
    -- Related entities
    related_consultation_id UUID REFERENCES consultations(id),
    related_order_id UUID REFERENCES orders(id),
    
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events for tracking and reporting
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    
    -- User info
    user_id UUID,
    user_type VARCHAR(20),
    session_id VARCHAR(100),
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Additional data
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all necessary indexes
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_provider_id ON consultations(provider_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_submitted_at ON consultations(submitted_at DESC);
CREATE INDEX idx_consultations_urgency ON consultations(urgency);

CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_consultation_id ON orders(consultation_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

CREATE INDEX idx_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX idx_messages_is_read ON consultation_messages(is_read);
CREATE INDEX idx_messages_created_at ON consultation_messages(created_at DESC);

CREATE INDEX idx_measurements_patient_id ON patient_measurements(patient_id);
CREATE INDEX idx_measurements_date ON patient_measurements(measurement_date DESC);

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON support_tickets(assigned_to);

CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- Mock Patient Credentials:
-- Email: patient@demo.com, Password: Patient123!
-- Email: john.doe@example.com, Password: JohnDoe123!
-- Email: jane.smith@example.com, Password: JaneSmith123!
-- Email: bob.johnson@example.com, Password: BobJohnson123!
INSERT INTO patients (email, password_hash, first_name, last_name, date_of_birth, gender, phone, shipping_address, shipping_city, shipping_state, shipping_zip, is_active) VALUES
    ('patient@demo.com', '$2a$10$KMlQhLjV7hZRuLEl.mnZxup5njjJF5yf8VIBNxvVW/6fILSwILMJG', 'Demo', 'Patient', '1990-01-01', 'Other', '555-DEMO-001', '123 Demo Street', 'Demo City', 'CA', '90210', true),
    ('john.doe@example.com', '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', 'John', 'Doe', '1985-03-15', 'Male', '555-0100', '456 Oak Avenue', 'Springfield', 'CA', '90211', true),
    ('jane.smith@example.com', '$2a$10$ahpAiPpZUBLwn2JQyw2FxuOOr5Fz8B89I/gSs/p4ALHJEUQEzhrMW', 'Jane', 'Smith', '1990-07-22', 'Female', '555-0101', '789 Pine Boulevard', 'Riverside', 'CA', '90212', true),
    ('bob.johnson@example.com', '$2a$10$b3Lrhm489vI/Oe003Xw8OOsrGQXuq2/tXUjmnKCO3KoGKUfl2K6TW', 'Bob', 'Johnson', '1978-11-30', 'Male', '555-0102', '321 Maple Drive', 'Oceanview', 'CA', '90213', true);

-- Mock Provider Credentials: Password for all is 'Provider123!'
INSERT INTO providers (email, password_hash, first_name, last_name, title, license_number, license_state, specialties, status) VALUES
    ('dr.smith@clinic.com', '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', 'Sarah', 'Smith', 'Dr.', 'MD123456', 'CA', ARRAY['General Medicine', 'Dermatology'], 'active'),
    ('dr.jones@clinic.com', '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', 'Michael', 'Jones', 'Dr.', 'MD789012', 'CA', ARRAY['General Medicine', 'Endocrinology'], 'active'),
    ('np.williams@clinic.com', '$2a$10$VSpiQl1OXm2tsGmJt..7cu0OZygPWngCGndbxVrQWzYngByDc0lBu', 'Emily', 'Williams', 'NP', 'NP345678', 'CA', ARRAY['Family Medicine'], 'active');

-- Mock Admin Credentials:
-- Email: admin@telehealth.com, Password: Admin123!
-- Email: support@telehealth.com, Password: Support123!
INSERT INTO admin_users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@telehealth.com', '$2a$10$0tHlfcBjzPGSaQpN.Giy1uE.aeq.zbI75W.uVpw2H8V42RtkY5OsO', 'Admin', 'User', 'super_admin'),
    ('support@telehealth.com', '$2a$10$Hzd2A0tjjYknzRJREoN25ObhfZa.50fHEsvHK3SbrVPmyKLwdz/R2', 'Support', 'Team', 'support');

-- Sample inventory
INSERT INTO inventory (sku, medication_name, generic_name, strength, form, quantity_on_hand, cost_per_unit, retail_price, subscription_price, category) VALUES
    ('TRE-025-CR', 'Tretinoin Cream', 'Tretinoin', '0.025%', 'cream', 100, 8.00, 59.00, 49.00, 'Dermatology'),
    ('TRE-050-CR', 'Tretinoin Cream', 'Tretinoin', '0.05%', 'cream', 100, 10.00, 69.00, 59.00, 'Dermatology'),
    ('SIL-50-TAB', 'Sildenafil', 'Sildenafil', '50mg', 'tablet', 500, 2.00, 10.00, 8.00, 'Mens Health'),
    ('SIL-100-TAB', 'Sildenafil', 'Sildenafil', '100mg', 'tablet', 500, 3.00, 15.00, 12.00, 'Mens Health'),
    ('FIN-1-TAB', 'Finasteride', 'Finasteride', '1mg', 'tablet', 300, 0.50, 2.00, 1.50, 'Hair Loss'),
    ('MIN-5-SOL', 'Minoxidil Solution', 'Minoxidil', '5%', 'solution', 200, 5.00, 29.00, 24.00, 'Hair Loss'),
    ('SEM-025-PEN', 'Semaglutide', 'Semaglutide', '0.25mg', 'pen', 50, 150.00, 299.00, 249.00, 'Weight Loss'),
    ('SEM-050-PEN', 'Semaglutide', 'Semaglutide', '0.5mg', 'pen', 50, 200.00, 399.00, 349.00, 'Weight Loss'),
    ('DOX-100-CAP', 'Doxycycline', 'Doxycycline', '100mg', 'capsule', 400, 0.40, 4.00, 3.50, 'Antibiotics'),
    ('MET-500-TAB', 'Metformin', 'Metformin', '500mg', 'tablet', 600, 0.30, 3.00, 2.50, 'Diabetes');
