'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { treatmentProtocols, conditionDisplayNames, calculateProtocolCost } from '@/lib/treatment-protocols';

type Program = {
  id: string;
  program_name?: string;
  category?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  refills_remaining?: number;
  next_refill_date?: string | Date | null;
  consultation_id?: string;
  prescribed_date?: string | Date;
  status?: string;
};

export default function PatientConsultationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);

  // Local mock used if API data isn't available
  const mockPrograms: Program[] = useMemo(
    () => [
      {
        id: '1',
        program_name: 'Acne Treatment',
        category: 'acne',
        medication_name: 'Tretinoin + Doxycycline',
        dosage: '0.05% cream + 100mg',
        frequency: 'Nightly + Twice daily',
        duration: '12 weeks',
        refills_remaining: 2,
        next_refill_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        consultation_id: '123',
        prescribed_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: '2',
        program_name: 'Weight Management',
        category: 'weightLoss',
        medication_name: 'Semaglutide',
        dosage: '0.5mg weekly',
        frequency: 'Once weekly',
        duration: 'Ongoing',
        refills_remaining: 5,
        next_refill_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        consultation_id: '124',
        prescribed_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'active'
      }
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load from API first
        // Strategy: fetch all programs and match by consultation_id or id
        const programsRes = await api.get('/patients/me/programs').catch(() => null);
        const apiPrograms: Program[] = Array.isArray(programsRes?.data) ? programsRes!.data : [];
        const found = apiPrograms.find(
          (p) => String(p.consultation_id) === id || String(p.id) === id
        );

        if (found) {
          setProgram(found);
          return;
        }

        // Fallback: if not in API, try consultations endpoint by id
        const consultRes = await api.get(`/consultations/${id}`).catch(() => null);
        if (consultRes?.data) {
          const c = consultRes.data;
          const derived: Program = {
            id: String(c.id ?? id),
            consultation_id: String(c.id ?? id),
            program_name: c.program_name || 'Consultation',
            category: c.category || c.consultation_type || 'acne',
            medication_name: c.medication_name,
            dosage: c.dosage,
            frequency: c.frequency,
            duration: c.duration || 'Ongoing',
            refills_remaining: c.refills_remaining ?? 0,
            next_refill_date: c.next_refill_date ?? null,
            prescribed_date: c.prescribed_date || c.created_at,
            status: c.status || 'active'
          };
          setProgram(derived);
          return;
        }

        // Last fallback: mock by matching consultation_id
        const mockFound = mockPrograms.find(
          (p) => String(p.consultation_id) === id || String(p.id) === id
        );
        if (mockFound) {
          setProgram(mockFound);
          return;
        }

        setError('Consultation not found');
      } catch (e) {
        console.error(e);
        setError('Failed to load consultation');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, mockPrograms]);

  const protocol = useMemo(() => {
    if (!program) return null;
    const categoryKey = (program.category || '').toString();
    // Map some legacy category names to our protocol keys
    const normalized = categoryKey
      .replace(/weight[-_\s]?loss/i, 'weightLoss')
      .replace(/^ed$/i, 'ed')
      .replace(/hair[-_\s]?loss/i, 'hairLoss')
      .toLowerCase();

    const condition = (['acne', 'ed', 'hairloss', 'weightloss'] as string[]).includes(normalized)
      ? normalized
      : 'acne';

    const group = (treatmentProtocols as any)[condition];
    if (!group) return null;
    // Default to a sensible severity option
    return group.moderate || group.standard || group.starter || null;
  }, [program]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-3 text-slate-600">Loading consultation…</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-semibold">{error || 'Consultation not found'}</p>
          <p className="text-sm mt-1">The link may be outdated or this consultation is unavailable.</p>
          <div className="mt-4">
            <Link href="/patient/dashboard" className="px-4 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = program.program_name || conditionDisplayNames[program.category || ''] || 'Program';
  const nextRefill = program.next_refill_date ? new Date(program.next_refill_date) : null;
  const total = protocol ? calculateProtocolCost(protocol.medications || []) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/patient/consultations')} className="text-slate-600 hover:text-slate-900">
          ← Back to Consultations
        </button>
        {program.status && (
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 capitalize">
            {program.status}
          </span>
        )}
      </div>

      <header className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {program.medication_name ? (
            <>
              {program.medication_name}
              {program.dosage ? ` • ${program.dosage}` : ''}
              {program.frequency ? ` • ${program.frequency}` : ''}
            </>
          ) : (
            <>Personalized treatment details</>
          )}
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Program Overview</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Duration</p>
              <p className="font-medium text-slate-900">{program.duration || 'Ongoing'}</p>
            </div>
            <div>
              <p className="text-slate-500">Refills remaining</p>
              <p className="font-medium text-slate-900">{program.refills_remaining ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Next refill</p>
              <p className="font-medium text-slate-900">{nextRefill ? nextRefill.toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Consultation ID</p>
              <p className="font-medium text-slate-900">{program.consultation_id || id}</p>
            </div>
          </div>

          {protocol && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Suggested Protocol</h3>
              <p className="text-xs text-slate-600">{protocol.description}</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {(protocol.medications || []).map((m: any) => (
                  <li key={m.sku} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{m.name}</p>
                      <p className="text-slate-600">{m.instructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${m.price}</p>
                      <p className="text-xs text-slate-500">Qty {m.qty}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-right">
                <span className="text-sm font-semibold text-emerald-600">Estimated monthly total: ${total}</span>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
          <Link
            href="/patient/refill-checkin"
            className="block text-center rounded-lg bg-medical-600 px-4 py-2 text-sm font-semibold text-white hover:bg-medical-700"
          >
            Request Refill
          </Link>
          <Link
            href="/patient/messages"
            className="block text-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Message Provider
          </Link>
        </aside>
      </section>
    </div>
  );
}
