'use client';

import {
  createContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { UnsavedChangesDialog } from '@/components/shared/UnsavedChangesDialog';

// ---------------------------------------------------------------------------
// Context – shared between the provider (in the layout) and consumer forms
// ---------------------------------------------------------------------------
export interface NavigationGuardContextValue {
  /** Forms call this to register / unregister their dirty state. */
  setDirty: (dirty: boolean) => void;
  isDirty: boolean;
}

export const NavigationGuardContext = createContext<NavigationGuardContextValue>({
  setDirty: () => {},
  isDirty: false,
});

// ---------------------------------------------------------------------------
// Provider – renders the dialog & intercepts navigation
// ---------------------------------------------------------------------------
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(false);
  const [isDirty, setIsDirtyState] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingHref = useRef<string | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    setIsDirtyState(dirty);
  }, []);

  // 1. beforeunload – browser close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // 2. Click interception – catch <a> clicks inside the layout
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dirtyRef.current) return;

      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Only intercept same-origin, non-hash navigation
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      pendingHref.current = href;
      setShowDialog(true);
    };

    // Use capture so we run before Next.js link handlers
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  // 3. popstate – browser back / forward
  useEffect(() => {
    const handler = () => {
      if (!dirtyRef.current) return;
      // Push current state back to stay on page, then show dialog
      const currentUrl = window.location.href;
      window.history.pushState(null, '', currentUrl);
      pendingHref.current = null;
      setShowDialog(true);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    dirtyRef.current = false;
    setIsDirtyState(false);
    const href = pendingHref.current;
    pendingHref.current = null;
    if (href) {
      // Use window.location.assign because the href from <a> tags already
      // includes the locale prefix (e.g. /en/resume). Using next-intl's
      // router.push would double-prefix it.
      window.location.assign(href);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    pendingHref.current = null;
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setDirty, isDirty }}>
      {children}
      <UnsavedChangesDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
      />
    </NavigationGuardContext.Provider>
  );
}
