'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewConsultation() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data states
  const [consultationType, setConsultationType] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomDuration, setSymptomDuration] = useState('');
  const [severity, setSeverity] = useState(5);
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [lifestyle, setLifestyle] = useState({
    smoking: '',
    alcohol: '',
    exercise: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [urgency, setUrgency] = useState('regular');
  const [preferredTime, setPreferredTime] = useState('');
  const [hasConsented, setHasConsented] = useState(false);

  // Consultation type options
  const consultationTypes = [
    { value: 'general_medicine', label: 'General Medicine', icon: '🩺' },
    { value: 'dermatology', label: 'Dermatology', icon: '🧴' },
    { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
    { value: 'womens_health', label: "Women's Health", icon: '👩‍⚕️' },
    { value: 'mens_health', label: "Men's Health", icon: '👨‍⚕️' },
    { value: 'weight_loss', label: 'Weight Management', icon: '⚖️' }
  ];

  // Common symptoms by category
  const symptomOptions: Record<string, string[]> = {
    general_medicine: ['Fever', 'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Cough', 'Sore throat'],
    dermatology: ['Acne', 'Rash', 'Itching', 'Dry skin', 'Hair loss', 'Moles', 'Eczema'],
    mental_health: ['Anxiety', 'Depression', 'Stress', 'Sleep issues', 'Mood swings', 'Panic attacks'],
    womens_health: ['Irregular periods', 'PMS', 'Birth control', 'UTI', 'Hormonal issues'],
    mens_health: ['ED', 'Low testosterone', 'Hair loss', 'Prostate issues'],
    weight_loss: ['Weight gain', 'Slow metabolism', 'Food cravings', 'Low energy']
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Handle symptom selection
  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    const consultationData = {
      consultationType,
      chiefComplaint,
      symptoms,
      symptomDuration,
      severity,
      currentMedications,
      allergies,
      medicalHistory,
      lifestyle,
      additionalInfo,
      photos: photos.map(photo => photo.name), // In production, upload to cloud storage
      urgency,
      preferredTime,
      submittedAt: new Date().toISOString()
    };

    // Save to localStorage (in production, send to API)
    localStorage.setItem('consultationData', JSON.stringify(consultationData));
    
    // Redirect to confirmation page
    router.push('/patient/consultation-submitted');
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of consultation do you need?</h2>
              <p className="text-gray-600 mb-6">Select the category that best describes your health concern.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {consultationTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setConsultationType(type.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      consultationType === type.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-semibold text-gray-900">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                What is your main concern? *
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe your primary health concern or reason for this consultation..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                rows={4}
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your symptoms</h2>
              <p className="text-gray-600 mb-6">Select all symptoms you're experiencing and provide additional details.</p>
              
              {consultationType && symptomOptions[consultationType] && (
                <div>
                  <label className="block text-gray-700 font-medium mb-3">Common symptoms for {consultationTypes.find(t => t.value === consultationType)?.label}:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {symptomOptions[consultationType].map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => handleSymptomToggle(symptom)}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          symptoms.includes(symptom)
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    How long have you had these symptoms? *
                  </label>
                  <select
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="less_than_week">Less than a week</option>
                    <option value="1_2_weeks">1-2 weeks</option>
                    <option value="2_4_weeks">2-4 weeks</option>
                    <option value="1_3_months">1-3 months</option>
                    <option value="3_6_months">3-6 months</option>
                    <option value="6_12_months">6-12 months</option>
                    <option value="over_year">Over a year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Severity Level (1 = mild, 10 = severe)
                  </label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">1</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={severity}
                      onChange={(e) => setSeverity(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">10</span>
                    <span className="ml-2 font-semibold text-purple-600">{severity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical History & Medications</h2>
              <p className="text-gray-600 mb-6">Help us understand your medical background for safer, more effective care.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Current Medications
                </label>
                <textarea
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="List all medications, supplements, and vitamins you're currently taking, or type 'None'"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Allergies
                </label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="List any drug allergies, food allergies, or environmental allergies, or type 'None'"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  rows={4}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Relevant Medical History
              </label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Include any relevant medical conditions, surgeries, or family history that might be related to your current concern"
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                rows={4}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Smoking</label>
                  <select
                    value={lifestyle.smoking}
                    onChange={(e) => setLifestyle({...lifestyle, smoking: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="never">Never</option>
                    <option value="former">Former smoker</option>
                    <option value="occasional">Occasionally</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Alcohol</label>
                  <select
                    value={lifestyle.alcohol}
                    onChange={(e) => setLifestyle({...lifestyle, alcohol: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="none">None</option>
                    <option value="occasional">Occasionally</option>
                    <option value="1-2_daily">1-2 drinks/day</option>
                    <option value="3+_daily">3+ drinks/day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Exercise</label>
                  <select
                    value={lifestyle.exercise}
                    onChange={(e) => setLifestyle({...lifestyle, exercise: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="none">None</option>
                    <option value="light">Light (1-2x/week)</option>
                    <option value="moderate">Moderate (3-4x/week)</option>
                    <option value="intense">Intense (5+x/week)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Information</h2>
              <p className="text-gray-600 mb-6">Upload photos if relevant and set your consultation preferences.</p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Upload Photos (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                If applicable, upload photos to help providers better understand your condition
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-purple-600 font-medium">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any other information you'd like to share with the provider..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                rows={4}
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                How urgent is your condition?
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'regular', label: 'Regular', description: 'Response within 24 hours' },
                  { value: 'urgent', label: 'Urgent', description: 'Response within 4 hours' },
                  { value: 'emergency', label: 'Emergency', description: 'Immediate response needed' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setUrgency(option.value)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      urgency === option.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
              {urgency === 'emergency' && (
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ For life-threatening emergencies, please call 911 or visit your nearest emergency room.
                  </p>
                </div>
              )}
            </div>

            {/* Preferred Contact Time */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Preferred Contact Time
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="evening">Evening (5 PM - 9 PM)</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            <Link href="/patient/consultations" className="text-gray-600 hover:text-gray-900">
              Back to Consultations
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Consultation Request</h1>
          <p className="text-lg text-gray-600 mt-2">
            Complete this form to request a consultation with one of our healthcare providers.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < totalSteps && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!consultationType || (currentStep === 1 && !chiefComplaint)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                (!consultationType || (currentStep === 1 && !chiefComplaint))
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              Next →
            </button>
          ) : (
            <div className="space-y-4">
              <label className="flex items-start cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 mr-3" 
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                />
                <span className="text-sm text-gray-600">
                  I understand that this consultation is not for emergency medical conditions. 
                  I consent to share my health information with licensed healthcare providers 
                  for the purpose of receiving medical advice and treatment.
                </span>
              </label>
              <button
                onClick={handleSubmit}
                disabled={!hasConsented}
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  hasConsented
                    ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Consultation Request
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>🔒 Your information is encrypted and secure. We comply with HIPAA regulations.</p>
        </div>
      </main>
    </div>
  );
}
