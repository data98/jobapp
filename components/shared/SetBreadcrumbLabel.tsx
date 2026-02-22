'use client';

import { useEffect } from 'react';
import { useBreadcrumbLabel } from './BreadcrumbContext';

export function SetBreadcrumbLabel({ label }: { label: string }) {
  const { setDynamicLabel } = useBreadcrumbLabel();

  useEffect(() => {
    setDynamicLabel(label);
    return () => setDynamicLabel(null);
  }, [label, setDynamicLabel]);

  return null;
}
