# AuraVisa Global — AI e-Visa Consultancy & Case Management System

AuraVisa Global is a full-stack, enterprise-grade electronic visa consultancy and case management platform built with React, Vite, Node.js, Express, SQLite, Prisma ORM, and Google Gemini 3.8 Flash.

---

## 🏛️ Strict Premium White Theme & Design System

The platform strictly implements the required white theme:
- **Main Background**: `#FFFFFF`
- **Secondary Backgrounds**: `#F8FAFC` and `#F1F5F9`
- **Primary Buttons & Links**: `#2563EB` (Hover: `#1D4ED8`)
- **Main Typography**: `#1F2937`
- **Muted Typography**: `#64748B`
- **Borders & Dividers**: `#E2E8F0`

Navy blue, gold, yellow, and full-page dark modes are strictly avoided. Typography is crisp and accessible with subtle cards and zero dark pill UI components.

---

## 🔑 Demo Access & Seed Accounts

The platform includes seed users representing the three separate roles. The `/login` page includes convenient 1-click test credential buttons:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@auravisa.com` | `Customer@123456` | `/customer/*` — Create enquiries, submit applications, upload documents to private vault, book appointments |
| **Consultant** | `consultant@auravisa.com` | `Consultant@123456` | `/consultant/*` — Inspect assigned dossiers, forensic document check, approve/reject docs, update status, internal notes |
| **Consultant 2** | `consultant2@auravisa.com` | `Consultant@123456` | `/consultant/*` — Southeast Asia & India specialist |
| **Administrator**| `admin@auravisa.com` | `Admin@123456` | `/admin/*` — Manage user roles, assign cases to specialists, CRUD visa programs, view immutable audit logs |

---

## 🛡️ Private Document Storage & Security

- **Isolated Storage**: Files are written to `/server/storage/private_uploads` outside any public static folder.
- **Path Traversal Protection**: Enforced via `path.resolve` boundary verification.
- **Server-Side File Naming**: Uploaded files receive cryptographic UUID filenames (`UUID.ext`). Original filenames and metadata are stored in SQLite.
- **MIME & Extension Whitelist**: Controlled upload of `.pdf`, `.jpg`, `.jpeg`, and `.png` up to 10MB.
- **Role-Based Authorization**: Every download request validates that the caller is the applicant owner, the assigned case consultant, or an authorized administrator.
- **Audit Logging**: All upload, download, and status change events are recorded with IP address, user agent, actor ID, and timestamps.

---

## 🤖 Multilingual AI Visa Assistant (Grounded in Verified Sources)

Powered by `@google/genai` using model `gemini-3.8-flash`:
- **Languages**: English, Gujarati (`ગુજરાતી`), and Hindi (`हिन्दी`).
- **Verified Official Sources**: Grounded in database records citing verified government portals:
  * **India e-Visa**: Government of India (`https://indianvisaonline.gov.in/evisa/`)
  * **UAE Tourist eVisa**: ICP Smart Services (`https://smartservices.icp.gov.ae`)
  * **United States B1/B2**: US Department of State (`https://travel.state.gov`)
  * **United Kingdom Standard Visitor**: UKVI (`https://www.gov.uk/standard-visitor`)
  * **Schengen France Short-Stay**: France-Visas (`https://france-visas.gouv.fr`)
  * **Singapore e-Visa**: ICA Singapore (`https://eservices.ica.gov.sg`)
  * **Saudi Arabia eVisa**: Visit Saudi (`https://visa.visitsaudi.com`)
  * **Vietnam eVisa**: Vietnam Immigration (`https://evisa.xuatnhapcanh.gov.vn`)
- **Transparent Disclaimers**: Discloses non-guarantee notices and uncertainty when rules vary by individual consular discretion.

---

## ⚡ Windows PowerShell Setup & Execution Guide

Follow these exact commands in **Windows PowerShell**:

### 1. Install Dependencies
```powershell
npm install --legacy-peer-deps
```

### 2. Configure Environment
Create `.env` based on `.env.example`:
```powershell
Copy-Item .env.example .env
```
Ensure your `.env` contains:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
SESSION_SECRET="auravisa-secure-session-super-secret-key-32chars"
FRONTEND_ORIGIN="http://localhost:3000"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 3. Initialize Database Schema & Seed Data
```powershell
# Push schema to SQLite
npm run db:push

# Seed demo users, programs, documents, and appointments
npm run db:seed
```

### 4. Run Automated Test Suite
```powershell
npm test
```

### 5. Start Development Server (Full-Stack Express + Vite)
```powershell
npm run dev
```
Open your browser at `http://localhost:3000`.

### 6. Production Build & Start
```powershell
# Compile production frontend assets
npm run build

# Start production server
npm start
```

---

## 📦 Project Architecture

```
auravisa-global/
├── prisma/
│   ├── schema.prisma        # Complete SQLite relational data model (16 entities)
│   ├── seed.ts              # Verified government visa programs, users, dossiers
│   └── dev.db               # SQLite database
├── server/
│   ├── src/
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.ts      # HMAC signed session tokens & role authorization guards
│   │   ├── routes/
│   │   │   ├── admin.ts     # Role switching, assignments, statistics, audit logs
│   │   │   ├── ai.ts        # Multilingual AI assistant endpoint
│   │   │   ├── applications.ts # Application filing & private document downloads
│   │   │   ├── appointments.ts # Consultation booking & anti-double-booking checks
│   │   │   ├── auth.ts      # Register (CUSTOMER only), login, profile, sessions
│   │   │   ├── consultant.ts   # Assigned caseload, document review, internal notes
│   │   │   ├── eligibility.ts  # Pre-screening questionnaire evaluation engine
│   │   │   ├── enquiries.ts    # Customer enquiries & specialist replies
│   │   │   └── visaPrograms.ts # Public & admin visa catalog
│   │   └── services/
│   │       ├── ai.ts        # Gemini 3.8 Flash grounding service with safe fallbacks
│   │       └── storage.ts   # Private local document storage with path traversal protection
│   └── storage/
│       └── private_uploads/ # Encrypted local document vault outside public web roots
├── src/
│   ├── components/common/   # Navbar, Footer, StatusBadge, LoadingSpinner, AI Modal
│   ├── context/AuthContext.tsx # Client-side session and auth state
│   ├── pages/
│   │   ├── admin/           # Admin Dashboard, Users, Consultants, Applications, Settings
│   │   ├── consultant/      # Consultant Dashboard, Cases, Review Console, Tasks
│   │   ├── customer/        # Customer Dashboard, Applications, Document Vault, Appointments
│   │   └── public/          # Home, Destinations, Detail, Eligibility, Consultation, Contact, Login, Register
│   ├── services/api.ts      # Robust Fetch client validating content-types
│   ├── types/index.ts       # TypeScript models
│   ├── App.tsx              # Role-guarded routing tree
│   └── main.tsx
├── tests/
│   └── system.test.ts       # Automated integration test suite
├── server.ts                # Express full-stack entry point
├── package.json
└── README.md
```
