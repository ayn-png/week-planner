import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NetworkStatus } from '@/components/pwa/NetworkStatus';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <NetworkStatus />
        {children}
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
