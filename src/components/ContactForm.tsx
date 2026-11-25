'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TOPICS = [
  'Pricing Update or Correction',
  'Broken Link or 404 Report',
  'Model Benchmark or Data Question',
  'Partnership or Advertising',
  'Privacy or Security Inquiry',
  'General Feedback',
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus('idle');
    setFeedback('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message, website }),
      });

      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };

      if (!res.ok || !data.ok) {
        setStatus('error');
        setFeedback(data.error || 'Something went wrong while sending your message.');
      } else {
        setStatus('success');
        setFeedback(
          `Message received (Reference: ${data.id || 'sent'}). Thanks for reaching out to PromptBill.`
        );
        setName('');
        setEmail('');
        setTopic(TOPICS[0]);
        setMessage('');
      }
    } catch {
      setStatus('error');
      setFeedback('Network error while sending your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot field hidden from human users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="pb-company-website">Website</label>
        <input
          id="pb-company-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="pb-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Your Name *
          </label>
          <input
            id="pb-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pb-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Reply Email *
          </label>
          <input
            id="pb-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pb-topic" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Topic
        </label>
        <select
          id="pb-topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pb-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Message *
        </label>
        <textarea
          id="pb-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share pricing updates, model questions, broken links, or feedback..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
        />
      </div>

      {status === 'success' ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-950"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{feedback}</span>
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-900"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{feedback}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </>
        )}
      </button>
    </form>
  );
}
