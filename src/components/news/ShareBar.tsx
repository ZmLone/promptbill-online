'use client';

import React, { useState } from 'react';

interface ShareBarProps {
  url: string;
  title: string;
  summary: string;
  compact?: boolean;
}

export function ShareBar({ url, title, summary, compact = false }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title} — ${summary}`.slice(0, 260);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const redditShareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;

  async function handleCopyLink() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: summary, url });
      } catch {
        // User cancelled native share sheet
      }
    } else {
      await handleCopyLink();
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        compact ? 'text-[11px]' : 'text-xs'
      }`}
      aria-label="Share this update"
    >
      <span className="font-semibold text-slate-600 mr-1">Share:</span>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
      </button>

      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <span>Share on X</span>
      </a>

      <a
        href={linkedInShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <span>LinkedIn</span>
      </a>

      <a
        href={redditShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <span>Reddit</span>
      </a>

      {!compact ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-800 hover:bg-slate-100 transition-colors sm:hidden"
        >
          <span>More Share</span>
        </button>
      ) : null}
    </div>
  );
}
