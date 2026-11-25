# Cleaning Up Leftover "Deals" Labels & Top Share Button on promptbill.online

## 1. Remove the Share button next to Advertise
In your top header / navigation component (where `Advertise` and `Share` sit together):
- Delete the `<button>` / `Share` action item and any `Share2` / copy-link handler next to the `Advertise` link.
- Use `<AdvertiseNavButton />` from `src/components/AdvertiseNavButton.tsx` (or style the `/advertise` `<Link>` with a crisp dark slate fill `bg-slate-900 text-white hover:bg-slate-800` and a subtle emerald icon/accent).

## 2. Replace leftover "Deals" labels/links with "Advertise" (`/advertise`)
Search `src/` for `/deals` or `Deals` in navigation, quick-jump pills, cards, or footer links:
- Change `href="/deals"` -> `href="/advertise"`
- Change visible labels like `Deals` / `API Deals` / `Pro Pass & Deals` -> `Advertise`
- Keep `src/app/deals/page.tsx` redirecting permanently to `/advertise` so old URLs never return 404.

## 3. Quick verification checklist
- [ ] Homepage header and quick pills show **Advertise** (not **Deals**)
- [ ] No **Share** button appears next to **Advertise** at the top
- [ ] **Advertise** button has clean contrast, `whitespace-nowrap`, and comfortable tap size on mobile
