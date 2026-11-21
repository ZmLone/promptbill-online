import posthog from 'posthog-js';

export const posthogLog = {
  info(message: string, attributes: Record<string, boolean | number | string>) {
    posthog.captureLog({ body: message, level: 'info', attributes });
  },
};
