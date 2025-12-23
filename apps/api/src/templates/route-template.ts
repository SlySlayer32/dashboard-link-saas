import {
    CreateWorkerSchema,
    UpdateWorkerBody,
    WorkerQuerySchema,
    logger,
    type HonoEnv,
    type TypedContext
} from '@dashboard-link/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '../middleware/auth';
import { requestId } from '../middleware/request-id';

// Create a new Hono app with typed environment
const app = new Hono<{ Variables: HonoEnv['Variables'] }>();

// Apply global middleware
app.use('*', requestId); // Add request ID for tracing
app.use('*', authMiddleware); // Require authentication

// GET /workers - List workers with pagination and filtering
app.get(
  '/workers',
  zValidator('query', WorkerQuerySchema),
  async (c: TypedContext) => {
    const query = c.req.valid('query');
    const requestLogger = logger.child({
      requestId: c.get('requestId'),
      userId: c.get('userId'),
      organizationId: c.get('organizationId')
    });

    try {
      requestLogger.info('Fetching workers', { query });

      // Business logic here
      const result = await getWorkers(query);

      requestLogger.info('Successfully fetched workers', { 
        count: result.data.length,
        total: result.pagination?.total 
      });

      return c.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      requestLogger.error('Failed to fetch workers', error as Error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch workers',
        cause: error 
      });
    }
  }
);

// POST /workers - Create a new worker
app.post(
  '/workers',
  zValidator('json', CreateWorkerSchema),
  async (c: TypedContext) => {
    const data = c.req.valid('json');
    const requestLogger = logger.child({
      requestId: c.get('requestId'),
      userId: c.get('userId'),
      organizationId: c.get('organizationId')
    });

    try {
      requestLogger.info('Creating worker', { data });

      // Add organization_id from context
      const workerData = {
        ...data,
        organization_id: c.get('organizationId')
      };

      const result = await createWorker(workerData);

      requestLogger.info('Successfully created worker', { workerId: result.id });

      return c.json({
        success: true,
        data: result
      }, 201);
    } catch (error) {
      requestLogger.error('Failed to create worker', error as Error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new HTTPException(409, { 
          message: 'Worker with this email already exists' 
        });
      }

      throw new HTTPException(500, { 
        message: 'Failed to create worker',
        cause: error 
      });
    }
  }
);

// GET /workers/:id - Get a specific worker
app.get(
  '/workers/:id',
  async (c: TypedContext) => {
    const id = c.req.param('id');
    const requestLogger = logger.child({
      requestId: c.get('requestId'),
      userId: c.get('userId'),
      organizationId: c.get('organizationId')
    });

    try {
      requestLogger.info('Fetching worker', { workerId: id });

      const result = await getWorkerById(id, c.get('organizationId'));

      if (!result) {
        throw new HTTPException(404, { 
          message: 'Worker not found' 
        });
      }

      requestLogger.info('Successfully fetched worker', { workerId: id });

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      requestLogger.error('Failed to fetch worker', error as Error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch worker',
        cause: error 
      });
    }
  }
);

// PUT /workers/:id - Update a worker
app.put(
  '/workers/:id',
  zValidator('json', CreateWorkerSchema.partial()),
  async (c: TypedContext) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const requestLogger = logger.child({
      requestId: c.get('requestId'),
      userId: c.get('userId'),
      organizationId: c.get('organizationId')
    });

    try {
      requestLogger.info('Updating worker', { workerId: id, data });

      const result = await updateWorker(id, data, c.get('organizationId'));

      if (!result) {
        throw new HTTPException(404, { 
          message: 'Worker not found' 
        });
      }

      requestLogger.info('Successfully updated worker', { workerId: id });

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      requestLogger.error('Failed to update worker', error as Error);
      throw new HTTPException(500, { 
        message: 'Failed to update worker',
        cause: error 
      });
    }
  }
);

// DELETE /workers/:id - Delete a worker
app.delete(
  '/workers/:id',
  async (c: TypedContext) => {
    const id = c.req.param('id');
    const requestLogger = logger.child({
      requestId: c.get('requestId'),
      userId: c.get('userId'),
      organizationId: c.get('organizationId')
    });

    try {
      requestLogger.info('Deleting worker', { workerId: id });

      const success = await deleteWorker(id, c.get('organizationId'));

      if (!success) {
        throw new HTTPException(404, { 
          message: 'Worker not found' 
        });
      }

      requestLogger.info('Successfully deleted worker', { workerId: id });

      return c.json({
        success: true,
        data: { id }
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      requestLogger.error('Failed to delete worker', error as Error);
      throw new HTTPException(500, { 
        message: 'Failed to delete worker',
        cause: error 
      });
    }
  }
);

// Example business logic functions (to be implemented)
async function getWorkers(query: WorkerQuerySchema) {
  // TODO: Implement database query
  return {
    data: [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: 0
    }
  };
}

export async function getWorkerById(_id: string, _organizationId: string) {
  // TODO: Implement database query
  return null;
}

async function createWorker(data: CreateWorkerSchema) {
  // TODO: Implement database insertion
  return {
    id: 'temp-id',
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function updateWorker(_id: string, _data: UpdateWorkerBody, _organizationId: string) {
  // TODO: Implement database update
  return null;
}

export async function deleteWorker(_id: string, _organizationId: string) {
  // TODO: Implement database deletion
  return false;
}

export default app;
