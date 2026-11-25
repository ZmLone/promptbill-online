'use client';

import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const ACCOUNT_TYPES = ['Company', 'Individual'] as const;

const ENQUIRY_REASONS = [
  'Advertise & Sponsorship',
  'Featured Model / Provider Listing',
  'Enterprise & Team API Cost Inquiry',
  'Data & Benchmark Collaboration',
  'Partnership Inquiry',
];

const BUDGET_TIERS = [
  'Under $250',
  '$250–$1,000',
  '$1,000–$5,000',
  '$5,000+',
];

const PLACEMENTS = [
  'Calculator & Pricing Placement',
  'Leaderboard / Comparison Spot',
  'Sponsored Guide / Benchmark',
  'Custom Package',
];

export function EnquiryForm() {
  const [accountType, setAccountType] = useState<'Company' | 'Individual'>('Company');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState<string>(ENQUIRY_REASONS[0]);
  const [budget, setBudget] = useState<string>(BUDGET_TIERS[1]);
  const [placement, setPlacement] = useState<string>(PLACEMENTS[0]);
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
          formType: 'enquiry',
          accountType,
          name,
          email,
          company,
          topic,
          budget,
          placement,
          message,
          website,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };

      if (!res.ok || !data.ok) {
        setStatus('error');
        setFeedback(data.error || 'Could not submit your enquiry right now.');
      } else {
        setStatus('success');
        setFeedback(
          `Enquiry submitted (Reference: ${data.id || 'sent'}). We have received your details and will reply by email.`
        );
        setName('');
        setEmail('');
        setCompany('');
        setTopic(ENQUIRY_REASONS[0]);
        setBudget(BUDGET_TIERS[1]);
        setPlacement(PLACEMENTS[0]);
        setMessage('');
      }
    } catch {
      setStatus('error');
      setFeedback('Network error while submitting your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const underlineField =
    'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#10b981] focus:outline-none transition-colors rounded-none';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-[#f4f5f7] p-5 sm:p-7 md:p-8 space-y-5"
      noValidate
    >
      <div className="hidden" aria-hidden="true">
        <label htmlFor="pb-enquiry-website">Website</label>
        <input
          id="pb-enquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Company vs Individual selector */}
      <div className="space-y-2">
        <span className="block text-xs font-semibold text-slate-700">
          Inquiring as*
        </span>
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 gap-1">
          {ACCOUNT_TYPES.map((type) => {
            const active = accountType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                aria-pressed={active}
                className={`min-h-[36px] px-4 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#22d38a] text-slate-950'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full name* + Email* (no phone field) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <label htmlFor="pb-enq-name" className="sr-only">
            Full name*
          </label>
          <input
            id="pb-enq-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name*"
            className={underlineField}
          />
        </div>

        <div>
          <label htmlFor="pb-enq-email" className="sr-only">
            Email*
          </label>
          <input
            id="pb-enq-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work or personal email*"
            className={underlineField}
          />
        </div>
      </div>

      {/* Company / Brand name + Enquiry / Advertise reason* */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <label htmlFor="pb-enq-company" className="sr-only">
            Company or brand name
          </label>
          <input
            id="pb-enq-company"
            name="company"
            type="text"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={accountType === 'Company' ? 'Company or API provider*' : 'Brand, project, or studio (optional)'}
            className={underlineField}
          />
        </div>

        <div className="relative">
          <label htmlFor="pb-enq-topic" className="sr-only">
            Enquiry reason*
          </label>
          <select
            id="pb-enq-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={`${underlineField} appearance-none pr-7 cursor-pointer`}
          >
            {ENQUIRY_REASONS.map((reason) => (
              <option key={reason} value={reason} className="bg-white text-slate-900">
                {reason}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-4 h-4 text-slate-500 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Budget / campaign tier pills */}
      <div className="space-y-2 pt-1">
        <span className="block text-xs font-medium text-slate-700">
          Budget or spend tier*
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

      {/* Advertising / feature placement pills */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-slate-700">
          Advertising or feature interest
        </span>
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map((spot) => {
            const active = placement === spot;
            return (
              <button
                key={spot}
                type="button"
                onClick={() => setPlacement(spot)}
                aria-pressed={active}
                className={`min-h-[38px] sm:min-h-[34px] px-3 py-1.5 rounded-[5px] text-xs font-medium border transition-colors cursor-pointer ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                    : 'border-slate-300 bg-white/70 text-slate-700 hover:border-slate-400'
                }`}
              >
                {spot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enquiry & advertising details* */}
      <div className="pt-1">
        <label htmlFor="pb-enq-message" className="sr-only">
          Enquiry and advertising details*
        </label>
        <input
          id="pb-enq-message"
          name="message"
          type="text"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your advertising campaign, sponsorship, or enquiry*"
          className={underlineField}
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
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[6px] bg-[#22d38a] hover:bg-[#19be7a] active:bg-[#15a86b] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit Enquiry</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
