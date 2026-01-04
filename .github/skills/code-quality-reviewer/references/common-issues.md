# Common Code Issues and Antipatterns

## TypeScript Antipatterns

### Using `any`
```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
interface DataShape {
  value: string;
}
function processData(data: DataShape) {
  return data.value;
}

// ✅ Better (if truly unknown)
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data shape');
}
```

### Missing Return Types
```typescript
// ❌ Bad
async function getWorkers() {
  return await db.from('workers').select();
}

// ✅ Good
async function getWorkers(): Promise<Worker[]> {
  return await db.from('workers').select();
}
```

### Type Assertions Without Validation
```typescript
// ❌ Bad
const data = await response.json() as Worker;

// ✅ Good
const rawData = await response.json();
const data = WorkerSchema.parse(rawData); // Zod validation
```

## React Antipatterns

### Missing Loading/Error States
```typescript
// ❌ Bad
export const WorkerList = () => {
  const { data } = useWorkers();
  return <div>{data.map(w => <WorkerCard worker={w} />)}</div>;
};

// ✅ Good
export const WorkerList: React.FC = () => {
  const { data, isLoading, error } = useWorkers();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;
  
  return (
    <div className="space-y-4">
      {data.map(worker => (
        <WorkerCard key={worker.id} worker={worker} />
      ))}
    </div>
  );
};
```

### Missing Keys
```typescript
// ❌ Bad
{workers.map((worker, index) => (
  <WorkerCard key={index} worker={worker} />
))}

// ✅ Good
{workers.map(worker => (
  <WorkerCard key={worker.id} worker={worker} />
))}
```

### Inline Objects in Render
```typescript
// ❌ Bad - Creates new object every render
<Button onClick={() => handleClick()} style={{ color: 'blue' }}>
  Click
</Button>

// ✅ Good
const handleButtonClick = useCallback(() => {
  handleClick();
}, []);

const buttonStyle = { color: 'blue' };

<Button onClick={handleButtonClick} style={buttonStyle}>
  Click
</Button>
```

### Incorrect Hook Dependencies
```typescript
// ❌ Bad - Missing dependency
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Also Good - For functions
const fetchData = useCallback((id: string) => {
  // fetch logic
}, []);

useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);
```

## API Route Antipatterns

### No Error Handling
```typescript
// ❌ Bad
router.post('/workers', async (c) => {
  const body = await c.req.json();
  const worker = await service.createWorker(body);
  return c.json(worker);
});

// ✅ Good
router.post('/workers', validateBody(CreateWorkerSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');
    const worker = await service.createWorker(body, organizationId);
    return c.json({ success: true, data: worker }, 201);
  } catch (error) {
    console.error('Create worker error:', error);
    return c.json(
      { success: false, error: 'Failed to create worker' },
      500
    );
  }
});
```

### Missing Validation
```typescript
// ❌ Bad - No validation
router.post('/workers', async (c) => {
  const body = await c.req.json();
  // Use body directly
});

// ✅ Good - With schema validation
const CreateWorkerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+61\d{9}$/),
  email: z.string().email().optional(),
});

router.post('/workers', validateBody(CreateWorkerSchema), async (c) => {
  const body = c.req.valid('json'); // Type-safe and validated
  // Use body
});
```

### Missing Organization Isolation
```typescript
// ❌ Bad - Cross-org data leak
router.get('/workers', async (c) => {
  const workers = await db.from('workers').select();
  return c.json(workers);
});

// ✅ Good - Organization isolation
router.use(authMiddleware); // Sets organizationId in context

router.get('/workers', async (c) => {
  const organizationId = c.get('organizationId');
  const workers = await db
    .from('workers')
    .select()
    .eq('organization_id', organizationId);
  return c.json(workers);
});
```

## Architecture Antipatterns

### Business Logic in UI
```typescript
// ❌ Bad - Complex logic in component
export const SendSMSButton = ({ workerId }) => {
  const handleClick = async () => {
    const worker = await fetch(`/api/workers/${workerId}`).then(r => r.json());
    const dashboard = await fetch(`/api/dashboard/${workerId}`).then(r => r.json());
    const token = generateToken(workerId);
    const message = `Your dashboard: https://app.com/d/${token}`;
    await fetch('https://mobilemessage.com/send', {
      method: 'POST',
      body: JSON.stringify({ to: worker.phone, message })
    });
  };
  
  return <Button onClick={handleClick}>Send SMS</Button>;
};

// ✅ Good - Logic in service layer
// Component
export const SendSMSButton = ({ workerId }) => {
  const mutation = useSendDashboardSMS();
  
  const handleClick = () => {
    mutation.mutate(workerId);
  };
  
  return (
    <Button 
      onClick={handleClick}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Sending...' : 'Send SMS'}
    </Button>
  );
};

// Service layer
export class DashboardSMSService {
  async sendDashboard(workerId: string): Promise<void> {
    const worker = await this.workerService.getWorker(workerId);
    const dashboard = await this.dashboardService.getDashboard(workerId);
    const token = this.tokenService.generate(workerId);
    const message = this.messageBuilder.build(token);
    await this.smsAdapter.send(worker.phone, message);
  }
}
```

### Direct External API Calls (Violates Zapier Pattern)
```typescript
// ❌ Bad - Service directly calls external API
export class DashboardService {
  async sendSMS(phone: string, message: string) {
    // Direct call to MobileMessage API
    await fetch('https://mobilemessage.com/api/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.SMS_API_KEY}` },
      body: JSON.stringify({ to: phone, text: message })
    });
  }
}

// ✅ Good - Adapter pattern
// Contract
interface SMSProvider {
  send(phone: string, message: string): Promise<void>;
}

// Adapter
export class MobileMessageAdapter implements SMSProvider {
  async send(phone: string, message: string): Promise<void> {
    await fetch('https://mobilemessage.com/api/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ to: phone, text: message })
    });
  }
}

// Service
export class DashboardService {
  constructor(private smsProvider: SMSProvider) {}
  
  async sendSMS(phone: string, message: string) {
    await this.smsProvider.send(phone, message); // Uses contract
  }
}
```

## Security Antipatterns

### Hardcoded Secrets
```typescript
// ❌ Bad
const API_KEY = 'sk_live_abc123xyz';

// ✅ Good
const API_KEY = process.env.SMS_API_KEY;
if (!API_KEY) throw new Error('SMS_API_KEY not configured');
```

### SQL Injection Risk
```typescript
// ❌ Bad (if using raw SQL)
const query = `SELECT * FROM workers WHERE name = '${userName}'`;

// ✅ Good - Use query builders or parameterized queries
const workers = await db
  .from('workers')
  .select()
  .eq('name', userName);
```

### Missing Input Validation
```typescript
// ❌ Bad
router.post('/workers', async (c) => {
  const { phone } = await c.req.json();
  await service.createWorker({ phone }); // No validation
});

// ✅ Good
const CreateWorkerSchema = z.object({
  phone: z.string().regex(/^\+61\d{9}$/, 'Invalid Australian phone number'),
});

router.post('/workers', validateBody(CreateWorkerSchema), async (c) => {
  const { phone } = c.req.valid('json');
  await service.createWorker({ phone });
});
```

## Performance Antipatterns

### N+1 Query Problem
```typescript
// ❌ Bad
const workers = await db.from('workers').select();
for (const worker of workers) {
  worker.schedules = await db
    .from('schedules')
    .select()
    .eq('worker_id', worker.id);
}

// ✅ Good - Single query with join
const workers = await db
  .from('workers')
  .select('*, schedules(*)')
  .eq('organization_id', organizationId);
```

### Missing Memoization
```typescript
// ❌ Bad - Recalculates every render
const WorkerList = ({ workers }) => {
  const sortedWorkers = workers.sort((a, b) => a.name.localeCompare(b.name));
  return <div>{sortedWorkers.map(...)}</div>;
};

// ✅ Good
const WorkerList = ({ workers }) => {
  const sortedWorkers = useMemo(
    () => workers.sort((a, b) => a.name.localeCompare(b.name)),
    [workers]
  );
  return <div>{sortedWorkers.map(...)}</div>;
};
```

### No Pagination
```typescript
// ❌ Bad - Loads all records
router.get('/workers', async (c) => {
  const workers = await db.from('workers').select();
  return c.json(workers);
});

// ✅ Good - With pagination
router.get('/workers', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;
  
  const workers = await db
    .from('workers')
    .select()
    .range(offset, offset + limit - 1);
    
  return c.json({ data: workers, page, limit });
});
```

## Testing Antipatterns

### No Tests for Critical Paths
```typescript
// ❌ Bad - No tests for authentication
export function generateToken(workerId: string): string {
  return jwt.sign({ workerId }, SECRET_KEY, { expiresIn: '24h' });
}

// ✅ Good - Tests for critical security function
describe('generateToken', () => {
  it('should generate valid JWT token', () => {
    const token = generateToken('worker_123');
    const decoded = jwt.verify(token, SECRET_KEY);
    expect(decoded.workerId).toBe('worker_123');
  });
  
  it('should expire after 24 hours', () => {
    const token = generateToken('worker_123');
    const decoded = jwt.verify(token, SECRET_KEY);
    const expiryTime = decoded.exp * 1000;
    const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
    expect(expiryTime).toBeCloseTo(expectedExpiry, -3);
  });
});
```

### Tests Depend on Each Other
```typescript
// ❌ Bad - Tests share state
let testWorker;

test('creates worker', async () => {
  testWorker = await service.createWorker({ name: 'Test' });
  expect(testWorker.id).toBeDefined();
});

test('updates worker', async () => {
  await service.updateWorker(testWorker.id, { name: 'Updated' });
  // Fails if first test fails
});

// ✅ Good - Independent tests
test('creates worker', async () => {
  const worker = await service.createWorker({ name: 'Test' });
  expect(worker.id).toBeDefined();
});

test('updates worker', async () => {
  // Create fresh worker for this test
  const worker = await service.createWorker({ name: 'Test' });
  await service.updateWorker(worker.id, { name: 'Updated' });
  const updated = await service.getWorker(worker.id);
  expect(updated.name).toBe('Updated');
});
```
