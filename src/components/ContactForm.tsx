'use client';

import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const TOPICS = [
  'Pricing Update or Correction',
  'Model Benchmark or Data Question',
  'Broken Link or 404 Report',
  'Partnership or Advertising',
  'Privacy or Security Inquiry',
  'General Feedback',
];

const BUDGET_TIERS = [
  '< $100 / mo',
  '$100–$500 / mo',
  '$500–$2K / mo',
  '$2K–$10K / mo',
  '$10K+ / mo',
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [budget, setBudget] = useState(BUDGET_TIERS[1]);
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
          name,
          email,
          phone,
          company,
          topic,
          budget,
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
          `Message received (Reference: ${data.id || 'sent'}). Thanks for reaching out to PromptBill.`
        );
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setTopic(TOPICS[0]);
        setBudget(BUDGET_TIERS[1]);
        setMessage('');
      }
    } catch {
      setStatus('error');
      setFeedback('Network error while sending your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const underlineInputClass =
    'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#10b981] focus:outline-none transition-colors rounded-none';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-[#f4f5f7] p-5 sm:p-7 md:p-8 space-y-5"
      noValidate
    >
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

      {/* Row 1: Full name* */}
      <div>
        <label htmlFor="pb-name" className="sr-only">
          Full name*
        </label>
        <input
          id="pb-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name*"
          className={underlineInputClass}
        />
      </div>

      {/* Row 2: Email* + Phone number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <label htmlFor="pb-email" className="sr-only">
            Email*
          </label>
          <input
            id="pb-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email*"
            className={underlineInputClass}
          />
        </div>

        <div>
          <label htmlFor="pb-phone" className="sr-only">
            Phone number
          </label>
          <input
            id="pb-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className={underlineInputClass}
          />
        </div>
      </div>

      {/* Row 3: Company name + Inquiry Reason* */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <label htmlFor="pb-company" className="sr-only">
            Company name
          </label>
          <input
            id="pb-company"
            name="company"
            type="text"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className={underlineInputClass}
          />
        </div>

        <div className="relative">
          <label htmlFor="pb-topic" className="sr-only">
            Inquiry Reason*
          </label>
          <select
            id="pb-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={`${underlineInputClass} appearance-none pr-7 cursor-pointer`}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t} className="bg-white text-slate-900">
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-4 h-4 text-slate-500 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Row 4: Monthly API spend / budget pill selector */}
      <div className="space-y-2.5 pt-1">
        <span className="block text-xs font-medium text-slate-700">
          API workload / budget*
        </span>
        <div className="flex flex-wrap gap-2">
          {BUDGET_TIERS.map((tier) => {
            const active = budget === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setBudget(tier)}
                aria-pressed={active}
                className={`min-h-[38px] sm:min-h-[34px] px-3.5 py-1.5 rounded-[5px] text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'border-[#10b981] bg-[#10b981]/15 text-slate-900 font-semibold'
                    : 'border-slate-300 bg-transparent text-slate-600 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 5: Project / inquiry details* */}
      <div className="pt-1">
        <label htmlFor="pb-message" className="sr-only">
          Project details*
        </label>
        <input
          id="pb-message"
          name="message"
          type="text"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Inquiry & pricing details*"
          className={underlineInputClass}
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

      {/* Primary emerald CTA matching reference */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[6px] bg-[#22d38a] hover:bg-[#19be7a] active:bg-[#15a86b] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Let&apos;s Connect</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
