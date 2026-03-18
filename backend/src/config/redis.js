const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

client.on('connect', () => {
  console.log('Redis connected');
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

// Helper functions
async function getAsync(key) {
  await connectRedis();
  return await client.get(key);
}

async function setAsync(key, value, expirySeconds = null) {
  await connectRedis();
  if (expirySeconds) {
    return await client.setEx(key, expirySeconds, value);
  }
  return await client.set(key, value);
}

async function deleteAsync(key) {
  await connectRedis();
  return await client.del(key);
}

async function hgetAsync(hash, field) {
  await connectRedis();
  return await client.hGet(hash, field);
}

async function hsetAsync(hash, field, value) {
  await connectRedis();
  return await client.hSet(hash, field, value);
}

async function hgetallAsync(hash) {
  await connectRedis();
  return await client.hGetAll(hash);
}

module.exports = {
  client,
  connectRedis,
  getAsync,
  setAsync,
  deleteAsync,
  hgetAsync,
  hsetAsync,
  hgetallAsync,
};
