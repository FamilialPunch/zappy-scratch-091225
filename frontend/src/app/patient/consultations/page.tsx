'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Consultation {
  id: string;
  consultation_type: string;
  chief_complaint: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  urgency: 'regular' | 'urgent' | 'emergency';
  created_at: string;
  updated_at: string;
  provider_name?: string;
  provider_response?: string;
  diagnosis?: string;
  treatment_plan?: string;
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  // Mock consultations for demo
  const mockConsultations: Consultation[] = [
    {
      id: '1',
      consultation_type: 'general_medicine',
      chief_complaint: 'Persistent headache for the past week',
      status: 'in-progress',
      urgency: 'regular',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      provider_name: 'Dr. Sarah Johnson',
      provider_response: 'I\'ve reviewed your symptoms. Let\'s discuss your headache patterns and potential triggers.'
    },
    {
      id: '2',
      consultation_type: 'dermatology',
      chief_complaint: 'Acne treatment follow-up',
      status: 'completed',
      urgency: 'regular',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      provider_name: 'Dr. Michael Chen',
      diagnosis: 'Mild to moderate acne vulgaris',
      treatment_plan: 'Continue with Tretinoin 0.05% nightly. Add Doxycycline 100mg twice daily for 8 weeks.'
    },
    {
      id: '3',
      consultation_type: 'weight_loss',
      chief_complaint: 'Weight management consultation',
      status: 'completed',
      urgency: 'regular',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
      provider_name: 'Dr. Emily Rodriguez',
      diagnosis: 'BMI indicates overweight category',
      treatment_plan: 'Prescribed Semaglutide 0.5mg weekly. Lifestyle modifications discussed.'
    },
    {
      id: '4',
      consultation_type: 'mental_health',
      chief_complaint: 'Anxiety and stress management',
      status: 'pending',
      urgency: 'urgent',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ];

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/me/consultations');
      
      // Use mock data if API returns empty or fails
      if (response.data && response.data.length > 0) {
        setConsultations(response.data);
      } else {
        setConsultations(mockConsultations);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      // Use mock data on error
      setConsultations(mockConsultations);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyStyles = {
      regular: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${urgencyStyles[urgency as keyof typeof urgencyStyles]}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </span>
    );
  };

  const formatConsultationType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        return 'Just now';
      }
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // Less than a week
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredConsultations = consultations.filter(consultation => {
    if (filter === 'all') return true;
    return consultation.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Consultations</h1>
            <p className="text-gray-600 mt-1">View and manage your healthcare consultations</p>
          </div>
          <Link
            href="/patient/new-consultation"
            className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Consultation
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({consultations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({consultations.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'in-progress'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({consultations.filter(c => c.status === 'in-progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({consultations.filter(c => c.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Consultations List */}
      {filteredConsultations.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No consultations found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "You haven't started any consultations yet."
              : `No ${filter} consultations.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/patient/new-consultation"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Start Your First Consultation
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((consultation) => (
            <div key={consultation.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatConsultationType(consultation.consultation_type)}
                    </h3>
                    <div className="flex items-center gap-2 ml-4">
                      {getUrgencyBadge(consultation.urgency)}
                      {getStatusBadge(consultation.status)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{consultation.chief_complaint}</p>
                  
                  {consultation.provider_name && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Provider</p>
                      <p className="font-medium text-gray-900">{consultation.provider_name}</p>
                    </div>
                  )}
                  
                  {consultation.provider_response && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Provider Response:</p>
                      <p className="text-sm text-blue-800">{consultation.provider_response}</p>
                    </div>
                  )}
                  
                  {consultation.diagnosis && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                      <p className="text-sm text-gray-600">{consultation.diagnosis}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Started {formatDate(consultation.created_at)}
                    </p>
                    <Link
                      href={`/patient/consultations/${consultation.id}`}
                      className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}