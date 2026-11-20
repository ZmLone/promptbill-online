"use client"

import NextError from "next/error"
import posthog from "posthog-js"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased">
        <NextError statusCode={0} />
        <button
          className="mx-auto mb-8 rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
