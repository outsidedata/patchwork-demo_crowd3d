// The crowd: one `crowd` actor of the scene, and the scene's clock. `time` is the seconds its truth
// has run, the steps taken times the step's `dt`, as the page's clock counts them, set at the start
// of every step; every person's `since` and `ends` and every gate's `due` are times on it. In its
// first step it stands a `person` of each person of its definition's `people`, a loader `json`
// entry, `{ people: [{ body, clip, at, yaw, holding }] }`: at `at`, facing `yaw`, on `clip`, holding
// what `holding` names (crowd3d's `holding`), its `to` its `at`, at a `speed` of 0, from that step; `placed` says it has. Each step it ends every walker whose `ends` has come.
// `kill` is handed a ray, `[x, y, z]` from and `[x, y, z]` along, by the seat's eye, and asks the
// first living person it meets where they stand now to `die`, with the definition's `die` clip and
// the clock's time. Each person is an upright cylinder of the definition's `radius` round where its
// feet stand, `height` tall; nobody on the `die` clip is met.
import type { Kind, Row } from '#engine/engine.ts'
import { def, json } from '#plugins/loader/loader.sim.ts'
import { where } from './person.sim.ts'

type V = [number, number, number]
type Person = { body: string; clip: string; at: V; yaw: number; holding: Record<string, string> }

// How far along the ray (from + s × along, s ≥ 0) it first meets the upright cylinder of `radius`
// round `at`, from its feet to `height` above them, or undefined when it never does.
export function meets(from: V, along: V, at: number[], radius: number, height: number): number | undefined {
  let lo = 0, hi = Infinity
  // Across the ground: within `radius` of the cylinder's axis.
  const x = from[0] - at[0], z = from[2] - at[2]
  const a = along[0] * along[0] + along[2] * along[2], b = x * along[0] + z * along[2], c = x * x + z * z - radius * radius
  if (a === 0) {
    if (c > 0) return undefined
  } else {
    const d = b * b - a * c
    if (d < 0) return undefined
    const r = Math.sqrt(d)
    lo = Math.max(lo, (-b - r) / a)
    hi = Math.min(hi, (-b + r) / a)
  }
  // Up and down: between its feet and its head.
  const y0 = at[1] - from[1], y1 = at[1] + height - from[1]
  if (along[1] === 0) {
    if (y0 > 0 || y1 < 0) return undefined
  } else {
    const s0 = y0 / along[1], s1 = y1 / along[1]
    lo = Math.max(lo, Math.min(s0, s1))
    hi = Math.min(hi, Math.max(s0, s1))
  }
  return lo <= hi ? lo : undefined
}

const finite = (...v: unknown[]) => v.every(x => typeof x === 'number' && Number.isFinite(x))

export const crowd: Kind = {
  before(me, dt, w) {
    me.data.time = (Math.round(me.data.time / dt) + 1) * dt
    const time = me.data.time
    for (const row of w.all('person')) if (row.data.ends > 0 && row.data.ends <= time) w.end(row)
    if (me.data.placed) return
    me.data.placed = true
    for (const p of (json(w, def(w, me.kind).people) as { people: Person[] }).people) {
      w.spawn('person', { pos: [...p.at], to: [...p.at], yaw: p.yaw, speed: 0, body: p.body, clip: p.clip, since: time, ends: 0, holding: { ...p.holding } })
    }
  },
  acts: {
    kill(me, w, seat, x: unknown, y: unknown, z: unknown, dx: unknown, dy: unknown, dz: unknown) {
      if (!finite(x, y, z, dx, dy, dz)) return
      const from = [x, y, z] as V, along = [dx, dy, dz] as V
      const { radius, height, die } = def(w, me.kind)
      let first: { s: number; row: Row } | undefined
      for (const row of w.all('person')) {
        if (row.data.clip === die) continue
        const s = meets(from, along, where(row, me.data.time), radius, height)
        if (s !== undefined && (!first || s < first.s)) first = { s, row }
      }
      if (first) w.call(first.row, 'die', seat, die, me.data.time)
    },
  },
}
