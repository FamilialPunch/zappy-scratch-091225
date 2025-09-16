"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface Provider {
  id: string;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'pending';
  patientsCount: number;
  joinedDate: string;
  rating?: number;
  consultationsToday?: number;
}

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    // Collect data from mock + localStorage to find the provider by id
    const mockProviders: Provider[] = [
      {
        id: '1',
        name: 'Dr. Jane Smith',
        email: 'jane.smith@clinic.com',
        specialty: 'Dermatology',
        licenseNumber: 'MD123456',
        status: 'active',
        patientsCount: 142,
        joinedDate: '2023-01-15',
        rating: 4.8,
        consultationsToday: 8,
      },
      {
        id: '2',
        name: 'Dr. John Brown',
        email: 'john.brown@clinic.com',
        specialty: 'Internal Medicine',
        licenseNumber: 'MD789012',
        status: 'active',
        patientsCount: 98,
        joinedDate: '2023-03-20',
        rating: 4.7,
        consultationsToday: 5,
      },
      {
        id: '3',
        name: 'Dr. Sarah Jones',
        email: 'sarah.jones@clinic.com',
        specialty: 'Endocrinology',
        licenseNumber: 'MD345678',
        status: 'active',
        patientsCount: 76,
        joinedDate: '2023-06-10',
        rating: 4.9,
        consultationsToday: 6,
      },
      {
        id: '4',
        name: 'Dr. Michael Lee',
        email: 'michael.lee@clinic.com',
        specialty: 'Psychiatry',
        licenseNumber: 'MD901234',
        status: 'pending',
        patientsCount: 0,
        joinedDate: '2024-01-10',
        rating: 0,
        consultationsToday: 0,
      },
      {
        id: '5',
        name: 'Dr. Emily Wilson',
        email: 'emily.wilson@clinic.com',
        specialty: 'Weight Management',
        licenseNumber: 'MD567890',
        status: 'inactive',
        patientsCount: 45,
        joinedDate: '2022-11-05',
        rating: 4.6,
        consultationsToday: 0,
      },
    ];

    try {
      const customRaw = localStorage.getItem('customProviders');
      const custom: Provider[] = customRaw ? JSON.parse(customRaw) : [];
      const overridesRaw = localStorage.getItem('providerOverrides');
      const overrides: Record<string, Partial<Provider>> = overridesRaw ? JSON.parse(overridesRaw) : {};

      const all = [...mockProviders, ...custom].map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
      const found = all.find((p) => p.id === params.id) || null;
      setProvider(found);
    } catch (e) {
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700">Provider not found.</p>
          <button
            onClick={() => router.push('/portal/providers')}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Provider Details</h1>
        <button
          onClick={() => router.push(`/portal/provider/${provider.id}/edit`)}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Manage
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <div><span className="text-gray-500 text-sm">Name:</span> <span className="font-medium">{provider.name}</span></div>
        <div><span className="text-gray-500 text-sm">Email:</span> <span className="font-medium">{provider.email}</span></div>
        <div><span className="text-gray-500 text-sm">Specialty:</span> <span className="font-medium">{provider.specialty}</span></div>
        <div><span className="text-gray-500 text-sm">License:</span> <span className="font-medium">{provider.licenseNumber}</span></div>
        <div><span className="text-gray-500 text-sm">Status:</span> <span className="font-medium capitalize">{provider.status}</span></div>
        <div><span className="text-gray-500 text-sm">Patients:</span> <span className="font-medium">{provider.patientsCount}</span></div>
        <div><span className="text-gray-500 text-sm">Joined:</span> <span className="font-medium">{provider.joinedDate}</span></div>
        <div><span className="text-gray-500 text-sm">Rating:</span> <span className="font-medium">{provider.rating ?? '-'}</span></div>
        <div><span className="text-gray-500 text-sm">Today:</span> <span className="font-medium">{provider.consultationsToday ?? 0}</span></div>
      </div>

      <button
        onClick={() => router.push('/portal/providers')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        Back to list
      </button>
    </div>
  );
}
