# Frontend — LUB MSME HOSUR

React + TypeScript + Vite + Tailwind frontend for the MSME Sangamam Connect – Tamil Nadu / Hosur stall booking portal.

## User-facing routes

- `/stall-booking` — public stall booking interest form, no login required.
- `/login` — administration portal login.
- `/app/dashboard` — authenticated command dashboard.

## Configure backend

Create `.env` in `frontend/`:

```text
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_EVENT_CODE=MSME-HOSUR-2026
```

## Run

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

## Seeded administrator accounts

Development password for all seeded users is documented in the package root README.

- `superadmin@lubmsmehosur.org`
- `eventadmin@lubmsmehosur.org`
- `stallallocation@lubmsmehosur.org`
- `payment@lubmsmehosur.org`
- `invoice@lubmsmehosur.org`
- `committee@lubmsmehosur.org`
- `auditor@lubmsmehosur.org`

## Acceptance flow

1. Submit a public booking from `/stall-booking`.
2. Login as event admin and block an available stall for the submitted booking.
3. Login as payment user and verify payment.
4. Login as invoice user and generate/send the proforma invoice.
5. Login as committee user and confirm dashboard visibility without write actions.
