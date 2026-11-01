// The crowd: the scene's clock, its `time` the steps taken times `dt`; in its first step a `person`
// row of each person of its standing file, standing where the file puts them, on its clip, holding
// what it holds (every soldier its kit), at a speed of 0, from that step; a seat's `kill` ray kills the first living person on it where they stand
// now, standing or walking, who takes the definition's `die` clip, stops there, from then, lies where
// they fell and never ends; a ray through nobody, or only through the dead, kills nobody. A person's
// row is a course: a seat is sent no change of anyone keeping theirs, only the clock and a gate's
// next. `meets` finds where a ray first enters a person's upright cylinder.
import { expect, test } from 'vitest'
import { boot, type Row, type Scene } from '#engine/engine.ts'
import { accept, connection, load, manager, type Diff, type Down } from '#addons/scenemanager/scenemanager.addon.ts'
import { sim } from './demo_crowd3d.sim.ts'
import { meets } from './crowd.sim.ts'
import { where } from './person.sim.ts'
import file from './demo_crowd3d.scene.json' with { type: 'json' }
import defs from './assets/demo_crowd3d.json' with { type: 'json' }
import standing from './assets/crowd.json' with { type: 'json' }

const DT = file.prefabs.engine.dt

async function joined() {
  const truth = boot(file as Scene, sim)
  const room = (await load(truth, import.meta.url)).get('main')!
  const heard: Down[] = []
  const seat = connection(manager(truth), d => heard.push(d))
  truth.step(DT)
  let seq = 0
  const kill = (...ray: number[]) => {
    const last = heard[heard.length - 1]
    const me = last.packet.rows.find(r => r.kind === 'player')!
    seat.take({ scene: last.scene, seat: last.seat, msg: { seq: ++seq, n: last.packet.n, id: me.id, action: 'kill', args: ray } })
    truth.step(DT)
  }
  const people = () => room.rows.filter(r => r.kind === 'person')
  const dead = () => people().filter(r => r.data.clip === defs.crowd.die)
  const time = () => room.rows.find(r => r.kind === 'crowd')!.data.time as number
  return { truth, room, kill, people, dead, time }
}

// The person standing where the standing file's `i`th person stands.
const at = (rows: Row[], i: number) => rows.find(r => r.data.pos.every((v: number, k: number) => v === standing.people[i].at[k]))!

test('the crowd\'s clock is the steps its truth has taken times dt', async () => {
  const { truth, room, time } = await joined()
  for (let i = 0; i < 1000; i++) truth.step(DT)
  expect(time()).toBe(room.n * DT)
})

test('the crowd stands each person of its file as a person row, once, from its first step', async () => {
  const { truth, people } = await joined()
  const still = () => people().filter(r => r.data.speed === 0)
  expect(still().length).toBe(standing.people.length)
  const first = at(still(), 0), p = standing.people[0]
  expect(first.data).toEqual({ pos: p.at, to: p.at, yaw: p.yaw, speed: 0, body: p.body, clip: p.clip, since: DT, ends: 0, holding: p.holding })
  // Every soldier holds the kit, and nobody else anything.
  for (const [i, q] of standing.people.entries()) {
    expect(at(still(), i).data.holding).toEqual(q.body.startsWith('soldier') ? { rightHand: 'sword', leftForearm: 'shield', head: 'helmet' } : {})
  }
  for (let i = 0; i < 10; i++) truth.step(DT)
  expect(still().length).toBe(standing.people.length)
  expect(at(still(), 0)).toBe(first)
  expect(first.data.pos).toEqual(p.at)
})

test('a ray down onto a standing person kills them, once; a ray through nobody kills nobody', async () => {
  const { kill, people, dead, time } = await joined()
  const [x, , z] = standing.people[0].at
  const then = time()
  kill(x, 10, z, 0, -1, 0)
  expect(at(people(), 0).data).toMatchObject({ clip: defs.crowd.die, speed: 0, since: then, ends: 0 })
  expect(dead().length).toBe(1)
  kill(x, 10, z, 0, -1, 0)
  expect(dead().length).toBe(1)
  // Straight up from the plaza's middle lane.
  kill(0, 0.1, 0, 0, 1, 0)
  expect(dead().length).toBe(1)
})

test('a ray along the ground kills the first person on it, not the one behind', async () => {
  const { kill, people, dead } = await joined()
  const [x, , z] = standing.people[0].at
  const from = [x - 50, 1, z] as [number, number, number]
  const first = standing.people
    .map((p, i) => ({ i, s: meets(from, [1, 0, 0], p.at, defs.crowd.radius, defs.crowd.height) }))
    .filter(h => h.s !== undefined)
    .sort((a, b) => a.s! - b.s!)[0]
  kill(from[0], from[1], from[2], 1, 0, 0)
  expect(dead()).toEqual([at(people(), first.i)])
})

test('a walking person clicked dies where they are now, lies there and never ends', async () => {
  const { truth, room, kill, dead, time } = await joined()
  for (let i = 0; i < 60; i++) truth.step(DT)
  const one = room.rows.find(r => r.kind === 'person' && r.data.speed > 0)!
  const then = time()
  const now = where(one, then)
  // Where its leg began is far behind it: the ray meets it only where it stands now.
  expect(Math.hypot(now[0] - one.data.pos[0], now[2] - one.data.pos[2])).toBeGreaterThan(defs.crowd.radius)
  kill(now[0], now[1] + 10, now[2], 0, -1, 0)
  expect(one.data).toMatchObject({ pos: now, clip: defs.crowd.die, speed: 0, since: then, ends: 0 })
  const steps = Math.ceil(defs.gate.length / (defs.gate.speed * DT))
  for (let i = 0; i < steps; i++) truth.step(DT)
  expect(room.rows.includes(one)).toBe(true)
  expect(one.data.pos).toEqual(now)
  expect(where(one, time())).toEqual(now)
  // Dead, they are met no more.
  const before = dead().length
  kill(now[0], now[1] + 10, now[2], 0, -1, 0)
  expect(dead().length).toBe(before)
})

test('a seat is sent no change of a person keeping its course: only the clock, and a gate\'s next when it sends one', async () => {
  const truth = boot(file as Scene, sim)
  const room = (await load(truth, import.meta.url)).get('main')!
  const sent: Diff[] = []
  const seat = accept(manager(truth))(d => sent.push(d))
  const step = () => {
    truth.step(DT)
    seat.take({ got: sent[sent.length - 1].k })
  }
  for (let i = 0; i < 10; i++) step()
  sent.length = 0
  const kindOf = new Map(room.rows.map(r => [r.id, r.kind]))
  const crowd = room.rows.find(r => r.kind === 'crowd')!.id
  // Long enough for walkers to spawn at every gate and the first to end.
  const steps = Math.ceil((defs.gate.length / defs.gate.speed + 3 * defs.gate.every) / DT)
  for (let i = 0; i < steps; i++) step()
  let added = 0, dropped = 0
  for (const d of sent) {
    for (const r of d.add) {
      kindOf.set(r.id, r.kind)
      expect(r.kind).toBe('person')
      added++
    }
    for (const id of d.drop) {
      expect(kindOf.get(id)).toBe('person')
      dropped++
    }
    for (const c of d.change) {
      const kind = kindOf.get(c.id)
      const fields = c.set.map(([path]) => path.join('.'))
      if (c.id === crowd) expect(fields).toEqual(['time'])
      else expect([kind, fields]).toEqual(['gate', ['due']])
    }
  }
  expect(added).toBeGreaterThan(0)
  expect(dropped).toBeGreaterThan(0)
})

test('meets: where a ray first enters an upright cylinder, or never', () => {
  // Along the ground into its side, 0.3 short of its axis.
  expect(meets([0, 1, -10], [0, 0, 1], [0, 0, 0], 0.3, 1.8)).toBeCloseTo(9.7, 9)
  // Over its head, and under its feet.
  expect(meets([0, 2, -10], [0, 0, 1], [0, 0, 0], 0.3, 1.8)).toBeUndefined()
  expect(meets([0, -0.1, -10], [0, 0, 1], [0, 0, 0], 0.3, 1.8)).toBeUndefined()
  // Straight down onto its head, and beside it.
  expect(meets([0.1, 5, 0], [0, -1, 0], [0, 0, 0], 0.3, 1.8)).toBeCloseTo(3.2, 9)
  expect(meets([0.4, 5, 0], [0, -1, 0], [0, 0, 0], 0.3, 1.8)).toBeUndefined()
  // Behind the ray's start.
  expect(meets([0, 1, 10], [0, 0, 1], [0, 0, 0], 0.3, 1.8)).toBeUndefined()
  // Down through its head at a slant: within its radius 0.9√2 along, but still over its head, which
  // the ray reaches 1.2√2 along, over its axis.
  expect(meets([0, 3, -1.2], [0, -Math.SQRT1_2, Math.SQRT1_2], [0, 0, 0], 0.3, 1.8)).toBeCloseTo(1.2 * Math.SQRT2, 9)
})
