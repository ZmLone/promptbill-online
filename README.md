# PromptBill Admin Endpoints & Types Package

Drop these files into `ZmLone/tokenledger`:

- `src/lib/catalogEndpoints.ts` — Shared `HostingEndpoint`, `EditableEndpointFormRow`, and `normalizeEndpointForSave` helpers matching `CatalogHostingEndpoint` in `src/lib/catalog.ts`.
- `src/components/admin/AdminRegistryClient.tsx` — Adds repeatable **Provider Endpoints** rows (`+ Official API`, `+ Inference Cloud`, `+ Router`) with `host`, `providerType`, `inputPer1M`, `outputPer1M`, `cachedInputPer1M`, `batchDiscount`, `latencyMs` (TTFT), `tokPerSec`, `notes`, `sourceUrl`, and `evidenceStatus` in both **Full Edit** (`Edit Live Catalog`) and **+ Add Model Manually**, plus JSON `hostingEndpoints`/`endpoints` support in **Bulk Import**.
- `src/app/api/admin/publish/route.ts` — Preserved admin publish endpoint with `ADMIN_PASSWORD`, `GITHUB_TOKEN`, duplicate slug check, and SHA conflict handling.
