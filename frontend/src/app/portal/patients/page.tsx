'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: 'active' | 'inactive' | 'pending';
  lastVisit: string;
  nextAppointment?: string;
  conditions: string[];
}

type FilterType = 'all' | 'active' | 'pending' | 'inactive' | 'new';

export default function PatientsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('provider');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('7d');
  const { success, error: errorToast, info } = useToast();

  useEffect(() => {
    // Try to get role from localStorage, but don't redirect if not found
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (role) {
      setUserRole(role);
    } else {
      // Default to provider if no role is set
      setUserRole('provider');
      // Set default role in localStorage for consistency
      localStorage.setItem('userRole', 'provider');
    }

    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    // Mock data - add more patients for better demo
    const mockPatients: Patient[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 123-4567',
        dateOfBirth: '1990-05-15',
        status: 'active',
        lastVisit: '2024-01-10',
        nextAppointment: '2024-01-20',
        conditions: ['Acne', 'Eczema']
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'mchen@email.com',
        phone: '(555) 234-5678',
        dateOfBirth: '1985-08-22',
        status: 'active',
        lastVisit: '2024-01-05',
        conditions: ['Psoriasis']
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily.d@email.com',
        phone: '(555) 345-6789',
        dateOfBirth: '1995-03-10',
        status: 'pending',
        lastVisit: '2023-12-15',
        conditions: ['Rosacea']
      },
      {
        id: '4',
        name: 'Robert Wilson',
        email: 'rwilson@email.com',
        phone: '(555) 456-7890',
        dateOfBirth: '1978-11-28',
        status: 'active',
        lastVisit: '2024-01-12',
        conditions: ['Hair Loss']
      },
      {
        id: '5',
        name: 'Jessica Martinez',
        email: 'jmartinez@email.com',
        phone: '(555) 567-8901',
        dateOfBirth: '1992-07-03',
        status: 'inactive',
        lastVisit: '2023-11-20',
        conditions: ['Acne']
      },
      {
        id: '6',
        name: 'David Thompson',
        email: 'dthompson@email.com',
        phone: '(555) 678-9012',
        dateOfBirth: '1988-02-14',
        status: 'active',
        lastVisit: '2024-01-14',
        conditions: ['Weight Loss']
      },
      {
        id: '7',
        name: 'Amanda White',
        email: 'awhite@email.com',
        phone: '(555) 789-0123',
        dateOfBirth: '1983-09-25',
        status: 'active',
        lastVisit: '2024-01-13',
        conditions: ["Men's Health"]
      },
      {
        id: '8',
        name: 'Christopher Lee',
        email: 'clee@email.com',
        phone: '(555) 890-1234',
        dateOfBirth: '1991-04-17',
        status: 'pending',
        lastVisit: '2024-01-11',
        conditions: ['TRT']
      }
    ];
    
    setPatients(mockPatients);
    setLoading(false);
  };

  // Filter counts
  const filterCounts = {
    all: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    pending: patients.filter(p => p.status === 'pending').length,
    inactive: patients.filter(p => p.status === 'inactive').length,
    new: 12 // Mock value for new this week
  };

  // Apply filters
  let filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      if (activeFilter === 'new') {
        // Mock logic - in reality would check dates
        matchesFilter = ['1', '4', '6', '7'].includes(patient.id);
      } else {
        matchesFilter = patient.status === activeFilter;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const togglePatientSelection = (patientId: string) => {
    const newSelection = new Set(selectedPatients);
    if (newSelection.has(patientId)) {
      newSelection.delete(patientId);
    } else {
      newSelection.add(patientId);
    }
    setSelectedPatients(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedPatients.size === filteredPatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(filteredPatients.map(p => p.id)));
    }
  };

  // Export all patients function
  const handleExportAllPatients = () => {
    try {
      // Create CSV content
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'Status', 'Last Visit', 'Conditions'];
      const csvContent = [
        headers.join(','),
        ...filteredPatients.map(patient => [
          patient.id,
          `"${patient.name}"`,
          `"${patient.email}"`,
          `"${patient.phone}"`,
          patient.dateOfBirth,
          patient.status,
          patient.lastVisit,
          `"${patient.conditions.join('; ')}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success(`Exported ${filteredPatients.length} patients to CSV.`);
    } catch (error) {
      console.error('Export failed:', error);
      errorToast('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Export selected patients function
  const handleExportSelectedPatients = () => {
    const selectedData = patients.filter(patient =>
      selectedPatients.has(patient.id)
    );
    
    if (selectedData.length === 0) {
      info('No patients selected for export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Date of Birth', 'Status', 'Last Visit', 'Conditions'];
      const csvContent = [
        headers.join(','),
        ...selectedData.map(patient => [
          patient.id,
          `"${patient.name}"`,
          `"${patient.email}"`,
          `"${patient.phone}"`,
          patient.dateOfBirth,
          patient.status,
          patient.lastVisit,
          `"${patient.conditions.join('; ')}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_patients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clear selection after export
      setSelectedPatients(new Set());
      success(`Exported ${selectedData.length} selected patients to CSV.`);
    } catch (error) {
      console.error('Export failed:', error);
      errorToast('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'active', label: 'Active', count: filterCounts.active },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'inactive', label: 'Inactive', count: filterCounts.inactive },
    { id: 'new', label: 'New This Week', count: filterCounts.new }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
      </div>

      {/* Toasts rendered by provider in layout */}

      {/* Stripe-style Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {filter.label}
            <span className={`ml-1.5 ${activeFilter === filter.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Integrated Search and Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        {/* Status Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* More Filters */}
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          More filters
        </button>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button 
          onClick={handleExportAllPatients}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
        >
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => router.push('/portal/patients/new')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Add Patient
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedPatients.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedPatients.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
          <button 
            onClick={handleExportSelectedPatients}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Export
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Archive</button>
          <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedPatients(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Compact Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === filteredPatients.length && filteredPatients.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conditions
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedPatients.has(patient.id)}
                      onChange={() => togglePatientSelection(patient.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/patient/${patient.id}`)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      <div className="text-xs text-gray-500">DOB: {patient.dateOfBirth}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                    <div className="text-xs text-gray-500">{patient.phone}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      patient.status === 'active' ? 'bg-green-100 text-green-800' :
                      patient.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {patient.conditions.map((condition, i) => (
                        <span key={i} className="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => router.push(`/portal/patient/${patient.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/patient/${patient.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {filteredPatients.length} of {patients.length} patients
            </span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Previous</button>
              <span className="px-2 py-1 text-sm text-gray-700">Page 1 of 1</span>
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
