"use client";

import { useState, useEffect } from "react";

type HeroSlogan = {
  es: string;
  en: string;
};

type SloganState = {
  slogan: HeroSlogan | null;
  loading: boolean;
};

export function useHeroSlogan(): SloganState {
  const [state, setState] = useState<SloganState>({ slogan: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/hero-slogan")
      .then((r) => r.json())
      .then((data: HeroSlogan) => {
        if (!cancelled && data.es && data.en) {
          setState({ slogan: data, loading: false });
        } else if (!cancelled) {
          setState({ slogan: null, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ slogan: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
