import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prisma: any = null;
let isMock = false;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl.startsWith('mock://') || dbUrl.includes('localhost:51213')) {
  isMock = true;
} else {
  try {
    const pool = new pg.Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined;
    };
    
    prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
  } catch (e) {
    console.error('Falha ao instanciar o Prisma com PostgreSQL. Usando fallback Mock.', e);
    isMock = true;
    prisma = null;
  }
}

export { prisma, isMock };
