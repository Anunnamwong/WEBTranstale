import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

interface WithNextAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

const withNextAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithNextAuthOptions = {}
) => {
  const { redirectTo = '/login-zitadel', requireAuth = true } = options;

  const Wrapper: React.FC<P> = (props) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (requireAuth && status === 'unauthenticated') {
        router.push(redirectTo);
      }
    }, [status, requireAuth, redirectTo, router]);

    if (requireAuth && status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      );
    }

    if (requireAuth && status === 'unauthenticated') {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  Wrapper.displayName = `withNextAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return Wrapper;
};

export default withNextAuth;
