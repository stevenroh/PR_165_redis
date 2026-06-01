import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const MESSAGES_KEY = 'chat:messages';
const MAX_MESSAGES = 10;
const MESSAGE_TTL = 10;

export async function getMessages() {
  const raw = await redis.lrange(MESSAGES_KEY, 0, -1);
  return raw.map(m => JSON.parse(m) as App.ChatMessage);
}

export async function saveMessage(message: App.ChatMessage) {
  await redis.lpush(MESSAGES_KEY, JSON.stringify(message));
  await redis.ltrim(MESSAGES_KEY, 0, MAX_MESSAGES - 1);
  await redis.expire(MESSAGES_KEY, MESSAGE_TTL);
}