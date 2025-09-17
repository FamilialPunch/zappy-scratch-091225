'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  name: string;
  instructions: string;
  warnings: string;
  quantity: string;
  refills: string;
  prescriptionId?: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  items: OrderItem[];
  total: string;
  tracking: string;
}

export default function OrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const router = useRouter();

  const handleTrackingClick = (trackingNumber: string) => {
    // For demo purposes, we'll open a mock tracking page
    // In production, this would open the actual carrier's tracking page
    const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`;
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };
  
  const orders: Order[] = [
    {
      id: 'ORD-001',
      date: 'Dec 9, 2025',
      status: 'delivered',
      items: [
        {
          name: 'Tretinoin Cream 0.025%',
          instructions: 'Apply at bedtime to clean skin',
          warnings: 'Use sunscreen daily',
          quantity: '1 tube (30g)',
          refills: '2 refills left',
          prescriptionId: 'mock-1'
        },
        {
          name: 'Doxycycline 100mg',
          instructions: 'Take twice daily with food',
          warnings: 'Avoid sun exposure',
          quantity: '60 capsules',
          refills: '1 refill left',
          prescriptionId: 'mock-2'
        }
      ],
      total: '$147.00',
      tracking: '9400111899562123456789'
    },
    {
      id: 'ORD-002',
      date: 'Nov 9, 2025',
      status: 'delivered',
      items: [
        {
          name: 'Finasteride 1mg',
          instructions: 'Take 1 tablet daily',
          warnings: 'Keep away from pregnant women',
          quantity: '30 tablets',
          refills: '5 refills left',
          prescriptionId: 'mock-3'
        }
      ],
      total: '$29.00',
      tracking: '9400111899562123456788'
    }
  ];

  const handleRefillRequest = (prescriptionId: string | undefined, medicationName: string) => {
    if (!prescriptionId) {
      return;
    }

    // Navigate to refill-checkin page with prescription ID as query parameter
    router.push(`/patient/refill-checkin?prescription=${prescriptionId}`);
  };

  const activeShipment = {
    status: 'in-transit',
    expectedDate: 'Dec 12, 2025',
    tracking: '9400111899562123456790',
    progress: 75
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Your Orders</h1>
        <p className="text-sm text-slate-600 mt-1">Track shipments and manage medications</p>
      </div>

      {/* Active Shipment - Mobile Priority */}
      {activeShipment && (
        <div className="bg-gradient-to-r from-medical-500 to-emerald-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white/90">Package In Transit</p>
              <p className="text-lg font-bold">Arrives {activeShipment.expectedDate}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-3">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${activeShipment.progress}%` }}
            />
          </div>
          
          <button 
            onClick={() => handleTrackingClick(activeShipment.tracking)}
            className="text-sm text-white/90 underline hover:text-white transition-colors"
          >
            Track: {activeShipment.tracking}
          </button>
        </div>
      )}

      {/* Active Medications - Mobile Cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Active Medications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orders[0].items.map((med, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-slate-900">{med.name}</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  Active
                </span>
              </div>
              
              <p className="text-xs text-slate-600 mb-2">📋 {med.instructions}</p>
              <p className="text-xs text-orange-600 mb-3">⚠️ {med.warnings}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{med.refills}</span>
                <button 
                  onClick={() => handleRefillRequest(med.prescriptionId, med.name)}
                  className="text-xs font-medium text-medical-600 hover:text-medical-700"
                >
                  Request Refill →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order History - Clean List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Order History</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id}>
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900">{order.id}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'delivered' ? '✓ Delivered' : '🚚 Shipped'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{order.date}</p>
                    <div className="mt-2 space-y-0.5">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-slate-500">• {item.name}</p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{order.total}</p>
                    <svg 
                      className={`w-4 h-4 text-slate-400 mt-2 transition-transform ${
                        expandedOrder === order.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-4 pb-4 bg-slate-50">
                  <div className="space-y-3 pt-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3">
                        <p className="font-medium text-sm text-slate-900 mb-2">{item.name}</p>
                        <div className="space-y-1 text-xs">
                          <p className="text-slate-600">
                            <span className="font-medium">How to take:</span> {item.instructions}
                          </p>
                          <p className="text-orange-600">
                            <span className="font-medium">Warning:</span> {item.warnings}
                          </p>
                          <div className="flex justify-between pt-2">
                            <span className="text-slate-500">{item.quantity}</span>
                            <span className="text-medical-600 font-medium">{item.refills}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-600">
                        Tracking: <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackingClick(order.tracking);
                          }}
                          className="font-mono text-medical-600 hover:text-medical-700 underline"
                        >
                          {order.tracking}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button className="bg-white rounded-xl border-2 border-medical-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">🔄</div>
          <p className="text-sm font-semibold text-medical-700">Auto-Refill</p>
          <p className="text-xs text-slate-600 mt-1">Jan 5, 2026</p>
        </button>
        
        <button className="bg-white rounded-xl border-2 border-emerald-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]">
          <div className="text-2xl mb-2">⏰</div>
          <p className="text-sm font-semibold text-emerald-700">Reminders</p>
          <p className="text-xs text-slate-600 mt-1">Daily: On</p>
        </button>
        
        <button className="bg-white rounded-xl border-2 border-blue-200 p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02] col-span-2 lg:col-span-1">
          <div className="text-2xl mb-2">💊</div>
          <p className="text-sm font-semibold text-blue-700">Ask Pharmacist</p>
          <p className="text-xs text-slate-600 mt-1">Get help</p>
        </button>
      </div>
    </div>
  );
}
