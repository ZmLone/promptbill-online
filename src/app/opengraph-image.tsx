import { ImageResponse } from 'next/og';

export const alt = 'TokenLedger — AI API Token & Cloud Cost Simulator';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'DeepSeek',
  'xAI',
  'Qwen',
  'Mistral',
  'Groq',
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: '#020617',
          padding: '64px',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '10px 22px',
              fontSize: '20px',
              fontWeight: 600,
              color: '#6ee7b7',
            }}
          >
            22 Live Models · Prompt Caching &amp; Batch API Discounts
          </div>
        </div>

        {/* Center Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.05,
            }}
          >
            TokenLedger
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '36px',
              fontWeight: 600,
              color: '#34d399',
              lineHeight: 1.2,
            }}
          >
            AI API Token &amp; Cloud Cost Simulator
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#94a3b8',
              maxWidth: '920px',
              lineHeight: 1.4,
            }}
          >
            Compare real monthly API bills, cache savings, and context windows
            across 231 model-to-model benchmarks.
          </div>
        </div>

        {/* Bottom Provider Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e293b',
            paddingTop: '28px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            {PROVIDERS.map((name) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  padding: '6px 14px',
                  fontSize: '16px',
                  color: '#cbd5e1',
                }}
              >
                {name}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            tokenledger-six.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
