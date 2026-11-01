// A gate people walk in at: a `gate` actor of the scene, at `pos` [x, y, z] facing `yaw`. Once the
// crowd's clock (`crowd`) reaches `due` it spawns a `person` there, its `to` there, from then, facing its way, walking
// its definition's `clip` at its definition's `speed`, the metres a second that clip carries the hips
// (crowd3d's `travel`), so its feet stay where they land; of a body drawn by the scene's die from its
// definition's `bodies`, to end once its definition's `length` metres are walked. Its next is due
// `every` seconds of its definition after.
import type { Kind } from '#engine/engine.ts'
import { def } from '#plugins/loader/loader.sim.ts'

export const gate: Kind = {
  tick(me, _dt, w) {
    const time = w.find('crowd').data.time
    if (time < me.data.due) return
    const { every, bodies, length, clip, speed } = def(w, me.kind)
    me.data.due += every
    w.spawn('person', {
      pos: [...me.data.pos],
      to: [...me.data.pos],
      yaw: me.data.yaw,
      speed,
      body: bodies[Math.floor(w.die() * bodies.length)],
      clip,
      since: time,
      ends: time + length / speed,
    })
  },
}
