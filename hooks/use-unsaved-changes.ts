'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { NavigationGuardContext } from '@/components/shared/NavigationGuardProvider';

/**
 * Track whether form data has changed from its last saved state.
 * Automatically registers with the NavigationGuardProvider so that
 * navigating away shows a confirmation dialog.
 *
 * @param currentData - the current form state (serialisable)
 * @returns `{ isDirty, markSaved }` – call `markSaved()` after a successful save
 */
export function useUnsavedChanges<T>(currentData: T) {
  const { setDirty } = useContext(NavigationGuardContext);
  const savedSnapshotRef = useRef<string>(JSON.stringify(currentData));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const dirty = JSON.stringify(currentData) !== savedSnapshotRef.current;
    setIsDirty(dirty);
    setDirty(dirty);
  }, [currentData, setDirty]);

  // Clean up on unmount – mark not dirty
  useEffect(() => {
    return () => setDirty(false);
  }, [setDirty]);

  const markSaved = useCallback(() => {
    savedSnapshotRef.current = JSON.stringify(currentData);
    setIsDirty(false);
    setDirty(false);
  }, [currentData, setDirty]);

  return { isDirty, markSaved };
}
