import { Pool, type PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { getDbPool, initDbConnection } from './connect';

interface SchemaInfo {
  tables: Set<string>;
}

async function getCurrentSchema(client: PoolClient): Promise<SchemaInfo> {
  const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  return { tables: new Set(tablesRes.rows.map(row => row.table_name)) };
}

async function checkDataExists(client: PoolClient, tableName: string, values: string[]): Promise<boolean> {
  const valueList = values.map(v => v.split(',')[0].trim().replace(/['"]/g, '')).join("','");
  const query = `SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE name IN ('${valueList}'))`;
  const result = await client.query(query);
  return result.rows[0].exists;
}

async function syncDatabaseSchema(): Promise<boolean> {
  const pool = await getDbPool();
  const client = await pool.connect();
  let changesMade = false;

  try {
    const schemaPath = path.join(process.cwd(), '/src/database/auth/schemas/master.sql');
    const statements = fs.readFileSync(schemaPath, 'utf-8')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt);

    const { tables } = await getCurrentSchema(client);

    for (const stmt of statements) {
      const isCreateTable = stmt.toLowerCase().startsWith('create table');
      const isInsert = stmt.toLowerCase().startsWith('insert into');

      if (isCreateTable) {
        const tableName = stmt.match(/create table\s+(?:if not exists\s+)?(\w+)/i)?.[1]?.toLowerCase();
        if (!tableName) continue;

        const exists = tables.has(tableName);
        const hasIfNotExists = stmt.toLowerCase().includes('if not exists');

        if (exists && hasIfNotExists) continue;

        try {
          await client.query(stmt);
          console.log(`TABLE CREATED: ${tableName}`);
          changesMade = true;
          if (exists) tables.delete(tableName);
        } catch (err: any) {
          if (err.message.includes('already exists')) continue;
          console.error(`Failed to apply: ${tableName}`, err.message);
        }
      } else if (isInsert) {
        const tableName = stmt.match(/insert into\s+(\w+)/i)?.[1]?.toLowerCase();
        if (!tableName) continue;

        const valuesMatch = stmt.match(/VALUES\s*(\([\s\S]*?\))/i);
        if (!valuesMatch) continue;
        const values = valuesMatch[1].split('),').map(v => v.trim().replace(/^\(|\)$/g, ''));

        const dataExists = await checkDataExists(client, tableName, values);
        if (dataExists) continue;

        try {
          const result = await client.query(stmt);
          if(result.rowCount)
          if (result.rowCount > 0) {
            console.log(`DATA INSERTED: ${tableName} (${result.rowCount} rows)`);
            changesMade = true;
          }
        } catch (err: any) {
          console.error(`Failed to insert: ${stmt.slice(0, 50)}...`, err.message);
        }
      }
    }

    return changesMade;
  } catch (err) {
    console.error('Schema sync failed:', err instanceof Error ? err.message : err);
    throw err;
  } finally {
    client.release();
  }
}

export default async function runDbSync(): Promise<void> {
  try {
    await initDbConnection();
    await syncDatabaseSchema();
  } catch (err) {
    console.error('Database initialization failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}