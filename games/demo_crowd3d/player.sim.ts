// The seat's eye, its `player` row: it flies, and nothing stops it. `pos` [x, y, z] metres, `view`
// [yaw, pitch] radians (yaw θ looks along (sin θ, cos θ), pitch up). `before` puts it once on its
// slot's `start`, at that start's `pos` and `view`. Each step it moves its definition's `speed` metres
// a second, times 2 to the power of `pace`, along the view's yaw by `stick` (x to the right, y back),
// and up by `up` less `down`. `look` turns the view by the radians it is handed, its pitch kept within
// the definition's `pitch` of level; `pace` takes the wheel's turn, a tenth of a power of two a notch.
// `kill` hands the crowd the ray a click sent, `[x, y, z]` from and `[x, y, z]` along.
import type { Kind } from '#engine/engine.ts'
import { def } from '#plugins/loader/loader.sim.ts'
import * as math from '#plugins/math/math.sim.ts'

const finite = (...v: unknown[]) => v.every(x => typeof x === 'number' && Number.isFinite(x))

export const player: Kind = {
  before(me, _dt, w) {
    if (me.data.placed) return
    const start = w.find('start', s => s.data.slot === me.data.seat)
    me.data.pos = [...start.data.pos]
    me.data.view = [...start.data.view]
    me.data.placed = true
  },
  tick(me, dt, w) {
    const { speed } = def(w, me.kind)
    const v = speed * math.pow(2, me.data.pace) * dt
    const [x, y] = me.data.stick
    const yaw = me.data.view[0]
    const s = math.sin(yaw), c = math.cos(yaw)
    // Ahead is (s, c), its right (−c, s).
    const ahead = -y, right = x
    const [px, py, pz] = me.data.pos
    me.data.pos = [px + (s * ahead - c * right) * v, py + ((me.data.up ? 1 : 0) - (me.data.down ? 1 : 0)) * v, pz + (c * ahead + s * right) * v]
  },
  acts: {
    stick(me, _w, _seat, x: unknown, y: unknown) {
      if (!finite(x, y)) return
      me.data.stick = [Math.max(-1, Math.min(1, x as number)), Math.max(-1, Math.min(1, y as number))]
    },
    up(me, _w, _seat, on: unknown) { me.data.up = on === true || on === 1 },
    down(me, _w, _seat, on: unknown) { me.data.down = on === true || on === 1 },
    look(me, w, _seat, yaw: unknown, pitch: unknown) {
      if (!finite(yaw, pitch)) return
      const limit = def(w, me.kind).pitch
      const turned = me.data.view[0] + (yaw as number)
      me.data.view = [math.atan2(math.sin(turned), math.cos(turned)), Math.min(limit, Math.max(-limit, me.data.view[1] + (pitch as number)))]
    },
    pace(me, _w, _seat, dy: unknown) {
      if (!finite(dy)) return
      me.data.pace = Math.max(-4, Math.min(4, me.data.pace - Math.sign(dy as number) / 10))
    },
    kill(_me, w, seat, ...ray: unknown[]) {
      w.call(w.find('crowd'), 'kill', seat, ...(ray as number[]))
    },
  },
}
