import UnifiedPortalLayout from '@/components/UnifiedPortalLayout';
import { ToastProvider } from '@/components/toast/ToastProvider';
import ToastContainer from '@/components/toast/ToastContainer';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UnifiedPortalLayout>
        {children}
        <ToastContainer />
      </UnifiedPortalLayout>
    </ToastProvider>
  );
}
