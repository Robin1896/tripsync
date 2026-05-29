import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// wipe old test group
await sql(`DELETE FROM ts_groups WHERE invite_code = 'TESTEN'`)

// create group
const [group] = await sql(`
  INSERT INTO ts_groups (name, invite_code, owner_id, phase)
  VALUES ('Test Trip', 'TESTEN', 'test-owner-id', 'lobby')
  RETURNING *
`)
console.log('✅ Groep aangemaakt:', group.id)

// two mock members
await sql(`
  INSERT INTO ts_members (group_id, user_id, name, avatar_color, questions_done)
  VALUES
    ($1, 'test-owner-id',   'Robin (jij)',  '#c14a1f', 0),
    ($1, 'test-member-two', 'Anna (nep)',   '#2563eb', 0)
`, [group.id])
console.log('✅ 2 leden toegevoegd')
console.log('')
console.log('Open: https://tripsync-jade.vercel.app/lobby/TESTEN')
console.log('Jouw user-id in localStorage moet "test-owner-id" zijn om host te zijn.')
console.log('Of ga gewoon naar de lobby — je bent als nieuwe user automatisch geen host.')
