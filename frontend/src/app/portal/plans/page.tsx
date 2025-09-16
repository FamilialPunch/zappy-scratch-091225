'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

// Condition types available in the system
const CONDITIONS = [
  { value: 'weightLoss', label: 'Weight Loss', icon: '⚖️' },
  { value: 'hairLoss', label: 'Hair Loss', icon: '💇' },
  { value: 'mensHealth', label: "Men's Health", icon: '♂️' },
  { value: 'womensHealth', label: "Women's Health", icon: '♀️' },
  { value: 'longevity', label: 'Longevity', icon: '🧬' },
  { value: 'trt', label: 'TRT', icon: '💪' },
];

interface TreatmentPlan {
  id: string;
  condition: string;
  plan_tier: 'basic' | 'standard' | 'premium';
  name: string;
  price: number;
  billing_period: string;
  features: string[];
  medications?: any[];
  is_popular: boolean;
  active_subscribers?: number;
}

export default function TreatmentPlansPage() {
  const router = useRouter();
  const [selectedCondition, setSelectedCondition] = useState('weightLoss');
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState<TreatmentPlan | null>(null);

  // Load plans from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to plans management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      loadPlans();
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router, selectedCondition]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from API
      // const response = await fetch(`/api/treatment-plans?condition=${selectedCondition}`);
      // const data = await response.json();
      
      // Mock data matching database structure
      const mockPlans: TreatmentPlan[] = [
        // Weight Loss Plans
        ...(selectedCondition === 'weightLoss' ? [
          {
            id: 'wl-basic',
            condition: 'weightLoss',
            plan_tier: 'basic' as const,
            name: 'Starter Plan',
            price: 99.00,
            billing_period: 'month',
            features: [
              'Semaglutide or Tirzepatide',
              'Monthly provider consultations',
              'Basic nutritional guidance',
              'Email support'
            ],
            is_popular: false,
            active_subscribers: 234
          },
          {
            id: 'wl-standard',
            condition: 'weightLoss',
            plan_tier: 'standard' as const,
            name: 'Accelerated Plan',
            price: 149.00,
            billing_period: 'month',
            features: [
              'Premium GLP-1 medications',
              'Bi-weekly check-ins',
              'Personalized meal plans',
              'Priority support',
              'Progress tracking app'
            ],
            is_popular: true,
            active_subscribers: 567
          },
          {
            id: 'wl-premium',
            condition: 'weightLoss',
            plan_tier: 'premium' as const,
            name: 'Comprehensive Plan',
            price: 249.00,
            billing_period: 'month',
            features: [
              'All medications included',
              'Weekly 1-on-1 coaching',
              'Custom exercise plans',
              'Nutritionist consultations',
              '24/7 support',
              'Lab work monitoring'
            ],
            is_popular: false,
            active_subscribers: 123
          }
        ] : []),
        
        // Hair Loss Plans
        ...(selectedCondition === 'hairLoss' ? [
          {
            id: 'hl-basic',
            condition: 'hairLoss',
            plan_tier: 'basic' as const,
            name: 'Essential',
            price: 22.00,
            billing_period: 'month',
            features: [
              'Finasteride (generic)',
              'Quarterly consultations',
              'Basic progress tracking'
            ],
            is_popular: false,
            active_subscribers: 890
          },
          {
            id: 'hl-standard',
            condition: 'hairLoss',
            plan_tier: 'standard' as const,
            name: 'Advanced',
            price: 45.00,
            billing_period: 'month',
            features: [
              'Finasteride + Minoxidil',
              'Monthly consultations',
              'Biotin supplements',
              'Progress photos analysis'
            ],
            is_popular: true,
            active_subscribers: 1234
          },
          {
            id: 'hl-premium',
            condition: 'hairLoss',
            plan_tier: 'premium' as const,
            name: 'Complete Care',
            price: 79.00,
            billing_period: 'month',
            features: [
              'All medications',
              'DHT blocking shampoo',
              'Micro-needling kit',
              'Weekly check-ins',
              'Dermatologist consultations'
            ],
            is_popular: false,
            active_subscribers: 345
          }
        ] : []),
        
        // Men's Health Plans
        ...(selectedCondition === 'mensHealth' ? [
          {
            id: 'mh-basic',
            condition: 'mensHealth',
            plan_tier: 'basic' as const,
            name: 'Essential ED',
            price: 2.00,
            billing_period: 'dose',
            features: [
              'Sildenafil (generic Viagra)',
              '10 doses per month',
              'Online consultations'
            ],
            is_popular: false,
            active_subscribers: 2345
          },
          {
            id: 'mh-standard',
            condition: 'mensHealth',
            plan_tier: 'standard' as const,
            name: 'Performance Plus',
            price: 5.00,
            billing_period: 'dose',
            features: [
              'Cialis or Viagra brand',
              '20 doses per month',
              'Monthly consultations',
              'Discreet packaging'
            ],
            is_popular: true,
            active_subscribers: 3456
          },
          {
            id: 'mh-premium',
            condition: 'mensHealth',
            plan_tier: 'premium' as const,
            name: 'Total Vitality',
            price: 199.00,
            billing_period: 'month',
            features: [
              'All ED medications',
              'Testosterone support',
              'Libido enhancers',
              'Weekly consultations',
              'Lab work included'
            ],
            is_popular: false,
            active_subscribers: 456
          }
        ] : []),
        
        // Add similar structures for other conditions...
      ];
      
      setPlans(mockPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan) return;
    try {
      // In production, call POST /api/treatment-plans
      // const res = await fetch('/api/treatment-plans', { method: 'POST', body: JSON.stringify(newPlan) });
      // const created = await res.json();
      const generatedId = `${newPlan.condition}-${newPlan.plan_tier}-${Date.now()}`;
      const created = { ...newPlan, id: generatedId };
      setPlans((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewPlan(null);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    try {
      // API call to update plan
      // await fetch(`/api/treatment-plans/${editingPlan.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(editingPlan)
      // });
      
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierOrder = (tier: string) => {
    switch(tier) {
      case 'basic': return 1;
      case 'standard': return 2;
      case 'premium': return 3;
      default: return 4;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Plans</h1>
          <p className="text-gray-600 mt-1">Manage condition-specific treatment plans and pricing</p>
        </div>
        <button
          onClick={() => {
            setNewPlan({
              id: '',
              condition: selectedCondition,
              plan_tier: 'basic',
              name: '',
              price: 0,
              billing_period: 'month',
              features: [''],
              medications: [],
              is_popular: false,
              active_subscribers: 0,
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Add New Plan
        </button>
      </div>

      {/* Condition Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {CONDITIONS.map((condition) => (
          <button
            key={condition.value}
            onClick={() => setSelectedCondition(condition.value)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCondition === condition.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{condition.icon}</span>
            {condition.label}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans
            .sort((a, b) => getTierOrder(a.plan_tier) - getTierOrder(b.plan_tier))
            .map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 relative ${plan.is_popular ? 'ring-2 ring-blue-500' : ''}`}
            >
              {plan.is_popular && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getTierColor(plan.plan_tier)}`}>
                      {plan.plan_tier.toUpperCase()}
                    </span>
                  </div>
                </div>
                {plan.active_subscribers && (
                  <p className="text-sm text-gray-500 mt-2">{plan.active_subscribers} active subscribers</p>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 ml-1">/{plan.billing_period}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </button>
                <button className="flex-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  Analytics
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Condition Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Subscribers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {plans.reduce((sum, p) => sum + (p.active_subscribers || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-1">+18% from last month</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${plans.reduce((sum, p) => {
              const subscribers = p.active_subscribers || 0;
              const monthlyPrice = p.billing_period === 'dose' ? p.price * 10 : p.price;
              return sum + (subscribers * monthlyPrice);
            }, 0).toLocaleString()}
          </p>
          <p className="text-sm text-green-600 mt-1">+22% from last month</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">24.5%</p>
          <p className="text-sm text-green-600 mt-1">+3.2% from last month</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Plan Value</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${(plans.reduce((sum, p) => sum + p.price, 0) / plans.length).toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">Per {plans[0]?.billing_period || 'month'}</p>
        </Card>
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Edit {CONDITIONS.find(c => c.value === editingPlan.condition)?.label} - {editingPlan.name}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tier</label>
                  <select
                    value={editingPlan.plan_tier}
                    onChange={(e) => setEditingPlan({ ...editingPlan, plan_tier: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Period</label>
                  <select
                    value={editingPlan.billing_period}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billing_period: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="month">Monthly</option>
                    <option value="dose">Per Dose</option>
                    <option value="one-time">One Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {editingPlan.features.map((feature, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...editingPlan.features];
                        newFeatures[index] = e.target.value;
                        setEditingPlan({ ...editingPlan, features: newFeatures });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <button
                      onClick={() => {
                        const newFeatures = editingPlan.features.filter((_, i) => i !== index);
                        setEditingPlan({ ...editingPlan, features: newFeatures });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditingPlan({ 
                    ...editingPlan, 
                    features: [...editingPlan.features, ''] 
                  })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  + Add Feature
                </button>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="popular"
                  checked={editingPlan.is_popular}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="popular" className="ml-2 block text-sm text-gray-900">
                  Mark as Most Popular
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && newPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add New Plan</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <select
                    value={newPlan.condition}
                    onChange={(e) => setNewPlan({ ...newPlan, condition: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tier</label>
                  <select
                    value={newPlan.plan_tier}
                    onChange={(e) => setNewPlan({ ...newPlan, plan_tier: e.target.value as any })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Period</label>
                  <select
                    value={newPlan.billing_period}
                    onChange={(e) => setNewPlan({ ...newPlan, billing_period: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="month">Monthly</option>
                    <option value="dose">Per Dose</option>
                    <option value="one-time">One Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value || '0') })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="add-popular"
                    checked={newPlan.is_popular}
                    onChange={(e) => setNewPlan({ ...newPlan, is_popular: e.target.checked })}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <label htmlFor="add-popular" className="ml-2 block text-sm text-gray-900">
                    Mark as Most Popular
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...newPlan.features];
                        newFeatures[index] = e.target.value;
                        setNewPlan({ ...newPlan, features: newFeatures });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    <button
                      onClick={() => {
                        const newFeatures = newPlan.features.filter((_, i) => i !== index);
                        setNewPlan({ ...newPlan, features: newFeatures.length ? newFeatures : [''] });
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setNewPlan({
                    ...newPlan,
                    features: [...newPlan.features, '']
                  })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  + Add Feature
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => { setShowAddModal(false); setNewPlan(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                disabled={!newPlan.name || newPlan.price < 0}
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
