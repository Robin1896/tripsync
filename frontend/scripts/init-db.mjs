import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(resolve(__dirname, '../../db/schema.sql'), 'utf8')

const sql = neon(process.env.DATABASE_URL)

// Run each statement separately
const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0)

for (const stmt of statements) {
  try {
    await sql(stmt)
    console.log('✅', stmt.slice(0, 60).replace(/\n/g, ' '))
  } catch (e) {
    console.error('❌', e.message)
  }
}
console.log('Done')
