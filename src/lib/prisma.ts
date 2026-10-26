// Week 7 Backend & Database Lead Audit Compliance
// Item 3.1: Global Prisma Singleton Pattern to Prevent Hot Module Replacement (HMR) Connection Leaks
// Ensures local Next.js development reuses a single PrismaClient instance rather than opening new TCP connection pools on every code edit.

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
