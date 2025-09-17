'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConsultationSubmitted() {
  const router = useRouter();
  const [consultationData, setConsultationData] = useState<any>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState('');
  
  useEffect(() => {
    // Retrieve consultation data from localStorage
    const data = localStorage.getItem('consultationData');
    if (data) {
      setConsultationData(JSON.parse(data));
      
      // Clear the data after retrieving it
      localStorage.removeItem('consultationData');
    }
    
    // Set estimated wait time based on urgency
    const urgency = data ? JSON.parse(data).urgency : 'regular';
    switch (urgency) {
      case 'emergency':
        setEstimatedWaitTime('within 30 minutes');
        break;
      case 'urgent':
        setEstimatedWaitTime('within 4 hours');
        break;
      default:
        setEstimatedWaitTime('within 24 hours');
    }
  }, []);
  
  // Auto-redirect to dashboard after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/patient/dashboard');
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              TeleHealth
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/patient/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/patient/consultations" className="text-gray-600 hover:text-gray-900">
                My Consultations
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            {/* Success Icon */}
            <div className="mb-8 text-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Consultation Request Submitted Successfully!
              </h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Your consultation request has been received and is being reviewed by our healthcare team. A licensed provider will respond {estimatedWaitTime}.
              </p>
            </div>
          
            {/* Consultation Details */}
            {consultationData && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Consultation Details</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Type:</span> <span className="text-gray-600">{consultationData.consultationType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></p>
                    <p><span className="font-medium text-gray-700">Urgency:</span> <span className="text-gray-600">{consultationData.urgency?.charAt(0).toUpperCase() + consultationData.urgency?.slice(1)}</span></p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium text-gray-700">Submitted:</span> <span className="text-gray-600">{new Date(consultationData.submittedAt).toLocaleString()}</span></p>
                    <p><span className="font-medium text-gray-700">Reference ID:</span> <span className="text-gray-600 font-mono text-xs">CONS-{Date.now().toString().slice(-6)}</span></p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p><span className="font-medium text-gray-700">Chief Complaint:</span> <span className="text-gray-600">{consultationData.chiefComplaint}</span></p>
                </div>
              </div>
            )}
          
            {/* What happens next - Two Column Layout for Desktop */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-4 text-lg">What Happens Next?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Provider Review</p>
                      <p className="text-sm text-blue-700">A licensed healthcare provider will review your consultation request</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Notification</p>
                      <p className="text-sm text-blue-700">You'll receive an email and in-app notification when your provider responds</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Secure Messaging</p>
                      <p className="text-sm text-blue-700">Communicate with your provider through encrypted messaging</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-700 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Treatment Plan</p>
                      <p className="text-sm text-blue-700">Receive prescriptions sent directly to your preferred pharmacy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Action Buttons - Side by side on desktop */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Link 
                href="/patient/dashboard"
                className="block text-center bg-purple-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-purple-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/patient/consultations"
                className="block text-center bg-gray-100 text-gray-700 py-3 px-6 rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                View All Consultations
              </Link>
            </div>
          
            {/* Auto-redirect notice */}
            <p className="text-sm text-gray-500 mt-6 text-center">
              You will be automatically redirected to your dashboard in a few seconds...
            </p>
          </div>
          
          {/* Contact Support - Outside main card */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Have questions? Contact our support team at{' '}
              <a href="mailto:support@telehealth.com" className="text-purple-600 hover:text-purple-700 font-medium">
                support@telehealth.com
              </a>
              {' '}or call{' '}
              <a href="tel:1-800-HEALTH" className="text-purple-600 hover:text-purple-700 font-medium">
                1-800-HEALTH
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}