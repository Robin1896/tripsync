import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, type Group, type Member } from '../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../lib/pusher'
import { QUESTIONS } from '../../lib/questions'

const TOTAL_Q = QUESTIONS.length

export async function POST(req: NextRequest) {
  const { groupId, code, userId, questionId, value } = await req.json()

  await query(
    `INSERT INTO ts_answers (group_id, user_id, question_id, value)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (group_id, user_id, question_id) DO UPDATE SET value = EXCLUDED.value`,
    [groupId, userId, questionId, value],
  )

  // Count how many questions this user has answered
  const [{ count }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM ts_answers WHERE group_id = $1 AND user_id = $2',
    [groupId, userId],
  )
  const done = parseInt(count)

  await query(
    'UPDATE ts_members SET questions_done = $1 WHERE group_id = $2 AND user_id = $3',
    [done, groupId, userId],
  )

  await pusherServer.trigger(groupChannel(code), EVENTS.ANSWER_SUBMITTED, {
    userId, questionId, questionsDone: done,
  })

  // Check if all members are done
  if (done >= TOTAL_Q) {
    const members = await query<Member>(
      'SELECT * FROM ts_members WHERE group_id = $1',
      [groupId],
    )
    const allDone = members.length > 0 && members.every(m => m.questions_done >= TOTAL_Q)

    if (allDone) {
      await query(
        "UPDATE ts_groups SET phase = 'results' WHERE id = $1 AND phase = 'game'",
        [groupId],
      )
      await pusherServer.trigger(groupChannel(code), EVENTS.PHASE_CHANGED, { phase: 'results' })
    }
  }

  return NextResponse.json({ ok: true, questionsDone: done })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const userId  = searchParams.get('userId')

  if (!groupId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  try {
    const answers = await query<{ question_id: string; value: string }>(
      'SELECT question_id, value FROM ts_answers WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    )
    return NextResponse.json({ answers })
  } catch (e) {
    console.error('GET /api/answers error:', e)
    return NextResponse.json({ answers: [] })
  }
}
