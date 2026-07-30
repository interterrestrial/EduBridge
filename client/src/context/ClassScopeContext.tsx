'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';

export interface ScopePair {
  className: string;
  section: string;
}

interface ClassScopeContextValue {
  /** All (className, section) pairs this teacher teaches. */
  availableScopes: ScopePair[];
  /** The currently active scope (null if none available). */
  scope: ScopePair | null;
  /** Set the active scope (also persists to localStorage). */
  setScope: (s: ScopePair) => void;
  /** Build a query string for API calls — includes `?className=&section=`. */
  scopeQuery: string;
  /** Loading flag — true while fetching the teacher's scopes. */
  loading: boolean;
  /** Manually trigger a refresh (e.g. after enrolling a student). */
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'eduBridge.teacherScope';

const ClassScopeContext = createContext<ClassScopeContextValue | null>(null);

export const ClassScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableScopes, setAvailableScopes] = useState<ScopePair[]>([]);
  const [scope, setScopeState] = useState<ScopePair | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchScopes = useCallback(async () => {
    try {
      setLoading(true);

      // Read the persisted scope — we'll validate it after fetching the available list.
      let persistedScope: ScopePair | null = null;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.className && parsed?.section) {
              persistedScope = { className: parsed.className, section: parsed.section };
            }
          } catch {
            // ignore corrupt localStorage
          }
        }
      }

      // Fetch the teacher's available scopes from the server
      let list: ScopePair[] = [];
      try {
        const res = await api.get('/teacher/scopes');
        list = res.data.scopes || [];
      } catch {
        // endpoint may fail (network / 401); leave list empty
      }
      setAvailableScopes(list);

      // Pick the active scope:
      // 1. Use the persisted scope if it's still valid
      // 2. Otherwise, fall back to the first alphabetical scope
      // 3. Otherwise, leave as null
      if (list.length === 0) {
        setScopeState(null);
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      } else {
        const stillValid = persistedScope
          ? list.find((s) => s.className === persistedScope!.className && s.section === persistedScope!.section)
          : null;
        const next = stillValid || list[0];
        setScopeState(next);
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch (err) {
      console.error('Failed to load teacher scope', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScopes(); }, [fetchScopes]);

  const setScope = useCallback((s: ScopePair) => {
    setScopeState(s);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }
  }, []);

  const scopeQuery = scope ? `?className=${encodeURIComponent(scope.className)}&section=${encodeURIComponent(scope.section)}` : '';

  return (
    <ClassScopeContext.Provider value={{ availableScopes, scope, setScope, scopeQuery, loading, refresh: fetchScopes }}>
      {children}
    </ClassScopeContext.Provider>
  );
};

export const useClassScope = (): ClassScopeContextValue => {
  const ctx = useContext(ClassScopeContext);
  if (!ctx) throw new Error('useClassScope must be used inside <ClassScopeProvider>');
  return ctx;
};
