'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export default function CreateOrderPage() {
  const router = useRouter();

  // Role guard (providers cannot create orders)
  useEffect(() => {
    const role = (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'admin';
    if (role === 'provider') {
      router.replace('/portal/dashboard');
    }
  }, [router]);

  // Patient and shipping fields
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [fulfillmentPartner, setFulfillmentPartner] = useState('QuickMeds Pharmacy');

  // Items management
  const [items, setItems] = useState<OrderItem[]>([
    { id: crypto.randomUUID(), name: 'Tretinoin 0.025%', quantity: 1, price: 59.99 },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0), [items]);
  const shippingCost = useMemo(() => (subtotal >= 50 ? 0 : 5.99), [subtotal]);
  const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

  const generateOrderNumber = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}-${month}${day}-${rand}`;
  };

  const handleCreate = () => {
    // Basic validation
    if (!patientName || !patientEmail || !shippingAddress || items.length === 0) {
      alert('Please complete patient details, shipping address, and add at least one item.');
      return;
    }

    const now = new Date();
    const orderNumber = generateOrderNumber();
    const mockOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      patientName,
      patientEmail,
      items: items.map(({ id, ...rest }) => rest),
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      total: Number(total.toFixed(2)),
      date: now.toISOString(),
      shippingAddress,
      fulfillmentPartner,
    };

    // Persist temporarily so Orders page can prepend and show success
    sessionStorage.setItem('lastCreatedOrder', JSON.stringify(mockOrder));

    // Redirect back with a success indicator
    const params = new URLSearchParams({ created: '1', orderNumber });
    router.push(`/portal/orders?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Create Order</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
      </div>

      {/* Patient & Shipping */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Patient</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Full name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Email"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Shipping</h2>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Shipping address"
            rows={2}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
          <div className="mt-3">
            <label className="text-sm text-gray-700 mr-2">Fulfillment partner</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={fulfillmentPartner}
              onChange={(e) => setFulfillmentPartner(e.target.value)}
            >
              <option>QuickMeds Pharmacy</option>
              <option>Regional Health Pharmacy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Items</h2>
          <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800">+ Add item</button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <input
                className="md:col-span-6 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Medication or product name"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                type="number"
                min={1}
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                type="number"
                step="0.01"
                min={0}
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
              />
              <div className="md:col-span-1 text-sm text-gray-900 font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <div className="md:col-span-1 text-right">
                <button onClick={() => removeItem(item.id)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary & Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-700 space-y-1">
            <div>Subtotal: <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span></div>
            <div>Shipping: <span className="font-semibold text-gray-900">${shippingCost.toFixed(2)}</span> <span className="text-gray-500">{subtotal >= 50 ? '(Free over $50)' : ''}</span></div>
            <div>Total: <span className="font-semibold text-gray-900">${total.toFixed(2)}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Create Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
