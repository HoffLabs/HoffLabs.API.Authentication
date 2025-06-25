
import { Pool, Client } from 'pg';
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DATABASE } from '../../config/env';

interface PostgresConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }
  

// Cached Pool instance
let cachedPool: Pool | null = null;

const config: PostgresConfig = {
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '5432', 10),
    user: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'hofflabs_dev',
    database: DATABASE || 'Hofflabs',
  };

// Initialize the pool
async function initializePool(): Promise<Pool> {
  if (cachedPool) {
    console.log('Using cached PostgreSQL connection pool');
    return cachedPool;
  }

  const tempClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  });

  try {
    await tempClient.connect();
    const res = await tempClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );
    if (res.rowCount === 0) {
      console.log(`Creating database ${config.database}...`);
      await tempClient.query(`CREATE DATABASE "${config.database}"`);
      console.log(`Database ${config.database} created..`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', `${config.database} database exists..`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err instanceof Error ? err.message : err);
    throw err;
  } finally {
    await tempClient.end();
  }

  cachedPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  cachedPool.on('connect', () => console.log('\x1b[34m%s\x1b[0m', `Connection made to database: ${config.database}`));
  cachedPool.on('error', (err) => console.error('Pool error:', err.message));

  return cachedPool;
}

// Get the cached pool
export async function getDbPool(): Promise<Pool> {
  if (!cachedPool) {
    throw new Error('Database pool not initialized. Ensure runDbSync is called during server startup.');
  }
  return cachedPool;
}

// Initialize pool during server startup
export async function initDbConnection(): Promise<void> {
  await initializePool();
}
