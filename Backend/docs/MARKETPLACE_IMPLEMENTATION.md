# MSME Sangamam Buyer–Seller Marketplace

This implementation uses the existing `StallBookingDbContext` and PostgreSQL `public` schema for both stall booking and buyer/seller marketplace features. There is only one EF Core context, one model snapshot and one migration history table. Existing tables remain structurally unchanged; the marketplace migrations only add new tables and seed data.

## Apply the seven additive migrations

From the backend solution folder:

```powershell
dotnet restore
dotnet ef migrations list --project src/MSME.StallBooking.Persistence --startup-project src/MSME.StallBooking.Api
dotnet ef database update --project src/MSME.StallBooking.Persistence --startup-project src/MSME.StallBooking.Api
dotnet build MSME.StallBooking.sln
```

Module 1 embeds and seeds the reconciled workbook baseline: 74 main categories, 723 classification rows, UOM/status/certification lookups, and matching weights. All new tables are created in the existing `public` schema.

Do not create or specify `MarketplaceDbContext`; it no longer exists. Because the solution contains only `StallBookingDbContext`, normal Package Manager Console commands such as `Add-Migration`, `Update-Database`, and `Get-Migration` no longer produce the “More than one DbContext” error.

## Frontend

```powershell
cd <frontend-folder>
npm install
npm run build
npm run dev
```

The frontend uses `https://localhost:53946/api/v1` by default. Override `src/config/appConfig.ts` or the project environment for another deployment.

Seller journey routes:

- `/seller/dashboard`
- `/seller/capabilities/new/basic`
- `/seller/capabilities/:id/classification`
- `/seller/capabilities/:id/technical`
- `/seller/capabilities/:id/commercial`
- `/seller/capabilities/:id/review`
- `/seller/opportunities`, `/seller/meetings`, `/seller/rfqs`, `/seller/negotiations`, `/seller/awards`

Buyer screens use the real `/buyer/*` endpoints; the mock-data repository path is no longer used.

## Smoke test order

1. Login and obtain a JWT carrying marketplace permissions.
2. Create a seller organization with `POST /api/v1/marketplace/organizations`.
3. Create a capability with `POST /api/v1/seller/capabilities`.
4. Save classification, technical and commercial steps.
5. Publish the capability.
6. Create and publish a buyer requirement.
7. Run `POST /api/v1/marketplace/matching/requirements/{requirementId}/run`.
8. Verify buyer matches, seller opportunities, engagement, meeting, RFQ, quotation and award endpoints.

Every state-changing endpoint validates tenant scope, demands permission claims, uses optimistic version checks where records are edited, and writes to the existing `audit_logs` table without changing that table.
