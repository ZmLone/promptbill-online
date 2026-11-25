import posthog from 'posthog-js';

type LogAttributes = Parameters<typeof posthog.logger.info>[1];

export function logEvent(eventName: string, props?: LogAttributes) {
  posthog.logger.info(eventName, props);
}

export const posthogLog = {
  info: (message: string, meta?: LogAttributes) => posthog.logger.info(message, meta),
  warn: (message: string, meta?: LogAttributes) => posthog.logger.warn(message, meta),
  error: (message: string, meta?: LogAttributes) => posthog.logger.error(message, meta),
  capture: (eventName: string, props?: LogAttributes) => logEvent(eventName, props),
};
