import type { FastifyPluginAsync } from 'fastify';
import runDbSync from '../database/utils/sync'; 

export async function initAuth() {
  console.log('\x1b[33m%s\x1b[0m', 'Initializing auth service..');
  try {
    await runDbSync();
    console.log('\x1b[32m%s\x1b[0m', 'Finished validating authentication database..');
} catch (err) {
    console.error('Authentication database sync failed on server startup:', err);
    process.exit(1); 
}
};
