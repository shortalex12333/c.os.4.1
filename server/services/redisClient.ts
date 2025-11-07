import { createClient, RedisClientType } from "redis";

/**
 * Lightweight Redis client wrapper
 * - Uses REDIS_URL env or defaults to localhost:6543 for offline deployment
 * - Exposes a singleton client and a small helper API
 */
class RedisConnection {
  private clientInternal: RedisClientType | null = null;
  private connecting = false;
  private enabled = false;

  constructor() {
    const url = process.env.REDIS_URL ?? "redis://localhost:6543/0";
    // Enable only if URL is provided (always true with default) but guard runtime errors
    try {
      this.clientInternal = createClient({ url });
      this.registerEvents(this.clientInternal);
      this.enabled = true;
    } catch (error) {
      this.clientInternal = null;
      this.enabled = false;
      // eslint-disable-next-line no-console
      console.warn("Redis disabled (failed to construct client):", error);
    }
  }

  private registerEvents(client: RedisClientType) {
    client.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("Redis error:", err);
    });
    client.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("✅ Connected to Redis");
    });
    client.on("reconnecting", () => {
      // eslint-disable-next-line no-console
      console.log("Redis reconnecting...");
    });
  }

  get isEnabled(): boolean {
    return this.enabled && !!this.clientInternal;
  }

  async ensureConnected(): Promise<void> {
    if (!this.clientInternal || !this.enabled) return;
    if (this.connecting) return;
    if ((this.clientInternal as any).isOpen) return;
    this.connecting = true;
    try {
      await this.clientInternal.connect();
    } finally {
      this.connecting = false;
    }
  }

  get client(): RedisClientType | null {
    return this.clientInternal;
  }

  async disconnect(): Promise<void> {
    if (!this.clientInternal || !this.enabled) return;
    try {
      if ((this.clientInternal as any).isOpen) {
        await this.clientInternal.quit();
        console.log('✅ Redis disconnected');
      }
    } catch (error) {
      console.error('Redis disconnect error:', error);
      // Force close if quit fails
      try {
        await this.clientInternal.disconnect();
      } catch {}
    }
  }
}

export const redisConnection = new RedisConnection();

export async function redisGet(key: string): Promise<string | null> {
  if (!redisConnection.isEnabled || !redisConnection.client) return null;
  await redisConnection.ensureConnected();
  return redisConnection.client.get(key);
}

export async function redisSet(key: string, value: string): Promise<void> {
  if (!redisConnection.isEnabled || !redisConnection.client) return;
  await redisConnection.ensureConnected();
  await redisConnection.client.set(key, value);
}

export async function redisDel(key: string): Promise<void> {
  if (!redisConnection.isEnabled || !redisConnection.client) return;
  await redisConnection.ensureConnected();
  await redisConnection.client.del(key);
}

export async function redisScanKeys(pattern: string, count = 100): Promise<string[]> {
  if (!redisConnection.isEnabled || !redisConnection.client) return [];
  await redisConnection.ensureConnected();
  const keys: string[] = [];
  const client = redisConnection.client;
  if (!client) return keys;

  let cursor = 0;
  do {
    // @ts-ignore redis v4 scan type
    const reply: [number, string[]] = await client.scan(cursor, { MATCH: pattern, COUNT: count });
    cursor = reply[0] as unknown as number; // redis returns string cursors internally, lib converts
    keys.push(...reply[1]);
  } while (cursor !== 0 && keys.length < 5000);

  return keys;
}

