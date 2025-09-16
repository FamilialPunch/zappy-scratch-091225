"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface NewProviderForm {
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function NewProviderPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [form, setForm] = useState<NewProviderForm>({
    name: '',
    email: '',
    specialty: '',
    licenseNumber: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // For now, store in localStorage so Providers page can pick it up
      const existingRaw = localStorage.getItem('customProviders');
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const newProvider = {
        id,
        name: form.name,
        email: form.email,
        specialty: form.specialty,
        licenseNumber: form.licenseNumber,
        status: form.status,
        patientsCount: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        rating: undefined,
        consultationsToday: 0,
      };
      localStorage.setItem('customProviders', JSON.stringify([...existing, newProvider]));
      success('Provider added');
      router.push('/portal/providers');
    } catch (e) {
      console.error(e);
      error('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Add Provider</h1>
        <button
          onClick={() => router.push('/portal/providers')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Specialty</label>
            <select
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select specialty</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="Weight Management">Weight Management</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">License Number</label>
            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push('/portal/providers')}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}
