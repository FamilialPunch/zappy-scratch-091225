'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function RefillCheckIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support both 'prescription' and 'prescriptionId' to be robust with different link sources
  const prescriptionId = searchParams.get('prescription') || searchParams.get('prescriptionId');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [responses, setResponses] = useState<any>({});
  const [sideEffects, setSideEffects] = useState<any[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);

  // Medication-specific check-in configurations
  const checkInConfigs: any = {
    'weight-loss': {
      title: 'Weight Loss Medication Check-in',
      steps: 4,
      requiresPhotos: false,
      requiresWeight: true,
      frequency: 'monthly'
    },
    'hair-loss': {
      title: 'Hair Loss Treatment Check-in',
      steps: 4,
      requiresPhotos: true,
      requiresWeight: false,
      frequency: 'quarterly'
    },
    'ed': {
      title: 'ED Medication Check-in',
      steps: 3,
      requiresPhotos: false,
      requiresWeight: false,
      frequency: 'quarterly'
    },
    'skincare': {
      title: 'Skincare Treatment Check-in',
      steps: 4,
      requiresPhotos: true,
      requiresWeight: false,
      frequency: 'monthly'
    }
  };

  // Red flag conditions that trigger escalation
  const redFlagConditions = {
    'chest_pain': ['ed'],
    'vision_changes': ['ed'],
    'severe_nausea': ['weight-loss'],
    'suicidal_thoughts': ['mental-health'],
    'severe_mood_changes': ['hair-loss'],
    'allergic_reaction': ['all'],
    'hospitalization': ['all'],
    'pregnancy': ['all']
  };

  useEffect(() => {
    // Always fetch/set prescription data (mock or real)
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      // For demo/MVP, use mock data if no prescriptionId
      if (!prescriptionId) {
        setPrescription({
          id: 'demo-prescription-001',
          medication_name: 'Semaglutide',
          category: 'weight-loss',
          dosage: '0.5mg',
          frequency: 'Once weekly'
        });
        return;
      }
      
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      setPrescription(response.data);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      // Fallback to mock data for demo
      setPrescription({
        id: prescriptionId || 'demo-prescription-001',
        medication_name: 'Semaglutide',
        category: 'weight-loss',
        dosage: '0.5mg',
        frequency: 'Once weekly'
      });
    }
  };

  const handleResponse = (question: string, value: any) => {
    setResponses({
      ...responses,
      [question]: value
    });

    // Check for red flags
    if (value in redFlagConditions && redFlagConditions[value as keyof typeof redFlagConditions]) {
      setRedFlags([...redFlags, value]);
    }
  };

  const handleSideEffect = (effect: string, severity: number) => {
    const existing = sideEffects.find((se: any) => se.effect === effect);
    if (existing) {
      setSideEffects(sideEffects.map((se: any) => 
        se.effect === effect ? { ...se, severity } : se
      ));
    } else {
      setSideEffects([...sideEffects, { effect, severity }]);
    }

    // Check if severe (8+ out of 10)
    if (severity >= 8) {
      setRedFlags([...redFlags, `severe_${effect}`]);
    }
  };

  const submitCheckIn = async () => {
    setLoading(true);
    setSubmitError(null);
    
    // Use a mock prescriptionId for demo if none provided
    const effectivePrescriptionId = prescriptionId || 'demo-prescription-001';
    
    try {
      const checkInData = {
        prescription_id: effectivePrescriptionId,
        responses,
        side_effects: sideEffects,
        has_red_flags: redFlags.length > 0,
        red_flags: redFlags,
        weight_log: responses.weight_log,
        photos_urls: responses.photos
      };

      const response = await api.post('/refill-checkins', checkInData);

      if (response.data.requires_consultation) {
        router.push('/patient/new-consultation?type=refill-followup');
      } else {
        router.push('/patient/dashboard?checkin=complete');
      }
    } catch (error: any) {
      console.error('Error submitting check-in:', error);
      // Show specific validation errors if available
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => err.msg || err.message).join(', ');
        setSubmitError(`Validation error: ${errorMessages}`);
      } else if (error.response?.data?.error) {
        setSubmitError(error.response.data.error);
      } else {
        setSubmitError('We could not submit your check-in. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const config = prescription ? checkInConfigs[prescription.category] || checkInConfigs['ed'] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {config?.title || 'Medication Check-in'}
            </h1>
            <span className="text-sm text-gray-500">
              Step {step} of {config?.steps || 4}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-medical-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / (config?.steps || 4)) * 100}%` }}
            />
          </div>
        </div>

        {/* Check-in Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {submitError && (
            <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-800">
              {submitError}
            </div>
          )}
          {/* Step 1: General Health */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">General Health Check</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you still taking {prescription?.medication_name} as prescribed?
                </label>
                <div className="space-y-2">
                  {['Yes, exactly as prescribed', 'Yes, but I miss doses sometimes', 'No, I stopped taking it'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleResponse('taking_as_prescribed', option)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        responses.taking_as_prescribed === option
                          ? 'border-medical-600 bg-medical-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any changes to your health since your last check-in?
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                  rows={3}
                  placeholder="Please describe any changes..."
                  value={responses.health_changes || ''}
                  onChange={(e) => handleResponse('health_changes', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you started any new medications?
                </label>
                <div className="space-y-2">
                  {['No', 'Yes'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleResponse('new_medications', option)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        responses.new_medications === option
                          ? 'border-medical-600 bg-medical-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {responses.new_medications === 'Yes' && (
                  <input
                    type="text"
                    className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500"
                    placeholder="Please list the new medications..."
                    value={responses.new_medications_list || ''}
                    onChange={(e) => handleResponse('new_medications_list', e.target.value)}
                  />
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition"
                disabled={!responses.taking_as_prescribed || !responses.new_medications}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Side Effects */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Side Effects Assessment</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Have you experienced any of the following? Rate severity (0-10):
                </label>
                
                <div className="space-y-4">
                  {/* Common side effects based on medication type */}
                  {prescription?.category === 'weight-loss' && (
                    <>
                      {['Nausea', 'Diarrhea', 'Constipation', 'Headache', 'Fatigue'].map((effect) => (
                        <div key={effect} className="space-y-2">
                          <label className="text-sm text-gray-700">{effect}</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">None</span>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              className="flex-1"
                              onChange={(e) => handleSideEffect(effect.toLowerCase(), parseInt(e.target.value))}
                            />
                            <span className="text-xs text-gray-500">Severe</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {prescription?.category === 'ed' && (
                    <>
                      {['Headache', 'Flushing', 'Nasal congestion', 'Back pain', 'Dizziness'].map((effect) => (
                        <div key={effect} className="space-y-2">
                          <label className="text-sm text-gray-700">{effect}</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">None</span>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              className="flex-1"
                              onChange={(e) => handleSideEffect(effect.toLowerCase(), parseInt(e.target.value))}
                            />
                            <span className="text-xs text-gray-500">Severe</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Red flag symptoms */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-3">
                  Have you experienced any of these serious symptoms?
                </p>
                <div className="space-y-2">
                  {['Chest pain', 'Vision changes', 'Severe allergic reaction', 'Thoughts of self-harm'].map((symptom) => (
                    <label key={symptom} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRedFlags([...redFlags, symptom.toLowerCase().replace(' ', '_')]);
                          }
                        }}
                      />
                      <span className="text-sm text-red-800">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Medication Effectiveness */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Treatment Effectiveness</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How effective has {prescription?.medication_name} been for your condition?
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Not effective</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="flex-1"
                    value={responses.effectiveness || 5}
                    onChange={(e) => handleResponse('effectiveness', parseInt(e.target.value))}
                  />
                  <span className="text-sm text-gray-500">Very effective</span>
                </div>
                <p className="text-center text-2xl font-bold text-medical-600 mt-2">
                  {responses.effectiveness || 5}/10
                </p>
              </div>

              {/* Weight tracking for weight loss meds */}
              {config?.requiresWeight && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current weight (lbs)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500"
                    placeholder="Enter your current weight"
                    value={responses.current_weight || ''}
                    onChange={(e) => handleResponse('current_weight', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Would you like to continue this treatment?
                </label>
                <div className="space-y-2">
                  {[
                    'Yes, it\'s working well',
                    'Yes, but I\'d like to adjust the dose',
                    'No, I\'d like to try something else',
                    'I need to discuss with my provider'
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleResponse('continue_treatment', option)}
                      className={`w-full text-left p-3 rounded-lg border ${
                        responses.continue_treatment === option
                          ? 'border-medical-600 bg-medical-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              
              {redFlags.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    ⚠️ Based on your responses, we recommend speaking with a provider immediately.
                  </p>
                  <p className="text-sm text-red-700">
                    Your check-in will be prioritized for provider review.
                  </p>
                </div>
              )}

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Check-in Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medication compliance:</span>
                    <span className="font-medium">{responses.taking_as_prescribed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effectiveness rating:</span>
                    <span className="font-medium">{responses.effectiveness}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Side effects reported:</span>
                    <span className="font-medium">{sideEffects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Continue treatment:</span>
                    <span className="font-medium">{responses.continue_treatment}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any questions or concerns for your provider?
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500"
                  rows={3}
                  placeholder="Optional: Enter any questions or concerns..."
                  value={responses.provider_questions || ''}
                  onChange={(e) => handleResponse('provider_questions', e.target.value)}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  By submitting this check-in, you confirm that all information provided is accurate 
                  and complete. Your provider will review your responses within 24 hours.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={submitCheckIn}
                  disabled={loading}
                  className="flex-1 py-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Check-in'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Educational Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Why are check-ins required?</h3>
          <p className="text-sm text-blue-700">
            Regular check-ins help ensure your medication is working safely and effectively. 
            They allow your provider to monitor your progress, adjust treatment if needed, 
            and ensure you're getting the best possible care.
          </p>
        </div>
      </div>
    </div>
  );
}
