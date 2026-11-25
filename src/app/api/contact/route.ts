import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  topic?: unknown;
  budget?: unknown;
  message?: unknown;
  website?: unknown; // honeypot field for bots
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;

    // Honeypot check: bots often fill hidden 'website' fields
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true, id: 'accepted' }, { status: 200 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : 'Pricing Update or Correction';
    const budget = typeof body.budget === 'string' ? body.budget.trim() : 'Not specified';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 1 || name.length > 120) {
      return NextResponse.json(
        { ok: false, error: 'Please enter your full name (up to 120 characters).' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email) || email.length > 160) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid email address so we can reply.' },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { ok: false, error: 'Please write project or inquiry details between 10 and 5,000 characters.' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const submissionId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    const record = {
      id: submissionId,
      submittedAt,
      name,
      email,
      phone: phone || 'Not provided',
      company: company || 'Not provided',
      topic,
      budget,
      message,
      pageUrl: req.headers.get('referer') || 'https://promptbill.online/contact',
      userAgent: req.headers.get('user-agent') || 'unknown',
    };

    const deliveries: string[] = [];

    // 1. Optional webhook delivery (Slack / Discord / Zapier / Make / custom endpoint)
    const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
    if (webhookUrl) {
      const textSummary =
        `New PromptBill Contact (${record.id})\n` +
        `From: ${record.name} <${record.email}>\n` +
        `Phone: ${record.phone} | Company: ${record.company}\n` +
        `Topic: ${record.topic} | Budget/Scale: ${record.budget}\n` +
        `Time: ${record.submittedAt}\n` +
        `Details:\n${record.message}`;

      const whRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textSummary,
          content: textSummary,
          ...record,
        }),
      });
      if (whRes.ok) {
        deliveries.push('webhook');
      } else {
        console.error('[Contact API] Webhook failed with status:', whRes.status);
      }
    }

    // 2. Resend email delivery to your inbox
    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
    const notifyFrom = process.env.CONTACT_FROM_EMAIL || 'PromptBill <onboarding@resend.dev>';

    if (resendApiKey && notifyTo) {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: notifyFrom,
          to: [notifyTo],
          reply_to: record.email,
          subject: `[PromptBill Contact] ${record.topic} — from ${record.name}`,
          text: [
            `Submission ID: ${record.id}`,
            `Submitted At: ${record.submittedAt}`,
            `Name: ${record.name}`,
            `Email: ${record.email}`,
            `Phone: ${record.phone}`,
            `Company: ${record.company}`,
            `Inquiry Reason: ${record.topic}`,
            `Monthly Spend Tier: ${record.budget}`,
            `Referrer: ${record.pageUrl}`,
            '',
            'Details:',
            record.message,
          ].join('\n'),
        }),
      });
      if (mailRes.ok) {
        deliveries.push('email');
      } else {
        const errText = await mailRes.text();
        console.error('[Contact API] Resend email failed:', mailRes.status, errText);
      }
    }

    // 3. Always log structured payload to Vercel Runtime Logs
    console.info('[PromptBill Contact Submission]', JSON.stringify(record));

    return NextResponse.json(
      {
        ok: true,
        id: submissionId,
        deliveredTo: deliveries,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Contact API] Unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not process your message right now. Please try again.' },
      { status: 500 }
    );
  }
}
