

if (token && host) {
    api_host: host,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
    defaults: '2026-08-30',
  });
} else if (process.env.NODE_ENV === 'development') {
  const missingVariable = token

  throw new Error(
  );
}
