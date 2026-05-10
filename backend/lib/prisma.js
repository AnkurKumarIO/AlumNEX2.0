/**
 * Singleton PrismaClient instance.
 * All route files MUST import from this module instead of creating new PrismaClient().
 * Prevents connection pool exhaustion in production (PostgreSQL default: 100 connections).
 */
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, reuse the client across hot-reloads
  if (!global.__prismaClient) {
    global.__prismaClient = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__prismaClient;
}

module.exports = prisma;
