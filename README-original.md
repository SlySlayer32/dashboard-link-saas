# Dashboard Link SaaS Platform

> 🚀 A modern SaaS platform for delivering personalized daily dashboards to workers via SMS. Built with Vite, React, Hono.js, and Supabase.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Overview

Dashboard Link allows organizations to create and deliver personalized daily dashboards for their people (workers, contractors, staff) via SMS. Admins configure dashboard widgets powered by plugins that pull data from external systems like Google Calendar, Airtable, or Notion.

**Perfect for:**
- 🧹 Cleaning companies → Send cleaners their daily jobs/locations
- 🏗️ Construction firms → Send workers their site assignments
- 🏥 Healthcare agencies → Send carers their patient visit schedules
- 📦 Delivery companies → Send drivers their daily routes

## ✨ Key Features

- **📱 SMS Delivery**: Workers receive dashboard links via SMS (Australian provider: MobileMessage.com.au)
- **🔒 Secure Tokens**: Time-limited access tokens (1hr-1day expiry)
- **🔌 Plugin System**: Extensible adapter system for external data sources
- **⚡ Real-time Updates**: Webhook support for push notifications
- **🏢 Multi-tenant**: Full organization isolation with Row Level Security
- **📊 Mobile-first**: Responsive dashboards optimized for mobile devices

## 🏗️ Architecture

```
┌─────────────┐
│ Admin Setup │ → Configure workers, plugins, generate SMS links
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ SMS Service  │ → MobileMessage.com.au sends link with token
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Worker Opens │ → Tokenized URL on mobile
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Backend Validates│ → API validates token, Dashboard API orchestrates
└──────┬───────────┘
       │
       ▼
┌────────────────────┐
│ Plugin Adapters    │ → Pull data from external APIs
│ (Google Calendar,  │
│  Airtable, Notion) │
└────────────────────┘
       │
       ▼
┌──────────────────┐
│ Display Dashboard│ → Today's schedule, tasks, notes
└──────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Vite** - Lightning-fast build tool
- **React 18** - UI library
- **TanStack Query** - Data fetching & caching
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Lightweight state management

### Backend
- **Hono.js** - Ultra-fast web framework (edge-ready)
- **Supabase** - PostgreSQL database + Auth + Storage
- **MobileMessage.com.au** - Australian SMS provider (2-3¢/SMS)

### Monorepo
- **Turborepo** - High-performance build system
- **pnpm** - Fast, disk space efficient package manager

### Deployment
- **Vercel** - Frontend hosting
- **Supabase** - Backend services
- **Vercel Edge Functions** - API deployment

## 📦 Repository Structure

```
dashboard-link-saas/
├── apps/
│   ├── admin/          # Admin dashboard (Vite + React)
│   ├── worker/         # Worker mobile dashboard (Vite + React)
│   └── api/            # Hono.js API server
├── packages/
│   ├── plugins/        # Plugin adapter system
│   ├── database/       # Supabase migrations & schema
│   ├── shared/         # Shared types & utilities
│   └── ui/             # Shared UI components
└── .github/
    └── workflows/      # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 9+
- **Supabase account** (free tier available)
- **MobileMessage.com.au account** (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SlySlayer32/dashboard-link-saas.git
   cd dashboard-link-saas
   ```

2. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run migrations:
     ```bash
     # Copy the SQL from packages/database/migrations/001_initial_schema.sql
     # Paste into Supabase SQL Editor and execute
     ```
   - Optional: Run seed data:
     ```bash
     # Copy packages/database/seed.sql to Supabase SQL Editor
     ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - Admin app: http://localhost:5173
   - Worker app: http://localhost:5174
   - API server: http://localhost:3000

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# App URLs
APP_URL=http://localhost:5173
API_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# MobileMessage.com.au SMS
MOBILEMESSAGE_USERNAME=your-username
MOBILEMESSAGE_PASSWORD=your-password
MOBILEMESSAGE_SENDER_ID=DashLink

# Plugin Credentials (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AIRTABLE_API_KEY=your-api-key
NOTION_INTEGRATION_SECRET=your-integration-secret
```

## 📚 Documentation

- **[RESEARCH.md](./RESEARCH.md)** - Tech stack research and decision rationale
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and architecture details
- **[API Documentation](./apps/api/README.md)** - API endpoints and usage (coming soon)

## 🔌 Plugin System

Dashboard Link uses a plugin adapter system to fetch data from external sources:

### Built-in Plugins

1. **Manual Entry** - Direct data entry (no external API)
2. **Google Calendar** - Sync schedule from Google Calendar
3. **Airtable** - Pull data from Airtable bases
4. **Notion** - Fetch from Notion databases

### Creating Custom Plugins

```typescript
import { BaseAdapter } from '@dashboard-link/plugins';

export class MyCustomAdapter extends BaseAdapter {
  id = 'my-custom-plugin';
  name = 'My Custom Plugin';
  description = 'Description here';
  version = '1.0.0';

  async getTodaySchedule(workerId: string, config: any) {
    // Fetch and return schedule items
    return [];
  }

  async getTodayTasks(workerId: string, config: any) {
    // Fetch and return task items
    return [];
  }
}
```

## 🧪 Testing

```bash
# Run tests across all packages
pnpm test

# Lint code
pnpm lint

# Type check
pnpm build
```

## 📱 SMS Integration

We use **MobileMessage.com.au** for SMS delivery:

- **Pricing**: 2¢/SMS intro, 3¢ ongoing (vs Twilio AU at 5.15¢)
- **No monthly fees**
- **Credits never expire**
- **Free virtual number** for 2-way SMS
- **Australian-based** with local support

Example SMS sent to workers:
```
Hi John! Your daily dashboard is ready: https://app.dashlink.com/dashboard/abc123xyz
```

## 🚢 Deployment

### Vercel (Frontend)

```bash
# Deploy admin and worker apps
vercel --prod
```

### Supabase (Backend)

Backend is hosted on Supabase - no deployment needed. Just run migrations via SQL Editor.

### API (Vercel Edge Functions or Cloudflare Workers)

```bash
# Deploy Hono.js API
cd apps/api
vercel --prod
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hono.js](https://hono.dev/)
- Powered by [Supabase](https://supabase.com)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- SMS delivery by [MobileMessage.com.au](https://mobilemessage.com.au)

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ in Australia** 🇦🇺
