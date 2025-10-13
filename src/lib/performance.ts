import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { Sentry } from './sentry';

const sendToAnalytics = (metric: Metric) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }

  // Send to Sentry in production
  if (import.meta.env.PROD) {
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: {
        web_vital: metric.name,
      },
      extra: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      },
    });
  }

  // You can also send to Google Analytics or other analytics services
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

export const initPerformanceMonitoring = () => {
  // Core Web Vitals
  onCLS(sendToAnalytics); // Cumulative Layout Shift
  onFID(sendToAnalytics); // First Input Delay
  onFCP(sendToAnalytics); // First Contentful Paint
  onLCP(sendToAnalytics); // Largest Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
};

// Performance observer for long tasks
export const observeLongTasks = () => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('[Performance] Long task detected:', entry.duration, 'ms');
            
            if (import.meta.env.PROD) {
              Sentry.captureMessage('Long Task Detected', {
                level: 'warning',
                extra: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                },
              });
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported
      console.warn('PerformanceObserver not supported');
    }
  }
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
