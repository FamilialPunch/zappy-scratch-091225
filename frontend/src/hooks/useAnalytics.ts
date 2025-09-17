import { useState, useEffect } from 'react';

export interface AnalyticsData {
  unique_visitors: number;
  page_views: number;
  consultations_started: number;
  consultations_completed: number;
  orders_placed: number;
  total_revenue: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  period: string;
}

export type TimePeriod = 'today' | 'week' | 'month' | 'year';

export const useAnalytics = (period: TimePeriod = 'month') => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (selectedPeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/analytics/summary?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AnalyticsResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch analytics data');
      }

      // Ensure all numbers are valid
      const cleanData: AnalyticsData = {
        unique_visitors: Number(result.data.unique_visitors) || 0,
        page_views: Number(result.data.page_views) || 0,
        consultations_started: Number(result.data.consultations_started) || 0,
        consultations_completed: Number(result.data.consultations_completed) || 0,
        orders_placed: Number(result.data.orders_placed) || 0,
        total_revenue: Number(result.data.total_revenue) || 0,
      };

      setData(cleanData);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      // Fallback to mock data for development/demo purposes
      setData({
        unique_visitors: 1250,
        page_views: 3480,
        consultations_started: 95,
        consultations_completed: 87,
        orders_placed: 73,
        total_revenue: 48352,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchAnalytics(period),
  };
};

export default useAnalytics;