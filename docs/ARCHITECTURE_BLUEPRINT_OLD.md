# Dashboard Link SaaS - Legacy Architecture Blueprint

> **Status**: Legacy / historical reference (may contain outdated diagrams and stack choices)
>
> For the current, repo-aligned architecture (Hono + Supabase + BullMQ, etc.), see `docs/ARCHITECTURE_BLUEPRINT.md`.

## 🎯 Project Overview

CleanConnect is a Zapier-inspired enterprise SaaS platform that delivers personalized daily dashboards via SMS. This document provides comprehensive architectural diagrams for developers, investors, and users to understand the complete system.

---

## 🏗️ High-Level System Architecture (Zapier-Style)

```mermaid
graph TB
    subgraph "Frontend Applications"
        WebApp[Web Dashboard]
        MobileApp[Mobile App]
        AdminPanel[Admin Panel]
        PublicSite[Public Website]
    end

    subgraph "API Gateway Layer"
        API[API Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiting]
        LoadBalancer[Load Balancer]
    end

    subgraph "Service Layer (Your Core)"
        UserService[User Service]
        DashboardService[Dashboard Service]
        SMSService[SMS Service]
        PluginService[Plugin Service]
        BillingService[Billing Service]
    end

    subgraph "Contract Layer (THE MISSING PIECE)"
        style Contract fill:#ffd43b,stroke:#000,stroke-width:4px
        Contract[Provider Interfaces<br/>────────────────<br/>SMSProvider<br/>PluginAdapter<br/>Repository<br/>AuthProvider<br/>PaymentProvider]
    end

    subgraph "Adapter Layer (Swappable)"
        MobileMessageAdapter[MobileMessage SMS]
        TwilioAdapter[Twilio SMS]
        GoogleAdapter[Google Calendar]
        AirtableAdapter[Airtable]
        PostgresAdapter[PostgreSQL]
        CacheAdapter[Redis Cache]
        StripeAdapter[Stripe]
        SupabaseAdapter[Supabase Auth]
    end

    subgraph "External Services (Their Problem)"
        MobileMessage[MobileMessage API]
        Twilio[Twilio API]
        Google[Google API]
        Airtable[Airtable API]
        Postgres[(PostgreSQL)]
        Redis[(Redis)]
        Stripe[Stripe API]
        Supabase[Supabase Auth]
    end

    %% User Flow
    WebApp --> API
    MobileApp --> API
    AdminPanel --> API
    PublicSite --> API

    %% API Layer
    API --> Auth
    API --> RateLimit
    LoadBalancer --> API

    %% Core Services
    API --> UserService
    API --> DashboardService
    API --> SMSService
    API --> PluginService
    API --> BillingService

    %% Contract Layer (The Critical Missing Piece)
    UserService --> Contract
    DashboardService --> Contract
    SMSService --> Contract
    PluginService --> Contract
    BillingService --> Contract

    %% Adapter Layer
    Contract --> MobileMessageAdapter
    Contract --> TwilioAdapter
    Contract --> GoogleAdapter
    Contract --> AirtableAdapter
    Contract --> PostgresAdapter
    Contract --> CacheAdapter
    Contract --> StripeAdapter
    Contract --> SupabaseAdapter

    %% External Services
    MobileMessageAdapter --> MobileMessage
    TwilioAdapter --> Twilio
    GoogleAdapter --> Google
    AirtableAdapter --> Airtable
    PostgresAdapter --> Postgres
    CacheAdapter --> Redis
    StripeAdapter --> Stripe
    SupabaseAdapter --> Supabase
```

---

## 🔧 Plugin System Architecture (Zapier-Style)

```mermaid
graph TB
    subgraph "Your Core Services (Stable)"
        PluginService[Plugin Service]
        DashboardService[Dashboard Service]
    end
    
    subgraph "Contract Layer (THE MISSING PIECE)"
        style PluginContract fill:#ffd43b,stroke:#000,stroke-width:4px
        PluginContract[PluginAdapter Interface<br/>────────────────<br/>getSchedule<br/>getTasks<br/>validateConfig<br/>healthCheck]
    end
    
    subgraph "Adapter Layer (Swappable)"
        GoogleAdapter[Google Calendar Adapter]
        AirtableAdapter[Airtable Adapter]
        NotionAdapter[Notion Adapter]
        SlackAdapter[Slack Adapter]
        TrelloAdapter[Trello Adapter]
    end
    
    subgraph "External APIs (Their Problem)"
        GoogleAPI[Google Calendar API]
        AirtableAPI[Airtable API]
        NotionAPI[Notion API]
        SlackAPI[Slack API]
        TrelloAPI[Trello API]
    end
    
    subgraph "Standard Data Flow"
        StandardSchedule[StandardScheduleItem<br/>Your Format]
        StandardTasks[StandardTaskItem<br/>Your Format]
        PluginResponse[PluginResponse<br/>Your Envelope]
    end

    %% Service to Contract
    PluginService --> PluginContract
    DashboardService --> PluginContract
    
    %% Contract to Adapters
    PluginContract --> GoogleAdapter
    PluginContract --> AirtableAdapter
    PluginContract --> NotionAdapter
    PluginContract --> SlackAdapter
    PluginContract --> TrelloAdapter
    
    %% Adapters to External APIs
    GoogleAdapter --> GoogleAPI
    AirtableAdapter --> AirtableAPI
    NotionAdapter --> NotionAPI
    SlackAdapter --> SlackAPI
    TrelloAdapter --> TrelloAPI
    
    %% Data Transformation Flow
    GoogleAPI -.->|Transform| StandardSchedule
    AirtableAPI -.->|Transform| StandardTasks
    NotionAPI -.->|Transform| StandardSchedule
    SlackAPI -.->|Transform| StandardTasks
    TrelloAPI -.->|Transform| StandardTasks
    
    StandardSchedule --> PluginResponse
    StandardTasks --> PluginResponse
    PluginResponse --> PluginService
```

---

## 🔍 Contract Layer Details (What's INSIDE the Interfaces)

### SMSProvider Contract Fields

```mermaid
graph TB
    subgraph "SMSProvider Interface"
        SMSContract[SMSProvider Contract]
        
        subgraph "Input: SMSMessage"
            SMSMsg[SMSMessage<br/>├─ to: string<br/>├─ body: string<br/>├─ from?: string<br/>├─ metadata?: Record<br/>├─ scheduledFor?: Date<br/>├─ priority?: 'low|normal|high'<br/>└─ tags?: string[]]
        end
        
        subgraph "Output: SMSResult"
            SMSRes[SMSResult<br/>├─ success: boolean<br/>├─ messageId: string<br/>├─ provider: string<br/>├─ timestamp: string<br/>├─ cost?: number<br/>├─ error?: string<br/>├─ errorType?: enum<br/>└─ deliveryReport?: object]
        end
        
        subgraph "Methods"
            Methods[├─ send(message): Promise<SMSResult><br/>├─ getStatus(messageId): Promise<SMSStatus><br/>├─ validateConfig(): Promise<Validation><br/>└─ getHealthCheck(): Promise<Health>]
        end
    end
    
    SMSContract --> SMSMsg
    SMSContract --> SMSRes
    SMSContract --> Methods
```

### PluginAdapter Contract Fields

```mermaid
graph TB
    subgraph "PluginAdapter Interface"
        PluginContract[PluginAdapter Contract]
        
        subgraph "Standard Data Shapes"
            ScheduleItem[StandardScheduleItem<br/>├─ id: string<br/>├─ title: string<br/>├─ startTime: string (ISO 8601)<br/>├─ endTime: string (ISO 8601)<br/>├─ location?: string<br/>├─ description?: string<br/>├─ priority?: enum<br/>├─ status?: enum<br/>└─ metadata: Record]
            
            TaskItem[StandardTaskItem<br/>├─ id: string<br/>├─ title: string<br/>├─ description?: string<br/>├─ dueDate?: string (ISO 8601)<br/>├─ priority: enum<br/>├─ status: enum<br/>├─ assignee?: string<br/>├─ tags?: string[]<br/>├─ estimatedTime?: number<br/>└─ metadata: Record]
        end
        
        subgraph "Response Envelope"
            Response[PluginResponse<T><br/>├─ success: boolean<br/>├─ data: T[]<br/>├─ errors?: PluginError[]<br/>└─ metadata: PluginMetadata]
        end
        
        subgraph "Methods"
            Methods[├─ getSchedule(): Promise<PluginResponse<StandardScheduleItem>><br/>├─ getTasks(): Promise<PluginResponse<StandardTaskItem>><br/>├─ validateConfig(): Promise<Validation><br/>├─ handleWebhook?(): Promise<Response><br/>└─ healthCheck?(): Promise<Health>]
        end
    end
    
    PluginContract --> ScheduleItem
    PluginContract --> TaskItem
    PluginContract --> Response
    PluginContract --> Methods
```

---

## 🔄 SMS Fallback Flow (Resilience Pattern)

```mermaid
graph TB
    subgraph "SMS Service (Your Core)"
        SMSService[SMS Service<br/>sendDashboardLink()]
    end
    
    subgraph "Contract Layer"
        SMSManager[SMS Manager<br/>sendWithFallback()]
    end
    
    subgraph "Primary Provider"
        MobileAdapter[MobileMessage Adapter]
        MobileAPI[MobileMessage API]
    end
    
    subgraph "Fallback Provider"
        TwilioAdapter[Twilio Adapter]
        TwilioAPI[Twilio API]
    end
    
    subgraph "Fallback Logic"
        TryPrimary[Try Primary Provider]
        CheckSuccess{Success?}
        TryFallback[Try Fallback Provider]
        LogFailure[Log Failure]
        ReturnResult[Return Result]
    end
    
    subgraph "Error Handling"
        Validation[Validate Message]
        FormatPhone[Format Phone]
        CreateStandard[Create Standard SMSMessage]
        TransformResponse[Transform to Standard Result]
    end
    
    %% Flow
    SMSService --> Validation
    Validation --> FormatPhone
    FormatPhone --> CreateStandard
    CreateStandard --> SMSManager
    
    SMSManager --> TryPrimary
    TryPrimary --> MobileAdapter
    MobileAdapter --> MobileAPI
    MobileAPI -.->|API Response| TransformResponse
    TransformResponse --> CheckSuccess
    
    CheckSuccess -->|Yes| ReturnResult
    CheckSuccess -->|No| TryFallback
    
    TryFallback --> TwilioAdapter
    TwilioAdapter --> TwilioAPI
    TwilioAPI -.->|API Response| TransformResponse
    TransformResponse --> ReturnResult
    
    TryFallback -.->|Both Failed| LogFailure
    LogFailure --> ReturnResult
    
    style SMSManager fill:#ffd43b,stroke:#000,stroke-width:3px
```

---

## ⚡ Adapter Transformation Details (Inside the Black Box)

### MobileMessage Adapter Transformation

```mermaid
graph LR
    subgraph "MobileMessage Adapter"
        subgraph "Input (Your Format)"
            StandardMsg[Standard SMSMessage<br/>├─ to: "+61412345678"<br/>├─ body: "Your dashboard: ..."<br/>├─ from: "DashLink"<br/>└─ metadata: {...}]
        end
        
        subgraph "Transformation Logic"
            Validate[Validate Required Fields]
            Format[Format to MobileMessage Schema]
            Auth[Create Basic Auth Header]
            Request[Build HTTP Request]
        end
        
        subgraph "Output (Their Format)"
            MobilePayload[MobileMessage Payload<br/>├─ to: "+61412345678"<br/>├─ message: "Your dashboard: ..."<br/>└─ from: "DashLink"]
        end
        
        subgraph "Response Transformation"
            MobileResponse[MobileMessage Response<br/>├─ message_id: "msg_12345"<br/>├─ cost: 0.085<br/>└─ status: "sent"]
            
            StandardResult[Standard SMSResult<br/>├─ success: true<br/>├─ messageId: "msg_12345"<br/>├─ provider: "mobile-message"<br/>├─ timestamp: "2026-01-01T12:00:00Z"<br/>├─ cost: 0.085<br/>└─ deliveryReport: {...}]
        end
    end
    
    StandardMsg --> Validate
    Validate --> Format
    Format --> Auth
    Auth --> Request
    Request --> MobilePayload
    
    MobilePayload -.->|API Call| MobileResponse
    MobileResponse --> StandardResult
```

### Google Calendar Adapter Transformation

```mermaid
graph LR
    subgraph "Google Calendar Adapter"
        subgraph "Input (Your Request)"
            YourRequest[getSchedule()<br/>├─ workerId: "user_123"<br/>├─ dateRange: {...}<br/>└─ config: {...}]
        end
        
        subgraph "API Request Building"
            BuildURL[Build Google API URL]
            AddParams[Add Time Range & API Key]
            MakeCall[Fetch Google Calendar API]
        end
        
        subgraph "External API Response"
            GoogleResponse[Google API Response<br/>├─ items: [<br/>│  {<br/>│    id: "event_123",<br/>│    summary: "Team Meeting",<br/>│    start: { dateTime: "..." },<br/>│    end: { dateTime: "..." },<br/>│    location: "Room 1",<br/>│    description: "Weekly sync"<br/>│  }<br/>]]
        end
        
        subgraph "Transformation Logic"
            MapItems[Map Each Google Event]
            ExtractFields[Extract & Rename Fields]
            ConvertTime[Convert to ISO 8601]
            AddMetadata[Store Google-Specific Data]
        end
        
        subgraph "Output (Your Format)"
            StandardItems[StandardScheduleItem[]<br/>├─ id: "event_123"<br/>├─ title: "Team Meeting"<br/>├─ startTime: "2026-01-01T10:00:00Z"<br/>├─ endTime: "2026-01-01T11:00:00Z"<br/>├─ location: "Room 1"<br/>├─ description: "Weekly sync"<br/>├─ metadata: {<br/>│  googleEventId: "event_123",<br/>│  htmlLink: "...",<br/>│  attendees: [...]<br/>│}]
        end
    end
    
    YourRequest --> BuildURL
    BuildURL --> AddParams
    AddParams --> MakeCall
    MakeCall --> GoogleResponse
    GoogleResponse --> MapItems
    MapItems --> ExtractFields
    ExtractFields --> ConvertTime
    ConvertTime --> AddMetadata
    AddMetadata --> StandardItems
```

---

## 📱 User Journey Flow

```mermaid
journey
    title User Daily Dashboard Experience
    section Registration
      User Signs Up: 5: User
      Connects Data Sources: 4: User
      Configures Dashboard: 4: User
    section Daily Usage
      Receives SMS: 5: User
      Views Dashboard: 5: User
      Takes Action: 4: User
    section Management
      Updates Preferences: 3: User
      Adds New Plugins: 3: User
      Manages Subscription: 3: User
```

---

## 🏢 Business Model Architecture

```mermaid
graph TB
    subgraph "Revenue Streams"
        Subscriptions[Subscription Plans]
        PremiumPlugins[Premium Plugins]
        Enterprise[Enterprise Plans]
        APIUsage[API Usage Fees]
    end

    subgraph "Customer Segments"
        Individuals[Individual Users]
        SmallTeams[Small Teams]
        Enterprise[Enterprise Clients]
        Developers[API Developers]
    end

    subgraph "Value Propositions"
        DailyInsights[Daily SMS Insights]
        DataIntegration[Multi-Source Integration]
        Automation[Automated Workflows]
        Analytics[Advanced Analytics]
    end

    subgraph "Cost Structure"
        Infrastructure[Cloud Infrastructure]
        SMSCosts[SMS Delivery Costs]
        Development[Development Team]
        Support[Customer Support]
    end

    %% Revenue to Customer
    Subscriptions --> Individuals
    Subscriptions --> SmallTeams
    PremiumPlugins --> SmallTeams
    Enterprise --> Enterprise
    APIUsage --> Developers

    %% Value Delivery
    DailyInsights --> Individuals
    DataIntegration --> SmallTeams
    Automation --> Enterprise
    Analytics --> Enterprise

    %% Cost Allocation
    Infrastructure --> DailyInsights
    SMSCosts --> DailyInsights
    Development --> DataIntegration
    Support --> Enterprise
```

---

## 🔐 Security & Authentication Architecture

```mermaid
graph TB
    subgraph "Authentication Layers"
        FrontendAuth[Frontend Auth]
        APIAuth[API Authentication]
        ServiceAuth[Service-to-Service]
        ExternalAuth[External Auth]
    end

    subgraph "Security Components"
        JWT[JWT Tokens]
        OAuth[OAuth 2.0]
        MFA[Multi-Factor Auth]
        RBAC[Role-Based Access]
    end

    subgraph "Data Protection"
        Encryption[Data Encryption]
        Hashing[Password Hashing]
        Auditing[Audit Logs]
        Compliance[GDPR Compliance]
    end

    subgraph "Threat Protection"
        RateLimiting[Rate Limiting]
        InputValidation[Input Validation]
        CORS[CORS Protection]
        WAF[Web App Firewall]
    end

    %% Authentication Flow
    FrontendAuth --> JWT
    APIAuth --> OAuth
    ServiceAuth --> MFA
    ExternalAuth --> RBAC

    %% Security Measures
    JWT --> Encryption
    OAuth --> Hashing
    MFA --> Auditing
    RBAC --> Compliance

    %% Protection Layers
    Encryption --> RateLimiting
    Hashing --> InputValidation
    Auditing --> CORS
    Compliance --> WAF
```

---

## 📊 Data Flow Architecture

```mermaid
graph LR
    subgraph "Data Sources"
        UserInput[User Input]
        ExternalAPIs[External APIs]
        Webhooks[Webhooks]
        ScheduledJobs[Scheduled Jobs]
    end

    subgraph "Data Processing"
        Validation[Data Validation]
        Transformation[Data Transform]
        Enrichment[Data Enrichment]
        Aggregation[Data Aggregation]
    end

    subgraph "Data Storage"
        RawData[Raw Data Store]
        ProcessedData[Processed Data]
        Cache[Cache Layer]
        Archive[Data Archive]
    end

    subgraph "Data Consumption"
        SMSDelivery[SMS Delivery]
        DashboardAPI[Dashboard API]
        AnalyticsAPI[Analytics API]
        ExportAPI[Export API]
    end

    %% Data Pipeline
    UserInput --> Validation
    ExternalAPIs --> Transformation
    Webhooks --> Enrichment
    ScheduledJobs --> Aggregation

    Validation --> RawData
    Transformation --> ProcessedData
    Enrichment --> Cache
    Aggregation --> Archive

    RawData --> SMSDelivery
    ProcessedData --> DashboardAPI
    Cache --> AnalyticsAPI
    Archive --> ExportAPI
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DevLocal[Local Development]
        DevStaging[Dev Staging]
        DevTesting[Automated Testing]
        DevCI[CI/CD Pipeline]
    end

    subgraph "Production Environment"
        ProdFrontend[Frontend CDN]
        ProdAPI[API Servers]
        ProdWorkers[Worker Servers]
        ProdDB[Database Cluster]
    end

    subgraph "Infrastructure"
        CloudProvider[Cloud Provider]
        ContainerRegistry[Container Registry]
        LoadBalancers[Load Balancers]
        Monitoring[Monitoring Stack]
    end

    subgraph "Support Services"
        Logging[Centralized Logging]
        ErrorTracking[Error Tracking]
        Performance[Performance Monitoring]
        Backup[Backup Systems]
    end

    %% Deployment Flow
    DevCI --> ContainerRegistry
    ContainerRegistry --> CloudProvider
    CloudProvider --> ProdFrontend
    CloudProvider --> ProdAPI
    CloudProvider --> ProdWorkers
    CloudProvider --> ProdDB

    %% Infrastructure Support
    ProdFrontend --> LoadBalancers
    ProdAPI --> Monitoring
    ProdWorkers --> Logging
    ProdDB --> Backup

    %% Monitoring Integration
    Monitoring --> ErrorTracking
    Logging --> Performance
    ErrorTracking --> Backup
```

---

## 💰 Technology Stack Architecture

```mermaid
graph TB
    subgraph "Frontend Stack"
        React[React 18]
        TypeScript[TypeScript]
        Tailwind[Tailwind CSS]
        Vite[Vite Build Tool]
    end

    subgraph "Backend Stack"
        NodeJS[Node.js]
        Express[Express.js]
        PostgreSQL[PostgreSQL]
        Redis[Redis]
    end

    subgraph "Infrastructure Stack"
        Docker[Docker Containers]
        Kubernetes[Kubernetes]
        AWS[AWS Services]
        GitHub[GitHub Actions]
    end

    subgraph "Communication Stack"
        REST[REST APIs]
        GraphQL[GraphQL]
        WebSockets[WebSockets]
        MessageQueue[Message Queue]
    end

    subgraph "Monitoring Stack"
        Prometheus[Prometheus]
        Grafana[Grafana]
        Sentry[Sentry]
        LogRocket[LogRocket]
    end

    %% Technology Integration
    React --> TypeScript
    TypeScript --> Tailwind
    Tailwind --> Vite

    NodeJS --> Express
    Express --> PostgreSQL
    PostgreSQL --> Redis

    Docker --> Kubernetes
    Kubernetes --> AWS
    AWS --> GitHub

    REST --> GraphQL
    GraphQL --> WebSockets
    WebSockets --> MessageQueue

    Prometheus --> Grafana
    Grafana --> Sentry
    Sentry --> LogRocket
```

---

## 📈 Scaling Architecture

```mermaid
graph TB
    subgraph "Horizontal Scaling"
        AppServers[App Servers]
        DatabaseReplicas[Database Replicas]
        CacheCluster[Cache Cluster]
        WorkerPool[Worker Pool]
    end

    subgraph "Vertical Scaling"
        CPUScaling[CPU Scaling]
        MemoryScaling[Memory Scaling]
        StorageScaling[Storage Scaling]
        NetworkScaling[Network Scaling]
    end

    subgraph "Auto Scaling"
        TrafficMonitoring[Traffic Monitoring]
        AutoScaling[Auto Scaling Groups]
        LoadBalancing[Load Balancing]
        HealthChecks[Health Checks]
    end

    subgraph "Performance Optimization"
        CDN[Content Delivery]
        Caching[Multi-level Caching]
        DatabaseOptimization[DB Optimization]
        CodeOptimization[Code Optimization]
    end

    %% Scaling Implementation
    AppServers --> DatabaseReplicas
    DatabaseReplicas --> CacheCluster
    CacheCluster --> WorkerPool

    CPUScaling --> MemoryScaling
    MemoryScaling --> StorageScaling
    StorageScaling --> NetworkScaling

    TrafficMonitoring --> AutoScaling
    AutoScaling --> LoadBalancing
    LoadBalancing --> HealthChecks

    CDN --> Caching
    Caching --> DatabaseOptimization
    DatabaseOptimization --> CodeOptimization
```

---

## 🎯 Target User Personas

```mermaid
graph TB
    subgraph "Primary Users"
        BusinessOwner[Business Owner]
        TeamLead[Team Lead]
        DataAnalyst[Data Analyst]
    end

    subgraph "Secondary Users"
        Developer[Developer]
        Consultant[Consultant]
        Student[Student]
    end

    subgraph "User Needs"
        DailyInsights[Daily Insights]
        QuickOverview[Quick Overview]
        DataIntegration[Data Integration]
        Automation[Automation]
    end

    subgraph "User Behaviors"
        MobileFirst[Mobile-First Usage]
        SMSDriven[SMS-Driven]
        TimeSensitive[Time-Sensitive]
        ActionOriented[Action-Oriented]
    end

    %% Persona Mapping
    BusinessOwner --> DailyInsights
    TeamLead --> QuickOverview
    DataAnalyst --> DataIntegration
    Developer --> Automation

    DailyInsights --> MobileFirst
    QuickOverview --> SMSDriven
    DataIntegration --> TimeSensitive
    Automation --> ActionOriented
```

---

## 🔄 Development Workflow Architecture

```mermaid
graph LR
    subgraph "Planning"
        Requirements[Requirements]
        Design[Design]
        Architecture[Architecture]
        Planning[Planning]
    end

    subgraph "Development"
        Coding[Coding]
        Testing[Unit Testing]
        Integration[Integration Testing]
        CodeReview[Code Review]
    end

    subgraph "Deployment"
        Build[Build Process]
        Staging[Staging Deploy]
        Production[Production Deploy]
        Monitoring[Monitoring]
    end

    subgraph "Maintenance"
        BugFixes[Bug Fixes]
        Features[New Features]
        Updates[Updates]
        Support[Support]
    end

    %% Workflow Flow
    Requirements --> Design
    Design --> Architecture
    Architecture --> Planning
    Planning --> Coding

    Coding --> Testing
    Testing --> Integration
    Integration --> CodeReview
    CodeReview --> Build

    Build --> Staging
    Staging --> Production
    Production --> Monitoring

    Monitoring --> BugFixes
    BugFixes --> Features
    Features --> Updates
    Updates --> Support
```

---

## 📊 Analytics & Metrics Architecture

```mermaid
graph TB
    subgraph "Data Collection"
        UserEvents[User Events]
        SystemMetrics[System Metrics]
        BusinessMetrics[Business Metrics]
        ExternalData[External Data]
    end

    subgraph "Data Processing"
        RealTime[Real-time Processing]
        BatchProcessing[Batch Processing]
        DataCleaning[Data Cleaning]
        DataAggregation[Data Aggregation]
    end

    subgraph "Data Storage"
        TimeSeries[Time Series DB]
        DataWarehouse[Data Warehouse]
        SearchIndex[Search Index]
        Cache[Analytics Cache]
    end

    subgraph "Data Visualization"
        Dashboards[Analytics Dashboards]
        Reports[Automated Reports]
        Alerts[Alerting System]
        API[Analytics API]
    end

    %% Analytics Pipeline
    UserEvents --> RealTime
    SystemMetrics --> BatchProcessing
    BusinessMetrics --> DataCleaning
    ExternalData --> DataAggregation

    RealTime --> TimeSeries
    BatchProcessing --> DataWarehouse
    DataCleaning --> SearchIndex
    DataAggregation --> Cache

    TimeSeries --> Dashboards
    DataWarehouse --> Reports
    SearchIndex --> Alerts
    Cache --> API
```

---

## 🎉 Conclusion

This comprehensive architecture blueprint provides a complete view of the CleanConnect system from multiple perspectives:

- **For Developers**: Technical implementation details and system interactions
- **For Investors**: Business model, scalability, and revenue potential
- **For Users**: Value proposition and user journey understanding

The system is designed with enterprise-grade scalability, security, and maintainability in mind, following Zapier-level development standards for a robust multi-tenant SaaS platform.
