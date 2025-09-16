'use client';

import { useParams, useRouter } from 'next/navigation';
import MessageChat from '@/components/MessageChat';

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  // For now, treat id as consultationId in the mock flow
  const consultationId = id;

  // Mock current user context until auth is wired in this route
  const currentUserId = 'admin-1';
  const currentUserType = 'provider' as const;
  const currentUserName = 'Admin User';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/portal/messages')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Messages
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Message Thread</h1>
        <div />
      </div>

      <MessageChat
        consultationId={consultationId}
        currentUserId={currentUserId}
        currentUserType={currentUserType}
        currentUserName={currentUserName}
        recipientName="Conversation"
      />
    </div>
  );
}
