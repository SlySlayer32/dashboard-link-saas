import { Context as HonoContext } from 'hono';

export type Context = HonoContext<{
  Variables: {
    user: unknown;
    userId: string;
  };
}>;
