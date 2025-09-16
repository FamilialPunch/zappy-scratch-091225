'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type RecipientType = 'patient' | 'provider' | 'admin';

interface RecipientOption {
  id: string;
  name: string;
  type: RecipientType;
}

export default function ComposeMessagePage() {
  const router = useRouter();

  // Simple mock recipients to unblock flow
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    // In a real flow, fetch recipients by role/permissions
    const mock: RecipientOption[] = [
      { id: 'patient-1', name: 'John Doe (Patient)', type: 'patient' },
      { id: 'provider-1', name: 'Dr. Sarah Smith (Provider)', type: 'provider' },
      { id: 'admin-support', name: 'Admin Support', type: 'admin' },
    ];
    setRecipients(mock);
    setSelectedRecipientId(mock[0].id);
  }, []);

  const onCancel = () => router.push('/portal/messages');

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId || !body.trim()) {
      alert('Please select a recipient and enter a message.');
      return;
    }

    // Mock submit only: no backend integration yet
    const recipient = recipients.find(r => r.id === selectedRecipientId);
    console.log('Mock send message', {
      to: recipient,
      subject: subject.trim(),
      body: body.trim(),
    });
    alert('Message composed (mock). Returning to Messages.');
    router.push('/portal/messages');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compose Message</h1>
          <p className="text-gray-600 mt-1">Create a new message to a patient, provider, or admin</p>
        </div>
        <button onClick={onCancel} className="text-gray-600 hover:text-gray-900">Back to Messages</button>
      </div>

      <Card className="p-6">
        <form onSubmit={onSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {recipients.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Optional subject"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your message..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
              Send
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
