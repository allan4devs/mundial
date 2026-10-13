"use client";

// React binding over the localStorage-backed application tracker in
// applications.ts. SSR-safe (starts empty, hydrates in an effect) and syncs
// across tabs via the `storage` event.

import { useCallback, useEffect, useState } from "react";
import {
  APPS_STORAGE_KEY,
  type ApplicationState,
  type AppsMap,
  loadApps,
  resolveState,
  saveApps,
} from "./applications";
import { cvVariants } from "./variants";

const JAVA_REACT_CAMPAIGN_MIGRATION_KEY = "cv:campaign:java-react-2026:v1";

export type UseApplications = {
  /** false until the first client-side read has run. */
  ready: boolean;
  raw: AppsMap;
  get: (slug: string) => ApplicationState;
  update: (slug: string, patch: Partial<ApplicationState>) => void;
  reset: (slug: string) => void;
};

export function useApplications(): UseApplications {
  const [map, setMap] = useState<AppsMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadApps();
    try {
      if (!window.localStorage.getItem(JAVA_REACT_CAMPAIGN_MIGRATION_KEY)) {
        const migrated: AppsMap = { ...loaded };
        const migratedOn = new Date().toISOString();

        // The old base résumé lived at the empty slug. Preserve any tracker
        // notes under its archived replacement, then leave the new master clean.
        if (migrated[""]) {
          migrated["legacy-god-cv"] = {
            ...resolveState(migrated[""]),
            status: "archived",
            updatedOn: migratedOn,
          };
          delete migrated[""];
        }

        for (const variant of cvVariants) {
          if (!variant.archivedByDefault) continue;
          migrated[variant.slug] = {
            ...resolveState(migrated[variant.slug]),
            status: "archived",
            updatedOn: migratedOn,
          };
        }

        saveApps(migrated);
        window.localStorage.setItem(JAVA_REACT_CAMPAIGN_MIGRATION_KEY, migratedOn);
        setMap(migrated);
      } else {
        setMap(loaded);
      }
    } catch {
      setMap(loaded);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === APPS_STORAGE_KEY) setMap(loadApps());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const get = useCallback((slug: string) => resolveState(map[slug]), [map]);

  const update = useCallback((slug: string, patch: Partial<ApplicationState>) => {
    setMap((prev) => {
      const next: AppsMap = {
        ...prev,
        [slug]: { ...resolveState(prev[slug]), ...patch, updatedOn: new Date().toISOString() },
      };
      saveApps(next);
      return next;
    });
  }, []);

  const reset = useCallback((slug: string) => {
    setMap((prev) => {
      if (!(slug in prev)) return prev;
      const next = { ...prev };
      delete next[slug];
      saveApps(next);
      return next;
    });
  }, []);

  return { ready, raw: map, get, update, reset };
}
