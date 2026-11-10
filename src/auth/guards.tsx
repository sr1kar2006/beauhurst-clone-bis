import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from './authStore';
import { usePageTitle } from '../lib/title';

/** "Admin console" item for the user menu: shown to Administrators only. */
export function useAdminMenuItems(): { label: string; to: string; hint?: string }[] {
  const user = useCurrentUser();
  return user?.role === 'Administrator' ? [{ label: 'Admin console', to: '/admin/users' }] : [];
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const loc = useLocation();
  if (!user) return <Navigate to="/sign-in" replace state={{ from: loc.pathname + loc.search + loc.hash }} />;
  return <>{children}</>;
}

/**
 * The ONLY role check in the product (CMA clarification: all 30 users get full functionality).
 * Administrators additionally see the Admin console; Members get a 403 page that explains why.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  if (user?.role !== 'Administrator') return <Forbidden />;
  return <>{children}</>;
}

function Forbidden() {
  usePageTitle('Access denied');
  return (
    <div className="max-w-[640px] mx-auto py-[60px] text-center" data-forbidden>
      <ShieldAlert size={36} className="mx-auto text-primary" />
      <h1 className="text-[24px] font-light text-ink mt-[10px]">403: Admin console only</h1>
      <p className="text-text mt-[8px]">The Admin console is where administrators add and remove users and see usage reports. Every other feature is available to every user, including you.</p>
      <Link to="/" className="inline-block mt-[14px] text-primary underline">Back to Advanced search</Link>
    </div>
  );
}
