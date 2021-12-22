import { PrismaClient } from '@prisma/client';

export let prI: PrismaClient; // prI = prismaInstance

export async function PrismaInit() {
  const pc = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
    // errorFormat: 'pretty',
  });

  await pc.$connect();

  pc.$on('query', e => {
    console.log('         Query: ' + e.query);
    console.log('         Duration: ' + e.duration + 'ms');
  });

  console.log(`PrismaClient.$connect()ed: ${pc}`);

  prI = pc;
}
