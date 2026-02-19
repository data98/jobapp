'use client';

import { authClient } from '@/lib/auth-client';

export function useSession() {
  const { data: session, isPending, error } = authClient.useSession();
  return {
    session,
    user: session?.user ?? null,
    isPending,
    error,
    isAuthenticated: !!session?.user,
  };
}
