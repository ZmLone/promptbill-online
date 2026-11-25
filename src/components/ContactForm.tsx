'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, ChevronDown, Mail, Globe } from 'lucide-react';

const TOPICS = [
  'Pricing Update or Correction',
  'Model Benchmark or Data Question',
  'Broken Link or 404 Report',
  'Privacy or Security Inquiry',
  'General Feedback',
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(TOPICS[0]);
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
        body: JSON.stringify({
          formType: 'contact',
          accountType: 'Individual',
          name,
          email,
          topic: subject,
          message,
          website,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };

      if (!res.ok || !data.ok) {
        setStatus('error');
        setFeedback(data.error || 'Something went wrong while sending your message.');
      } else {
        setStatus('success');
        setFeedback(
          `Message sent (Reference: ${data.id || 'sent'}). We'll get back to you via email.`
        );
        setName('');
        setEmail('');
        setSubject(TOPICS[0]);
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left teal-emerald panel inspired by reference card */}
        <div className="md:col-span-4 bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#059669] p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Direct Contact
            </h2>
            <p className="text-xs sm:text-sm text-teal-50/95 leading-relaxed">
              Report an outdated LLM token rate, flag a 404 or calculation issue, or share feedback on PromptBill.
            </p>
          </div>

          <div className="space-y-3.5 pt-6 md:pt-8 text-xs sm:text-sm text-teal-50 relative z-10">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-teal-100 shrink-0" aria-hidden="true" />
              <span className="truncate">promptbill.online</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-teal-100 shrink-0" aria-hidden="true" />
              <span>API Pricing &amp; Token Calculator</span>
            </div>
          </div>

          {/* Decorative corner arc */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/10"
          />
        </div>

        {/* Right clean underline form (phone number intentionally removed) */}
        <form onSubmit={handleSubmit} className="md:col-span-8 p-5 sm:p-7 md:p-8 space-y-5 bg-white" noValidate>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="pb-contact-website">Website</label>
            <input
              id="pb-contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label htmlFor="pb-contact-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name *
              </label>
              <input
                id="pb-contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0d9488] focus:outline-none transition-colors rounded-none"
              />
            </div>

            <div>
              <label htmlFor="pb-contact-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Your Email *
              </label>
              <input
                id="pb-contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0d9488] focus:outline-none transition-colors rounded-none"
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="pb-contact-subject" className="block text-xs font-semibold text-slate-700 mb-1">
              Your Subject *
            </label>
            <select
              id="pb-contact-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 pr-7 text-[15px] sm:text-sm text-slate-900 appearance-none focus:border-[#0d9488] focus:outline-none transition-colors rounded-none cursor-pointer"
            >
              {TOPICS.map((item) => (
                <option key={item} value={item} className="bg-white text-slate-900">
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-4 h-4 text-slate-500 pointer-events-none absolute right-1 bottom-2.5"
              aria-hidden="true"
            />
          </div>

          <div>
            <label htmlFor="pb-contact-message" className="block text-xs font-semibold text-slate-700 mb-1">
              Message *
            </label>
            <input
              id="pb-contact-message"
              name="message"
              type="text"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message, rate correction, or feedback..."
              className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0d9488] focus:outline-none transition-colors rounded-none"
            />
          </div>

          {status === 'success' ? (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{feedback}</span>
            </div>
          ) : null}

          {status === 'error' ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3.5 text-xs sm:text-sm text-red-900"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{feedback}</span>
            </div>
          ) : null}

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[6px] bg-[#0d9488] hover:bg-[#0f766e] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
}
