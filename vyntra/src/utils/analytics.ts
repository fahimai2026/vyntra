/**
 * Vyntra Analytics Service
 * Secure helper wrapper for Google Analytics (GA4) to prevent PII (Personally Identifiable Information) leaks.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Strip out potential email, passwords, token parameters from URLs and event parameters
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      let cleanVal = value;
      // Mask email patterns
      cleanVal = cleanVal.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[MASKED_EMAIL]");
      // Mask recovery keys / private strings
      cleanVal = cleanVal.replace(/\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, "[MASKED_SECURITY_CODE]");
      sanitized[key] = cleanVal;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function initGA(trackingId: string = (import.meta as any).env?.VITE_GA_TRACKING_ID || "") {
  if (!trackingId || typeof window === "undefined") return;

  // Dynamically load Google Tag script safely
  const scriptExist = document.getElementById("google-tag-manager-js");
  if (!scriptExist) {
    const script = document.createElement("script");
    script.id = "google-tag-manager-js";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: any[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", trackingId, {
      anonymize_ip: true, // Privacy rule: anonymize IPs
      send_page_view: false, // Let us handle pageviews explicitly
    });
  }
}

/**
 * Log a page view event securely
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window === "undefined") return;
  const trackingId = (import.meta as any).env?.VITE_GA_TRACKING_ID;
  if (!trackingId || !window.gtag) return;

  const sanitizedPath = pagePath.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
  
  window.gtag("event", "page_view", {
    page_path: sanitizedPath,
    page_title: pageTitle || document.title,
    send_to: trackingId,
  });
}

/**
 * Log a custom engagement event securely without leaking sensitive info (likes, clicks, triggers)
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  
  // Strip any direct references to sensitive properties
  const { password, email, otp, secret, recoveryCodes, code, ...safeParams } = params;
  const sanitizedParams = sanitizeData(safeParams);

  window.gtag("event", eventName, {
    ...sanitizedParams,
    non_interaction: false,
  });
}
