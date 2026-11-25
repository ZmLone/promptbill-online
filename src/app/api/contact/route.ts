import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  formType?: unknown;
  accountType?: unknown;
  name?: unknown;
  email?: unknown;
  company?: unknown;
  topic?: unknown;
  budget?: unknown;
  placement?: unknown;
  message?: unknown;
  website?: unknown; // honeypot field for bots
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailHtml(record: {
  id: string;
  formType: 'contact' | 'enquiry';
  accountType: string;
  submittedAt: string;
  name: string;
  email: string;
  company: string;
  topic: string;
  budget: string;
  placement: string;
  message: string;
  pageUrl: string;
}): string {
  const isEnquiry = record.formType === 'enquiry';
  const badgeLabel = isEnquiry ? 'ENQUIRY &amp; ADVERTISING' : 'DIRECT CONTACT';
  const accentColor = isEnquiry ? '#10b981' : '#0d9488';
  const replySubject = encodeURIComponent(`Re: ${record.topic} — PromptBill`);

  const rows: Array<[string, string]> = [
    ['From', `${escapeHtml(record.name)} &lt;<a href="mailto:${escapeHtml(record.email)}" style="color:#0f766e;text-decoration:none;font-weight:600;">${escapeHtml(record.email)}</a>&gt;`],
    ['Topic / Reason', escapeHtml(record.topic)],
    ['Reference ID', `<code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${escapeHtml(record.id)}</code>`],
    ['Submitted', escapeHtml(record.submittedAt)],
  ];

  if (isEnquiry) {
    rows.splice(
      1,
      0,
      ['Category', escapeHtml(record.accountType)],
      ['Company / Brand', escapeHtml(record.company)],
      ['Budget Tier', escapeHtml(record.budget)],
      ['Placement', escapeHtml(record.placement)]
    );
  }

  const tableRowsHtml = rows
    .map(
      ([label, val]) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;width:140px;font-size:12px;font-weight:600;color:#64748b;vertical-align:top;">
            ${label}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;vertical-align:top;">
            ${val}
          </td>
        </tr>`
    )
    .join('');

  const formattedMessage = escapeHtml(record.message).replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PromptBill Notification</title>
  </head>
  <body style="margin:0;padding:24px 12px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background-color:#0f172a;padding:20px 24px;">
          <div style="display:inline-block;background-color:${accentColor};color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.08em;padding:4px 9px;border-radius:999px;margin-bottom:8px;">
            ${badgeLabel}
          </div>
          <h1 style="margin:0;font-size:18px;line-height:1.35;color:#f8fafc;font-weight:700;">
            ${escapeHtml(record.topic)}
          </h1>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
            promptbill.online &middot; Submitted by ${escapeHtml(record.name)}
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 24px 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;overflow:hidden;">
            ${tableRowsHtml}
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:14px 24px 20px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px;">
            Message
          </div>
          <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${accentColor};border-radius:8px;padding:14px 16px;font-size:14px;line-height:1.6;color:#1e293b;word-break:break-word;">
            ${formattedMessage}
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 22px;">
          <a
            href="mailto:${escapeHtml(record.email)}?subject=${replySubject}"
            style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;"
          >
            Reply to ${escapeHtml(record.name)}
          </a>
        </td>
      </tr>

      <tr>
        <td style="padding:14px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
          Source page: ${escapeHtml(record.pageUrl)}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;

    // Honeypot check: bots often fill hidden 'website' fields
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true, id: 'accepted' }, { status: 200 });
    }

    const rawFormType =
      typeof body.formType === 'string' ? body.formType.trim().toLowerCase() : 'contact';
    const formType: 'contact' | 'enquiry' = rawFormType === 'enquiry' ? 'enquiry' : 'contact';

    const accountType =
      typeof body.accountType === 'string' && body.accountType.trim().length > 0
        ? body.accountType.trim()
        : 'Individual';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const topic =
      typeof body.topic === 'string' && body.topic.trim().length > 0
        ? body.topic.trim()
        : formType === 'enquiry'
          ? 'Advertise & Sponsorship'
          : 'Pricing Update or Correction';
    const budget =
      typeof body.budget === 'string' && body.budget.trim().length > 0
        ? body.budget.trim()
        : 'Not specified';
    const placement =
      typeof body.placement === 'string' && body.placement.trim().length > 0
        ? body.placement.trim()
        : 'Not specified';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 1 || name.length > 120) {
      return NextResponse.json(
        { ok: false, error: 'Please enter your name (up to 120 characters).' },
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
        { ok: false, error: 'Please write a message between 10 and 5,000 characters.' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const prefix = formType === 'enquiry' ? 'enq' : 'msg';
    const submissionId = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    const record = {
      id: submissionId,
      formType,
      accountType,
      submittedAt,
      name,
      email,
      company: company || 'Not provided',
      topic,
      budget,
      placement,
      message,
      pageUrl: req.headers.get('referer') || `https://promptbill.online/${formType}`,
      userAgent: req.headers.get('user-agent') || 'unknown',
    };

    const deliveries: string[] = [];

    // 1. Optional webhook delivery (Slack / Discord / Zapier / Make / custom endpoint)
    const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
    if (webhookUrl) {
      const label =
        formType === 'enquiry' ? 'PromptBill Enquiry / Advertise' : 'PromptBill Contact';
      const textSummary =
        `New ${label} (${record.id})\n` +
        `From: ${record.name} <${record.email}> (${record.accountType})\n` +
        `Company: ${record.company} | Topic: ${record.topic}\n` +
        `Budget: ${record.budget} | Placement: ${record.placement}\n` +
        `Time: ${record.submittedAt}\n` +
        `Message:\n${record.message}`;

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

    // 2. Resend email delivery to your inbox (clean HTML card + plain-text fallback)
    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
    const notifyFrom = process.env.CONTACT_FROM_EMAIL || 'PromptBill <onboarding@resend.dev>';

    if (resendApiKey && notifyTo) {
      const subjectTag =
        formType === 'enquiry' ? 'PromptBill Enquiry / Advertise' : 'PromptBill Contact';
      const plainTextLines =
        formType === 'enquiry'
          ? [
              `Submission ID: ${record.id}`,
              `Type: Enquiry & Advertising (${record.accountType})`,
              `Submitted At: ${record.submittedAt}`,
              `Name: ${record.name}`,
              `Email: ${record.email}`,
              `Company / Brand: ${record.company}`,
              `Reason: ${record.topic}`,
              `Budget Tier: ${record.budget}`,
              `Placement: ${record.placement}`,
              `Source: ${record.pageUrl}`,
              '',
              'Message:',
              record.message,
            ]
          : [
              `Submission ID: ${record.id}`,
              `Type: Direct Contact`,
              `Submitted At: ${record.submittedAt}`,
              `Name: ${record.name}`,
              `Email: ${record.email}`,
              `Topic: ${record.topic}`,
              `Source: ${record.pageUrl}`,
              '',
              'Message:',
              record.message,
            ];

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
          subject: `[${subjectTag}] ${record.topic} — from ${record.name}`,
          html: buildEmailHtml(record),
          text: plainTextLines.join('\n'),
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
