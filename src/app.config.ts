import * as dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  mongoUrl: process.env.MONGO_URL,
  port: process.env.PORT,
  valkeyUrl: process.env.VALKEY_URL,
  valkeyHost: process.env.VALKEY_HOST,
  valkeyPort: Number(process.env.VALKEY_PORT ?? 6379),
};
