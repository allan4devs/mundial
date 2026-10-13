"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

function getTrackableElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest("button, a, input, select, textarea, [data-analytics], [role='button']");
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!pathname) return;

    trackAnalyticsEvent("page_view", {
      path: queryString ? `${pathname}?${queryString}` : pathname,
    });

  }, [pathname, queryString, status]);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const element = getTrackableElement(event.target);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      trackAnalyticsEvent("click", {
        metadata: {
          target: {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            role: element.getAttribute("role"),
            href: element instanceof HTMLAnchorElement ? element.href : null,
            analyticsId: element.getAttribute("data-analytics"),
          },
          click: {
            x: event.clientX,
            y: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
          },
          elementRect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        },
      });
    };

    window.addEventListener("click", clickHandler, { capture: true });
    return () => window.removeEventListener("click", clickHandler, { capture: true });
  }, []);

  return null;
}
