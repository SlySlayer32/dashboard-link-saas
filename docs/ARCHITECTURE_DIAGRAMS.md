# CleanConnect Project Architecture & Operations

This document contains comprehensive Mermaid diagrams that visualize how the CleanConnect project operates and is set up.

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Authentication Flow](#authentication-flow)
5. [Plugin Architecture](#plugin-architecture)
6. [Database Schema](#database-schema)
7. [Deployment Architecture](#deployment-architecture)
8. [Development Workflow](#development-workflow)

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Applications"
        A[Admin Portal<br/>Vite + React<br/>Port 5173]
        W[Worker Dashboard<br/>Vite + React<br/>Port 5174]
    end
    
    subgraph "Backend Services"
        API[Hono.js API<br/>Port 3000]
        SMS[SMS Gateway<br/>MobileMessage.com.au]
    end
    
    subgraph "Infrastructure"
        DB[(Supabase<br/>PostgreSQL)]
        AUTH[Supabase Auth]
        STORAGE[Supabase Storage]
    end
    
    subgraph "External Services"
        GOOGLE[Google Calendar API]
        AIRTABLE[Airtable API]
        NOTION[Notion API]
    end
    
    A -->|HTTP/REST| API
    W -->|HTTP/REST| API
    API --> DB
    API --> AUTH
    API --> STORAGE
    API --> SMS
    SMS -->|SMS with Link| W
    
    API -->|Plugin API Calls| GOOGLE
    API -->|Plugin API Calls| AIRTABLE
    API -->|Plugin API Calls| NOTION
    
    style A fill:#e1f5fe
    style W fill:#f3e5f5
    style API fill:#e8f5e8
    style DB fill:#fff3e0
    style SMS fill:#fce4ec
```

---

## Monorepo Structure

```mermaid
graph TD
    ROOT[CleanConnect Root<br/>pnpm-workspace.yaml]
    
    subgraph "Apps (Applications)"
        ADMIN[apps/admin<br/>Admin Portal]
        API_APP[apps/api<br/>Hono.js Backend]
        WORKER[apps/worker<br/>Worker Dashboard]
    end
    
    subgraph "Packages (Shared Libraries)"
        SHARED[packages/shared<br/>Types & Utils]
        PLUGINS[packages/plugins<br/>Plugin System]
        UI[packages/ui<br/>React Components]
        DATABASE[packages/database<br/>Schema & Migrations]
    end
    
    subgraph "Infrastructure"
        SUPABASE[supabase/<br/>Database Config]
        DOCS[docs/<br/>Documentation]
        GITHUB[.github/<br/>CI/CD Workflows]
    end
    
    ROOT --> ADMIN
    ROOT --> API_APP
    ROOT --> WORKER
    ROOT --> SHARED
    ROOT --> PLUGINS
    ROOT --> UI
    ROOT --> DATABASE
    ROOT --> SUPABASE
    ROOT --> DOCS
    ROOT --> GITHUB
    
    ADMIN --> SHARED
    ADMIN --> UI
    API_APP --> SHARED
    API_APP --> PLUGINS
    API_APP --> DATABASE
    WORKER --> SHARED
    WORKER --> UI
    
    style ROOT fill:#e3f2fd
    style ADMIN fill:#fff3e0
    style API_APP fill:#e8f5e8
    style WORKER fill:#fce4ec
    style SHARED fill:#f1f8e9
    style PLUGINS fill:#f3e5f5
    style UI fill:#e0f2f1
    style DATABASE fill:#fff8e1
```

---

## Data Flow Diagrams

### 1. Admin Creates Dashboard Link

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant AdminApp as Admin Portal
    participant API as Hono.js API
    participant DB as Supabase DB
    participant SMS as SMS Gateway
    participant Worker as Worker Phone
    
    Admin->>AdminApp: Clicks "Send Dashboard Link"
    AdminApp->>API: POST /sms/send-dashboard-link
    API->>DB: Validate admin authorization
    API->>API: TokenService.generateToken()
    API->>DB: Store token with expiry
    API->>API: SMSService.formatPhone()
    API->>SMS: Send SMS with dashboard link
    SMS->>Worker: SMS delivered with link
    SMS-->>API: Delivery confirmation
    API-->>AdminApp: Success response
    AdminApp-->>Admin: "Link sent successfully"
```

### 2. Worker Accesses Dashboard

```mermaid
sequenceDiagram
    participant Worker as Worker
    participant WorkerApp as Worker Dashboard
    participant API as Hono.js API
    participant DB as Supabase DB
    participant Plugins as Plugin System
    
    Worker->>WorkerApp: Opens SMS link
    WorkerApp->>API: GET /dashboards/:token
    API->>DB: Validate token
    API->>DB: Fetch worker data
    API->>DB: Get active widgets
    loop For each widget
        API->>Plugins: Get data from plugin
        Plugins->>DB: Query plugin data
        DB-->>Plugins: Return data
        Plugins-->>API: Formatted results
    end
    API->>API: Aggregate all results
    API-->>WorkerApp: { worker, schedule[], tasks[] }
    WorkerApp-->>Worker: Display dashboard
```

---

## Authentication Flow

```mermaid
graph LR
    subgraph "Admin Authentication"
        A1[Admin Login] --> A2[Email/Password]
        A2 --> A3[Supabase Auth]
        A3 --> A4[JWT Token]
        A4 --> A5[API Requests]
    end
    
    subgraph "Worker Authentication"
        W1[Receive SMS] --> W2[Click Link]
        W2 --> W3[Token Validation]
        W3 --> W4[Dashboard Access]
        W4 --> W5[Auto-logout on expiry]
    end
    
    subgraph "Security Layers"
        S1[Row Level Security]
        S2[JWT Validation]
        S3[Token Expiry]
        S4[Rate Limiting]
    end
    
    A5 --> S1
    A5 --> S2
    W3 --> S3
    W3 --> S4
    
    style A1 fill:#e3f2fd
    style W1 fill:#f3e5f5
    style S1 fill:#fff3e0
```

---

## Plugin Architecture

```mermaid
graph TB
    subgraph "Plugin System"
        REGISTRY[Plugin Registry<br/>Singleton]
        MANAGER[Plugin Manager<br/>Orchestrator]
    end
    
    subgraph "Plugin Adapters"
        BASE[BaseAdapter<br/>Abstract Class]
        MANUAL[ManualAdapter]
        GOOGLE[GoogleCalendarAdapter]
        AIRTABLE[AirtableAdapter]
        NOTION[NotionAdapter]
        CUSTOM[CustomAdapter]
    end
    
    subgraph "Plugin Interface"
        INTERFACE[getTodaySchedule()<br/>getTodayTasks()<br/>validateConfig()<br/>handleWebhook()]
    end
    
    REGISTRY --> MANUAL
    REGISTRY --> GOOGLE
    REGISTRY --> AIRTABLE
    REGISTRY --> NOTION
    REGISTRY --> CUSTOM
    
    BASE --> MANUAL
    BASE --> GOOGLE
    BASE --> AIRTABLE
    BASE --> NOTION
    BASE --> CUSTOM
    
    MANUAL --> INTERFACE
    GOOGLE --> INTERFACE
    AIRTABLE --> INTERFACE
    NOTION --> INTERFACE
    CUSTOM --> INTERFACE
    
    MANAGER --> REGISTRY
    
    style REGISTRY fill:#e8f5e8
    style MANAGER fill:#e1f5fe
    style BASE fill:#fff3e0
    style INTERFACE fill:#f3e5f5
```

---

## Database Schema

```mermaid
erDiagram
    ORGANIZATIONS {
        uuid id PK
        text name
        jsonb settings
        timestamp created_at
        timestamp updated_at
    }
    
    ADMINS {
        uuid id PK
        uuid organization_id FK
        uuid auth_user_id FK
        text email
        text name
        timestamp created_at
    }
    
    WORKERS {
        uuid id PK
        uuid organization_id FK
        text name
        text phone
        text email
        boolean active
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    WORKER_TOKENS {
        uuid id PK
        uuid worker_id FK
        text token
        timestamp expires_at
        timestamp created_at
        timestamp used_at
        boolean revoked
    }
    
    DASHBOARDS {
        uuid id PK
        uuid organization_id FK
        uuid worker_id FK
        text name
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    
    DASHBOARD_WIDGETS {
        uuid id PK
        uuid dashboard_id FK
        text plugin_id
        jsonb config
        integer order
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    
    MANUAL_SCHEDULE_ITEMS {
        uuid id PK
        uuid organization_id FK
        uuid worker_id FK
        text title
        timestamp start_time
        timestamp end_time
        text location
        text description
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    MANUAL_TASK_ITEMS {
        uuid id PK
        uuid organization_id FK
        uuid worker_id FK
        text title
        text description
        timestamp due_date
        text priority
        text status
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    SMS_LOGS {
        uuid id PK
        uuid organization_id FK
        uuid worker_id FK
        text phone
        text message
        text status
        jsonb provider_response
        timestamp created_at
    }
    
    ORGANIZATIONS ||--o{ ADMINS : has
    ORGANIZATIONS ||--o{ WORKERS : has
    ORGANIZATIONS ||--o{ DASHBOARDS : has
    ORGANIZATIONS ||--o{ MANUAL_SCHEDULE_ITEMS : has
    ORGANIZATIONS ||--o{ MANUAL_TASK_ITEMS : has
    ORGANIZATIONS ||--o{ SMS_LOGS : has
    
    WORKERS ||--o{ WORKER_TOKENS : has
    WORKERS ||--|| DASHBOARDS : has
    
    DASHBOARDS ||--o{ DASHBOARD_WIDGETS : has
    
    WORKERS ||--o{ MANUAL_SCHEDULE_ITEMS : has
    WORKERS ||--o{ MANUAL_TASK_ITEMS : has
    WORKERS ||--o{ SMS_LOGS : has
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_LOCAL[Local Development<br/>pnpm dev]
        DEV_DB[Local Supabase<br/>pnpm db:start]
        DEV_APPS[All Apps Running<br/>Ports 5173, 5174, 3000]
    end
    
    subgraph "Production Environment"
        subgraph "Frontend Deployment"
            ADMIN_DEPLOY[Admin Portal<br/>Vercel/Netlify]
            WORKER_DEPLOY[Worker Dashboard<br/>Vercel/Netlify]
        end
        
        subgraph "Backend Deployment"
            API_DEPLOY[Hono.js API<br/>Edge Functions]
        end
        
        subgraph "Database"
            PROD_DB[Supabase Pro<br/>PostgreSQL]
            PROD_AUTH[Supabase Auth]
        end
        
        subgraph "External Services"
            PROD_SMS[MobileMessage.com.au]
            MONITORING[Monitoring/Logging]
        end
    end
    
    DEV_LOCAL --> DEV_DB
    DEV_LOCAL --> DEV_APPS
    
    ADMIN_DEPLOY --> API_DEPLOY
    WORKER_DEPLOY --> API_DEPLOY
    API_DEPLOY --> PROD_DB
    API_DEPLOY --> PROD_AUTH
    API_DEPLOY --> PROD_SMS
    API_DEPLOY --> MONITORING
    
    style DEV_LOCAL fill:#e3f2fd
    style ADMIN_DEPLOY fill:#fff3e0
    style WORKER_DEPLOY fill:#fce4ec
    style API_DEPLOY fill:#e8f5e8
    style PROD_DB fill:#fff8e1
```

---

## Development Workflow

```mermaid
gitgraph
    commit id: "Initial Setup"
    branch feature/new-plugin
    checkout feature/new-plugin
    commit id: "Add plugin interface"
    commit id: "Implement adapter"
    commit id: "Add tests"
    checkout main
    merge feature/new-plugin
    commit id: "Release plugin"
    branch hotfix/security-fix
    checkout hotfix/security-fix
    commit id: "Fix token validation"
    checkout main
    merge hotfix/security-fix tag: "v1.0.1"
    commit id: "Documentation update"
```

---

## Component Interaction Flow

```mermaid
graph TB
    subgraph "Admin Portal Components"
        NAV[Navigation]
        WORKER_LIST[WorkerList]
        WORKER_FORM[WorkerForm]
        SMS_BUTTON[SMSButton]
        PLUGIN_CONFIG[PluginConfig]
    end
    
    subgraph "API Services"
        TOKEN_SVC[TokenService]
        SMS_SVC[SMSService]
        PLUGIN_MGR[PluginManager]
        AUTH_MW[AuthMiddleware]
    end
    
    subgraph "Worker Dashboard Components"
        DASHBOARD_VIEW[DashboardView]
        SCHEDULE_WIDGET[ScheduleWidget]
        TASK_WIDGET[TaskWidget]
        TOKEN_VALIDATOR[TokenValidator]
    end
    
    NAV --> WORKER_LIST
    WORKER_LIST --> WORKER_FORM
    WORKER_FORM --> SMS_BUTTON
    SMS_BUTTON --> PLUGIN_CONFIG
    
    SMS_BUTTON -->|HTTP| TOKEN_SVC
    TOKEN_SVC --> SMS_SVC
    SMS_SVC -->|SMS| DASHBOARD_VIEW
    
    DASHBOARD_VIEW --> TOKEN_VALIDATOR
    TOKEN_VALIDATOR --> PLUGIN_MGR
    PLUGIN_MGR --> SCHEDULE_WIDGET
    PLUGIN_MGR --> TASK_WIDGET
    
    AUTH_MW --> TOKEN_SVC
    AUTH_MW --> SMS_SVC
    AUTH_MW --> PLUGIN_MGR
    
    style NAV fill:#e1f5fe
    style TOKEN_SVC fill:#e8f5e8
    style DASHBOARD_VIEW fill:#f3e5f5
```

---

## Testing Architecture

```mermaid
graph TB
    subgraph "Test Types"
        UNIT[Unit Tests<br/>Vitest + React Testing Library]
        INTEGRATION[Integration Tests<br/>API Endpoints]
        E2E[End-to-End Tests<br/>Playwright]
    end
    
    subgraph "Test Coverage Areas"
        AUTH_TESTS[Authentication Components]
        API_TESTS[API Routes & Services]
        PLUGIN_TESTS[Plugin Adapters]
        UI_TESTS[UI Components]
    end
    
    subgraph "Test Infrastructure"
        VITEST[Vitest Config]
        TEST_DB[Test Database]
        MOCKS[External API Mocks]
        COVERAGE[Coverage Reports]
    end
    
    UNIT --> AUTH_TESTS
    UNIT --> PLUGIN_TESTS
    UNIT --> UI_TESTS
    
    INTEGRATION --> API_TESTS
    INTEGRATION --> PLUGIN_TESTS
    
    E2E --> AUTH_TESTS
    E2E --> API_TESTS
    
    VITEST --> UNIT
    VITEST --> INTEGRATION
    TEST_DB --> INTEGRATION
    MOCKS --> UNIT
    MOCKS --> INTEGRATION
    COVERAGE --> UNIT
    COVERAGE --> INTEGRATION
    
    style UNIT fill:#e3f2fd
    style INTEGRATION fill:#e8f5e8
    style E2E fill:#fff3e0
```

---

## Performance & Scaling Architecture

```mermaid
graph TB
    subgraph "Current Performance"
        CURRENT_LOAD[1000 Workers<br/>10K Requests/day]
        CURRENT_DB[Supabase Free Tier<br/>1GB Storage]
        CURRENT_SMS[~$30/month<br/>SMS Costs]
    end
    
    subgraph "Scaling Path"
        SCALE_5K[5K Workers<br/>Hobby Tier]
        SCALE_50K[50K Workers<br/>Pro Tier]
        SCALE_ENTERPRISE[50K+ Workers<br/>Enterprise]
    end
    
    subgraph "Optimization Strategies"
        CACHE[TanStack Query<br/>Client-side Caching]
        DB_INDEX[Database Indexes<br/>Query Optimization]
        PARALLEL[Parallel Plugin<br/>Execution]
        EDGE[Edge Deployment<br/>Global CDN]
    end
    
    CURRENT_LOAD --> SCALE_5K
    SCALE_5K --> SCALE_50K
    SCALE_50K --> SCALE_ENTERPRISE
    
    CACHE --> SCALE_5K
    DB_INDEX --> SCALE_50K
    PARALLEL --> SCALE_50K
    EDGE --> SCALE_ENTERPRISE
    
    style CURRENT_LOAD fill:#e3f2fd
    style SCALE_5K fill:#e8f5e8
    style SCALE_50K fill:#fff3e0
    style SCALE_ENTERPRISE fill:#f3e5f5
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layers"
        ADMIN_AUTH[Admin Auth<br/>Supabase JWT]
        WORKER_AUTH[Worker Auth<br/>Time-limited Tokens]
        API_AUTH[API Auth<br/>Middleware Validation]
    end
    
    subgraph "Data Protection"
        RLS[Row Level Security<br/>Multi-tenant Isolation]
        ENCRYPTION[Data Encryption<br/>API Keys & Configs]
        HTTPS[HTTPS Only<br/>TLS Encryption]
    end
    
    subgraph "Security Controls"
        RATE_LIMIT[Rate Limiting<br/>DDoS Protection]
        TOKEN_EXPIRY[Token Expiry<br/>Auto-cleanup]
        AUDIT_LOG[Audit Logging<br/>SMS & API Logs]
    end
    
    ADMIN_AUTH --> API_AUTH
    WORKER_AUTH --> API_AUTH
    API_AUTH --> RLS
    
    RLS --> ENCRYPTION
    ENCRYPTION --> HTTPS
    
    RATE_LIMIT --> TOKEN_EXPIRY
    TOKEN_EXPIRY --> AUDIT_LOG
    
    style ADMIN_AUTH fill:#e3f2fd
    style WORKER_AUTH fill:#f3e5f5
    style RLS fill:#e8f5e8
    style RATE_LIMIT fill:#fff3e0
```

---

## Future Enhancement Roadmap

```mermaid
graph LR
    subgraph "Current (v1.0)"
        CURRENT[Baseline Features<br/>SMS Delivery<br/>Basic Plugins]
    end
    
    subgraph "Near Future (v1.5)"
        REALTIME[Real-time Updates<br/>WebSocket/SSE]
        ANALYTICS[Analytics Dashboard<br/>Usage Metrics]
        MOBILE_APPS[Native Mobile Apps<br/>iOS/Android]
    end
    
    subgraph "Mid Future (v2.0)"
        ADVANCED_PLUGINS[Advanced Plugins<br/>Salesforce, Outlook]
        WHITE_LABEL[White-labeling<br/>Custom Branding]
        EMAIL_DELIVERY[Email Delivery<br/>Alternative to SMS]
    end
    
    subgraph "Long Term (v3.0)"
        ENTERPRISE[Enterprise Features<br/>SSO, Advanced Security]
        AI_FEATURES[AI Integration<br/>Smart Scheduling]
        MARKETPLACE[Plugin Marketplace<br/>Third-party Plugins]
    end
    
    CURRENT --> REALTIME
    CURRENT --> ANALYTICS
    CURRENT --> MOBILE_APPS
    
    REALTIME --> ADVANCED_PLUGINS
    ANALYTICS --> WHITE_LABEL
    MOBILE_APPS --> EMAIL_DELIVERY
    
    ADVANCED_PLUGINS --> ENTERPRISE
    WHITE_LABEL --> AI_FEATURES
    EMAIL_DELIVERY --> MARKETPLACE
    
    style CURRENT fill:#e3f2fd
    style REALTIME fill:#e8f5e8
    style ADVANCED_PLUGINS fill:#fff3e0
    style ENTERPRISE fill:#f3e5f5
```

---

## Key Insights & Recommendations

### ✅ **Well-Designed Aspects**
1. **Clean Monorepo Structure** - Clear separation between apps and packages
2. **Plugin Architecture** - Extensible system with standardized interfaces
3. **Multi-tenant Security** - Row Level Security for data isolation
4. **Mobile-First Design** - Worker dashboard optimized for mobile
5. **Token-Based Access** - Secure, passwordless worker authentication

### 🔧 **Potential Improvements**
1. **Real-time Updates** - Add WebSocket/SSE for live dashboard updates
2. **Caching Layer** - Redis for plugin data and API responses
3. **Monitoring** - Comprehensive logging and error tracking
4. **Testing Coverage** - Expand E2E tests for critical user flows
5. **Documentation** - API documentation and plugin development guides

### 🚀 **Scaling Considerations**
1. **Database Optimization** - Proper indexing and query optimization
2. **Edge Deployment** - Deploy API to edge functions for global performance
3. **Load Balancing** - Multiple API instances for high availability
4. **CDN Integration** - Static assets delivery optimization
5. **Background Jobs** - Cron jobs for token cleanup and data processing

These diagrams provide a comprehensive view of the CleanConnect project's architecture, helping developers understand the system's design, data flows, and operational patterns.
