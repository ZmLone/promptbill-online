# PromptBill — LLM API Pricing, Token Cost Calculator & Benchmarks

**Live App:** [PromptBill (`promptbill.online`)](https://promptbill.online)

PromptBill is a web directory and cost-estimation suite for comparing large language model (LLM) API pricing per 1 million tokens, modeling 30-day production spend, and inspecting benchmark scores with transparent data provenance.

## Core Tools & Routes

- **[API Token Pricing Table](https://promptbill.online/pricing)** — Compare per-1M-token input, cached read, and output rates alongside context windows and provenance status (`Verified`, `Estimated`, or `Unavailable`).
- **[30-Day API Spend Estimator](https://promptbill.online)** — Calculate monthly spend from daily call volume, prompt cache hit rates, batch API discounts, and long-context thresholds.
- **[LLM Benchmark Leaderboard](https://promptbill.online/leaderboard)** — Sort tracked models by overall benchmark score, coding (`CO`), reasoning (`RE`), throughput (`tok/s`), and score-per-dollar efficiency.
- **[Head-to-Head Model Compare](https://promptbill.online/compare)** — Evaluate models side by side across token rates, context limits, domain scores, and hosting endpoints.
- **[Live Prompt Tokenizer](https://promptbill.online/tools/token-counter)** — Estimate prompt token counts and per-request costs across model families.
- **[Interactive LLM Selector](https://promptbill.online/tools/llm-selector)** — Filter models by task type, monthly budget cap, context size, and open-weight vs. closed license.
- **[Hybrid Routing Simulator](https://promptbill.online/tools/routing-simulator)** — Model cost savings from routing routine calls to economy models and complex requests to flagship models.
- **[Data Provenance Methodology](https://promptbill.online/methodology)** — How verified provider citations are separated from unverified estimates.

## Tech Stack

- Next.js (App Router) & TypeScript
- Tailwind CSS
- Deployed on Vercel at [PromptBill](https://promptbill.online)
