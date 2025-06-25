import { Pool, type QueryResult } from 'pg';
import { getDbPool } from './connect';
import { type User } from '../../interfaces/auth/user';
import { encrypt, decrypt } from '../../utils/crypto';

interface QueryResultRow {
  [key: string]: any;
}

interface QueryParams {
  text: string;
  values?: any[];
}

export async function executeQuery<T extends QueryResultRow>(query: QueryParams): Promise<T[]> {
  const pool: Pool = await getDbPool();
  try {
    // Log query for debugging SQL syntax errors
    if (process.env.TEST_MODE === 'true' && (!query.text || query.text.trim() === '')) {
      console.error('Empty query detected:', query);
    }
    const result: QueryResult<T> = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error('Query error:', err instanceof Error ? err.message : err);
    console.error('Problematic query:', query);
    throw err;
  }
}

export async function create<T extends QueryResultRow>(table: string, data: Record<string, any>): Promise<T> {
  const columns = Object.keys(data).join(', ');
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = {
    text: `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values,
  };
  
  const result = await executeQuery<T>(query);
  return result[0];
}

export async function read<T extends QueryResultRow>(table: string, id: number | string): Promise<T | null> {
  const query = {
    text: `SELECT * FROM ${table} WHERE id = $1`,
    values: [id],
  };
  
  const result = await executeQuery<T>(query);
  return result[0] || null;
}
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

////////////////////////////////////////////////////////////////////
export async function readSpecific<T extends QueryResultRow>(
  table: string,
  id: string,
  value: unknown | string,
  validateUser?: boolean,
  andCondition?: { column: string; value: unknown | string }
): Promise<number | T | null> {
  const values: (unknown | string)[] = [value];
  let queryText = `SELECT * FROM ${table} WHERE ${id} = $1`;
  if(validateUser && andCondition) {
    const query = {
      text: queryText,
      values,
    };
    const result = await executeQuery<T>(query);
    for (const session of result) {
      const value = await decrypt(session.session_token);
      if (value === andCondition.value) {
        if (new Date(session.session_expires_at) > new Date()) {
          const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000); 
          await update('user_sessions', session.id, { session_expires_at: newExpiresAt });
          return 200;
        } else {
          return 403;
        }
      }
    }
    return 401;
  }
  else {
    if (andCondition) {
      values.push(andCondition.value);
      queryText += ` AND ${andCondition.column} = $2`;
    }
  
    const query = {
      text: queryText,
      values,
    };
  
    const result = await executeQuery<T>(query);
    return result[0] || null;
  }
}

export async function readSelect<T extends QueryResultRow>(table: string, columns: string[], conditions?: Record<string, any>): Promise<T[]> {
  const selectClause = columns.join(', ');
  let queryText = `SELECT ${selectClause} FROM ${table}`;
  const values: any[] = [];
  
  if (conditions && Object.keys(conditions).length > 0) {
    const whereClauses = Object.keys(conditions).map((key, i) => {
      values.push(conditions[key]);
      return `${key} = $${i + 1}`;
    });
    queryText += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  
  const query = { text: queryText, values };

  return executeQuery<T>(query);
}

export async function update<T extends QueryResultRow>(table: string, id: number | string, data: Record<string, any>): Promise<T> {
  const setClause = Object.keys(data)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ');
  const values = Object.values(data);
  values.push(id);
  
  const query = {
    text: `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values,
  };
  
  const result = await executeQuery<T>(query);
  if (!result[0]) {
    throw new Error(`No record found with id ${id}`);
  }
  return result[0];
}

export async function remove(table: string, id: number | string): Promise<boolean> {
  const query = {
    text: `DELETE FROM ${table} WHERE id = $1`,
    values: [id],
  };
  
  const pool: Pool = await getDbPool();
  try {
    const result = await pool.query(query);
    return result.rowCount > 0;
  } catch (err) {
    console.error('Delete error:', err instanceof Error ? err.message : err);
    return false;
  }
}
