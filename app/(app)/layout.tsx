import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
