import { Context as HonoContext } from 'hono';

export type Context = HonoContext<{
  Variables: {
    user: any;
    userId: string;
  };
}>;
