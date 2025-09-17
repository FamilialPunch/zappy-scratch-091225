'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function PatientDashboard() {
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real data from API
  const [patientData, setPatientData] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Mock programs for demo
  const mockPrograms = [
    {
      id: '1',
      program_name: 'Acne Treatment',
      category: 'acne',
      medication_name: 'Tretinoin + Doxycycline',
      dosage: '0.05% cream + 100mg',
      frequency: 'Nightly + Twice daily',
      duration: '12 weeks',
      refills_remaining: 2,
      next_refill_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      consultation_id: '123',
      prescribed_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      status: 'active'
    },
    {
      id: '2',
      program_name: 'Weight Management',
      category: 'weight-loss',
      medication_name: 'Semaglutide',
      dosage: '0.5mg weekly',
      frequency: 'Once weekly',
      duration: 'Ongoing',
      refills_remaining: 5,
      next_refill_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      consultation_id: '124',
      prescribed_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      status: 'active'
    }
  ];

  // Mock recent orders
  const mockOrders = [
    {
      id: '1',
      order_number: 'ORD-2024-001',
      items: [{ medication_name: 'Tretinoin 0.05%' }],
      total_amount: 89,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      fulfillment_status: 'shipped',
      tracking_number: '1Z999AA10123456784',
      payment_status: 'completed'
    },
    {
      id: '2',
      order_number: 'ORD-2024-002',
      items: [{ medication_name: 'Semaglutide 0.5mg' }],
      total_amount: 299,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      fulfillment_status: 'delivered',
      tracking_number: '1Z999AA10123456785',
      payment_status: 'completed'
    }
  ];

  // Mock measurements
  const mockMeasurements = [
    { weight: 185, measurement_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
    { weight: 183, measurement_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
    { weight: 181, measurement_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    { weight: 179, measurement_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { weight: 178, measurement_date: new Date() }
  ];

  // Mock stats
  const mockStats = {
    active_prescriptions: 2,
    total_orders: 8,
    total_consultations: 4,
    unread_messages: 1
  };

  // Handle refill request
  const handleRefillRequest = async (program: any) => {
    try {
      // For mock data and MVP, always redirect to refill check-in page
      // This avoids database issues since we're not using real prescriptions yet
      window.location.href = `/patient/refill-checkin?prescription=${program.id}`;
      
      // Once real database is set up, uncomment this code:
      /*
      // Check if this is mock data
      if (program.id?.startsWith('mock-')) {
        // For mock data, redirect to refill check-in page
        window.location.href = `/patient/refill-checkin?prescription=${program.id}`;
        return;
      }
      
      // For real data, check if we have a prescription_id
      const prescriptionId = program.prescription_id || program.id;
      
      const response = await api.post(`/prescriptions/${prescriptionId}/refill`);
      
      // Show success message
      alert('Refill request submitted successfully!');
      
      // Refresh programs to update refill information
      const programsResponse = await api.get('/patients/me/programs');
      setPrograms(programsResponse.data.length > 0 ? programsResponse.data : mockPrograms);
      */
    } catch (error: any) {
      // Show error message
      console.error('Refill request error:', error);
      alert('Failed to process refill request. Redirecting to refill check-in...');
      window.location.href = `/patient/refill-checkin?prescription=${program.id}`;
    }
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [patient, programs, orders, measurements, stats] = await Promise.all([
          api.get('/patients/me').catch(() => null),
          api.get('/patients/me/programs').catch(() => ({ data: [] })),
          api.get('/patients/me/orders?limit=5').catch(() => ({ data: [] })),
          api.get('/patients/me/measurements?limit=5').catch(() => ({ data: [] })),
          api.get('/patients/me/stats').catch(() => ({ data: {} }))
        ]);

        // Use mock data if API returns empty
        if (patient?.data) setPatientData(patient.data);
        setPrograms(programs?.data?.length > 0 ? programs.data : mockPrograms);
        setRecentOrders(orders?.data?.length > 0 ? orders.data : mockOrders);
        setMeasurements(measurements?.data?.length > 0 ? measurements.data : mockMeasurements);
        setStats(stats?.data?.active_prescriptions > 0 ? stats.data : mockStats);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Log weight measurement
  const handleLogWeight = async (weight: number) => {
    try {
      await api.post('/patients/me/measurements', {
        weight,
        measurement_date: new Date().toISOString()
      });
      
      // Refresh measurements
      const response = await api.get('/patients/me/measurements?limit=5');
      setMeasurements(response.data);
    } catch (err) {
      console.error('Error logging weight:', err);
    }
  };

  // Calculate shipment steps from order status
  const getShipmentSteps = (order: any) => {
    const steps = [
      { label: 'Provider Review', completed: true },
      { label: 'Prescription Processed', completed: order?.payment_status === 'completed' },
      { label: 'Shipped', completed: order?.fulfillment_status === 'shipped' || order?.fulfillment_status === 'delivered' },
      { label: 'Delivered', completed: order?.fulfillment_status === 'delivered' }
    ];
    return steps;
  };

  // Format wait time
  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${Math.round(minutes % 60)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeProgram = programs[activeProgramIndex];
  const patientName = patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Patient';

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Mobile-first Welcome Section */}
      <div className="flex items-center gap-3">
        <img
          src="/Alex.webp"
          alt="Your Health Assistant"
          className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {patientName}!
        </h1>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Active Programs</p>
            <p className="text-xl font-bold text-slate-900">{stats.active_prescriptions || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-bold text-slate-900">{stats.total_orders || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Consultations</p>
            <p className="text-xl font-bold text-slate-900">{stats.total_consultations || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500">Messages</p>
            <p className="text-xl font-bold text-slate-900">{stats.unread_messages || 0}</p>
          </div>
        </div>
      )}

      {/* Program Cards - Mobile Optimized */}
      {programs.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base lg:text-lg font-bold text-slate-900">
              Your Medications
            </h2>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              {programs.length} Active
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {programs.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveProgramIndex(i)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  i === activeProgramIndex
                    ? "border-medical-500 bg-gradient-to-br from-medical-50 to-emerald-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
                }`}
              >
                {i === activeProgramIndex && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-medical-500 rounded-full animate-pulse"></span>
                )}
                <div className="font-semibold text-slate-900 text-sm">{p.program_name || p.category}</div>
                <div className="text-slate-600 text-xs mt-1">{p.medication_name} • {p.dosage}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    Next refill: {p.next_refill_date ? new Date(p.next_refill_date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {p.refills_remaining} refills
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-slate-600 mb-4">No active medications</p>
          <Link 
            href="/patient/new-consultation"
            className="inline-block px-6 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
          >
            Start Consultation
          </Link>
        </div>
      )}

      {/* Mobile-First Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Column - Full width on mobile */}
        <div className="lg:col-span-2 space-y-4">
          {/* Program Summary Card */}
          {activeProgram && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {activeProgram.program_name || activeProgram.category} Program
                </h2>
              </header>
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{activeProgram.medication_name}</h3>
                  <p className="text-sm text-slate-600">{activeProgram.dosage} • {activeProgram.frequency}</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="font-bold text-medical-600">{activeProgram.duration || 'Ongoing'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Refills left</p>
                    <p className="font-bold text-emerald-600">{activeProgram.refills_remaining}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link 
                    href={`/patient/consultations/${activeProgram.consultation_id}`}
                    className="rounded-lg bg-medical-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-medical-700 text-center"
                  >
                    View Details
                  </Link>
                  <button 
                    onClick={() => handleRefillRequest(activeProgram)}
                    disabled={activeProgram.refills_remaining === 0}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      activeProgram.refills_remaining > 0
                        ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {activeProgram.refills_remaining > 0 ? 'Request Refill' : 'No Refills Available'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Shipment Status */}
          {recentOrders.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Latest Shipment</h2>
              </header>
              <ol className="p-5">
                {getShipmentSteps(recentOrders[0]).map((step, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-1 text-sm">
                    <span className={`h-3 w-3 rounded-full ${step.completed ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={`${step.completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                  </li>
                ))}
              </ol>
              {recentOrders[0].tracking_number && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-600">
                    Tracking: <span className="font-mono">{recentOrders[0].tracking_number}</span>
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Progress Tracker (Weight) */}
          {measurements.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Progress Tracker</h2>
              </header>
              <div className="p-5">
                <p className="text-sm text-slate-500 mb-4">Your weight progress (lbs)</p>

                <div className="h-40 mb-4 bg-gradient-to-t from-medical-50 to-white rounded-lg p-4">
                  <div className="flex items-end justify-between h-full">
                    {measurements.slice(0, 5).reverse().map((data, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className="w-8 bg-medical-500 rounded-t"
                          style={{ height: `${Math.min(data.weight || 0, 100)}px` }}
                        />
                        <span className="text-xs text-slate-500 mt-2">
                          {new Date(data.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const weight = (e.target as any).weight.value;
                    if (weight) handleLogWeight(parseFloat(weight));
                  }}
                  className="flex space-x-2"
                >
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter today's weight"
                    className="flex-grow w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-medical-500 focus:border-medical-500"
                  />
                  <button
                    type="submit"
                    className="bg-medical-600 text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-medical-700 transition-colors"
                  >
                    Log
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar - Stacks on mobile */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions */}
          <section className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <Link href="/patient/messages" className="rounded-xl border-2 border-medical-200 bg-gradient-to-br from-medical-50 to-white p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm font-semibold text-medical-700">Message Doctor</div>
              <div className="text-xs text-slate-600 mt-1">Get help now</div>
              {stats?.unread_messages > 0 && (
                <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {stats.unread_messages} new
                </span>
              )}
            </Link>
            <Link href="/patient/orders" className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-semibold text-emerald-700">Track Orders</div>
              <div className="text-xs text-slate-600 mt-1">View shipments</div>
            </Link>
          </section>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
              </header>
              <ul className="divide-y divide-slate-100">
                {recentOrders.slice(0, 3).map((order) => (
                  <li key={order.id} className="px-5 py-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">#{order.order_number}</p>
                        <p className="text-slate-500">
                          {order.items?.length > 0 ? order.items[0].medication_name : 'Order'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </p>
                        <span className={`text-xs font-medium ${
                          order.fulfillment_status === 'delivered' ? 'text-emerald-600' : 
                          order.fulfillment_status === 'shipped' ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {order.fulfillment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Action items</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  stats?.total_consultations > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                } text-white`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className={stats?.total_consultations > 0 ? "text-slate-500 line-through" : "text-slate-700"}>
                  Complete health assessment
                </span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  patientData?.insurance_provider ? 'bg-emerald-500' : 'bg-slate-300'
                } text-white`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className={patientData?.insurance_provider ? "text-slate-500 line-through" : "text-slate-700"}>
                  Upload insurance information
                </span>
              </li>
              <li className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-slate-700">Schedule follow-up consultation</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
