import { NextRequest, NextResponse } from 'next/server'
import { query, type Member } from '../../lib/db'
import { pusherServer, groupChannel, EVENTS } from '../../lib/pusher'
import { QUESTIONS } from '../../lib/questions'
import { logApi } from '../../lib/log'

const TOTAL_Q = QUESTIONS.length

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  let userId    = ''
  let groupCode = ''
  try {
    const body = await req.json()
    const { groupId, code, questionId, value } = body
    userId    = body.userId ?? ''
    groupCode = code ?? ''

    await query(
      `INSERT INTO ts_answers (group_id, user_id, question_id, value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (group_id, user_id, question_id) DO UPDATE SET value = EXCLUDED.value`,
      [groupId, userId, questionId, value],
    )

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

    logApi({ method: 'POST', path: '/api/answers', status: 200, durationMs: Date.now() - t0, userId, groupCode })
    return NextResponse.json({ ok: true, questionsDone: done })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    logApi({ method: 'POST', path: '/api/answers', status: 500, durationMs: Date.now() - t0, userId, groupCode, error: msg })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const userId  = searchParams.get('userId')

  if (!groupId || !userId) {
    logApi({ method: 'GET', path: '/api/answers', status: 400, durationMs: Date.now() - t0 })
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try {
    const answers = await query<{ question_id: string; value: string }>(
      'SELECT question_id, value FROM ts_answers WHERE group_id = $1 AND user_id = $2',
      [groupId, userId],
    )
    logApi({ method: 'GET', path: '/api/answers', status: 200, durationMs: Date.now() - t0, userId })
    return NextResponse.json({ answers })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('GET /api/answers error:', e)
    logApi({ method: 'GET', path: '/api/answers', status: 500, durationMs: Date.now() - t0, userId, error: msg })
    return NextResponse.json({ answers: [] })
  }
}
