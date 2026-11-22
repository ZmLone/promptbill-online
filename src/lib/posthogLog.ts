export function logEvent(_eventName: string, _props?: Record<string, unknown>) {}

export const posthogLog = {
  info: (_message: string, _meta?: Record<string, unknown>) => {},
  warn: (_message: string, _meta?: Record<string, unknown>) => {},
  error: (_message: string, _meta?: Record<string, unknown>) => {},
  capture: (_eventName: string, _props?: Record<string, unknown>) => {},
};
