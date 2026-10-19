import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 1) return null; // Stop retrying after 1 attempt
    return 500;
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

let redisWarned = false;

redis.on("connect", () => {
  console.log("✅ Redis connected");
  redisWarned = false;
});

redis.on("error", () => {
  if (!redisWarned) {
    console.warn("⚠️ Redis not available — caching disabled (this message won't repeat).");
    redisWarned = true;
  }
});

export default redis;

// Safe Redis wrappers for non-blocking caching
export const safeRedisGet = async (key) => {
  try {
    if (redis.status === "ready") {
      return await redis.get(key);
    }
  } catch (err) {
    console.warn(`⚠️ Redis GET failed for ${key}: ${err.message}`);
  }
  return null;
};

export const safeRedisSet = async (key, value, mode, duration) => {
  try {
    if (redis.status === "ready") {
      await redis.set(key, value, mode, duration);
    }
  } catch (err) {
    console.warn(`⚠️ Redis SET failed for ${key}: ${err.message}`);
  }
};
