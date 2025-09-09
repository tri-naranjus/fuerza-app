import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const entrySchema = z.object({
  id: z.string(),
  date: z.string(),
  week: z.string(),
  day: z.union([z.literal('A'), z.literal('B')]),
  exercise: z.string(),
  exerciseLabel: z.string(),
  weight: z.string(),
  sets: z.array(z.string()).max(5),
  rpe: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { week, day, q } = req.query as Record<string, string | undefined>;
      const parts: string[] = [];
      const params: any[] = [];
      if (week) { params.push(week); parts.push(`week = $${params.length}`); }
      if (day)  { params.push(day);  parts.push(`day  = $${params.length}`); }
      const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
      const rows = await sql<any>`SELECT * FROM entries ${sql.raw(where)} ORDER BY date DESC, created_at DESC`;
      const data = q
        ? rows.rows.filter(r => (`${r.exercise_label} ${r.notes ?? ''}`.toLowerCase().includes(q.toLowerCase())))
        : rows.rows;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === 'POST') {
      const parsed = entrySchema.parse(req.body);
      const { id, date, week, day, exercise, exerciseLabel, weight, sets, rpe, notes } = parsed;
      await sql`
        INSERT INTO entries (id, date, week, day, exercise, exercise_label, weight, sets, rpe, notes)
        VALUES (${id}, ${date}, ${week}, ${day}, ${exercise}, ${exerciseLabel}, ${weight}, ${sets}, ${rpe ?? null}, ${notes ?? null})
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          week = EXCLUDED.week,
          day = EXCLUDED.day,
          exercise = EXCLUDED.exercise,
          exercise_label = EXCLUDED.exercise_label,
          weight = EXCLUDED.weight,
          sets = EXCLUDED.sets,
          rpe = EXCLUDED.rpe,
          notes = EXCLUDED.notes;
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ ok: false, error: 'id requerido' });
      }
      await sql`DELETE FROM entries WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'server error' });
  }
}
