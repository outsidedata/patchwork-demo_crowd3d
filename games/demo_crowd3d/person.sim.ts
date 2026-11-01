// A person on the plaza, drawn by crowd3d (`world.crowd3d.kinds`): `pos` [x, y, z] metres where its
// feet stood at `since`, seconds on the crowd's clock (`crowd`), `yaw` (yaw θ faces and walks along
// (sin θ, cos θ)), `speed` metres a second, `body`, `clip` and `to`, crowd3d's end of its course, its
// `pos`. Where it stands at a time is `pos` plus
// its facing times `speed` times the time since `since` (`where`), worked out by every rule that needs
// it and by crowd3d on the page, so its row never changes while it keeps its course. The crowd stands
// one of each person of its standing file, at a `speed` of 0; a gate sends one walking at the walk's
// speed, which the crowd ends at `ends`, seconds on its clock, once its length is walked; 0 is never.
// `die`, asked by the crowd with the clock's time, stands it where it is then, its `to` there, from then, hands it the
// clip it is handed and a `speed` of 0, and takes its end away: it never ends, so crowd3d lays it down
// where it fell and keeps it there.
import type { Kind, Row } from '#engine/engine.ts'
import * as math from '#plugins/math/math.sim.ts'

// Where a person's feet stand at `time`, seconds on the crowd's clock.
export function where(row: Row, time: number): [number, number, number] {
  const [x, y, z] = row.data.pos
  const gone = row.data.speed * (time - row.data.since)
  return [x + math.sin(row.data.yaw) * gone, y, z + math.cos(row.data.yaw) * gone]
}

export const person: Kind = {
  acts: {
    die(me, _w, _seat, clip: string, time: number) {
      me.data.pos = where(me, time)
      me.data.to = [...me.data.pos]
      me.data.since = time
      me.data.speed = 0
      me.data.clip = clip
      me.data.ends = 0
    },
  },
}
