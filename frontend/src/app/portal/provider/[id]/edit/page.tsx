"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

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

export default function EditProviderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    // Gather from mocks + localStorage
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
      setForm(found ?? null);
    } catch (e) {
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  const updateField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: name === 'patientsCount' ? Number(value) : (value as any) } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const overridesRaw = localStorage.getItem('providerOverrides');
      const overrides: Record<string, Partial<Provider>> = overridesRaw ? JSON.parse(overridesRaw) : {};
      overrides[form.id] = {
        name: form.name,
        email: form.email,
        specialty: form.specialty,
        licenseNumber: form.licenseNumber,
        status: form.status,
        patientsCount: form.patientsCount,
        rating: form.rating,
      };
      localStorage.setItem('providerOverrides', JSON.stringify(overrides));
      success('Provider updated');
      router.push(`/portal/provider/${form.id}`);
    } catch (e) {
      console.error(e);
      error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!form) {
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Manage Provider</h1>
        <button
          onClick={() => router.push(`/portal/provider/${form.id}`)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
          <input name="name" value={form.name} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Specialty</label>
            <select name="specialty" value={form.specialty} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="Dermatology">Dermatology</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="Weight Management">Weight Management</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">License Number</label>
            <input name="licenseNumber" value={form.licenseNumber} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Patients</label>
            <input type="number" name="patientsCount" value={form.patientsCount} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => router.push(`/portal/provider/${form.id}`)} className="px-3 py-2 border border-gray-300 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
