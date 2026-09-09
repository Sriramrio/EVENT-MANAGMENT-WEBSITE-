# MSME Sangamam Connect — Stall Booking & Exhibition Management System

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB?style=flat-square&logo=react)
![Backend](https://img.shields.io/badge/Backend-ASP.NET%20Core%208.0%20%7C%20C%23-512BD4?style=flat-square&logo=dotnet)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)
![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)

An enterprise-grade, full-stack event and exhibition management platform designed for **LUB MSME Hosur / Tamil Nadu MSME Sangamam**. The platform streamlines public stall bookings, exhibitor onboarding, dynamic stall floor allocation, payment verification, proforma invoicing, custom email communication templates, visitor registration, and role-based administration.

---

## 📌 Features & Capabilities

### 🌐 Public & Exhibitor Portals
- **Public Stall Booking & Enquiry**: Intuitive online booking form with automatic calculation and event code binding.
- **Exhibitor Self-Service Portal**: Direct access to stall allocation status, company details, requirements management, and digital passes.
- **Digital Stall Pass & QR Badges**: Instant pass generation with QR code check-in, printable and exportable to PDF/PNG.
- **B2B Marketplace & Catalog**: Exhibitors can showcase products, upload brochures, and manage buyer inquiries.
- **Visitor & VIP Pre-Registration**: Dedicated workflows for fast badge printing and onsite check-in tracking.

### 🛡️ Admin & Operational Workflows
- **Interactive Stall Floor Management**: Real-time status tracking (Available, Reserved, Blocked, Allocated), visual layout grids, and drag-and-drop allocations.
- **Multi-Tier Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admin, Event Admin, Stall Allocation Team, Payment Verifier, Invoice Officer, Committee Viewer, and Auditor.
- **Payment Verification & Accounts Reconciliation**: Offline/online payment receipt verification with audit logging.
- **Automated Billing & Invoicing**: Automated Proforma and Final Tax Invoice generation with PDF download.
- **Rich Email Template Engine**: Customizable HTML/Text email templates with dynamic tokens, live preview, test email dispatch, and audit history.
- **Analytics & Executive Dashboard**: Recharts-powered metrics for revenue, stall occupancy, visitor footfall, and category breakdown.

---

## 🏗️ Architecture & Tech Stack

```
MSME Stall Booking Platform
├── Frontend (SPA)
│   ├── React 18 + TypeScript + Vite
│   ├── TailwindCSS + Lucide Icons
│   ├── React Router + TanStack Query (React Query)
│   ├── Zustand (State Management) + React Hook Form + Zod
│   └── Dexie (Offline Storage) + Recharts + HTML2Canvas / jsPDF
│
└── Backend (Clean Architecture ASP.NET Core)
    ├── MSME.StallBooking.Api (REST Controllers, JWT Auth, Swagger)
    ├── MSME.StallBooking.Application (CQRS, Commands, Queries, Validators)
    ├── MSME.StallBooking.Domain (Entities, Enums, Value Objects, Domain Events)
    ├── MSME.StallBooking.Infrastructure (Email Services, PDF Generation, QR Codes)
    ├── MSME.StallBooking.Persistence (EF Core, PostgreSQL, Repositories, Migrations)
    └── MSME.StallBooking.Worker (Background Tasks, Notification Dispatchers)
```

---

## 📂 Project Structure

```
.
├── Backend/
│   ├── docs/                         # DB Schemas & Seed SQL scripts
│   ├── migrations/                   # Entity Framework database migrations
│   ├── src/
│   │   ├── MSME.StallBooking.Api/            # ASP.NET Core Web API project
│   │   ├── MSME.StallBooking.Application/    # Business logic & DTOs
│   │   ├── MSME.StallBooking.Domain/         # Domain models & entities
│   │   ├── MSME.StallBooking.Infrastructure/ # Third-party services (Email, PDF, QR)
│   │   ├── MSME.StallBooking.Persistence/    # PostgreSQL Database context & EF Core
│   │   ├── MSME.StallBooking.SharedKernel/   # Common types & primitives
│   │   └── MSME.StallBooking.Worker/         # Background queue workers
│   ├── tests/                        # Unit & integration test suites
│   ├── MSME.StallBooking.sln          # Visual Studio Solution file
│   └── appsettings.example.json      # Sample backend configuration
│
├── Frontend/
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── data/api/                 # Axios clients and API handlers
│   │   ├── features/                 # Modular feature domains (Admin, Exhibitor, Public)
│   │   ├── services/                 # Business services & state stores
│   │   ├── types/                    # TypeScript interfaces & types
│   │   └── App.tsx                   # Main router and app entry point
│   ├── public/                       # Static public assets
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── vite.config.ts                # Vite build configuration
│   └── tailwind.config.js            # Tailwind CSS design system
│
├── .gitignore                        # Git exclusion rules
└── README.md                         # Documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18.0+ / npm v9+
- **.NET SDK**: .NET 8.0 SDK
- **PostgreSQL**: v14+ (Local or Cloud instance)
- **Git**: Installed and configured

---

### 1️⃣ Database Setup

1. Create a PostgreSQL database (e.g. `msme_stall_booking`):
   ```sql
   CREATE DATABASE msme_stall_booking;
   ```
2. Apply the initial schema and seed data:
   - Run the scripts located in `Backend/docs/schema.sql` and `Backend/docs/seed.sql` against your PostgreSQL database.
   - Or apply EF Core migrations:
     ```bash
     cd Backend/src/MSME.StallBooking.Api
     dotnet ef database update --project ../MSME.StallBooking.Persistence
     ```

---

### 2️⃣ Backend Setup (.NET 8 API)

1. Open a terminal and navigate to the backend API directory:
   ```bash
   cd Backend/src/MSME.StallBooking.Api
   ```

2. Create `appsettings.json` (or copy from `Backend/appsettings.example.json`):
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=msme_stall_booking;Username=postgres;Password=YOUR_POSTGRES_PASSWORD"
     },
     "Cors": {
       "AllowedOrigins": [
         "http://localhost:5173"
       ]
     },
     "Jwt": {
       "Issuer": "msme-stall-booking",
       "Audience": "msme-stall-booking-admin",
       "SigningKey": "YOUR_STRONG_SECRET_KEY_MINIMUM_32_CHARACTERS"
     },
     "Email": {
       "Provider": "Smtp",
       "From": "bookings@msmesangamam.org"
     }
   }
   ```

3. Restore dependencies and run the API:
   ```bash
   dotnet restore
   dotnet build
   dotnet run
   ```
   *The API will start at `http://localhost:5000` (Swagger UI at `http://localhost:5000/swagger`).*

---

### 3️⃣ Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Configure the environment variables:
   ```bash
   cp .env.example .env
   ```
   *Verify that `VITE_API_BASE_URL=http://localhost:5000/api/v1` in `.env`.*

3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
   *The Frontend will start at `http://localhost:5173`.*

---

## 👥 Seeded Default Roles & Accounts

For development and staging environments, the following accounts can be used:

| Role | Email Address | Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@lubmsmehosur.org` | Full system access, users, settings, and templates |
| **Event Admin** | `eventadmin@lubmsmehosur.org` | Event configuration, stall allocations, approvals |
| **Stall Allocation** | `stallallocation@lubmsmehosur.org` | Stall layout, blocking, and manual assignments |
| **Payment Verifier** | `payment@lubmsmehosur.org` | Payment verification and reconciliation |
| **Invoice Officer** | `invoice@lubmsmehosur.org` | Proforma & Tax invoice generation and exports |
| **Auditor** | `auditor@lubmsmehosur.org` | Read-only access to audit logs and transaction trails |
| **Committee Member** | `committee@lubmsmehosur.org` | Read-only executive dashboard and reporting |

---

## 🛠️ Available Scripts

### Frontend Scripts
- `npm run dev` — Start the Vite development server.
- `npm run build` — Type-check and create production build bundle.
- `npm run preview` — Preview the production build locally.
- `npm run lint` — Check for TypeScript/ESLint errors.
- `npm run test` — Run Vitest unit tests.
- `npm run test:e2e` — Run Playwright end-to-end test suites.

### Backend Scripts
- `dotnet build` — Build solution and dependencies.
- `dotnet run --project src/MSME.StallBooking.Api` — Launch the Web API server.
- `dotnet test` — Run unit and integration tests.

---

## 📜 License
This project is proprietary software created for **LUB MSME Hosur / MSME Sangamam Connect**. All rights reserved.
