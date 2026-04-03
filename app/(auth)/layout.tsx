export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-bg flex min-h-screen items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
