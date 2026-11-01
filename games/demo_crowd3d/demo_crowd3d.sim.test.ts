// demo_crowd3d: the manager booted as its page boots it and main loaded; a seat joins and its eye
// stands on its slot's start, and flies along its view; a gate spawns a person at its place, from
// then, on its definition's clip, who walks its definition's speed along its yaw, its row unchanged as
// it goes, and ends once they have walked its length.
import { expect, test } from 'vitest'
import { boot, type Scene } from '#engine/engine.ts'
import { connection, load, manager, type Down } from '#addons/scenemanager/scenemanager.addon.ts'
import { sim } from './demo_crowd3d.sim.ts'
import { where } from './person.sim.ts'
import file from './demo_crowd3d.scene.json' with { type: 'json' }
import defs from './assets/demo_crowd3d.json' with { type: 'json' }

const DT = file.prefabs.engine.dt

test('a seat joins main, its eye stands on its start and flies along its view', async () => {
  const truth = boot(file as Scene, sim)
  const room = (await load(truth, import.meta.url)).get('main')!
  const heard: Down[] = []
  const seat = connection(manager(truth), d => heard.push(d))
  truth.step(DT)
  const start = room.rows.find(r => r.kind === 'start' && r.data.slot === 0)!
  const eye = () => room.rows.find(r => r.kind === 'player')!
  expect(eye().data.pos).toEqual(start.data.pos)
  expect(eye().data.view).toEqual(start.data.view)

  const last = heard[heard.length - 1]
  const me = last.packet.rows.find(r => r.kind === 'player')!
  seat.take({ scene: last.scene, seat: last.seat, msg: { seq: 1, n: last.packet.n, id: me.id, action: 'stick', args: [0, -1] } })
  const from = eye().data.pos
  for (let i = 0; i < 30; i++) truth.step(DT)
  const [yaw] = eye().data.view
  const gone = defs.player.speed * DT * 30
  expect(eye().data.pos[0]).toBeCloseTo(from[0] + Math.sin(yaw) * gone, 6)
  expect(eye().data.pos[2]).toBeCloseTo(from[2] + Math.cos(yaw) * gone, 6)
})

test('a gate spawns people who walk its speed along their yaw and end after its length', async () => {
  const truth = boot(file as Scene, sim)
  const room = (await load(truth, import.meta.url)).get('main')!
  connection(manager(truth), () => {})
  for (let i = 0; i < 10; i++) truth.step(DT)
  const first = room.rows.find(r => r.kind === 'person' && r.data.speed > 0)!
  const gate = room.rows.filter(r => r.kind === 'gate').find(g => g.data.yaw === first.data.yaw && Math.abs(g.data.pos[2] - first.data.pos[2]) < 1e-9)!
  expect(defs.gate.bodies).toContain(first.data.body)
  expect(first.data).toMatchObject({ pos: gate.data.pos, clip: defs.gate.clip, speed: defs.gate.speed })
  expect(first.data.ends).toBeCloseTo(first.data.since + defs.gate.length / defs.gate.speed, 9)
  const was = structuredClone(first.data)
  const time = () => room.rows.find(r => r.kind === 'crowd')!.data.time as number
  for (let i = 0; i < 60; i++) truth.step(DT)
  expect(first.data).toEqual(was)
  const gone = defs.gate.speed * (time() - was.since)
  const [x, , z] = where(first, time())
  expect(x).toBeCloseTo(was.pos[0] + Math.sin(gate.data.yaw) * gone, 9)
  expect(z).toBeCloseTo(was.pos[2] + Math.cos(gate.data.yaw) * gone, 9)
  const steps = Math.ceil(defs.gate.length / (defs.gate.speed * DT))
  for (let i = 0; i < steps; i++) truth.step(DT)
  expect(room.rows.some(r => r.id === first.id)).toBe(false)
})
