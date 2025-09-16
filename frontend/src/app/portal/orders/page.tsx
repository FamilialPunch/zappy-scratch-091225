'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientEmail: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  total: number;
  date: string;
  shippingAddress: string;
  fulfillmentPartner?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

type FilterType = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export default function OrdersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to orders
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      fetchOrders();
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const fetchOrders = async () => {
    // Mock data with enhanced details
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        patientName: 'Sarah Johnson',
        patientEmail: 'sarah.j@email.com',
        items: [
          { name: 'Tretinoin 0.025%', quantity: 1, price: 59.99 },
          { name: 'Moisturizer SPF 30', quantity: 2, price: 15.00 }
        ],
        status: 'processing',
        paymentStatus: 'paid',
        total: 89.99,
        date: '2024-01-15T10:00:00',
        shippingAddress: '123 Main St, San Francisco, CA 94105',
        fulfillmentPartner: 'QuickMeds Pharmacy',
        trackingNumber: undefined
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        patientName: 'Michael Chen',
        patientEmail: 'mchen@email.com',
        items: [
          { name: 'Hydrocortisone 2.5%', quantity: 1, price: 45.00 }
        ],
        status: 'shipped',
        paymentStatus: 'paid',
        total: 45.00,
        date: '2024-01-14T15:00:00',
        shippingAddress: '456 Oak Ave, Los Angeles, CA 90012',
        fulfillmentPartner: 'Regional Health Pharmacy',
        trackingNumber: '1Z999AA10123456784',
        shippedAt: '2024-01-15T09:00:00'
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        patientName: 'Emily Davis',
        patientEmail: 'emily.d@email.com',
        items: [
          { name: 'Doxycycline 100mg', quantity: 30, price: 65.50 },
          { name: 'Cleanser', quantity: 1, price: 30.00 },
          { name: 'Sunscreen', quantity: 1, price: 30.00 }
        ],
        status: 'delivered',
        paymentStatus: 'paid',
        total: 125.50,
        date: '2024-01-10T09:00:00',
        shippingAddress: '789 Pine St, Seattle, WA 98101',
        fulfillmentPartner: 'QuickMeds Pharmacy',
        trackingNumber: '1Z999AA10123456785',
        shippedAt: '2024-01-11T10:00:00',
        deliveredAt: '2024-01-13T14:30:00'
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-004',
        patientName: 'James Wilson',
        patientEmail: 'jwilson@email.com',
        items: [
          { name: 'Sertraline 50mg', quantity: 30, price: 22.99 }
        ],
        status: 'pending',
        paymentStatus: 'pending',
        total: 22.99,
        date: '2024-01-15T11:00:00',
        shippingAddress: '321 Elm St, Portland, OR 97201',
        fulfillmentPartner: undefined
      },
      {
        id: '5',
        orderNumber: 'ORD-2024-005',
        patientName: 'Amanda White',
        patientEmail: 'awhite@email.com',
        items: [
          { name: 'Finasteride 1mg', quantity: 30, price: 45.00 }
        ],
        status: 'processing',
        paymentStatus: 'paid',
        total: 45.00,
        date: '2024-01-15T09:30:00',
        shippingAddress: '555 Market St, San Diego, CA 92101',
        fulfillmentPartner: 'QuickMeds Pharmacy'
      }
    ];
    
    // If coming back from Create Order, prepend the temporary order
    try {
      const last = sessionStorage.getItem('lastCreatedOrder');
      if (last) {
        const created = JSON.parse(last) as Order;
        setOrders([created, ...mockOrders]);
        sessionStorage.removeItem('lastCreatedOrder');
      } else {
        setOrders(mockOrders);
      }
    } catch {
      setOrders(mockOrders);
    }
    setLoading(false);
  };

  // Filter counts
  const filterCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  // Calculate today's metrics
  const todaysOrders = orders.filter(o => 
    new Date(o.date).toDateString() === new Date().toDateString()
  );
  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);

  // Apply filters
  let filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter !== 'all') {
      matchesFilter = order.status === activeFilter;
    }
    
    return matchesSearch && matchesFilter;
  });

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // Export selected (or all filtered) orders to CSV
  const handleExportOrders = () => {
    try {
      const toExport = orders.filter(o => selectedOrders.size === 0 ? filteredOrders.some(f => f.id === o.id) : selectedOrders.has(o.id));
      if (toExport.length === 0) {
        console.info('No orders to export');
        return;
      }
      const headers = [
        'Order Number',
        'Patient Name',
        'Patient Email',
        'Status',
        'Payment Status',
        'Total',
        'Date',
        'Items Count',
        'Fulfillment Partner',
        'Tracking Number'
      ];
      const rows = toExport.map(o => [
        o.orderNumber,
        o.patientName,
        o.patientEmail,
        o.status,
        o.paymentStatus,
        o.total.toFixed(2),
        new Date(o.date).toISOString(),
        String(o.items.length),
        o.fulfillmentPartner || '',
        o.trackingNumber || ''
      ]);
      const csv = [headers, ...rows]
        .map(r => r.map(val => {
          const s = String(val ?? '');
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      // Clear selection after export
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    );
    setOrders(updatedOrders);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All Orders', count: filterCounts.all },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'processing', label: 'Processing', count: filterCounts.processing },
    { id: 'shipped', label: 'Shipped', count: filterCounts.shipped },
    { id: 'delivered', label: 'Delivered', count: filterCounts.delivered }
  ];

  return (
    <div className="space-y-3">
      {/* Success banner when redirected from Create Order */}
      <SuccessBanner />
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Today: <span className="font-semibold text-gray-900">{todaysOrders.length} orders</span> • 
            <span className="font-semibold text-gray-900 ml-1">${todaysRevenue.toFixed(2)}</span>
          </span>
        </div>
      </div>

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
              placeholder="Search orders..."
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
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>

        {/* Payment Status Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Payment Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* Fulfillment Partner Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Partners</option>
          <option value="quickmeds">QuickMeds Pharmacy</option>
          <option value="regional">Regional Health</option>
        </select>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button onClick={handleExportOrders} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => router.push('/portal/orders/new')}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Create Order
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedOrders.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Print Labels</button>
          <button onClick={handleExportOrders} className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Update Status</button>
          <button className="text-sm text-red-600 hover:text-red-700">Cancel</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedOrders(new Set())}
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
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/portal/order/${order.id}`)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      {order.trackingNumber && (
                        <div className="text-xs text-gray-500">Track: {order.trackingNumber}</div>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.patientName}</div>
                    <div className="text-xs text-gray-500">{order.patientEmail}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {order.items.length === 1 
                        ? order.items[0].name 
                        : `${order.items.length} items`
                      }
                    </div>
                    {order.items.length > 1 && (
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map(item => item.name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => router.push(`/portal/order/${order.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Process
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Ship
                      </button>
                    )}
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
              Showing {filteredOrders.length} of {orders.length} orders
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

function SuccessBanner() {
  const [visible, setVisible] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const created = params.get('created');
    const ord = params.get('orderNumber');
    if (created === '1' && ord) {
      setOrderNumber(ord);
      setVisible(true);
      // Clean URL after showing banner briefly
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;
  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
      Order {orderNumber} created successfully.
    </div>
  );
}
