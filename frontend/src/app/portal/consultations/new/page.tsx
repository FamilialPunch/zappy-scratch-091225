"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import NewConsultationForm from '@/components/NewConsultationForm';
import { useToast } from '@/hooks/useToast';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialPatient, setInitialPatient] = useState<Patient | null>(null);
  const { success } = useToast();

  // Mock data
  const mockPatients: Patient[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '(555) 123-4567', dateOfBirth: '1990-05-15' },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@email.com', phone: '(555) 234-5678', dateOfBirth: '1985-11-22' },
    { id: '3', name: 'Emily Davis', email: 'emily.davis@email.com', phone: '(555) 345-6789', dateOfBirth: '1992-08-10' },
    { id: '4', name: 'Robert Wilson', email: 'robert.wilson@email.com', phone: '(555) 456-7890', dateOfBirth: '1978-03-05' },
    { id: '5', name: 'Jessica Martinez', email: 'jessica.martinez@email.com', phone: '(555) 567-8901', dateOfBirth: '1988-12-18' },
  ];

  // no longer needed here; NewConsultationForm contains form content

  useEffect(() => {
    // preselect from query param to keep behavior compatible
    const pid = searchParams?.get('patientId');
    if (pid) {
      const found = mockPatients.find((p) => p.id === pid) || null;
      setInitialPatient(found);
    }
  }, [searchParams]);

  const handleCreated = () => {
    success('Consultation created successfully');
    router.push('/portal/consultations');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Consultation</h1>
            <p className="text-gray-600 mt-1">Create a new consultation for a patient</p>
          </div>
          <button
            onClick={() => router.push('/portal/consultations')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Progress is shown inside the form component */}
      </div>

      {/* Form Content */}
      <NewConsultationForm
        initialPatient={initialPatient ? { id: initialPatient.id, name: initialPatient.name } : null}
        onCancel={() => router.push('/portal/consultations')}
        onCreated={handleCreated}
        mode="page"
      />
    </div>
  );
}