import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
