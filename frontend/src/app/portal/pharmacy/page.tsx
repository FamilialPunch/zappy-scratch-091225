'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Partner {
  id: number;
  name: string;
  type: 'Primary' | 'Regional' | 'Backup';
  status: 'active' | 'standby';
  region: string;
  avgFulfillmentTime: string;
  successRate: string;
  monthlyVolume: number;
  apiEndpoint: string;
  capabilities: string[];
  states: string[];
  licensedStates: number;
}

interface ShippingZone {
  zone: string;
  states: string;
  baseRate: number;
  estimatedDays: string;
}

export default function PharmacyPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners');
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  // Local edit state for Manage States modal
  const [editStates, setEditStates] = useState<string[]>([]);
  
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: 1,
      name: 'QuickMeds Pharmacy',
      type: 'Primary',
      status: 'active',
      region: 'National',
      avgFulfillmentTime: '2.3 days',
      successRate: '99.2%',
      monthlyVolume: 1234,
      apiEndpoint: 'https://api.quickmeds.com/v2',
      capabilities: ['Same-day processing', 'Cold chain', 'Controlled substances'],
      states: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
      licensedStates: 48,
    },
    {
      id: 2,
      name: 'Regional Health Pharmacy',
      type: 'Regional',
      status: 'active',
      region: 'West Coast',
      avgFulfillmentTime: '1.8 days',
      successRate: '98.7%',
      monthlyVolume: 567,
      apiEndpoint: 'https://api.regionalhealth.com',
      capabilities: ['Next-day delivery', 'Compounding'],
      states: ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM'],
      licensedStates: 11,
    },
    {
      id: 3,
      name: 'Express Scripts',
      type: 'Backup',
      status: 'standby',
      region: 'National',
      avgFulfillmentTime: '3.1 days',
      successRate: '97.5%',
      monthlyVolume: 89,
      apiEndpoint: 'https://api.express-scripts.com',
      capabilities: ['Mail order', 'Specialty medications'],
      states: ['ALL'],
      licensedStates: 50,
    },
  ]);

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([
    { zone: 'Zone 1', states: 'CA, OR, WA, NV', baseRate: 5.99, estimatedDays: '1-2' },
    { zone: 'Zone 2', states: 'AZ, UT, ID, MT', baseRate: 7.99, estimatedDays: '2-3' },
    { zone: 'Zone 3', states: 'CO, NM, WY, TX', baseRate: 9.99, estimatedDays: '3-4' },
    { zone: 'Zone 4', states: 'Rest of US', baseRate: 11.99, estimatedDays: '4-5' },
  ]);

  const [processingSettings, setProcessingSettings] = useState({
    autoRoutingEnabled: true,
    priorityThreshold: 24,
    maxRetries: 3,
    batchProcessingTime: '14:00',
    weekendProcessing: false,
  });
  const [savingProcessing, setSavingProcessing] = useState(false);

  // Add Partner Modal State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  // Edit Shipping Zone Modal State
  const [showEditZoneModal, setShowEditZoneModal] = useState(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [zoneForm, setZoneForm] = useState<ShippingZone>({ zone: '', states: '', baseRate: 0, estimatedDays: '' });
  // Add Shipping Zone Modal State
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  // Delete Shipping Zone Modal State
  const [showDeleteZoneModal, setShowDeleteZoneModal] = useState(false);
  const [deletingZoneIndex, setDeletingZoneIndex] = useState<number | null>(null);
  // Reusable passive toast notification
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  // Local selection state for Edit Shipping Zone modal
  const [editZoneStates, setEditZoneStates] = useState<string[]>([]);
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    type: 'Regional' as 'Primary' | 'Regional' | 'Backup',
    region: '',
    apiEndpoint: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    capabilities: [] as string[],
    states: [] as string[],
    licensedStates: 0
  });

  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  const availableCapabilities = [
    'Same-day processing',
    'Next-day delivery',
    'Cold chain',
    'Controlled substances',
    'Compounding',
    'Mail order',
    'Specialty medications',
    'Weekend processing',
    '24/7 support'
  ];

  // Helper to show passive toast messages
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ text, type });
    // Auto-dismiss after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  // Initialize Edit Shipping Zone state selection from zoneForm.states when modal opens
  useEffect(() => {
    if (showEditZoneModal) {
      const parsed = zoneForm.states
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => allStates.includes(s));
      setEditZoneStates(parsed);
    }
  }, [showEditZoneModal, zoneForm.states]);

  // Initialize editStates when opening the Manage States modal
  useEffect(() => {
    if (showStateModal && selectedPartner) {
      if (selectedPartner.states.includes('ALL')) {
        setEditStates(allStates);
      } else {
        setEditStates(selectedPartner.states);
      }
    }
  }, [showStateModal, selectedPartner]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to pharmacy management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      // Load saved processing settings if available
      try {
        const saved = localStorage.getItem('processingSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProcessingSettings((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (e) {
        console.warn('Failed to load processing settings from storage');
      }
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handleSaveProcessingSettings = () => {
    // Basic normalization and safety checks
    const normalized = {
      ...processingSettings,
      priorityThreshold: Math.max(0, Number(processingSettings.priorityThreshold) || 0),
      maxRetries: Math.max(0, Number(processingSettings.maxRetries) || 0),
      batchProcessingTime: processingSettings.batchProcessingTime || '14:00',
      weekendProcessing: !!processingSettings.weekendProcessing,
    };

    setProcessingSettings(normalized);
    setSavingProcessing(true);
    try {
      localStorage.setItem('processingSettings', JSON.stringify(normalized));
      showToast('Processing settings saved.', 'success');
    } catch (e) {
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSavingProcessing(false);
    }
  };

  const handleTogglePartnerStatus = (partnerId: number) => {
    setPartners(partners.map(p => 
      p.id === partnerId 
        ? { ...p, status: p.status === 'active' ? 'standby' : 'active' }
        : p
    ));
  };

  const handleAddPartner = () => {
    // Generate new ID
    const newId = Math.max(...partners.map(p => p.id)) + 1;
    
    // Create new partner object
    const newPartner: Partner = {
      id: newId,
      name: newPartnerForm.name,
      type: newPartnerForm.type as 'Primary' | 'Regional' | 'Backup',
      status: 'standby',
      region: newPartnerForm.region,
      avgFulfillmentTime: '3.0 days', // Default for new partners
      successRate: '0%', // Will be calculated as orders are processed
      monthlyVolume: 0,
      apiEndpoint: newPartnerForm.apiEndpoint,
      capabilities: newPartnerForm.capabilities,
      states: newPartnerForm.states,
      licensedStates: newPartnerForm.licensedStates
    };

    // Add to partners list
    setPartners([...partners, newPartner]);

    // Reset form and close modal
    setNewPartnerForm({
      name: '',
      type: 'Regional' as 'Primary' | 'Regional' | 'Backup',
      region: '',
      apiEndpoint: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      capabilities: [] as string[],
      states: [] as string[],
      licensedStates: 0
    });
    setShowAddPartnerModal(false);
    // Passive confirmation
    showToast('Partner added successfully!', 'success');
  };

  const handleCapabilityToggle = (capability: string) => {
    const updatedCapabilities = newPartnerForm.capabilities.includes(capability)
      ? newPartnerForm.capabilities.filter(cap => cap !== capability)
      : [...newPartnerForm.capabilities, capability];
    
    setNewPartnerForm({
      ...newPartnerForm,
      capabilities: updatedCapabilities
    });
  };

  const handleStateToggle = (state: string) => {
    const updatedStates = newPartnerForm.states.includes(state)
      ? newPartnerForm.states.filter(st => st !== state)
      : [...newPartnerForm.states, state];
    
    setNewPartnerForm({
      ...newPartnerForm,
      states: updatedStates,
      licensedStates: updatedStates.length
    });
  };

  // Toggle state selection inside Manage States modal
  const toggleEditState = (state: string) => {
    setEditStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Management</h1>
          <p className="text-gray-600 mt-1">Configure fulfillment partners and settings</p>
        </div>
        <button
          onClick={() => setShowAddPartnerModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Add Partner
        </button>
      </div>


      {/* Passive Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center animate-fade-in ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
          style={{ minWidth: '260px', transition: 'opacity 0.3s' }}
        >
          <span className="font-medium">{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['partners', 'shipping', 'processing', 'costs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'partners' && 'Fulfillment Partners'}
              {tab === 'shipping' && 'Shipping Zones'}
              {tab === 'processing' && 'Processing Settings'}
              {tab === 'costs' && 'Cost Analysis'}
            </button>
          ))}
        </nav>
      </div>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                      partner.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {partner.status}
                    </span>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {partner.type}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Region</p>
                      <p className="font-medium">{partner.region}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg. Fulfillment</p>
                      <p className="font-medium">{partner.avgFulfillmentTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="font-medium text-green-600">{partner.successRate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Volume</p>
                      <p className="font-medium">{partner.monthlyVolume.toLocaleString()} orders</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {partner.capabilities.map((cap, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">API Endpoint</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{partner.apiEndpoint}</code>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => handleTogglePartnerStatus(partner.id)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {partner.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedPartner(partner);
                      setShowStateModal(true);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Manage States
                  </button>
                  <button 
                    onClick={() => showToast('Testing API connection…', 'info')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Test API
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Shipping Zones Tab */}
      {activeTab === 'shipping' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Zones Configuration</h2>
              <button
                onClick={() => {
                  setZoneForm({ zone: '', states: '', baseRate: 0, estimatedDays: '' });
                  setEditZoneStates([]);
                  setShowAddZoneModal(true);
                }}
                className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Add Zone
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">States</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shippingZones.map((zone, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {zone.zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {zone.states}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${zone.baseRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {zone.estimatedDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setEditingZoneIndex(index);
                              setZoneForm({ ...zone });
                              setShowEditZoneModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => {
                              setDeletingZoneIndex(index);
                              setShowDeleteZoneModal(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Free shipping automatically applies to orders over $50 or for subscription members.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Shipping Zone Modal */}
      {showAddZoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Shipping Zone</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={zoneForm.zone}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">States Covered</label>
                  <span className="text-xs text-gray-500">{editZoneStates.length} selected</span>
                </div>
                <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {allStates.map((state) => {
                    const active = editZoneStates.includes(state);
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() =>
                          setEditZoneStates((prev) =>
                            prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
                          )
                        }
                        className={`px-2 py-1 text-xs rounded border ${
                          active
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        title={state}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Use the buttons to select states for this shipping zone.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zoneForm.baseRate}
                    onChange={(e) => setZoneForm({ ...zoneForm, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days</label>
                  <input
                    type="text"
                    value={zoneForm.estimatedDays}
                    onChange={(e) => setZoneForm({ ...zoneForm, estimatedDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., 1-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddZoneModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const statesString = editZoneStates.sort().join(', ');
                  setShippingZones((prev) => [...prev, { ...zoneForm, states: statesString }]);
                  setShowAddZoneModal(false);
                  showToast('Shipping zone added!', 'success');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Add Zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shipping Zone Confirmation */}
      {showDeleteZoneModal && deletingZoneIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Shipping Zone</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete
              {` "${shippingZones[deletingZoneIndex].zone}"`}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteZoneModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShippingZones((prev) => prev.filter((_, i) => i !== deletingZoneIndex));
                  setShowDeleteZoneModal(false);
                  setDeletingZoneIndex(null);
                  showToast('Shipping zone deleted.', 'success');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shipping Zone Modal */}
      {showEditZoneModal && editingZoneIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Shipping Zone</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={zoneForm.zone}
                  onChange={(e) => setZoneForm({ ...zoneForm, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">States Covered</label>
                  <span className="text-xs text-gray-500">{editZoneStates.length} selected</span>
                </div>
                <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {allStates.map((state) => {
                    const active = editZoneStates.includes(state);
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() =>
                          setEditZoneStates((prev) =>
                            prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
                          )
                        }
                        className={`px-2 py-1 text-xs rounded border ${
                          active
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        title={state}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Use the buttons to select states for this shipping zone.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={zoneForm.baseRate}
                    onChange={(e) => setZoneForm({ ...zoneForm, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days</label>
                  <input
                    type="text"
                    value={zoneForm.estimatedDays}
                    onChange={(e) => setZoneForm({ ...zoneForm, estimatedDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., 1-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditZoneModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingZoneIndex === null) return;
                  const statesString = editZoneStates.length > 0 ? editZoneStates.sort().join(', ') : zoneForm.states.trim();
                  setShippingZones((prev) =>
                    prev.map((z, i) => (i === editingZoneIndex ? { ...zoneForm, states: statesString } : z))
                  );
                  setShowEditZoneModal(false);
                  showToast('Shipping zone updated!', 'success');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Settings Tab */}
      {activeTab === 'processing' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Processing Configuration</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-Routing</label>
                <p className="text-sm text-gray-500">Automatically route orders to best fulfillment partner</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={processingSettings.autoRoutingEnabled}
                  onChange={(e) => setProcessingSettings({
                    ...processingSettings,
                    autoRoutingEnabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority Processing Threshold</label>
              <p className="text-sm text-gray-500 mb-2">Orders older than this will be prioritized (hours)</p>
              <input
                type="number"
                value={processingSettings.priorityThreshold}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  priorityThreshold: parseInt(e.target.value)
                })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Retry Attempts</label>
              <p className="text-sm text-gray-500 mb-2">Number of times to retry failed fulfillment</p>
              <input
                type="number"
                value={processingSettings.maxRetries}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  maxRetries: parseInt(e.target.value)
                })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Batch Processing Time</label>
              <p className="text-sm text-gray-500 mb-2">Daily time to process batch orders</p>
              <input
                type="time"
                value={processingSettings.batchProcessingTime}
                onChange={(e) => setProcessingSettings({
                  ...processingSettings,
                  batchProcessingTime: e.target.value
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Weekend Processing</label>
                <p className="text-sm text-gray-500">Process orders on weekends</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={processingSettings.weekendProcessing}
                  onChange={(e) => setProcessingSettings({
                    ...processingSettings,
                    weekendProcessing: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveProcessingSettings}
                disabled={savingProcessing}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {savingProcessing ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Monthly Fulfillment Cost</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$8,234</p>
              <p className="text-sm text-green-600 mt-1">-12% from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Average Cost per Order</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$4.23</p>
              <p className="text-sm text-green-600 mt-1">-$0.45 from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Shipping Revenue</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$2,156</p>
              <p className="text-sm text-gray-500 mt-1">26% of fulfillment cost</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Partner</h2>
            <div className="space-y-4">
              {partners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{partner.name}</p>
                    <div className="mt-1 flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-gray-900 h-2 rounded-full" 
                          style={{ width: `${(partner.monthlyVolume / 2000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-3 text-sm text-gray-500">
                        {partner.monthlyVolume} orders
                      </span>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="font-semibold text-gray-900">
                      ${(partner.monthlyVolume * 4.23).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      $4.23/order
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* State Management Modal */}
      {showStateModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage State Coverage for {selectedPartner.name}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Currently licensed in {editStates.length} states
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-10 gap-2">
                {allStates.map((state) => {
                  const isActive = editStates.includes(state);
                  return (
                    <button
                      key={state}
                      onClick={() => toggleEditState(state)}
                      className={`px-3 py-2 text-sm rounded border ${
                        isActive
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {state}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> State licensing requirements must be verified before enabling fulfillment in a new state.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedPartner) return;
                  const nextStates = editStates.length === allStates.length ? ['ALL'] : [...editStates].sort();
                  // Update partners list
                  setPartners((prev) => prev.map((p) =>
                    p.id === selectedPartner.id
                      ? { ...p, states: nextStates, licensedStates: editStates.length }
                      : p
                  ));
                  // Keep selectedPartner in sync
                  setSelectedPartner((prev) => prev ? { ...prev, states: nextStates, licensedStates: editStates.length } : prev);
                  setShowStateModal(false);
                  showToast('State coverage updated!', 'success');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-6">Add New Pharmacy Partner</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name *</label>
                  <input
                    type="text"
                    value={newPartnerForm.name}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., ABC Pharmacy Network"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type *</label>
                  <select
                    value={newPartnerForm.type}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, type: e.target.value as 'Primary' | 'Regional' | 'Backup'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="Primary">Primary</option>
                    <option value="Regional">Regional</option>
                    <option value="Backup">Backup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Region *</label>
                  <input
                    type="text"
                    value={newPartnerForm.region}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g., West Coast, National, Southeast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint *</label>
                  <input
                    type="url"
                    value={newPartnerForm.apiEndpoint}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, apiEndpoint: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="https://api.partner.com/v1"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newPartnerForm.address}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newPartnerForm.city}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={newPartnerForm.state}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <option value="">Select State</option>
                      {allStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={newPartnerForm.zipCode}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newPartnerForm.phone}
                      onChange={(e) => setNewPartnerForm({...newPartnerForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newPartnerForm.email}
                    onChange={(e) => setNewPartnerForm({...newPartnerForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Capabilities</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableCapabilities.map((capability) => (
                  <label key={capability} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPartnerForm.capabilities.includes(capability)}
                      onChange={() => handleCapabilityToggle(capability)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{capability}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Licensed States */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Licensed States ({newPartnerForm.licensedStates} selected)</h4>
              <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
                {allStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => handleStateToggle(state)}
                    className={`px-3 py-2 text-sm rounded border ${
                      newPartnerForm.states.includes(state)
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowAddPartnerModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPartner}
                disabled={!newPartnerForm.name || !newPartnerForm.region || !newPartnerForm.apiEndpoint}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
