import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { buildApp } from './app.js';
import { readConfig } from './config.js';
import { AcrCloudProvider } from './providers/acrcloud-provider.js';

loadEnv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const config = readConfig();
const app = await buildApp({
  allowedOrigin: config.ALLOWED_ORIGIN,
  perIpDailyLimit: config.PER_IP_DAILY_LIMIT,
  globalDailyLimit: config.GLOBAL_DAILY_LIMIT,
  provider: new AcrCloudProvider({
    host: config.ACRCLOUD_HOST,
    accessKey: config.ACRCLOUD_ACCESS_KEY,
    accessSecret: config.ACRCLOUD_ACCESS_SECRET,
  }),
});
const port = config.PORT;

try {
  await app.listen({ host: '0.0.0.0', port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
