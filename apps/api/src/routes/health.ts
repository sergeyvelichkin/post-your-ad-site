import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  environment: z.enum(['development', 'test', 'production'])
});

export const registerHealthRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/', () =>
    healthResponseSchema.parse({
      status: 'ok',
      uptime: process.uptime(),
      environment: env.NODE_ENV
    })
  );

  done();
};
