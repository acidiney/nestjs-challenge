import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  // eslint-disable-next-line no-console
  console.warn('MONGO_URL not set; test DB setup will be skipped');
}

beforeAll(async () => {
  if (!mongoUrl) return;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUrl);
  }
});

beforeEach(async () => {
  if (!mongoUrl) return;
  const db = mongoose.connection.db;
  if (!db) return;
  try {
    const collections = await db.listCollections({ name: 'records' }).toArray();
    if (collections.length) {
      await db.collection('records').deleteMany({});
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to clear records collection before test:', err);
  }
});

afterAll(async () => {
  if (!mongoUrl) return;
  await mongoose.disconnect();
});
