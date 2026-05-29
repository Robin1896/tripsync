import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(resolve(__dirname, '../../db/schema.sql'), 'utf8')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await pool.query(sql)
  console.log('✅ TripSync schema initialised')
} catch (err) {
  console.error('❌ Init failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
