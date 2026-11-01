// Writes `crowd.json` beside this file, the people main's crowd stands (the `crowd` definition's
// `people`): `node games/demo_crowd3d/assets/crowd.mjs`. The same seed writes the same crowd.
//
// People stand in groups on the plaza, `HALF` metres each way from its middle, never within `LANE`
// metres of a lane people walk from the gates (z = −12, 0 and 12), and never nearer than `APART`
// metres to another. A group of two to six stands round a point facing it, each one talking, idling,
// looking round or bored; a crowd at the north end faces the plaza's middle and cheers or claps; a few
// at its edges wave. Where in its clip each starts is crowd3d's, on the page. Every soldier holds a
// sword in the right hand and a shield on the left forearm, and wears a helmet (`holding`).
import fs from 'node:fs'
import path from 'node:path'

const SEED = 7, PEOPLE = 1000, HALF = 38, LANE = 2.5, APART = 0.65
const LANES = [-12, 0, 12]
const BODIES = ['farmer_man', 'farmer_woman', 'farmhand', 'mechworker', 'soldier', 'soldier_woman']
const CHAT = ['talk', 'talk', 'idle', 'look', 'bored']

// The engine's seeded die (`seeded`, engine/engine.ts).
let state = SEED >>> 0
const die = () => {
  state = (state + 0x6d2b79f5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = list => list[Math.floor(die() * list.length)]
const round = x => Math.round(x * 1000) / 1000

const people = []
const free = (x, z) =>
  Math.abs(x) <= HALF && Math.abs(z) <= HALF &&
  LANES.every(l => Math.abs(z - l) >= LANE) &&
  people.every(p => (p.at[0] - x) ** 2 + (p.at[2] - z) ** 2 >= APART * APART)
// Yaw θ faces (sin θ, cos θ).
const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z)
const KIT = { rightHand: 'sword', leftForearm: 'shield', head: 'helmet' }
const add = (x, z, yaw, clip) => {
  const body = pick(BODIES)
  people.push({ body, clip, at: [round(x), 0, round(z)], yaw: round(yaw), holding: body.startsWith('soldier') ? KIT : {} })
}

// The cheering crowd: rows at the north end facing the middle.
for (let tries = 0; people.length < 220 && tries < 20000; tries++) {
  const x = (die() * 2 - 1) * HALF, z = 26 + die() * 12
  if (free(x, z)) add(x, z, facing(x, z, 0, 0), die() < 0.6 ? 'cheer' : 'clap')
}
// The wavers at the edges.
for (let tries = 0; people.length < 260 && tries < 20000; tries++) {
  const side = Math.floor(die() * 2) * 2 - 1, x = side * (HALF - die() * 3), z = (die() * 2 - 1) * 24
  if (free(x, z)) add(x, z, facing(x, z, 0, z), 'wave')
}
// The groups, until the plaza holds PEOPLE.
for (let tries = 0; people.length < PEOPLE && tries < 200000; tries++) {
  const cx = (die() * 2 - 1) * HALF, cz = -HALF + die() * (HALF + 24)
  const n = 2 + Math.floor(die() * 5), r = 0.5 + n * 0.15, turn = die() * Math.PI * 2
  for (let i = 0; i < n && people.length < PEOPLE; i++) {
    const a = turn + (i / n) * Math.PI * 2, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r
    if (free(x, z)) add(x, z, facing(x, z, cx, cz), pick(CHAT))
  }
}

const out = path.join(import.meta.dirname, 'crowd.json')
fs.writeFileSync(out, JSON.stringify({ people }) + '\n')
console.log(`wrote ${out}: ${people.length} people`)
