import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { identifyResponseSchema } from '@soundseeker/shared';
import { MockRecognitionProvider } from './providers/mock-provider.js';
import type { RecognitionProvider } from './providers/recognition-provider.js';
import { DailyQuota, GuardedRecognitionProvider } from './guards.js';

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const acceptedMimeTypes = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/ogg',
]);

export async function buildApp({
  provider = new MockRecognitionProvider(),
  allowedOrigin = 'http://localhost:5173',
  perIpDailyLimit = 20,
  globalDailyLimit = 200,
}: {
  provider?: RecognitionProvider;
  allowedOrigin?: string;
  perIpDailyLimit?: number;
  globalDailyLimit?: number;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const guardedProvider = new GuardedRecognitionProvider(
    provider,
    new DailyQuota(globalDailyLimit),
  );

  await app.register(cors, { origin: allowedOrigin });
  await app.register(rateLimit, { global: false });
  await app.register(multipart, {
    limits: { fileSize: MAX_AUDIO_BYTES, files: 1, fields: 0, parts: 1 },
  });

  app.get('/api/health', async () => ({ status: 'ok' }));
  app.post(
    '/api/identify',
    { config: { rateLimit: { max: perIpDailyLimit, timeWindow: '1 day' } } },
    async (request, reply) => {
      const upload = await request.file();
      if (!upload)
        return reply.code(400).send({ status: 'error', message: 'Please attach an audio sample.' });
      if (!acceptedMimeTypes.has(upload.mimetype)) {
        return reply.code(415).send({
          status: 'error',
          message: 'This audio format is not supported. Please try another browser.',
        });
      }
      const audio = await upload.toBuffer();
      return reply.send(
        identifyResponseSchema.parse(await guardedProvider.identify(audio, upload.mimetype)),
      );
    },
  );

  app.setErrorHandler((error, _request, reply) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 429
    )
      return reply.code(429).send({
        status: 'error',
        message: 'You’ve reached today’s listening limit. Please try again tomorrow.',
      });
    if (error instanceof app.multipartErrors.RequestFileTooLargeError) {
      return reply
        .code(413)
        .send({ status: 'error', message: 'That recording is too large. Please try again.' });
    }
    app.log.error({ err: error }, 'Request failed');
    return reply
      .code(500)
      .send({ status: 'error', message: 'Something went wrong. Please try again.' });
  });
  return app;
}
