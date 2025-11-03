import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerBoardRoutes } from './routes/boards.js';

export const buildServer = (): FastifyInstance => {
  const server = Fastify({
    logger: {
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
      level: env.NODE_ENV === 'development' ? 'debug' : 'info'
    }
  }).withTypeProvider<ZodTypeProvider>();

  void server.register(cors, {
    origin: env.WEB_ORIGIN ?? true,
    credentials: true
  });

  void server.register(websocket);
  void server.register(registerHealthRoutes, { prefix: '/health' });
  void server.register(registerBoardRoutes, { prefix: '/api' });

  return server;
};

if (env.NODE_ENV !== 'test') {
  const server = buildServer();

  server
    .listen({ port: env.PORT, host: '0.0.0.0' })
    .then((address) => {
      server.log.info(`🚀 API server ready at ${address}`);
    })
    .catch((error) => {
      server.log.error(error, 'Failed to start server');
      process.exit(1);
    });
}
