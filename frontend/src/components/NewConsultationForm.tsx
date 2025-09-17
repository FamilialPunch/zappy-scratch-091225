'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { useToast } from '@/hooks/useToast';

type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
};

type Props = {
  initialPatient?: Patient | null;
  onCancel?: () => void;
  onCreated?: (consultation: any) => void;
  mode?: 'page' | 'modal';
};

export default function NewConsultationForm({ initialPatient = null, onCancel, onCreated, mode = 'page' }: Props) {
  const { error: errorToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [userRole, setUserRole] = useState<string>('provider');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultationType, setConsultationType] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomDuration, setSymptomDuration] = useState('');
  const [severity, setSeverity] = useState(5);
  const [urgency, setUrgency] = useState('regular');
  const [notes, setNotes] = useState('');
  const [assignedProvider, setAssignedProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mock data
  const mockPatients: Patient[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '(555) 123-4567', dateOfBirth: '1990-05-15' },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@email.com', phone: '(555) 234-5678', dateOfBirth: '1985-11-22' },
    { id: '3', name: 'Emily Davis', email: 'emily.davis@email.com', phone: '(555) 345-6789', dateOfBirth: '1992-08-10' },
    { id: '4', name: 'Robert Wilson', email: 'robert.wilson@email.com', phone: '(555) 456-7890', dateOfBirth: '1978-03-05' },
    { id: '5', name: 'Jessica Martinez', email: 'jessica.martinez@email.com', phone: '(555) 567-8901', dateOfBirth: '1988-12-18' },
  ];

  const mockProviders = [
    { id: '1', name: 'Dr. Smith' },
    { id: '2', name: 'Dr. Jones' },
    { id: '3', name: 'Dr. Brown' },
    { id: '4', name: 'Dr. Garcia' },
  ];

  const consultationTypes = [
    { value: 'general_medicine', label: 'General Medicine', icon: '🩺' },
    { value: 'dermatology', label: 'Dermatology', icon: '🧴' },
    { value: 'mental_health', label: 'Mental Health', icon: '🧠' },
    { value: 'womens_health', label: "Women's Health", icon: '👩‍⚕️' },
    { value: 'mens_health', label: "Men's Health", icon: '👨‍⚕️' },
    { value: 'weight_loss', label: 'Weight Management', icon: '⚖️' },
    { value: 'follow_up', label: 'Follow-up', icon: '🔄' },
    { value: 'prescription_renewal', label: 'Prescription Renewal', icon: '💊' },
  ];

  const symptomOptions: Record<string, string[]> = {
    general_medicine: ['Fever', 'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Cough', 'Sore throat'],
    dermatology: ['Acne', 'Rash', 'Itching', 'Dry skin', 'Hair loss', 'Moles', 'Eczema'],
    mental_health: ['Anxiety', 'Depression', 'Stress', 'Sleep issues', 'Mood swings', 'Panic attacks'],
    womens_health: ['Irregular periods', 'PMS', 'Birth control', 'UTI', 'Hormonal issues'],
    mens_health: ['ED', 'Low testosterone', 'Hair loss', 'Prostate issues'],
    weight_loss: ['Weight gain', 'Slow metabolism', 'Food cravings', 'Low energy'],
    follow_up: ['Treatment review', 'Medication adjustment', 'Progress check'],
    prescription_renewal: ['Medication refill', 'Dosage review', 'Side effects check'],
  };

  useEffect(() => {
    const role = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'provider';
    setUserRole(role);

    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setCurrentStep(2);
    }
  }, [initialPatient]);

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !consultationType || !chiefComplaint) {
      errorToast('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const consultationData = {
        id: `consultation-${Date.now()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        consultationType,
        chiefComplaint,
        symptoms,
        symptomDuration,
        severity,
        urgency,
        notes,
        assignedProvider: assignedProvider || 'Unassigned',
        status: 'pending',
        createdBy: userRole,
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      };
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 600));
  onCreated?.(consultationData);
    } catch (e) {
      console.error(e);
      errorToast('Failed to create consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((s) => (s < totalSteps ? s + 1 : s));
  const prevStep = () => setCurrentStep((s) => (s > 1 ? s - 1 : s));
  const canProceedFromStep1 = selectedPatient && consultationType && chiefComplaint;
  const canProceedFromStep2 = symptomDuration && symptoms.length > 0;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Patient Selection */}
            {!initialPatient && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">Select Patient *</label>
                <div className="grid gap-3">
                  {mockPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                        selectedPatient?.id === patient.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-600">{patient.email}</div>
                          <div className="text-sm text-gray-600">{patient.phone}</div>
                        </div>
                        <div className="text-sm text-gray-500">DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Type */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Consultation Type *</label>
              <div className="grid md:grid-cols-2 gap-3">
                {consultationTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setConsultationType(type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                      consultationType === type.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Chief Complaint *</label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe the primary health concern or reason for this consultation..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                rows={4}
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Symptoms */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Select Symptoms *</label>
              {consultationType && symptomOptions[consultationType] && (
                <div className="grid md:grid-cols-3 gap-2">
                  {symptomOptions[consultationType].map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        symptoms.includes(symptom) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Symptom Duration *</label>
              <select
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                required
              >
                <option value="">Select duration</option>
                <option value="less_than_24h">Less than 24 hours</option>
                <option value="1-3_days">1-3 days</option>
                <option value="1_week">About 1 week</option>
                <option value="2-4_weeks">2-4 weeks</option>
                <option value="1-3_months">1-3 months</option>
                <option value="more_than_3_months">More than 3 months</option>
                <option value="chronic">Chronic/Ongoing</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Severity (1-10) *</label>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Mild</span>
                <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm text-gray-500">Severe</span>
                <span className="font-semibold text-lg text-blue-600">{severity}</span>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Urgency Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'low', label: 'Low', color: 'green' },
                  { value: 'regular', label: 'Regular', color: 'blue' },
                  { value: 'high', label: 'High', color: 'yellow' },
                  { value: 'urgent', label: 'Urgent', color: 'red' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setUrgency(level.value)}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      urgency === level.value ? `border-${level.color}-600 bg-${level.color}-50 text-${level.color}-700` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Provider Assignment */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Assign to Provider</label>
              <select value={assignedProvider} onChange={(e) => setAssignedProvider(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none">
                <option value="">Auto-assign (recommended)</option>
                {mockProviders.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">If no provider is selected, the consultation will be automatically assigned based on availability and specialty.</p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Additional Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information or special instructions..." className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" rows={4} />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Consultation Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Patient:</strong> {selectedPatient?.name}
                </div>
                <div>
                  <strong>Type:</strong> {consultationTypes.find((t) => t.value === consultationType)?.label}
                </div>
                <div>
                  <strong>Chief Complaint:</strong> {chiefComplaint}
                </div>
                <div>
                  <strong>Symptoms:</strong> {symptoms.join(', ')}
                </div>
                <div>
                  <strong>Duration:</strong> {symptomDuration.replace('_', ' ')}
                </div>
                <div>
                  <strong>Severity:</strong> {severity}/10
                </div>
                <div>
                  <strong>Urgency:</strong> {urgency}
                </div>
                <div>
                  <strong>Provider:</strong> {assignedProvider || 'Auto-assign'}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      {renderStepContent()}

      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
          Cancel
        </button>
        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            disabled={(currentStep === 1 && !canProceedFromStep1) || (currentStep === 2 && !canProceedFromStep2)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Creating...' : 'Create Consultation'}
          </button>
        )}
      </div>
    </Card>
  );
}
