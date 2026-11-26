PromptBill Automated Staging + 1-Click Admin Approval Setup
===========================================================

1. Upload the files in this ZIP to your ZmLone/tokenledger GitHub repository:
   - scripts/sync-registry.mjs
   - .github/workflows/sync-model-registry.yml
   - src/data/pending-registry.json
   - src/app/admin/page.tsx
   - src/components/AdminRegistryClient.tsx
   - src/app/api/admin/publish/route.ts

2. Add two Environment Variables in Vercel (Project Settings -> Environment Variables):
   - ADMIN_PASSWORD = <choose a strong password for /admin>
   - GITHUB_TOKEN = <a GitHub Personal Access Token with Contents: Read & Write permission on ZmLone/tokenledger>

3. Optional Benchmark Feed:
   - If you ever host or connect a JSON benchmark feed (returning [{ "id": "...", "score": 88.5, "tokPerSec": 140, "sourceUrl": "..." }]),
     add BENCHMARK_FEED_URL in GitHub Repository Variables (Settings -> Secrets and variables -> Actions -> Variables).
   - You can also enter or edit benchmark scores and speeds directly inside /admin before clicking Approve!

4. How it works daily:
   - Every day at 04:00 UTC (or when you click "Run workflow" in GitHub Actions), GitHub fetches new models and price updates into src/data/pending-registry.json without touching your live website.
   - Open https://promptbill.online/admin, enter your ADMIN_PASSWORD, review/edit any new models, prices, or benchmark scores, click Approve, and click "Publish Approved Changes to Website".
   - Vercel automatically deploys the updated site within ~1 minute.
