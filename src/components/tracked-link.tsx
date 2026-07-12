"use client";

import type { ReactNode } from "react";

interface TrackedLinkProps {
  href: string;
  businessId: string;
  action: "phone" | "website" | "email" | "profile" | "booking";
  campaignId?: string;
  className?: string;
  children: ReactNode;
  rel?: string;
  target?: string;
}

/**
 * Link that logs a click action (phone/website/email/booking) before
 * navigating. Uses sendBeacon so navigation is never blocked.
 */
export function TrackedLink({
  href,
  businessId,
  action,
  campaignId,
  className,
  children,
  rel,
  target,
}: TrackedLinkProps) {
  const track = () => {
    try {
      const payload = JSON.stringify({ businessId, action, campaignId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track/click",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/track/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Tracking must never break navigation.
    }
  };

  return (
    <a href={href} onClick={track} className={className} rel={rel} target={target}>
      {children}
    </a>
  );
}
