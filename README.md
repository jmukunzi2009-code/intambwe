# INTAMBWE — Complete Digital Leadership Platform

> **Tagline:** Every Step Creates a Leader.  
> **Philosophy:** LEARN → THINK → CONNECT → ACT → CREATE IMPACT.  
> **Founder:** Irakoze Sarah Divine (Kigali, Rwanda)

---

## 1. About the Platform

**INTAMBWE** is an end-to-end digital leadership, conference management, and youth empowerment platform. Founded by Rwandan young woman Irakoze Sarah Divine, the initiative connects secondary school students, educators, and distinguished mentors across Rwanda.

The platform provides:
- **Public Leadership Portal:** Curated curriculum across 8 core pillars, upcoming summits, conference archives, and educational handbooks.
- **Student Leadership Portal:** Private reflection journals, conference seat registration, community challenges, and verified certificates.
- **Executive Administration Console:** User management, conference scheduling, agenda building, real-time physical attendance tracking, content publishing, and security audit trails.
- **Neon PostgreSQL Backend:** High-performance, relational database with repeatable versioned SQL migrations and strict parameterization.

---

## 2. Technology Stack

- **Framework:** Next.js (App Router, Node.js runtime)
- **Language:** JavaScript (ESNext, React)
- **Database:** Neon Serverless PostgreSQL with connection pooling (`pg` client)
- **Security:** HTTP-only secure cookies, cryptographic session tokens, bcrypt password hashing, parameterized SQL queries, strict server-side role validation
- **Styling:** Custom INTAMBWE Design System (`Forest Green #123B2A`, `Emerald #167A50`, `Warm Gold #D4A72C`, Google Fonts `Poppins` & `Inter`)
- **Icons & UI:** Lucide React, Recharts

---

## 3. Environment Variables

Create `.env.local` based on `.env.example`:

```env
# 1. NEON POSTGRESQL DATABASE
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# 2. APPLICATION CONFIGURATION
NODE_ENV="development"
APP_URL="http://localhost:3000"

# 3. INITIAL SUPER ADMIN ACCOUNT (One-time bootstrap)
SUPER_ADMIN_NAME="Irakoze Sarah Divine"
BOOTSTRAP_ADMIN_EMAIL="admin@intambwe.org"
BOOTSTRAP_ADMIN_PASSWORD="YourSecurePasswordHere"

# 4. SESSION SECURITY
SESSION_SECRET="your-cryptographically-secure-random-secret"
```

---

## 4. Setup and Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
Executes all versioned SQL scripts in `database/migrations/`:
```bash
node scripts/migrate.js
```

### 3. Bootstrap Super Administrator Account
Safely creates the initial Super Admin account from `.env.local`. Idempotent: refuses to create duplicate super admins.
```bash
node scripts/create-super-admin.js
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Account Roles and Access Control

1. **Founder / Super Admin:** Full platform governance, staff creation, system audit logs, website configuration.
2. **Administrator:** Conference management, attendance oversight, content approval, user management.
3. **Event Manager:** Conferences, agenda items, speakers, and attendance marking.
4. **Content Editor:** Leadership curriculum articles, learning resources, and toolkits.
5. **Student / Delegate:** Self-registration, conference seat reservations, personal leadership reflections, and challenge submissions.
6. **Public Visitor:** Open access to public curriculum, articles, upcoming summit dates, and contact forms.

---

## 6. Project Architecture

```
intambwe/
├── app/
│   ├── layout.js                     # Root layout with Poppins & Inter fonts
│   ├── globals.css                   # Master INTAMBWE design system styles
│   ├── page.jsx                      # Public homepage with live DB stats
│   ├── about/page.jsx                # Organization story, founder & values
│   ├── explore/                      # 8 leadership pillars & article details
│   ├── conferences/                  # Upcoming & past summits with agenda
│   ├── resources/                    # Handbooks, worksheets & downloads
│   ├── community/                    # Moderated dialogues, challenges & peer notes
│   ├── contact/                      # Contact form with PostgreSQL storage
│   ├── login/                        # Secure session-based authentication
│   ├── register/                     # Enforced student registration
│   ├── dashboard/
│   │   ├── student/                  # Student portal (journal, certificates)
│   │   └── admin/                    # Administrative console & attendance
│   └── api/                          # Next.js Node.js Route Handlers
│       ├── auth/                     # Register, login, logout, me
│       ├── meetings/                 # Conferences CRUD, registration, attendance
│       ├── articles/                 # Curriculum CRUD
│       ├── journal/                  # Student private reflections
│       ├── notes/                    # Peer learning wall and staff moderation
│       ├── challenges/               # Active challenges & submissions
│       ├── contact/                  # Contact messages
│       ├── stats/                    # Real-time DB analytics
│       └── users/                    # User roles & account status
├── components/                       # Shared UI components (Navbar, Footer)
├── database/
│   └── migrations/                   # Safe, repeatable SQL migrations
├── lib/
│   ├── db.js                         # PostgreSQL connection pool & transactions
│   ├── auth.js                       # Session management & bcrypt password hashing
│   ├── permissions.js                # Role definitions & RBAC checks
│   └── validation.js                 # Zod validation schemas
├── scripts/
│   ├── migrate.js                    # Database migration runner
│   └── create-super-admin.js         # Secure super admin initialization
└── package.json
```

---

## 7. Production Deployment (Vercel + Neon)

1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. In the Vercel project settings, configure `DATABASE_URL` and `SESSION_SECRET`.
3. Create and connect a **public Vercel Blob** store, and add its `BLOB_READ_WRITE_TOKEN` to the project environment variables. User-uploaded founder, leader, community, and other media files are stored there because Vercel deployments do not keep files written into the app's `public` directory.
4. Set the build command to `npm run build`.
5. Deploy the application.

For local development without a Blob store, uploads are saved under `public/uploads`. To test Blob uploads locally, connect the Blob store to the Development environment and configure `BLOB_READ_WRITE_TOKEN`.
