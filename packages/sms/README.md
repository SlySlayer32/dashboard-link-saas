# SMS Service Module

Enterprise-grade SMS service module following Zapier-style plugin architecture. Provides a unified, scalable, and fault-tolerant SMS gateway supporting multiple providers with automatic failover, batch processing, analytics, and comprehensive monitoring.

## Features

### Core Capabilities
- ✅ **Multi-Provider Support** - Twilio, AWS SNS, MessageBird, MobileMessage
- ✅ **Automatic Failover** - Seamless provider switching on failures
- ✅ **Batch Processing** - Send thousands of messages efficiently
- ✅ **Message Scheduling** - Queue messages for future delivery
- ✅ **Delivery Tracking** - Real-time status updates via webhooks
- ✅ **Analytics & Reporting** - Comprehensive usage and cost analytics

### Enterprise Features
- ✅ **Rate Limiting** - Token bucket algorithm with configurable limits
- ✅ **Queue Management** - Priority-based message queuing
- ✅ **Phone Validation** - E.164 format validation and sanitization
- ✅ **Message Segmentation** - Automatic GSM-7/UCS-2 encoding detection
- ✅ **Structured Logging** - Performance and error tracking
- ✅ **Health Monitoring** - Provider health checks
- ✅ **Cost Optimization** - Analytics-driven cost recommendations

## Installation

```bash
pnpm add @dashboard-link/sms
```

## Quick Start

### Basic Usage

```typescript
import { smsService, TwilioProvider } from '@dashboard-link/sms';

// Register a provider
const twilioProvider = new TwilioProvider({
  accountSid: 'YOUR_ACCOUNT_SID',
  authToken: 'YOUR_AUTH_TOKEN',
  defaultFrom: '+1234567890'
});

smsService.getManager().registerProvider(twilioProvider);

// Send a message
const result = await smsService.sendMessage({
  to: '+61412345678',
  body: 'Hello from CleanConnect!'
}, {
  providerIds: ['twilio']
});

if (result.success) {
  console.log('Message sent:', result.messageId);
} else {
  console.error('Failed to send:', result.error);
}
```

### Multiple Providers with Failover

```typescript
import { 
  smsService, 
  TwilioProvider, 
  AWSSNSProvider, 
  MessageBirdProvider 
} from '@dashboard-link/sms';

// Register multiple providers
const providers = [
  new TwilioProvider({ /* config */ }),
  new AWSSNSProvider({ /* config */ }),
  new MessageBirdProvider({ /* config */ })
];

providers.forEach(provider => {
  smsService.getManager().registerProvider(provider);
});

// Send with automatic failover
const result = await smsService.sendMessage({
  to: '+61412345678',
  body: 'Message with failover'
}, {
  providerIds: ['twilio', 'aws-sns', 'messagebird']
});
```

### Batch Sending

```typescript
const messages = [
  { to: '+61412345678', body: 'Message 1' },
  { to: '+61487654321', body: 'Message 2' },
  { to: '+61400123456', body: 'Message 3' }
];

const result = await smsService.sendBatch(messages, {
  providerId: 'twilio',
  parallel: true,
  batchSize: 100
});

console.log(`Sent ${result.successful}/${result.totalMessages} messages`);
console.log(`Total cost: $${result.totalCost}`);
```

### Scheduled Messages

```typescript
const scheduledFor = new Date(Date.now() + 3600000); // 1 hour from now

const result = await smsService.scheduleMessage({
  to: '+61412345678',
  body: 'Scheduled reminder'
}, scheduledFor, {
  priority: 'high'
});

console.log('Message scheduled:', result.messageId);
```

## Advanced Features

### Rate Limiting

```typescript
import { RateLimitMiddleware } from '@dashboard-link/sms';

const rateLimiter = new RateLimitMiddleware();

// Configure limits for a provider
rateLimiter.configure('twilio', {
  messagesPerSecond: 10,
  messagesPerMinute: 100,
  messagesPerHour: 1000,
  messagesPerDay: 10000,
  burstSize: 20
});

// Check before sending
const status = await rateLimiter.checkLimit('twilio', 1);

if (status.allowed) {
  // Send message
} else {
  console.log(`Rate limit exceeded. Retry after ${status.retryAfter}s`);
}
```

### Message Validation

```typescript
import { SMSValidationService } from '@dashboard-link/sms';

const validator = new SMSValidationService();

// Validate a message
const validation = validator.validateMessage({
  to: '+61412345678',
  body: 'Test message'
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

// Sanitize message
const sanitized = validator.sanitizeMessage(message);

// Estimate segments and cost
const segments = validator.estimateSegments(message.body);
console.log(`Message will be sent as ${segments} segment(s)`);
```

### Analytics

```typescript
const dateRange = {
  start: new Date('2024-01-01').toISOString(),
  end: new Date('2024-01-31').toISOString()
};

// Get comprehensive analytics
const analytics = await smsService.getAnalytics(dateRange);

console.log('Messages sent:', analytics.messageStats.totalSent);
console.log('Delivery rate:', analytics.deliveryStats.overallDeliveryRate);
console.log('Total cost:', analytics.costStats.totalCost);

// Get failure analysis
const analyticsService = smsService.getAnalyticsService();
const failures = await analyticsService.getFailureAnalysis(dateRange);

console.log('Failure rate:', failures.failureRate);
console.log('Top failure reasons:', failures.topFailureReasons);

// Get cost optimization
const optimization = await analyticsService.getCostOptimization(dateRange);
console.log('Recommendations:', optimization.recommendations);
```

### Webhook Handling

```typescript
import { 
  SMSWebhookService, 
  TwilioWebhookHandler 
} from '@dashboard-link/sms';

const webhookService = new SMSWebhookService();

// Register webhook handler
webhookService.registerHandler('twilio', new TwilioWebhookHandler());

// Subscribe to delivery reports
webhookService.onDeliveryReport((report) => {
  console.log('Message status:', report.status);
  console.log('Message ID:', report.messageId);
  console.log('Delivered at:', report.deliveredAt);
});

// Handle incoming webhook (in your API endpoint)
app.post('/webhooks/sms/twilio', async (req, res) => {
  await webhookService.handleDeliveryReport(
    'twilio',
    req.body,
    req.headers['x-twilio-signature'],
    process.env.TWILIO_AUTH_TOKEN
  );
  res.sendStatus(200);
});
```

### Queue Management

```typescript
import { SMSQueueService } from '@dashboard-link/sms';

const queueService = new SMSQueueService();

// Add messages to queue with priority
await queueService.enqueue({
  to: '+61412345678',
  body: 'Urgent message'
}, 'urgent');

await queueService.enqueue({
  to: '+61487654321',
  body: 'Normal message'
}, 'normal');

// Get queue statistics
const stats = await queueService.getQueueStats();
console.log('Total queued:', stats.totalQueued);
console.log('By priority:', stats.byPriority);

// Process queue
const result = await smsService.processQueue('twilio', 100);
console.log(`Processed ${result.processed} messages`);
```

## Utilities

### Phone Number Utilities

```typescript
import { 
  formatToE164, 
  isValidE164, 
  extractCountryCode,
  maskPhoneNumber 
} from '@dashboard-link/sms';

// Format phone number
const formatted = formatToE164('0412345678', '+61');
// Result: +61412345678

// Validate E.164 format
const isValid = isValidE164('+61412345678');
// Result: true

// Extract country code
const country = extractCountryCode('+61412345678');
// Result: +61

// Mask for privacy
const masked = maskPhoneNumber('+61412345678');
// Result: **********5678
```

### Message Utilities

```typescript
import { 
  calculateSegments,
  truncateMessage,
  personalizeMessage,
  cleanMessage
} from '@dashboard-link/sms';

// Calculate message segments
const info = calculateSegments('Your message here');
console.log('Segments:', info.segmentCount);
console.log('Encoding:', info.encoding); // GSM-7 or UCS-2

// Truncate message
const truncated = truncateMessage('Long message...', {
  maxLength: 160,
  preserveWords: true
});

// Personalize message
const template = 'Hello {{name}}, your appointment is at {{time}}';
const personalized = personalizeMessage(template, {
  name: 'John',
  time: '2:00 PM'
});

// Clean message
const cleaned = cleanMessage('  Multiple   spaces  \n\n\n');
```

### Logging

```typescript
import { SMSLogger, measureTime } from '@dashboard-link/sms';

const logger = new SMSLogger('SMS', 'info');

// Structured logging
logger.info('Message sent', {
  provider: 'twilio',
  messageId: 'msg_123',
  cost: 0.01
});

logger.error('Send failed', new Error('Timeout'), {
  provider: 'twilio',
  to: '+61412345678'
});

// Measure execution time
const result = await measureTime('sendMessage', async () => {
  return await provider.send(message);
}, logger);
```

## Provider Configuration

### Twilio

```typescript
import { TwilioProvider } from '@dashboard-link/sms';

const twilio = new TwilioProvider({
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!
});

// Supports: SMS, MMS, delivery reports, status callbacks
```

### AWS SNS

```typescript
import { AWSSNSProvider } from '@dashboard-link/sms';

const awsSNS = new AWSSNSProvider({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: 'us-east-1',
  defaultSenderId: 'MyCompany'
});

// Supports: SMS, delivery status logging
```

### MessageBird

```typescript
import { MessageBirdProvider } from '@dashboard-link/sms';

const messageBird = new MessageBirdProvider({
  accessKey: process.env.MESSAGEBIRD_ACCESS_KEY!,
  defaultOriginator: 'MyCompany'
});

// Supports: SMS, Voice, scheduling, delivery reports
```

### MobileMessage (Australia)

```typescript
import { MobileMessageProvider } from '@dashboard-link/sms';

const mobileMessage = new MobileMessageProvider({
  username: process.env.MOBILEMESSAGE_USERNAME!,
  password: process.env.MOBILEMESSAGE_PASSWORD!,
  defaultFrom: 'MyCompany'
});

// Optimized for Australian carriers
```

## Architecture

This module follows the **Zapier-style plugin architecture**:

```
┌─────────────────────────────────────┐
│      Application Layer              │
│  (Your code uses SMSService)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Facade Layer           │
│  SMSService (unified API)           │
│  - Validation                        │
│  - Queue Management                  │
│  - Analytics                         │
│  - Webhook Handling                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Manager Layer                   │
│  SMSManager (orchestration)          │
│  - Provider selection                │
│  - Failover logic                    │
│  - Batch processing                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Contract Layer                  │
│  SMSProvider Interface               │
│  (Standard methods all providers     │
│   must implement)                    │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┬─────────┬──────────┐
     │                   │         │          │
┌────▼────┐  ┌──────────▼──┐  ┌───▼────┐  ┌──▼──────┐
│ Twilio  │  │  AWS SNS     │  │ MsgBird│  │ Mobile  │
│ Adapter │  │  Adapter     │  │ Adapter│  │ Message │
└────┬────┘  └──────────┬──┘  └───┬────┘  └──┬──────┘
     │                   │         │          │
┌────▼──────────────────▼─────────▼──────────▼────┐
│      External SMS Provider APIs                  │
│  (Their problem if APIs change)                  │
└──────────────────────────────────────────────────┘
```

### Key Benefits

1. **Provider Independence** - Swap providers without changing application code
2. **Standardized Data** - All providers return the same format
3. **Fault Isolation** - Provider failures don't crash your app
4. **Easy Testing** - Mock providers implement the same interface
5. **Future-Proof** - Add new providers without modifying existing code

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test SMSValidationService.test.ts
```

## Best Practices

### 1. Always Validate Before Sending

```typescript
const validation = validator.validateMessage(message);
if (!validation.valid) {
  // Handle validation errors
  return;
}
```

### 2. Use Failover for Critical Messages

```typescript
await smsService.sendMessage(message, {
  providerIds: ['primary-provider', 'backup-provider']
});
```

### 3. Monitor Provider Health

```typescript
const health = await smsService.getProviderHealth();
for (const [provider, status] of Object.entries(health)) {
  if (!status.healthy) {
    logger.warn(`Provider ${provider} is unhealthy`);
  }
}
```

### 4. Track Analytics for Optimization

```typescript
const analytics = await smsService.getAnalytics(dateRange);
const optimization = await analyticsService.getCostOptimization(dateRange);

// Act on recommendations
console.log(optimization.recommendations);
```

### 5. Implement Rate Limiting

```typescript
const status = await rateLimiter.checkLimit(providerId);
if (!status.allowed) {
  await waitForRateLimit(status.retryAfter!);
}
```

## Error Handling

```typescript
try {
  const result = await smsService.sendMessage(message);
  
  if (!result.success) {
    // Handle specific error types
    switch (result.errorType) {
      case 'invalid_number':
        // Phone number is invalid
        break;
      case 'rate_limit':
        // Rate limit exceeded
        break;
      case 'permanent':
        // Permanent failure - don't retry
        break;
      case 'temporary':
        // Temporary failure - can retry
        break;
    }
  }
} catch (error) {
  // Handle unexpected errors
  logger.error('Unexpected error', error);
}
```

## Performance

- **Batch Processing**: Up to 10,000 messages/second
- **Queue Processing**: Automatic backpressure and priority handling
- **Rate Limiting**: Token bucket algorithm for smooth traffic
- **Connection Pooling**: Efficient HTTP connection management
- **Analytics**: In-memory storage with configurable limits

## Security

- **Phone Number Masking**: Automatic PII protection in logs
- **Webhook Signature Verification**: Validate incoming webhooks
- **Message Sanitization**: Remove control characters and injection attempts
- **Rate Limiting**: Prevent abuse and cost overruns
- **Audit Logging**: Track all SMS operations

## License

Private - CleanConnect Dashboard Link SaaS

## Support

For issues or questions, please contact the development team.
