import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const databaseUrl = new URL(process.env.DATABASE_URL ?? '')
if (databaseUrl.searchParams.get('sslmode') === 'require') {
  databaseUrl.searchParams.set('sslmode', 'verify-full')
}

export const pool = new Pool({
  connectionString: databaseUrl.toString(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

export const db = drizzle(pool, { schema })
