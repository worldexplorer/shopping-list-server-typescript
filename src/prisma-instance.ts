import { PrismaClient } from '@prisma/client';
import { config } from './server.config';

// https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/instantiate-prisma-client#the-number-of-prismaclient-instances-matters
export let prI: PrismaClient; // prI = prismaInstance

export async function PrismaInit() {
  const pc = new PrismaClient({
    // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging
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

  if (config.debugPrismaQuery) {
    pc.$on('query', e => {
      console.log('         Query: ' + e.query);
      console.log('         Duration: ' + e.duration + 'ms\n\n');
    });
  }

  console.log(`PrismaClient.$connect()ed: ${pc}`);

  prI = pc;
}
