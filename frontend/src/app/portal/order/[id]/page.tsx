'use client';

import { useParams, useRouter } from 'next/navigation';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Order Details</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm">
        Placeholder details page for order ID: <span className="font-mono">{id}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        We will display order metadata, items, fulfillment status, and timeline here once the backend is connected.
      </div>
    </div>
  );
}
