'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import LineChart from '@/components/LineChart';
import useAnalytics, { TimePeriod } from '@/hooks/useAnalytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  loading?: boolean;
}

const MetricCard = ({ title, value, change, trend = 'neutral', color = 'gray-900', loading }: MetricCardProps) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold text-${color} mb-1`}>{value}</p>
      {change && (
        <div className={`text-sm ${trendColors[trend]} flex items-center`}>
          <span className="mr-1">{trendIcons[trend]}</span>
          {change}
        </div>
      )}
    </Card>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const { data, loading, error, refetch } = useAnalytics(selectedPeriod);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to analytics
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setAuthLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number, decimals: 1) => {
    return `${num.toFixed(decimals)}%`;
  };

  // Calculate conversion rates and other derived metrics
  const consultationConversionRate = data 
    ? (data.consultations_started > 0 ? (data.consultations_completed / data.consultations_started) * 100 : 0)
    : 0;

  const orderConversionRate = data 
    ? (data.consultations_completed > 0 ? (data.orders_placed / data.consultations_completed) * 100 : 0)
    : 0;

  const avgOrderValue = data
    ? (data.orders_placed > 0 ? data.total_revenue / data.orders_placed : 0)
    : 0;

  const revenuePerVisitor = data
    ? (data.unique_visitors > 0 ? data.total_revenue / data.unique_visitors : 0)
    : 0;

  // Generate mock trend data for the chart
  const generateTrendData = (baseValue: number) => {
    const days = selectedPeriod === 'today' ? 24 : selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    const data = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const variation = Math.random() * 0.3 - 0.15; // ±15% variation
      const value = Math.max(0, baseValue * (1 + variation));
      data.push({ x: i, y: value });
    }
    return data;
  };

  const revenueTrendData = data ? generateTrendData(data.total_revenue / 30) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Business intelligence and performance metrics</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['today', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">Error loading analytics data: {error}</p>
                <p className="text-xs text-red-600 mt-1">Showing demo data for development purposes</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={data ? formatCurrency(data.total_revenue) : '$0'}
          change="+15.2%"
          trend="up"
          color="green-600"
          loading={loading}
        />
        <MetricCard
          title="Unique Visitors"
          value={data ? formatNumber(data.unique_visitors) : '0'}
          change="+8.1%"
          trend="up"
          color="blue-600"
          loading={loading}
        />
        <MetricCard
          title="Consultations Completed"
          value={data ? formatNumber(data.consultations_completed) : '0'}
          change="+12.5%"
          trend="up"
          color="purple-600"
          loading={loading}
        />
        <MetricCard
          title="Orders Placed"
          value={data ? formatNumber(data.orders_placed) : '0'}
          change="+6.8%"
          trend="up"
          color="indigo-600"
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Consultation Conversion"
          value={formatPercentage(consultationConversionRate, 1)}
          change="+2.3%"
          trend="up"
          color="emerald-600"
          loading={loading}
        />
        <MetricCard
          title="Order Conversion"
          value={formatPercentage(orderConversionRate, 1)}
          change="-1.2%"
          trend="down"
          color="orange-600"
          loading={loading}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          change="+5.4%"
          trend="up"
          color="teal-600"
          loading={loading}
        />
        <MetricCard
          title="Revenue per Visitor"
          value={formatCurrency(revenuePerVisitor)}
          change="+3.7%"
          trend="up"
          color="rose-600"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <span className="text-sm text-gray-500">Last {selectedPeriod}</span>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="h-48">
              <LineChart
                data={revenueTrendData}
                stroke="#059669"
                strokeWidth={3}
                width={400}
                height={192}
              />
            </div>
          )}
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Page Views</span>
                <span className="text-lg font-bold text-blue-600">{formatNumber(data?.page_views || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-900">Consultations Started</span>
                <span className="text-lg font-bold text-purple-600">{formatNumber(data?.consultations_started || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Consultations Completed</span>
                <span className="text-lg font-bold text-green-600">{formatNumber(data?.consultations_completed || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <span className="text-sm font-medium text-indigo-900">Orders Placed</span>
                <span className="text-lg font-bold text-indigo-600">{formatNumber(data?.orders_placed || 0)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
